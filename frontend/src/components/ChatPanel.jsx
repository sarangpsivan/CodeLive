// chat panel component for displaying messages and sending new ones.
import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const ChatPanel = ({ messages, onSendMessage }) => {
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

    return (
        <div className="w-full bg-dark-card border-l border-gray-800 flex flex-col h-full">
            <div className="p-4 border-b border-gray-800">
                <h2 className="font-bold text-white">Chat</h2>
            </div>

            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-4">
                        <p className="font-bold text-accent-lavender text-sm">{msg.username}</p>
                        <p className="text-white text-sm bg-gray-700 p-2 rounded-lg inline-block">{msg.message}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-purple"
                    />
                    <button type="submit" className="bg-primary-purple text-white p-3 rounded-lg hover:brightness-110 transition">
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;