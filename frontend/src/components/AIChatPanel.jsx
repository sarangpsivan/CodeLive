import React, { useState } from 'react';
import { FaPaperPlane, FaRobot, FaSync } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';

const AIChatPanel = ({ projectId }) => {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Hello! I am your AI assistant. I can answer questions about your code. Make sure to "Index" the project first!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);

    const handleIndexProject = async () => {
        setIsIndexing(true);
        try {
            await axiosInstance.post(`/api/projects/${projectId}/ai/index/`);
            setMessages(prev => [...prev, { sender: 'ai', text: '✅ Project successfully indexed! I now understand your latest code.' }]);
        } catch (error) {
            console.error("Indexing failed:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: '❌ Failed to index the project. Please try again.' }]);
        } finally {
            setIsIndexing(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axiosInstance.post(`/api/projects/${projectId}/ai/chat/`, {
                query: userMessage
            });
            
            setMessages(prev => [...prev, { sender: 'ai', text: response.data.answer }]);
        } catch (error) {
            console.error("AI Chat error:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error processing your request.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-black border-l border-gray-800 flex flex-col h-full font-sans text-white">
            
            <div className="h-14 px-4 border-b border-gray-800 flex justify-between items-center bg-[#1F242A] flex-shrink-0">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <FaRobot className="text-[var(--primary-purple)]" size={20} />
                    AI Assistant
                </div>
                <button 
                    onClick={handleIndexProject}
                    disabled={isIndexing}
                    className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition text-gray-200 ${isIndexing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Read all files and update AI memory"
                >
                    <FaSync className={isIndexing ? "animate-spin" : ""} />
                    {isIndexing ? 'Indexing...' : 'Index Code'}
                </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${
                                msg.sender === 'user' 
                                    ? 'bg-[var(--primary-purple)] text-white rounded-br-none' 
                                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-400 p-3 rounded-lg text-sm italic animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-800 bg-[#1F242A] flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your code..."
                        disabled={isLoading}
                        className="flex-grow bg-gray-900 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm border border-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-[var(--primary-purple)] text-white p-3 rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatPanel;