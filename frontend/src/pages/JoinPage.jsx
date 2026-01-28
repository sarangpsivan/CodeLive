import React, { useState } from 'react';
import { FaArrowRight, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { motion } from 'framer-motion';

// Simple Grid Background Component
const GridBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[var(--background)]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary-purple)]/5 rounded-full blur-[120px]"></div>
    </div>
);

const JoinPage = () => {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axiosInstance.post('/api/projects/join/', { room_code: roomCode });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to join project. Check the code and try again.');
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 font-sans text-white overflow-hidden">
            <GridBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass-card p-1 rounded-2xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                    <div className="bg-[#161B22]/80 rounded-xl p-8 border border-white/5">

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/20 transform rotate-3">
                                <FaLink className="text-2xl text-white" />
                            </div>
                            <h1 className="text-3xl font-bold font-display mb-2">Join a Project</h1>
                            <p className="text-gray-400">Enter the invite code shared by your team.</p>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300 ml-1 uppercase tracking-wider text-[10px]">Invite Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. AB12-CD34"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.2em] text-white placeholder-gray-700 focus:border-[var(--primary-purple)] focus:ring-1 focus:ring-[var(--primary-purple)] outline-none transition-all uppercase shadow-inner"
                                    maxLength={9}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-[var(--primary-purple)] hover:bg-[#7C3AED] text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                Enter Workspace <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        <div className="mt-8 text-center pt-6 border-t border-white/5">
                            <p className="text-sm text-gray-500">
                                Don't have a code? <button onClick={() => navigate('/dashboard')} className="text-[var(--primary-purple)] hover:text-white font-bold transition-colors">Go to Dashboard</button>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-600 mt-8 font-mono">CodeLive Secure Environment</p>
            </motion.div>
        </div>
    );
};

export default JoinPage;