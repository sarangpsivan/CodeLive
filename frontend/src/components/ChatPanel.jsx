import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { VscCommentDiscussion, VscClose } from 'react-icons/vsc';

const ChatPanel = ({ messages, onSendMessage, currentUser, onClose }) => {
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
    <div className="w-full bg-[#09090b] border-l border-[#27272a] flex flex-col h-full font-sans text-white">

      <div className="h-10 px-4 border-b border-[#27272a] flex items-center gap-2 bg-[#09090b] flex-shrink-0">
        <VscCommentDiscussion className="text-purple-500" size={16} />
        <h2 className="font-bold text-xs uppercase tracking-wider text-white flex-grow">Team Chat</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white md:hidden">
            <VscClose size={16} />
          </button>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-hide">
        {messages.map((msg, index) => {
          const isFromMe = msg.user_id === myUserId;

          return (
            <div
              key={index}
              className={`flex flex-col mb-4 ${isFromMe ? 'items-end' : 'items-start'
                }`}
            >
              {!isFromMe && (
                <p className="font-medium text-gray-500 text-xs mb-1 px-1">
                  {msg.username}
                </p>
              )}

              <div
                className={`text-sm px-4 py-2 max-w-[85%] break-words shadow-sm ${isFromMe
                  ? 'bg-[#27272a] text-white border border-[#3f3f46] rounded-lg rounded-tr-none'
                  : 'bg-purple-600 text-white rounded-lg rounded-tl-none'
                  }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#27272a] bg-[#09090b] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-[#1c1c1c] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-sm border border-[#27272a] placeholder-gray-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/50 shadow-sm"
          >
            <FaPaperPlane size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;