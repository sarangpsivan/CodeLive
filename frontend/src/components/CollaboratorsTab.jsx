import React from 'react';
import { FaCrown, FaUserPlus } from 'react-icons/fa';

const CollaboratorsTab = ({ members = [], activeMembers = [], user, onInviteClick }) => {
    return (
        <div className="space-y-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white font-display">Team Members</h2>
                <button
                    onClick={onInviteClick}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--primary-purple)] text-white font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-purple-900/20"
                >
                    <FaUserPlus /> Invite Member
                </button>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-white/5">
                    {members.map(member => {
                        const isOwner = member.role === 'ADMIN';
                        const isCurrentUser = user && user.user_id === member.user;
                        const isActive = activeMembers.includes(member.user);

                        return (
                            <div key={member.id} className="flex items-center justify-between p-4 md:p-5 hover:bg-white/5 transition-colors group gap-4">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center font-bold text-base md:text-lg text-white ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                            {(member.first_name || member.email).charAt(0).toUpperCase()}
                                        </div>
                                        {isActive && (
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-[#161B22] shadow-sm animate-pulse" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-white flex items-center gap-2 truncate text-sm md:text-base">
                                            <span className="truncate">{isCurrentUser ? 'You' : `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}</span>
                                            {isOwner && <FaCrown className="text-yellow-400 text-xs md:text-sm shrink-0" title="Project Owner" />}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 font-mono truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide ${member.role === 'ADMIN'
                                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                        : member.role === 'EDITOR'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CollaboratorsTab;