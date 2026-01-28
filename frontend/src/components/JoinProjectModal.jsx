import React, { useState } from 'react';
import { FaTimes, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

const JoinProjectModal = ({ isOpen, onClose }) => {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axiosInstance.post('/api/projects/join/', { room_code: roomCode });
            onClose();
            // Optional: trigger refresh in parent or navigate
            navigate(0); // Reload to show new project
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to join project');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#161b22] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-white/5">
                        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                            <FaLink className="text-blue-400" />
                            Join Project
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Invite Code</label>
                            <input
                                type="text"
                                placeholder="e.g. ab12-cd34"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono text-center tracking-widest uppercase"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all transform active:scale-[0.98]"
                            >
                                Join Project
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default JoinProjectModal;
