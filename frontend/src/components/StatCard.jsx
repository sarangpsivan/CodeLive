import React from 'react';

const StatCard = ({ value, label }) => {
    return (
        <div className="glass-card w-32 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
            <h3 className="text-4xl font-bold font-display text-white mb-2">{value}</h3>
            <p className="text-sm font-medium text-gray-400 tracking-wide uppercase">{label}</p>
        </div>
    );
};

export default StatCard;