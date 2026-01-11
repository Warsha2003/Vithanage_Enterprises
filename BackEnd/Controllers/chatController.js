const Chat = require('../Models/Chat');
const User = require('../Models/User');

// Create or get existing chat for user
exports.getUserChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the most recent chat (including closed ones)
    let chat = await Chat.findOne({ userId }).sort({ createdAt: -1 });

    // If no chat exists at all, create a new one
    if (!chat) {
      chat = new Chat({
        userId,
        userName: user.name,
        userEmail: user.email,
        status: 'waiting',
        messages: []
      });
      await chat.save();
    }

    res.json({ success: true, chat: chat });
  } catch (error) {
    console.error('Get user chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message from user
exports.sendUserMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const chat = await Chat.findOne({ _id: chatId, userId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = {
      sender: 'user',
      senderName: user.name,
      message,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessageAt = new Date();
    chat.unreadCount.admin += 1;
    chat.status = 'waiting';
    
    await chat.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', { chatId: chat._id, message: newMessage });
    }

    res.json({ success: true, chat: chat });
  } catch (error) {
    console.error('Send user message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all chats for admin
exports.getAllChats = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const chats = await Chat.find(query)
      .sort({ lastMessageAt: -1 })
      .populate('userId', 'name email')
      .populate('orderId', '_id');

    res.json({ success: true, chats: chats });
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single chat for admin
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('userId', 'name email phone')
      .populate('orderId');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark admin messages as read
    chat.unreadCount.admin = 0;
    await chat.save();

    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message from admin
exports.sendAdminMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const adminId = req.admin.id;
    const adminName = req.admin.name || 'Admin';

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = {
      sender: 'admin',
      senderName: adminName,
      message,
      timestamp: new Date()
    };

    chat.messages.push(newMessage);
    chat.lastMessageAt = new Date();
    chat.unreadCount.user += 1;
    chat.adminId = adminId;
    chat.adminName = adminName;
    chat.status = 'open';
    
    await chat.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', { chatId: chat._id, message: newMessage });
    }

    res.json({ success: true, chat: chat });
  } catch (error) {
    console.error('Send admin message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close chat
exports.closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.status = 'closed';
    await chat.save();

    // Emit socket event to notify user
    const io = req.app.get('io');
    if (io) {
      io.emit('chat_closed', { chatId: chat._id });
    }

    res.json({ success: true, message: 'Chat closed successfully', chat: chat });
  } catch (error) {
    console.error('Close chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userType } = req.body; // 'user' or 'admin'

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (userType === 'user') {
      chat.unreadCount.user = 0;
    } else if (userType === 'admin') {
      chat.unreadCount.admin = 0;
    }

    await chat.save();

    res.json({ success: true, chat: chat });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat statistics for admin
exports.getChatStats = async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments();
    const openChats = await Chat.countDocuments({ status: 'open' });
    const waitingChats = await Chat.countDocuments({ status: 'waiting' });
    const closedChats = await Chat.countDocuments({ status: 'closed' });
    const unreadMessages = await Chat.aggregate([
      { $group: { _id: null, total: { $sum: '$unreadCount.admin' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalChats: totalChats,
        openChats: openChats,
        waitingChats: waitingChats,
        closedChats: closedChats,
        totalUnread: unreadMessages[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
