import express, { Request, Response } from 'express';
import { db } from './db';
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateJWT,
  optionalAuth,
  authorizeRoles,
  AuthenticatedRequest
} from './auth';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & SESSIONS (JWT + BCRYPT)
// ==========================================

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'buyer', phone, businessName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (role === 'admin' || (role !== 'buyer' && role !== 'vendor')) {
      return res.status(403).json({ success: false, error: 'Public registration is only available for Buyer (Customer) and Vendor (Seller) accounts.' });
    }

    const existingUser = db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    let vendorId: string | undefined = undefined;

    // If registering as vendor, create vendor profile
    if (role === 'vendor') {
      const newVendor = db.insertOne('vendors', {
        businessName: businessName || `${name}'s Store`,
        ownerName: name,
        email: email.toLowerCase(),
        phone: phone || '+91 98000 00000',
        rating: 5.0,
        reviewsCount: 0,
        isVerified: false,
        status: 'pending',
        badge: 'New Seller',
        logo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
        joinedDate: new Date().toISOString().split('T')[0],
        dispatchTime: '1-2 Business Days',
        city: 'Mumbai, MH',
        kycDetails: {
          gstNumber: '27PENDING1234',
          panNumber: 'PENDING123',
          businessLicense: 'BL-NEW-2025',
          documentUrl: '',
          submittedAt: new Date().toISOString()
        },
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          fulfillmentRate: 100
        }
      });
      vendorId = newVendor.id || newVendor._id;
    }

    const newUser = db.insertOne('users', {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone: phone || '',
      vendorId,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      savedAddresses: [
        {
          id: 'addr_' + Date.now(),
          fullName: name,
          phone: phone || '+91 98765 43210',
          street: '123 Tech Residency, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560001',
          isDefault: true
        }
      ]
    });

    const token = generateToken({
      userId: newUser.id || newUser._id,
      email: newUser.email,
      role: newUser.role,
      vendorId: newUser.vendorId,
      name: newUser.name
    });

    const { passwordHash: _, ...safeUser } = newUser;

    // Log in audit
    db.insertOne('audit_logs', {
      action: 'USER_REGISTER',
      details: `New user registered: ${newUser.email} with role ${newUser.role}`,
      performedBy: newUser.id
    });

    res.status(201).json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user.id || user._id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
      name: user.name
    });

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

router.get('/auth/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findById('users', req.user!.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

router.post('/auth/switch-role', (req: Request, res: Response) => {
  const { targetRole, email } = req.body;
  const user = db.findOne('users', { role: targetRole });
  if (!user) {
    return res.status(404).json({ success: false, error: `No demo account found for role ${targetRole}` });
  }

  const token = generateToken({
    userId: user.id || user._id,
    email: user.email,
    role: user.role,
    vendorId: user.vendorId,
    name: user.name
  });

  const { passwordHash: _, ...safeUser } = user;

  res.json({
    success: true,
    token,
    user: safeUser,
    message: `Switched session to ${targetRole.toUpperCase()} mode`
  });
});

// ==========================================
// 2. PRODUCTS REST API
// ==========================================

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(stringList);
  return typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
}

function catalogFilter(query: Request['query']): Record<string, any> {
  const filter: Record<string, any> = {};
  const category = String(query.category || ''); const brands = stringList(query.brands || query.brand); const vendors = stringList(query.vendors || query.vendorId);
  if (category && category !== 'all') filter.category = category;
  if (brands.length) filter.brand = { $in: brands };
  if (vendors.length) filter.vendorId = { $in: vendors };
  const price: Record<string, number> = {};
  if (Number.isFinite(Number(query.minPrice))) price.$gte = Number(query.minPrice);
  if (Number.isFinite(Number(query.maxPrice))) price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length) filter.price = price;
  if (Number.isFinite(Number(query.minRating)) && Number(query.minRating) > 0) filter.rating = { $gte: Number(query.minRating) };
  if (query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.trending === 'true') filter.isTrending = true;
  if (query.flashDeal === 'true') filter.isFlashDeal = true;
  if (query.status && query.status !== 'all') filter.status = String(query.status);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) filter.$or = ['title', 'description', 'brand', 'vendorName', 'tags'].map(field => ({ [field]: { $regex: search, $options: 'i' } }));
  return filter;
}

function catalogSort(value: unknown): Record<string, 1 | -1> {
  switch (value) {
    case 'price_asc': return { price: 1, id: 1 };
    case 'price_desc': return { price: -1, id: 1 };
    case 'rating': return { rating: -1, id: 1 };
    case 'discount': return { discountPercentage: -1, id: 1 };
    case 'popularity': return { reviewsCount: -1, rating: -1, id: 1 };
    default: return { createdAt: -1, id: 1 };
  }
}

function countedFacets(products: any[]) {
  const count = (key: string, label = key) => Object.values(products.reduce((all: Record<string, any>, product) => {
    const value = product[key]; if (value) all[value] = all[value] || { value, label: product[label] || value, count: 0 }; if (value) all[value].count += 1; return all;
  }, {})).sort((left: any, right: any) => right.count - left.count);
  const prices = products.map(product => Number(product.price)).filter(Number.isFinite);
  return { brands: count('brand'), categories: count('category', 'categoryName'), vendors: count('vendorId', 'vendorName'), priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 } };
}

router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '24'), 10) || 24));
    const filter = catalogFilter(req.query);
    const [result, facetProducts] = await Promise.all([db.listCatalogProducts(filter, catalogSort(req.query.sort), page, limit), db.listCatalogFacetProducts(filter)]);
    const totalPages = Math.max(1, Math.ceil(result.total / limit));
    res.json({ success: true, products: result.products, pagination: { page, limit, total: result.total, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages }, facets: countedFacets(facetProducts), source: result.source });
  } catch (error: any) { res.status(503).json({ success: false, error: error.message || 'Catalog database unavailable' }); }
});

router.get('/products/:id', async (req: Request, res: Response) => {
  const product = await db.findCatalogProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const vendor = await db.findVendor(product.vendorId);
  const reviews = db.find('reviews', { productId: product.id });

  res.json({
    success: true,
    product,
    vendor,
    reviews
  });
});

router.post('/products', authenticateJWT, authorizeRoles('vendor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, price, originalPrice, category, brand, stock, images, thumbnail, specs, colors, tags } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ success: false, error: 'Title, price, and category are required' });
    }

    const vendorId = req.user?.vendorId || 'v_soundcrafters';
    const vendor = db.findById('vendors', vendorId) || { businessName: 'SoundCrafters Pro' };

    const discountPercentage = originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

    const newProduct = await db.insertCatalogProduct({
      title,
      description: description || '',
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      discountPercentage,
      category,
      brand: brand || 'Generic',
      vendorId,
      vendorName: vendor.businessName,
      rating: 5.0,
      reviewsCount: 0,
      stock: Number(stock || 10),
      images: images && images.length > 0 ? images : [thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
      thumbnail: thumbnail || (images && images[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      colors: colors || ['Default'],
      specs: specs || {},
      tags: tags || ['new'],
      isFeatured: false,
      isTrending: true
    });

    db.insertOne('audit_logs', {
      action: 'PRODUCT_CREATE',
      details: `Vendor ${vendor.businessName} added product ${newProduct.title}`,
      performedBy: req.user?.userId
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', authenticateJWT, authorizeRoles('vendor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.findCatalogProduct(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  if (req.user!.role !== 'admin' && existing.vendorId !== req.user!.vendorId) return res.status(403).json({ success: false, error: 'You can only update your own products' });
  const product = await db.updateCatalogProduct(req.params.id, req.body);
  res.json({ success: true, product });
});

router.delete('/products/:id', authenticateJWT, authorizeRoles('vendor', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const existing = await db.findCatalogProduct(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  if (req.user!.role !== 'admin' && existing.vendorId !== req.user!.vendorId) return res.status(403).json({ success: false, error: 'You can only delete your own products' });
  await db.deleteCatalogProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ==========================================
// 3. CATEGORIES & VENDORS
// ==========================================

router.get('/categories', async (req: Request, res: Response) => {
  const categories = await db.listCatalogCategories();
  res.json({ success: true, categories });
});

router.get('/vendors', (req: Request, res: Response) => {
  const vendors = db.find('vendors', {});
  res.json({ success: true, vendors });
});

router.get('/vendors/:id', (req: Request, res: Response) => {
  const vendor = db.findById('vendors', req.params.id);
  if (!vendor) {
    return res.status(404).json({ success: false, error: 'Vendor not found' });
  }
  const products = db.find('products', { vendorId: vendor.id });
  res.json({ success: true, vendor, products });
});

// ==========================================
// 4. ORDERS & MULTI-VENDOR DISPATCH
// ==========================================

router.get('/orders', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let orders: any[] = [];

  if (user.role === 'admin') {
    orders = db.find('orders', {}, { sort: { createdAt: -1 } });
  } else if (user.role === 'vendor') {
    // Return orders containing this vendor's items
    const allOrders = db.find('orders', {}, { sort: { createdAt: -1 } });
    orders = allOrders.filter(ord =>
      ord.subOrders && ord.subOrders.some((so: any) => so.vendorId === user.vendorId)
    );
  } else {
    // Buyer's own orders
    orders = db.find('orders', { userId: user.userId }, { sort: { createdAt: -1 } });
  }

  res.json({ success: true, orders });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.findById('orders', req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order });
});

router.post('/orders', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod = 'card' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }

    const orderId = 'ord_' + Math.floor(1000000 + Math.random() * 9000000);
    const trackingCode = 'FDX-' + Math.floor(100000000 + Math.random() * 900000000);

    // Group items by vendor
    const vendorMap: Record<string, any[]> = {};
    let subtotal = 0;

    for (const item of items) {
      subtotal += item.price * item.quantity;
      if (!vendorMap[item.vendorId]) {
        vendorMap[item.vendorId] = [];
      }
      vendorMap[item.vendorId].push(item);
    }

    const subOrders = Object.keys(vendorMap).map(vId => {
      const vItems = vendorMap[vId];
      const vendorName = vItems[0].vendorName || 'Verified Merchant';
      const vSubtotal = vItems.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);

      const subTracking = 'FDX-' + Math.floor(100000000 + Math.random() * 900000000);

      const milestones = [
        { status: 'placed', label: 'Order Placed', description: `Order ${orderId} confirmed with online payment.`, timestamp: new Date().toISOString(), completed: true, current: false },
        { status: 'confirmed', label: 'Confirmed by Seller', description: `${vendorName} acknowledged the order.`, timestamp: new Date().toISOString(), completed: true, current: true },
        { status: 'processing', label: 'Packing at Warehouse', description: 'Item being safely packaged.', timestamp: '', completed: false, current: false },
        { status: 'shipped', label: 'Dispatched via Courier', description: 'Handed over to carrier partner.', timestamp: '', completed: false, current: false },
        { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Courier out for final mile delivery.', timestamp: '', completed: false, current: false },
        { status: 'delivered', label: 'Delivered', description: 'Delivered to customer doorstep.', timestamp: '', completed: false, current: false }
      ];

      return {
        vendorId: vId,
        vendorName,
        items: vItems,
        subtotal: vSubtotal,
        shippingFee: vSubtotal > 1000 ? 0 : 99,
        status: 'confirmed',
        trackingNumber: subTracking,
        courier: 'FedEx Express Courier',
        estimatedDelivery: new Date(Date.now() + 3600000 * 48).toISOString(),
        milestones
      };
    });

    const shippingTotal = subOrders.reduce((sum, so) => sum + so.shippingFee, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const discount = subtotal > 50000 ? 2500 : 0;
    const totalAmount = subtotal + tax + shippingTotal - discount;

    const newOrder = db.insertOne('orders', {
      id: orderId,
      userId: req.user?.userId || 'u_buyer_demo',
      customerName: req.user?.name || shippingAddress?.fullName || 'Valued Customer',
      customerEmail: req.user?.email || 'customer@marketnexus.io',
      customerPhone: shippingAddress?.phone || '+91 98765 43210',
      shippingAddress: shippingAddress || {
        id: 'addr_default',
        fullName: 'Aarav Patel',
        phone: '+91 98765 43210',
        street: 'Flat 402, Skyline Residency, 100 Feet Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038'
      },
      items,
      subOrders,
      subtotal,
      tax,
      shippingTotal,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed',
      overallTrackingNumber: trackingCode
    });

    // Reduce stock
    for (const item of items) {
      const prod = db.findById('products', item.productId);
      if (prod) {
        db.updateOne('products', { id: prod.id }, { stock: Math.max(0, prod.stock - item.quantity) });
      }
    }

    db.insertOne('audit_logs', {
      action: 'ORDER_CREATE',
      details: `Order #${orderId} created for ₹${totalAmount.toLocaleString('en-IN')}`,
      performedBy: req.user?.userId
    });

    res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/orders/:id/status', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { status, vendorId } = req.body;
  const order = db.findById('orders', req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  // If vendor updating their subOrder
  if (vendorId && order.subOrders) {
    for (const so of order.subOrders) {
      if (so.vendorId === vendorId) {
        so.status = status;
        // Update milestone
        for (const m of so.milestones) {
          if (m.status === status) {
            m.completed = true;
            m.current = true;
            m.timestamp = new Date().toISOString();
          } else {
            m.current = false;
          }
        }
      }
    }
  } else {
    order.status = status;
  }

  db.updateOne('orders', { id: order.id }, order);

  res.json({ success: true, order });
});

// ==========================================
// 5. REVIEWS & RATINGS
// ==========================================

router.get('/reviews', (req: Request, res: Response) => {
  const { productId } = req.query;
  const query = productId ? { productId } : {};
  const reviews = db.find('reviews', query, { sort: { createdAt: -1 } });
  res.json({ success: true, reviews });
});

router.post('/reviews', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { productId, rating, title, comment } = req.body;
  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, error: 'Product ID, rating, and comment are required' });
  }

  const newReview = db.insertOne('reviews', {
    productId,
    userId: req.user?.userId || 'u_guest',
    userName: req.user?.name || 'Customer',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: Number(rating),
    title: title || 'Product Review',
    comment,
    isVerifiedPurchase: true,
    helpfulCount: 0
  });

  // Recompute product rating
  const productReviews = db.find('reviews', { productId });
  const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  db.updateOne('products', { id: productId }, {
    rating: Math.round(avgRating * 10) / 10,
    reviewsCount: productReviews.length
  });

  res.status(201).json({ success: true, review: newReview });
});

// ==========================================
// 6. ADMIN & MODERATION METRICS
// ==========================================

router.get('/admin/metrics', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const orders = db.find('orders', {});
  const products = db.find('products', {});
  const vendors = db.find('vendors', {});
  const users = db.find('users', {});

  const totalGMV = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
  const platformRevenue = Math.round(totalGMV * 0.10); // 10% marketplace commission

  const pendingApprovals = vendors.filter(v => v.status === 'pending').length;

  res.json({
    success: true,
    metrics: {
      totalGMV,
      platformRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalVendors: vendors.length,
      totalBuyers: users.filter(u => u.role === 'buyer').length,
      pendingApprovals,
      conversionRate: 3.42,
      activeDisputes: 2
    }
  });
});

router.post('/admin/vendors/:id/approve', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const result = db.updateOne('vendors', { id: req.params.id }, {
    status: 'approved',
    isVerified: true,
    badge: 'Verified Merchant'
  });

  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, error: 'Vendor not found' });
  }

  db.insertOne('audit_logs', {
    action: 'VENDOR_APPROVE',
    details: `Admin approved vendor ${result.doc?.businessName}`,
    performedBy: req.user?.userId
  });

  res.json({ success: true, vendor: result.doc });
});

router.post('/admin/vendors/:id/reject', authenticateJWT, authorizeRoles('admin'), (req: AuthenticatedRequest, res: Response) => {
  const result = db.updateOne('vendors', { id: req.params.id }, {
    status: 'rejected',
    isVerified: false
  });

  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, error: 'Vendor not found' });
  }

  res.json({ success: true, vendor: result.doc });
});

// ==========================================
// 7. MONGODB COMPASS STUDIO & QUERY ENGINE
// ==========================================

router.get('/mongodb/collections', (req: Request, res: Response) => {
  const stats = db.getCollectionStats();
  res.json({
    success: true,
    database: 'marketnexus',
    host: 'mongodb+srv://cluster0.marketnexus.internal',
    version: '7.0.5 Community',
    collections: stats
  });
});

router.get('/mongodb/collections/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const docs = db.find(name, {}, { limit: 100 });
  res.json({ success: true, collection: name, count: docs.length, documents: docs });
});

router.post('/mongodb/query', (req: Request, res: Response) => {
  const { collection, filter = {}, sort = {}, limit = 50, skip = 0 } = req.body;

  if (!collection) {
    return res.status(400).json({ success: false, error: 'Collection name is required' });
  }

  const startTime = performance.now();
  const documents = db.find(collection, filter, { sort, limit: Number(limit), skip: Number(skip) });
  const count = db.countDocuments(collection, filter);
  const executionTimeMs = (performance.now() - startTime).toFixed(2);

  res.json({
    success: true,
    collection,
    query: { filter, sort, limit, skip },
    executionStats: {
      executionTimeMs: `${executionTimeMs}ms`,
      totalDocsExamined: count,
      nReturned: documents.length,
      indexUsed: '_id_'
    },
    documents
  });
});

router.post('/mongodb/collections/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const newDoc = db.insertOne(name, req.body);
  res.status(201).json({ success: true, document: newDoc });
});

router.put('/mongodb/collections/:name/:id', (req: Request, res: Response) => {
  const { name, id } = req.params;
  const result = db.updateOne(name, { id }, req.body);
  res.json({ success: true, ...result });
});

router.delete('/mongodb/collections/:name/:id', (req: Request, res: Response) => {
  const { name, id } = req.params;
  const result = db.deleteOne(name, { id });
  res.json({ success: true, ...result });
});

export default router;
