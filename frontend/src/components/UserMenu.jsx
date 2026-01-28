import React, { useState, useRef, useEffect } from 'react';
import { FaSignOutAlt, FaCog, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const UserMenu = ({ user, logoutUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = (user?.first_name || user?.username || 'U').charAt(0).toUpperCase();
    const displayName = user?.first_name || user?.username || 'User';
    const displayEmail = user?.email || '';

    return (
        <div className="relative" ref={menuRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold border border-white/20 hover:shadow-[0_0_15px_-3px_rgba(124,58,237,0.5)] transition shadow-lg backdrop-blur-sm"
                title="Account"
            >
                {initials}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-3 w-72 bg-[#0d1117]/95 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-50 origin-top-right ring-1 ring-white/10 border border-white/10"
                    >

                        <div className="p-5 flex flex-col items-center border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-inner ring-1 ring-white/20">
                                {initials}
                            </div>
                            <h3 className="text-white font-bold text-lg font-display">{displayName}</h3>
                            <p className="text-gray-400 text-xs font-mono">{displayEmail}</p>
                        </div>

                        <div className="p-2 space-y-1">
                            <Link
                                to="/profile"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition text-sm group"
                            >
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <FaCog className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Settings</span>
                                    <span className="text-xs text-gray-500 group-hover:text-gray-400">Manage your account</span>
                                </div>
                            </Link>

                            <button
                                onClick={logoutUser}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition text-sm group"
                            >
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                                    <FaSignOutAlt className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Sign Out</span>
                                    <span className="text-xs text-gray-500 group-hover:text-gray-400">End your session</span>
                                </div>
                            </button>
                        </div>

                        <div className="bg-black/40 py-2.5 text-center border-t border-white/5">
                            <span className="text-[10px] text-gray-600 font-mono tracking-wider">CODELIVE v1.0</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserMenu;