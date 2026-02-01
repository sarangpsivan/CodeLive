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
                className="fixed top-14 right-4 z-50 w-80 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans ring-1 ring-black/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">Active Collaborators</h2>
                    <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20 shadow-sm">
                        {activeMembers.length} Online
                    </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto scrollbar-hide p-2 space-y-1">
                    {activeMembers.length > 0 ? (
                        activeMembers.map(member => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-inner border border-white/10 text-xs">
                                    {(member.first_name || member.email || '?').charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-200 text-xs truncate group-hover:text-white transition-colors">
                                        {((member.first_name ? member.first_name + ' ' : '') + (member.last_name || '')).trim() || member.email || 'User'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate group-hover:text-gray-400">
                                        {member.email}
                                    </p>
                                </div>

                                <div className="w-2 h-2 bg-green-500 rounded-full border border-black shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-gray-500 text-xs italic">No active collaborators.</p>
                        </div>
                    )}
                </div>

                <div className="p-2 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 hover:text-white transition-all py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/5"
                    >
                        Close Menu
                    </button>
                </div>
            </div>
        </>
    );
};

export default ActiveCollaboratorsModal;