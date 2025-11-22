// chat panel component for displaying messages and sending new ones.
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const ChatPanel = ({ messages, onSendMessage, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // === 1. ADD THIS LOG ===
  // This will run once and show us what's in the currentUser prop
  useEffect(() => {
    console.log('CURRENT USER OBJECT:', currentUser);
  }, [currentUser]);
  // ========================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  // === 2. ADD THIS LOG ===
  // This will run when messages change and show us the message array
  useEffect(() => {
    if (messages.length > 0) {
      console.log('MESSAGES ARRAY:', messages);
      console.log('FIRST MESSAGE OBJECT:', messages[0]);
    }
  }, [messages]);
  // ========================

  // We are guessing the field names here. The console logs will give us the real names.
  const myUserId = currentUser?.pk; // Maybe it's 'pk', 'user_id', etc.
  
  return (
    <div className="w-full bg-dark-card border-l border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-bold text-white">Chat</h2>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => {
          // We are guessing the field name here. The console log will give us the real name.
          const isFromMe = msg.user === myUserId; // Maybe it's 'msg.sender' or 'msg.author_id'

          return (
            <div
              key={index}
              className={`flex flex-col mb-4 ${
                isFromMe ? 'items-end' : 'items-start'
              }`}
            >
              <p className="font-bold text-accent-lavender text-sm mb-1 px-1">
                {isFromMe ? 'You' : msg.username}
              </p>
              <p
                className={`text-white text-sm p-2 rounded-lg max-w-[80%] break-words ${
                  isFromMe
                    ? 'bg-primary-purple'
                    : 'bg-gray-700'
                }`}
              >
                {msg.message}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* ... (form code is unchanged) ... */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple"
          />
          <button
            type="submit"
            className="bg-primary-purple text-white p-3 rounded-lg hover:brightness-110 transition"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;