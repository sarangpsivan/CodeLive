// main header component 
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <header className="bg-dark-card text-white p-4 px-8 flex justify-between items-center border-b border-gray-800">
            <Link to="/dashboard" className="text-2xl font-bold">CodeLive</Link>
            {user && (
                <div className="flex items-center space-x-4">
                    <span>Welcome, <span className="font-bold text-[var(--accent-lavender)]">{user.first_name || user.username}</span></span>
                    <button onClick={logoutUser} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition font-semibold">Logout</button>
                </div>
            )}
        </header>
    );
};

export default Header;