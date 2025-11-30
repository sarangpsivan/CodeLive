import React, { useState, useRef, useEffect } from 'react';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';

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
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-[var(--primary-purple)] flex items-center justify-center text-white font-bold border-2 border-white hover:border-gray-200 transition focus:outline-none shadow-sm"
                title="Account"
            >
                {initials}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1e2329] border border-gray-700 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    
                    <div className="p-4 flex flex-col items-center border-b border-gray-700">
                        <div className="w-16 h-16 rounded-full bg-[var(--primary-purple)] flex items-center justify-center text-2xl font-bold text-white mb-3">
                            {initials}
                        </div>
                        <h3 className="text-white font-semibold text-lg">{displayName}</h3>
                        <p className="text-gray-400 text-sm">{displayEmail}</p>
                    </div>

                    <div className="p-2 space-y-1">
                        <div className="px-4 py-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account</p>
                        </div>

                        <Link 
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-[#2d333b] rounded-xl transition text-sm text-left"
                        >
                            <FaCog className="text-gray-400" />
                            Manage Account
                        </Link>

                        <div className="border-t border-gray-700 my-1 mx-2"></div>

                        <button 
                            onClick={logoutUser}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-[#2d333b] rounded-xl transition text-sm text-left"
                        >
                            <FaSignOutAlt className="text-gray-400" />
                            Sign Out
                        </button>
                    </div>

                    <div className="bg-[#252a31] py-2 text-center border-t border-gray-700">
                        <span className="text-[10px] text-gray-500">CodeLive Account</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;