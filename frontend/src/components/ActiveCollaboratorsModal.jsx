import React from 'react';

const ActiveCollaboratorsModal = ({ isOpen, onClose, activeMembers = [] }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose} 
        >
            <div 
                className="bg-[var(--dark-card)] p-6 rounded-2xl shadow-lg border border-gray-800 w-full max-w-sm text-white"
                onClick={e => e.stopPropagation()} 
            >
                <h2 className="text-xl font-bold mb-6">Active Collaborators ({activeMembers.length})</h2>
                
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                    {activeMembers.length > 0 ? (
                        activeMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-purple)] flex-shrink-0 flex items-center justify-center font-bold">
                                    {(member.first_name || member.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate">
                                        {member.first_name || 'User'}
                                    </p>
                                    <p className="text-sm text-gray-400 truncate">
                                        {member.email}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No one else is active right now.</p>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActiveCollaboratorsModal;