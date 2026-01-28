import React, { useState } from 'react';
import { FaTimes, FaRocket } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        axiosInstance.post('/api/projects/', { name, description })
            .then(res => {
                onProjectCreated(res.data);
                onClose();
                setName('');
                setDescription('');
            })
            .catch(err => console.error(err));
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
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-white/5">
                        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                            <FaRocket className="text-[var(--primary-purple)]" />
                            New Project
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Project Name</label>
                            <input
                                type="text"
                                placeholder="e.g. NextGen Dashboard"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--primary-purple)] focus:ring-1 focus:ring-[var(--primary-purple)] focus:outline-none transition-all"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Description (Optional)</label>
                            <textarea
                                placeholder="What are you building?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--primary-purple)] focus:ring-1 focus:ring-[var(--primary-purple)] focus:outline-none transition-all resize-none h-24"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-[var(--primary-purple)] hover:bg-[#7c3aed] text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <FaRocket /> Create Project
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateProjectModal;