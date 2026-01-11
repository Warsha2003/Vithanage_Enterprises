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
  const [chatStatus, setChatStatus] = useState('waiting');
  const [closedAtIndex, setClosedAtIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserChat();
    }

    socket.on('new_message', (data) => {
      console.log('Received message:', data);
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

    socket.on('chat_closed', (data) => {
      if (data.chatId === chatId) {
        setChatStatus('closed');
        setClosedAtIndex(messages.length);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('chat_closed');
    };
  }, [user, chatId, isOpen, messages.length]);

  const fetchUserChat = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Fetching user chat...');
      const response = await fetch('http://localhost:5000/api/chat/user/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('User chat response:', data);
      if (data.success) {
        setChatId(data.chat._id);
        setMessages(data.chat.messages);
        setUnreadCount(data.chat.unreadCount?.user || 0);
        setChatStatus(data.chat.status);
        // If chat is closed, mark where the separator should be
        if (data.chat.status === 'closed') {
          setClosedAtIndex(data.chat.messages.length);
        }
        socket.emit('join_chat', data.chat._id);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) {
      console.log('Cannot send - inputMessage:', inputMessage, 'user:', user);
      return;
    }

    if (!chatId) {
      console.log('No chatId available, fetching chat first...');
      await fetchUserChat();
      return;
    }

    console.log('Sending message:', inputMessage, 'chatId:', chatId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/user/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chatId: chatId,
          message: inputMessage 
        })
      });

      const data = await response.json();
      console.log('Send message response:', data);
      
      if (data.success) {
        // Don't add message manually - socket will receive it and add to prevent duplicates
        // If chat was closed, reopen it
        if (chatStatus === 'closed') {
          setChatStatus('waiting');
          setClosedAtIndex(null);
        }
        setInputMessage('');
        scrollToBottom();
      } else {
        console.error('Failed to send message:', data.message);
        alert('Failed to send message: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
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
      // Refresh messages when opening chat
      fetchUserChat();
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userType: 'user' })
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
          <div className="chat-button-content">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" 
              alt="Support Agent"
              className="chat-agent-avatar"
            />
          </div>
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
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((msg, index) => (
                <React.Fragment key={index}>
                  {closedAtIndex !== null && index === closedAtIndex && (
                    <div style={{
                      margin: '20px 0',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        borderTop: '2px solid #e0e0e0',
                        margin: '0 20px'
                      }}></div>
                      <div style={{
                        background: '#fff',
                        color: '#999',
                        fontSize: '12px',
                        padding: '5px 15px',
                        display: 'inline-block',
                        position: 'relative',
                        top: '-12px',
                        borderRadius: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        Chat was closed by support team
                      </div>
                    </div>
                  )}
                  <div className={`message ${msg.sender}`}>
                    <div className="message-sender">{msg.senderName}</div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </React.Fragment>
              ))
            )}
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
