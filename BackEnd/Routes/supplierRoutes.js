const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addProductToSupplier,
  removeProductFromSupplier,
  getSupplierStats,
  searchSuppliers
} = require('../Controllers/supplierController');

// Import auth middleware
const { authMiddleware: auth } = require('../Controllers/authMiddleware');

// Route: GET /api/suppliers
// Description: Get all suppliers with their products
// Access: Private (Admin only)
router.get('/', auth, getAllSuppliers);

// Route: GET /api/suppliers/stats
// Description: Get supplier statistics
// Access: Private (Admin only)
router.get('/stats', auth, getSupplierStats);

// Route: GET /api/suppliers/search
// Description: Search suppliers
// Access: Private (Admin only)
router.get('/search', auth, searchSuppliers);

// Route: GET /api/suppliers/:id
// Description: Get single supplier by ID
// Access: Private (Admin only)
router.get('/:id', auth, getSupplierById);

// Route: POST /api/suppliers
// Description: Create new supplier
// Access: Private (Admin only)
router.post('/', auth, createSupplier);

// Route: PUT /api/suppliers/:id
// Description: Update supplier
// Access: Private (Admin only)
router.put('/:id', auth, updateSupplier);

// Route: DELETE /api/suppliers/:id
// Description: Delete supplier
// Access: Private (Admin only)
router.delete('/:id', auth, deleteSupplier);

// Route: POST /api/suppliers/:id/products
// Description: Add product to supplier
// Access: Private (Admin only)
router.post('/:id/products', auth, addProductToSupplier);

// Route: DELETE /api/suppliers/:id/products/:productId
// Description: Remove product from supplier
// Access: Private (Admin only)
router.delete('/:id/products/:productId', auth, removeProductFromSupplier);

module.exports = router;