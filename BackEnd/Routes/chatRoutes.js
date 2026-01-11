const express = require('express');
const router = express.Router();
const chatController = require('../Controllers/chatController');
const { authMiddleware, adminAuthMiddleware } = require('../Controllers/authMiddleware');

// User routes (authenticated users only)
router.get('/user/chat', authMiddleware, chatController.getUserChat);
router.post('/user/message', authMiddleware, chatController.sendUserMessage);
router.put('/user/read/:chatId', authMiddleware, chatController.markAsRead);

// Admin routes (authenticated admins only)
router.get('/admin/chats', adminAuthMiddleware, chatController.getAllChats);
router.get('/admin/chat/:chatId', adminAuthMiddleware, chatController.getChatById);
router.post('/admin/message', adminAuthMiddleware, chatController.sendAdminMessage);
router.put('/admin/close/:chatId', adminAuthMiddleware, chatController.closeChat);
router.put('/admin/read/:chatId', adminAuthMiddleware, chatController.markAsRead);
router.get('/admin/stats', adminAuthMiddleware, chatController.getChatStats);

module.exports = router;
