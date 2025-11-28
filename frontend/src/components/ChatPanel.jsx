import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { VscCommentDiscussion } from 'react-icons/vsc';

const ChatPanel = ({ messages, onSendMessage, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

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

  const myUserId = currentUser?.user_id;

  return (
    <div className="w-full bg-black border-l border-gray-800 flex flex-col h-full font-sans text-white">
      
      <div className="h-14 px-4 border-b border-gray-800 flex items-center gap-2 bg-[#1F242A] flex-shrink-0">
        <VscCommentDiscussion className="text-[var(--primary-purple)]" size={20} />
        <h2 className="font-bold text-sm">Team Chat</h2>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-hide">
        {messages.map((msg, index) => {
          const isFromMe = msg.user_id === myUserId;

          return (
            <div
              key={index}
              className={`flex flex-col mb-4 ${
                isFromMe ? 'items-end' : 'items-start'
              }`}
            >
              {!isFromMe && (
                <p className="font-bold text-[var(--accent-lavender)] text-xs mb-1 px-1">
                  {msg.username}
                </p>
              )}
              
              <div
                className={`text-white text-sm px-4 py-2 rounded-2xl max-w-[80%] break-words shadow-md ${
                  isFromMe
                    ? 'bg-[var(--primary-purple)] rounded-br-sm'
                    : 'bg-gray-700 rounded-bl-sm'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-800 bg-[#1F242A] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-gray-900 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm border border-gray-700"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[var(--primary-purple)] text-white p-3 rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;