import React from 'react';
import { VscClose } from 'react-icons/vsc';

const ActiveCollaboratorsModal = ({ isOpen, onClose, activeMembers = [] }) => {
    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={onClose} 
            />

            <div 
                className="fixed top-14 right-4 z-50 w-80 bg-[#1e2329] border border-gray-700 rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()} 
            >
                <div className="px-6 py-4 bg-[#252a31] border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-200">Active Collaborators</h2>
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {activeMembers.length} Online
                    </span>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto scrollbar-hide p-2 space-y-1">
                    {activeMembers.length > 0 ? (
                        activeMembers.map(member => (
                            <div 
                                key={member.id} 
                                className="flex items-center gap-3 p-2 hover:bg-[#2d333b] rounded-xl transition-colors cursor-default"
                            >
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-purple)] flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm border-2 border-[#1e2329]">
                                    {(member.first_name || member.email).charAt(0).toUpperCase()}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-200 text-sm truncate">
                                        {member.first_name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {member.email}
                                    </p>
                                </div>

                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#2d333b]"></div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-gray-500 text-sm">No one else is here.</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#252a31] p-2 border-t border-gray-700 text-center">
                    <button 
                        onClick={onClose}
                        className="text-xs font-medium text-gray-400 hover:text-white transition py-1"
                    >
                        Close Menu
                    </button>
                </div>
            </div>
        </>
    );
};

export default ActiveCollaboratorsModal;