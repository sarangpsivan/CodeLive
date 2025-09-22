// src/components/ActionCard.jsx
import React from 'react';

const ActionCard = ({ icon, title, description, buttonText, primary = false }) => {
    // This is the fix: The primary button is now purple with white text
    const primaryButtonStyle = "bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110";
    const secondaryButtonStyle = "bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600";

    return (
        <div className="bg-[var(--dark-card)] p-8 rounded-2xl flex flex-col border border-gray-800 hover:border-[var(--primary-purple)] hover:scale-105 hover:shadow-lg hover:shadow-[var(--primary-purple)]/20 transition-all duration-300">
            <div className="flex items-center mb-4">
                <div className="text-2xl mr-4 text-[var(--accent-lavender)]">{icon}</div>
                <h2 className="text-2xl font-semibold">{title}</h2>
            </div>
            <p className="text-gray-400 mb-6 flex-grow">{description}</p>
            <button className={`w-full mt-auto py-3 transition-colors ${primary ? primaryButtonStyle : secondaryButtonStyle}`}>
                {buttonText}
            </button>
        </div>
    );
};

export default ActionCard;