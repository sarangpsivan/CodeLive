import React from 'react';
import { motion } from 'framer-motion';

const ActionCard = ({ icon, title, description, buttonText, onClick, primary }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative p-8 rounded-2xl border flex flex-col items-start h-full overflow-hidden group ${primary
                    ? 'bg-[var(--primary-purple)]/10 border-[var(--primary-purple)]/30 hover:border-[var(--primary-purple)]/50'
                    : 'glass-card border-white/10 hover:border-white/20'
                }`}
        >
            {/* Background Gradient for Primary Card */}
            {primary && (
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--primary-purple)]/20 rounded-full blur-3xl group-hover:bg-[var(--primary-purple)]/30 transition-colors duration-500"></div>
            )}

            <div className={`p-3 rounded-xl mb-6 ${primary
                    ? 'bg-[var(--primary-purple)] text-white shadow-lg shadow-purple-900/20'
                    : 'bg-white/5 text-gray-300 group-hover:text-white group-hover:bg-white/10'
                } transition-colors`}>
                <div className="text-xl">
                    {icon}
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                {description}
            </p>

            <button
                onClick={onClick}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 transform group-hover:translate-y-0 ${primary
                        ? 'bg-[var(--primary-purple)] text-white hover:brightness-110 shadow-lg'
                        : 'bg-white/5 text-white hover:bg-white/15 border border-white/5 hover:border-white/10'
                    }`}
            >
                {buttonText}
            </button>
        </motion.div>
    );
};

export default ActionCard;