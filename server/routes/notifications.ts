import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userNotifs = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifs.filter(n => !n.read).length;
  res.json({ notifications: userNotifs, unreadCount });
});

// PUT /api/notifications/:id/read
notificationsRouter.put('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const notif = db.notifications.find(n => n.id === id && n.userId === userId);
  if (notif) {
    notif.read = true;
    db.save();
  }

  res.json({ message: 'Marked as read' });
});

// PUT /api/notifications/read-all
notificationsRouter.put('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  db.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
  db.save();
  res.json({ message: 'All notifications marked as read' });
});
