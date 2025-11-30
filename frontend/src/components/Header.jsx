import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import UserMenu from './UserMenu';

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <header className="bg-dark-card text-white p-4 px-8 flex justify-between items-center border-b border-gray-800">
            <Link to="/dashboard" className="text-2xl font-bold tracking-tight">
                CodeLive
            </Link>
            
            {user && (
                <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-white">
                        Hy, <span className="text-[var(--accent-lavender)]">{user.first_name || user.username}</span>
                    </span>

                    <UserMenu user={user} logoutUser={logoutUser} />
                </div>
            )}
        </header>
    );
};

export default Header;