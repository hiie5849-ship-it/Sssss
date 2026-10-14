import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User, SellerProfile } from '../db.js';
import { generateToken, requireAuth, AuthenticatedRequest, logAudit } from '../auth.js';

export const authRouter = Router();

// Register Customer or Seller
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role, sellerInfo } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const existing = db.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const targetRole: 'customer' | 'seller' = role === 'seller' ? 'seller' : 'customer';
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: emailNormalized,
      passwordHash,
      role: targetRole,
      name: name.trim(),
      phone: phone || '',
      status: 'active',
      createdAt: now,
    };

    db.users.push(newUser);

    if (targetRole === 'seller') {
      const storeName = sellerInfo?.storeName?.trim() || `${name.trim()}'s Store`;
      const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const newSellerProfile: SellerProfile = {
        userId,
        storeName,
        storeSlug,
        storeDescription: sellerInfo?.storeDescription || 'Independent verified merchant on ZappKart.',
        storeLogo: sellerInfo?.storeLogo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80',
        storeBanner: sellerInfo?.storeBanner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        businessAddress: sellerInfo?.businessAddress || 'India',
        gstin: sellerInfo?.gstin || '',
        pan: sellerInfo?.pan || '',
        bankAccount: sellerInfo?.bankAccount || '',
        ifsc: sellerInfo?.ifsc || '',
        approvalStatus: 'pending', // Requires Super Admin approval!
        commissionRate: db.appSettings.defaultCommissionRate || 10,
        totalSales: 0,
        totalEarnings: 0,
        rating: 5.0,
        numRatings: 0,
        createdAt: now,
        updatedAt: now,
      };

      db.sellerProfiles.push(newSellerProfile);

      // Create notification for admin
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: 'usr_admin_1',
        title: 'New Seller Onboarding Request',
        message: `${storeName} (${emailNormalized}) has registered as a seller and requires verification.`,
        type: 'seller',
        read: false,
        link: '/admin/sellers',
        createdAt: now,
      });
    }

    db.save();

    logAudit(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      'USER_REGISTERED',
      'user',
      newUser.id,
      { role: targetRole }
    );

    const token = generateToken(newUser);
    const sellerProfile = targetRole === 'seller' ? db.sellerProfiles.find(s => s.userId === userId) : null;

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
      sellerProfile,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = db.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by the marketplace administrator.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = generateToken(user);
    const sellerProfile = user.role === 'seller' ? db.sellerProfiles.find(s => s.userId === user.id) : null;

    logAudit(
      { id: user.id, email: user.email, role: user.role },
      'USER_LOGIN',
      'user',
      user.id
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      sellerProfile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Get Current User Profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find(u => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const sellerProfile = user.role === 'seller' ? db.sellerProfiles.find(s => s.userId === user.id) : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
    },
    sellerProfile,
  });
});

// Update Profile
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone } = req.body;
  const user = db.users.find(u => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  db.save();

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    }
  });
});

// Password recovery endpoint (simulates secure reset link / code generation)
authRouter.post('/recover-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    // Return generic success to prevent email enumeration
    return res.json({ message: 'If an account exists with this email, password recovery instructions have been dispatched.' });
  }

  // Create recovery notification for demonstration & audit
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Password Reset Requested',
    message: 'A password reset token was requested. Use our secure self-service portal to update your credentials.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  });
  db.save();

  logAudit(
    { id: user.id, email: user.email, role: user.role },
    'PASSWORD_RECOVERY_REQUESTED',
    'user',
    user.id
  );

  res.json({
    message: 'If an account exists with this email, password recovery instructions have been dispatched.',
    demoNote: 'For security in sandbox mode, you may reset credentials or login using test credentials.'
  });
});
