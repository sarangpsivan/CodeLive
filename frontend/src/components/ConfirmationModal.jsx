import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-md text-white">
                <h2 className="text-2xl font-bold text-red-400 mb-4">{title}</h2>
                <p className="text-gray-300 mb-8">{message}</p>
                
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-6 py-2 bg-red-800 font-bold rounded-lg hover:bg-red-700 transition"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;