import React from 'react';
import Header from '../Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans selection:bg-[hsl(var(--primary))]/30 flex flex-col">
            {/* Background Grid & Pattern */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.2] pointer-events-none z-0"></div>

            {/* Sticky Header */}
            <Header />

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 flex flex-col">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
