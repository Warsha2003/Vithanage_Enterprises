import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatWidget.css';

const socket = io('http://localhost:5000');

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserChat();
    }

    socket.on('receive_message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        if (!isOpen && data.message.sender === 'admin') {
          setUnreadCount(prev => prev + 1);
        }
        scrollToBottom();
      }
    });

    socket.on('user_typing', (data) => {
      if (data.chatId === chatId && data.sender === 'admin') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [user, chatId, isOpen]);

  const fetchUserChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/user/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChatId(data.chat._id);
        setMessages(data.chat.messages);
        setUnreadCount(data.chat.unreadCount?.user || 0);
        socket.emit('join_chat', data.chat._id);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/user/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();
      if (data.success) {
        const newMessage = {
          sender: 'user',
          senderName: user.name,
          message: inputMessage,
          timestamp: new Date()
        };
        
        socket.emit('send_message', {
          chatId: data.chat._id,
          message: newMessage
        });

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (chatId) {
      socket.emit('typing', { chatId, sender: 'user', senderName: user?.name });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    if (!chatId) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/chat/user/read/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="chat-widget">
      {!isOpen && (
        <button className="chat-button" onClick={toggleChat}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Chat with Support</h3>
            <button className="close-button" onClick={toggleChat}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-sender">{msg.senderName}</div>
                <div className="message-text">{msg.message}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
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

          <div className="chat-input">
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
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
