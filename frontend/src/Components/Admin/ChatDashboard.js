import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatDashboard.css';

const socket = io('http://localhost:5000');

const ChatDashboard = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
    fetchStats();

    socket.on('new_message', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        // Add message to the list
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => 
            msg.message === data.message.message && 
            msg.timestamp === data.message.timestamp
          );
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
        scrollToBottom();
      }
      fetchChats(); // Update chat list
    });

    socket.on('user_typing', (data) => {
      if (selectedChat && data.chatId === selectedChat._id && data.sender === 'user') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    const interval = setInterval(fetchChats, 30000); // Refresh every 30s

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      clearInterval(interval);
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Fetching chats with token:', token ? 'exists' : 'missing');
      
      const response = await fetch('http://localhost:5000/api/chat/admin/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetch chats response:', data);
      
      if (data.success) {
        setChats(data.chats);
      } else {
        console.error('Failed to fetch chats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetch stats response:', data);
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages(chat.messages);
    socket.emit('join_chat', chat._id);
    scrollToBottom();
    await markAsRead(chat._id);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;

    const messageText = inputMessage;
    setInputMessage(''); // Clear input immediately

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/admin/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          message: messageText
        })
      });

      const data = await response.json();
      if (data.success) {
        // Message will be added via socket event, just update chat list
        fetchChats();
        scrollToBottom();
      } else {
        // If failed, restore the message
        setInputMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setInputMessage(messageText);
    }
  };

  const closeChat = async (chatId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/chat/admin/close/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchChats();
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`http://localhost:5000/api/chat/admin/read/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userType: 'admin' })
      });
      fetchChats();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleTyping = () => {
    if (selectedChat) {
      socket.emit('typing', { chatId: selectedChat._id, sender: 'admin', senderName: 'Support' });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredChats = chats.filter(chat => {
    if (filterStatus === 'all') return true;
    return chat.status === filterStatus;
  });

  return (
    <div className="chat-dashboard">
      <div className="chat-stats">
        {stats && (
          <>
            <div className="stat-card">
              <h3>{stats.totalChats}</h3>
              <p>Total</p>
            </div>
            <div className="stat-card">
              <h3>{stats.openChats}</h3>
              <p>Open</p>
            </div>
            <div className="stat-card">
              <h3>{stats.waitingChats}</h3>
              <p>Waiting</p>
            </div>
            <div className="stat-card">
              <h3>{stats.closedChats}</h3>
              <p>Closed</p>
            </div>
            <div className="stat-card">
              <h3>{stats.totalUnread}</h3>
              <p>Unread</p>
            </div>
          </>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-list">
          <div className="chat-list-header">
            <h2>Live Chats</h2>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="waiting">Waiting</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="chat-items">
            {filteredChats.map(chat => (
              <div
                key={chat._id}
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''} ${
                  chat.unreadCount?.admin > 0 ? 'unread' : ''
                }`}
                onClick={() => selectChat(chat)}
              >
                <div className="chat-item-header">
                  <span className="chat-item-user">{chat.userId?.name || 'Unknown User'}</span>
                  <span className="chat-item-time">
                    {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="chat-item-preview">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].message
                    : 'No messages yet'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Conversation Window */}
        <div className="conversation">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="conversation-header">
                <div className="conversation-header-info">
                  <h3>{selectedChat.userId?.name}</h3>
                  <p>{selectedChat.userId?.email}</p>
                </div>
                <button
                  onClick={() => closeChat(selectedChat._id)}
                  disabled={selectedChat.status === 'closed'}
                >
                  {selectedChat.status === 'closed' ? 'Closed' : 'Close Chat'}
                </button>
              </div>

              {/* Messages Area */}
              <div className="conversation-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === 'admin' ? 'user-message' : ''}`}>
                    <div className="message-avatar">
                      {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">{msg.senderName}</span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="message-bubble">
                        <span className="message-text">{msg.message}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {selectedChat.status !== 'closed' && (
                <div className="conversation-input">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      handleTyping();
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows="1"
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <h3>Select a chat to start messaging</h3>
              <p>Choose a conversation from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
