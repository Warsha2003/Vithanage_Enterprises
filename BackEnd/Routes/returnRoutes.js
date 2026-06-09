const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../Controllers/authMiddleware');
const {
  createReturnRequest,
  getUserReturns,
  getReturnById,
  cancelReturnRequest,
  checkReturnEligibility
} = require('../Controllers/returnController');

router.use(authMiddleware);

router.post('/', createReturnRequest);
router.get('/', getUserReturns);
router.get('/eligibility/:orderId/:productId', checkReturnEligibility);
router.get('/:id', getReturnById);
router.delete('/:id', cancelReturnRequest);

module.exports = router;