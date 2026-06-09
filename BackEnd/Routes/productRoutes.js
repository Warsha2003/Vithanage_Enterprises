const express = require('express');
const router = express.Router();
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');
const Product = require('../Models/Product');
const AuditLog = require('../Models/AuditLog');
const { 
  getAllProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  createSampleProducts,
  getNewArrivals,
  markAsNewArrival,
  removeFromNewArrivals,
  getCategories,
  getBrands,
  getPriceRange,
  getRecommendations,
  compareProducts
} = require('../Controllers/productController');
const { adminAuthMiddleware } = require('../Controllers/authMiddleware');

const recordAudit = async (req, action, entityType, entityId, description, details = {}) => {
  try {
    await AuditLog.create({
      actorType: req.admin ? 'admin' : 'system',
      actorId: req.admin?.id || null,
      actorModel: req.admin ? 'Admin' : null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      details,
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    });
  } catch (error) {
    console.warn('Product audit log write failed:', error.message);
  }
};

const clearCatalogCache = async (req) => {
  const cache = req.app.get('cache');
  if (cache && cache.flush) {
    try { await cache.flush(); } catch (error) { console.warn('Failed to clear cache:', error.message); }
  }
};

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/price-range', getPriceRange);
router.get('/recommendations', getRecommendations);
router.get('/compare', compareProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/export/csv', adminAuthMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const csv = stringify(products.map(product => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      imageUrl: product.imageUrl,
      stock: product.stock,
      featured: product.featured,
      isNewArrival: product.isNewArrival,
      warrantyMonths: product.warrantyMonths,
      warrantyTerms: product.warrantyTerms
    })), { header: true });

    await recordAudit(req, 'product.export_csv', 'Product', 'bulk', 'Exported products to CSV', { count: products.length });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting products CSV:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/import/csv', adminAuthMiddleware, async (req, res) => {
  try {
    const csvText = req.body.csv || req.body.csvText;
    if (!csvText) {
      return res.status(400).json({ message: 'CSV content is required' });
    }

    const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
    const results = [];

    for (const row of rows) {
      const payload = {
        name: row.name,
        description: row.description,
        price: Number(row.price),
        category: row.category,
        brand: row.brand,
        imageUrl: row.imageUrl || 'https://via.placeholder.com/300',
        stock: row.stock !== undefined ? Number(row.stock) : 0,
        featured: String(row.featured).toLowerCase() === 'true',
        isNewArrival: String(row.isNewArrival).toLowerCase() === 'true',
        warrantyMonths: row.warrantyMonths ? Number(row.warrantyMonths) : 12,
        warrantyTerms: row.warrantyTerms || ''
      };

      if (!payload.name || !payload.description || !payload.price || !payload.category || !payload.brand) {
        results.push({ name: payload.name || null, success: false, message: 'Missing required fields' });
        continue;
      }

      const existing = row._id ? await Product.findById(row._id) : await Product.findOne({ name: payload.name, brand: payload.brand });
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        results.push({ name: existing.name, success: true, action: 'updated', id: existing._id });
        await recordAudit(req, 'product.import_csv.update', 'Product', existing._id, 'Updated product from CSV import', payload);
      } else {
        const created = await Product.create(payload);
        results.push({ name: created.name, success: true, action: 'created', id: created._id });
        await recordAudit(req, 'product.import_csv.create', 'Product', created._id, 'Created product from CSV import', payload);
      }
    }

    await clearCatalogCache(req);
    res.json({ message: 'CSV import completed', results });
  } catch (error) {
    console.error('Error importing products CSV:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});
router.get('/setup/create-samples', createSampleProducts);
router.get('/:id', getProductById);

// Admin routes (only admins can add/edit/delete)
router.post('/', adminAuthMiddleware, addProduct);
router.put('/:id', adminAuthMiddleware, updateProduct);
router.delete('/:id', adminAuthMiddleware, deleteProduct);
router.put('/:id/mark-new-arrival', adminAuthMiddleware, markAsNewArrival);
router.put('/:id/remove-new-arrival', adminAuthMiddleware, removeFromNewArrivals);

module.exports = router;
