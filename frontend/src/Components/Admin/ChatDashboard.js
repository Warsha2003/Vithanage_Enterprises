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

    socket.on('receive_message', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages(prev => [...prev, data.message]);
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
      socket.off('receive_message');
      socket.off('user_typing');
      clearInterval(interval);
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/chat/admin/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/chat/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
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

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/chat/admin/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: selectedChat._id,
          message: inputMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        const newMessage = {
          sender: 'admin',
          senderName: 'Support Team',
          message: inputMessage,
          timestamp: new Date()
        };

        socket.emit('send_message', {
          chatId: selectedChat._id,
          message: newMessage
        });

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        scrollToBottom();
        fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const closeChat = async (chatId) => {
    try {
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5000/api/chat/admin/read/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
              <p>Total Chats</p>
            </div>
            <div className="stat-card">
              <h3>{stats.openChats}</h3>
              <p>Open Chats</p>
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
                  <h4>{chat.userId?.name || 'Unknown User'}</h4>
                  <span className={`status-badge ${chat.status}`}>{chat.status}</span>
                </div>
                <p className="chat-preview">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].message
                    : 'No messages yet'}
                </p>
                <div className="chat-item-footer">
                  <span className="chat-time">
                    {new Date(chat.updatedAt).toLocaleString()}
                  </span>
                  {chat.unreadCount?.admin > 0 && (
                    <span className="unread-count">{chat.unreadCount.admin}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-conversation">
          {selectedChat ? (
            <>
              <div className="conversation-header">
                <div>
                  <h3>{selectedChat.userId?.name}</h3>
                  <p>{selectedChat.userId?.email}</p>
                </div>
                <button
                  className="close-chat-btn"
                  onClick={() => closeChat(selectedChat._id)}
                  disabled={selectedChat.status === 'closed'}
                >
                  {selectedChat.status === 'closed' ? 'Closed' : 'Close Chat'}
                </button>
              </div>

              <div className="conversation-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <div className="message-sender">{msg.senderName}</div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedChat.status !== 'closed' && (
                <div className="conversation-input">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      handleTyping();
                      if (e.key === 'Enter') sendMessage();
                    }}
                    placeholder="Type your message..."
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
