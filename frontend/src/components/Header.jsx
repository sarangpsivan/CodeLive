import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import UserMenu from './UserMenu';

const Header = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();

    // Map routes to friendly names for breadcrumbs
    const getPageTitle = (path) => {
        if (path.includes('/dashboard')) return 'Dashboard';
        if (path.includes('/profile')) return 'Settings';
        if (path.includes('/project')) return 'Project Hub';
        return '';
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[hsl(var(--background))]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">

                {/* Logo & Breadcrumb */}
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ring-1 ring-white/10">
                            <Terminal className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <span className="font-bold text-lg font-display tracking-tight text-white">CodeLive</span>
                    </Link>

                    {/* Simple Breadcrumb Separator */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-gray-600">/</span>
                        <span className="text-sm font-medium text-gray-400">{getPageTitle(location.pathname)}</span>
                    </div>
                </div>

                {/* Right Side Actions */}
                {user && (
                    <div className="flex items-center gap-6">


                        <UserMenu user={user} logoutUser={logoutUser} />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;