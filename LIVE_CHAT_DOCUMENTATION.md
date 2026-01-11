# Live Chat System Documentation

## Overview
A real-time chat system built with Socket.IO for user-admin communication in the Vithanage Enterprises e-commerce platform.

## Features

### For Users
- **Floating Chat Widget**: Always accessible chat button in bottom-right corner
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Typing Indicators**: See when admin is typing
- **Unread Count**: Badge showing unread messages
- **Message History**: All chat messages are saved in database
- **Responsive Design**: Works on mobile and desktop

### For Admins
- **Chat Dashboard**: Manage all customer conversations in one place
- **Live Statistics**: View total chats, open chats, waiting, closed, and unread messages
- **Status Filters**: Filter chats by status (all, open, waiting, closed)
- **Real-time Updates**: Automatic refresh for new messages
- **Chat Management**: Close conversations when resolved
- **User Information**: See customer name and email in chat
- **Typing Indicators**: See when users are typing

## Technical Stack

### Backend
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.IO server
- **Authentication**: JWT tokens

### Frontend
- **Framework**: React
- **Real-time**: Socket.IO client
- **Styling**: Custom CSS with animations

## File Structure

### Backend
```
BackEnd/
├── Models/
│   └── Chat.js                    # MongoDB schema for chat
├── Controllers/
│   └── chatController.js          # Business logic for chat operations
├── Routes/
│   └── chatRoutes.js             # API endpoints for chat
└── app.js                         # Socket.IO server setup
```

### Frontend
```
frontend/src/Components/
├── Chat/
│   ├── ChatWidget.js             # User chat component
│   └── ChatWidget.css            # User chat styles
└── Admin/
    ├── ChatDashboard.js          # Admin chat management
    └── ChatDashboard.css         # Admin chat styles
```

## API Endpoints

### User Endpoints
- **GET** `/api/chat/user/chat` - Get or create user's chat
- **POST** `/api/chat/user/message` - Send message as user
- **PUT** `/api/chat/user/read/:chatId` - Mark messages as read

### Admin Endpoints
- **GET** `/api/chat/admin/chats` - Get all chats with filters
- **GET** `/api/chat/admin/chat/:chatId` - Get specific chat
- **POST** `/api/chat/admin/message` - Send message as admin
- **PUT** `/api/chat/admin/close/:chatId` - Close a chat
- **PUT** `/api/chat/admin/read/:chatId` - Mark messages as read
- **GET** `/api/chat/admin/stats` - Get chat statistics

## Socket.IO Events

### Client → Server
- `join_chat` - Join a specific chat room
- `send_message` - Send a message
- `typing` - Notify typing status

### Server → Client
- `receive_message` - Receive new message
- `user_typing` - User is typing notification

## Database Schema

### Chat Model
```javascript
{
  userId: ObjectId,           // Reference to User
  userName: String,
  userEmail: String,
  adminId: ObjectId,          // Reference to Admin
  messages: [{
    sender: String,           // 'user' or 'admin'
    senderName: String,
    message: String,
    timestamp: Date,
    read: Boolean,
    attachments: [String]
  }],
  status: String,             // 'open', 'waiting', 'closed'
  category: String,           // Chat category (optional)
  orderId: ObjectId,          // Related order (optional)
  unreadCount: {
    user: Number,
    admin: Number
  },
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage

### For Users
1. Login to your account
2. Chat widget button appears in bottom-right corner
3. Click the button to open chat window
4. Type your message and press Enter or click Send
5. See replies from admin in real-time

### For Admins
1. Login to admin panel
2. Click "Live Chat" in sidebar menu
3. View all active conversations
4. Click on a chat to view and respond
5. Use "Close Chat" button when issue is resolved

## Configuration

### Socket.IO Connection
- **Server**: http://localhost:5000
- **Client Origin**: http://localhost:3000
- **Transport**: WebSocket with polling fallback

### Auto-refresh
- Chat list refreshes every 30 seconds
- Real-time updates via Socket.IO

## Security Features
- JWT authentication required for all endpoints
- User can only access their own chat
- Admin verification for admin endpoints
- Input validation and sanitization
- Protected Socket.IO connections

## Future Enhancements
- File/image attachments
- Voice messages
- Chat categories (support, sales, technical)
- Admin assignment to specific chats
- Canned responses for common questions
- Chat history export
- Customer satisfaction ratings
- Offline message queuing
