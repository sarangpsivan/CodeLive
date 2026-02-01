import React, { useState } from 'react';
import { FaPaperPlane, FaRobot, FaSync } from 'react-icons/fa';
import { VscClose } from 'react-icons/vsc';
import axiosInstance from '../utils/axiosInstance';

const AIChatPanel = ({ projectId, activeFile, onClose }) => {
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
                query: userMessage,
                code: activeFile?.content,
                file_name: activeFile?.name
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
        <div className="w-full bg-[#09090b] border-l border-[#27272a] flex flex-col h-full font-sans text-white">

            <div className="h-10 px-4 border-b border-[#27272a] flex justify-between items-center bg-[#09090b] flex-shrink-0">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <FaRobot size={16} />
                    <span>AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleIndexProject}
                        disabled={isIndexing}
                        className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] transition text-gray-300 ${isIndexing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Read all files and update AI memory"
                    >
                        <FaSync className={isIndexing ? "animate-spin" : ""} />
                        {isIndexing ? 'Indexing...' : 'Index Code'}
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white md:hidden">
                            <VscClose size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[90%] p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${msg.sender === 'user'
                                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                                : 'bg-transparent text-gray-300 border border-[#27272a]'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-transparent text-gray-500 p-2 rounded text-xs italic border border-[#27272a]">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-[#27272a] bg-[#09090b] flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your code..."
                        disabled={isLoading}
                        className="flex-grow bg-[#1c1c1c] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm border border-[#27272a] placeholder-gray-600 shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-[#27272a] text-white p-2 rounded-md hover:bg-[#3f3f46] transition disabled:opacity-50 disabled:cursor-not-allowed border border-[#3f3f46] shadow-sm"
                    >
                        <FaPaperPlane size={12} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatPanel;