import { Router, Response } from 'express';
import { db, Product, Review } from '../db.js';
import { requireAuth, requireSeller, AuthenticatedRequest, logAudit } from '../auth.js';

export const productsRouter = Router();

// GET /api/products - Search, Filter, Sort, Pagination
productsRouter.get('/', (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sellerId,
      featured,
      sortBy = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    let items = db.products.filter(p => p.status === 'active');

    // Filter by seller approval - only products from active & approved sellers are shown in public catalog
    items = items.filter(p => {
      const seller = db.sellerProfiles.find(s => s.userId === p.sellerId);
      return seller && seller.approvalStatus === 'approved';
    });

    // Query / Search
    if (q && typeof q === 'string') {
      const term = q.toLowerCase().trim();
      items = items.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term) ||
        p.storeName.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    // Category
    if (category && typeof category === 'string' && category !== 'all') {
      const catSlug = category.toLowerCase();
      const matchedCat = db.categories.find(c => c.slug === catSlug || c.id === catSlug);
      if (matchedCat) {
        items = items.filter(p => p.categoryId === matchedCat.id);
      }
    }

    // Seller Filter
    if (sellerId && typeof sellerId === 'string') {
      items = items.filter(p => p.sellerId === sellerId);
    }

    // Price Range
    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) items = items.filter(p => p.salePrice >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) items = items.filter(p => p.salePrice <= max);
    }

    // Min Rating
    if (minRating) {
      const rating = Number(minRating);
      if (!isNaN(rating)) items = items.filter(p => p.rating >= rating);
    }

    // In Stock
    if (inStock === 'true') {
      items = items.filter(p => p.stock > 0);
    }

    // Featured
    if (featured === 'true') {
      items = items.filter(p => p.isFeatured);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      items.sort((a, b) => a.salePrice - b.salePrice);
    } else if (sortBy === 'price_desc') {
      items.sort((a, b) => b.salePrice - a.salePrice);
    } else if (sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating || b.numReviews - a.numReviews);
    } else if (sortBy === 'popular') {
      items.sort((a, b) => b.numReviews - a.numReviews);
    } else {
      // Default: newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const paginated = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      products: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
      }
    });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// GET /api/products/categories - List active categories
productsRouter.get('/categories', (req, res) => {
  const activeCategories = db.categories
    .filter(c => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  res.json({ categories: activeCategories });
});

// GET /api/products/:id - Single product with reviews and seller info
productsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id || p.slug === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const seller = db.sellerProfiles.find(s => s.userId === product.sellerId);
  const reviews = db.reviews.filter(r => r.productId === product.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Also fetch related products from same category
  const related = db.products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.status === 'active')
    .slice(0, 4);

  res.json({
    product,
    seller: seller ? {
      userId: seller.userId,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      rating: seller.rating,
      storeLogo: seller.storeLogo,
      numRatings: seller.numRatings,
    } : null,
    reviews,
    related,
  });
});

// POST /api/products/:id/reviews - Submit review
productsRouter.post('/:id/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const product = db.products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }
  if (!comment || comment.trim().length < 5) {
    return res.status(400).json({ error: 'Please write a review comment with at least 5 characters.' });
  }

  const review: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    customerId: req.user!.userId,
    customerName: req.user!.name,
    rating: Math.round(numRating),
    title: title?.trim() || 'Verified Purchase Review',
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  db.reviews.push(review);

  // Recalculate product rating
  const prodReviews = db.reviews.filter(r => r.productId === product.id);
  const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
  product.rating = Number(avg.toFixed(1));
  product.numReviews = prodReviews.length;
  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'REVIEW_ADDED',
    'product',
    product.id,
    { rating: review.rating }
  );

  res.status(201).json({ message: 'Review submitted successfully', review, productRating: product.rating });
});

// POST /api/products - Create product (Seller only)
productsRouter.post('/', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  try {
    const seller = db.sellerProfiles.find(s => s.userId === req.user!.userId);
    if (!seller && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Seller profile not found.' });
    }

    if (seller && seller.approvalStatus !== 'approved' && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: `Cannot publish products. Your seller account status is: ${seller.approvalStatus}. Super Admin approval is required.`
      });
    }

    const {
      title,
      description,
      categoryId,
      price,
      salePrice,
      sku,
      stock,
      images,
      attributes,
      isFeatured,
      status = 'active',
    } = req.body;

    if (!title || !description || !categoryId || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Title, description, category, price, and stock are required.' });
    }

    const numPrice = Number(price);
    const numSalePrice = salePrice !== undefined ? Number(salePrice) : numPrice;
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }
    if (isNaN(numSalePrice) || numSalePrice <= 0 || numSalePrice > numPrice) {
      return res.status(400).json({ error: 'Sale price must be less than or equal to regular price.' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ error: 'Stock must be greater than or equal to 0.' });
    }

    const category = db.categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category selected.' });
    }

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${productId.substring(5, 9)}`;
    const now = new Date().toISOString();

    const productImages = Array.isArray(images) && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

    const newProduct: Product = {
      id: productId,
      sellerId: seller ? seller.userId : req.user!.userId,
      storeName: seller ? seller.storeName : 'ZappKart Official Direct',
      title: title.trim(),
      slug,
      description: description.trim(),
      categoryId: category.id,
      categoryName: category.name,
      price: numPrice,
      salePrice: numSalePrice,
      sku: sku ? sku.trim() : `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      stock: numStock,
      images: productImages,
      status: status === 'draft' ? 'draft' : (status === 'inactive' ? 'inactive' : 'active'),
      rating: 5.0,
      numReviews: 0,
      isFeatured: Boolean(isFeatured),
      attributes: attributes || {},
      createdAt: now,
      updatedAt: now,
    };

    db.products.push(newProduct);
    db.save();

    logAudit(
      { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
      'PRODUCT_CREATED',
      'product',
      newProduct.id,
      { title: newProduct.title, price: newProduct.salePrice, stock: newProduct.stock }
    );

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Update product (Seller ownership or Admin)
productsRouter.put('/:id', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const product = db.products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  // Security Check: Only the owning seller or Admin can modify
  if (product.sellerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: You can only edit products owned by your store.' });
  }

  const {
    title,
    description,
    categoryId,
    price,
    salePrice,
    sku,
    stock,
    images,
    status,
    isFeatured,
    attributes
  } = req.body;

  if (title) product.title = title.trim();
  if (description) product.description = description.trim();
  if (categoryId) {
    const cat = db.categories.find(c => c.id === categoryId);
    if (cat) {
      product.categoryId = cat.id;
      product.categoryName = cat.name;
    }
  }
  if (price !== undefined) {
    const p = Number(price);
    if (!isNaN(p) && p > 0) product.price = p;
  }
  if (salePrice !== undefined) {
    const sp = Number(salePrice);
    if (!isNaN(sp) && sp > 0) product.salePrice = sp;
  }
  if (stock !== undefined) {
    const st = Number(stock);
    if (!isNaN(st) && st >= 0) product.stock = st;
  }
  if (sku) product.sku = sku.trim();
  if (Array.isArray(images) && images.length > 0) product.images = images;
  if (status && ['active', 'inactive', 'draft'].includes(status)) product.status = status;
  if (isFeatured !== undefined && req.user!.role === 'admin') product.isFeatured = Boolean(isFeatured);
  if (attributes) product.attributes = attributes;
  product.updatedAt = new Date().toISOString();

  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'PRODUCT_UPDATED',
    'product',
    product.id
  );

  res.json({ message: 'Product updated successfully', product });
});

// DELETE /api/products/:id - Deactivate / Delete product
productsRouter.delete('/:id', requireSeller, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const product = db.products[index];
  if (product.sellerId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: You can only remove products owned by your store.' });
  }

  db.products.splice(index, 1);
  db.save();

  logAudit(
    { id: req.user!.userId, email: req.user!.email, role: req.user!.role },
    'PRODUCT_DELETED',
    'product',
    id
  );

  res.json({ message: 'Product removed successfully' });
});
