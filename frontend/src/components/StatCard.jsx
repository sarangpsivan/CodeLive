// StatCard component of the dashboard page
import React from 'react';

const StatCard = ({ value, label }) => (
    <div className="bg-[var(--dark-card)] p-6 rounded-2xl text-center border border-gray-800">
        <h3 className="text-4xl font-bold text-white">{value}</h3>
        <p className="text-gray-400 mt-1">{label}</p>
    </div>
);

export default StatCard;