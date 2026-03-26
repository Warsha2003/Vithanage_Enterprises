const express = require('express');
const router = express.Router();
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');
const {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  deleteQuestion,
  markHelpful,
  getMyQuestions,
  getUnansweredQuestions
} = require('../Controllers/questionController');

// Public route - get questions for a product
router.get('/product/:productId', getProductQuestions);

// Protected routes - require auth
router.post('/product/:productId', authMiddleware, askQuestion);
router.post('/:questionId/helpful', authMiddleware, markHelpful);
router.delete('/:questionId', authMiddleware, deleteQuestion);
router.get('/my-questions', authMiddleware, getMyQuestions);

// Admin routes
router.put('/:questionId/answer', adminAuthMiddleware, answerQuestion);
router.get('/unanswered', adminAuthMiddleware, getUnansweredQuestions);

module.exports = router;
