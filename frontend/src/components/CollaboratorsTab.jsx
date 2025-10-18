import React from 'react';
import { FaCrown, FaUserPlus } from 'react-icons/fa';

const CollaboratorsTab = ({ members = [], activeMembers = [], user, onInviteClick }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Team Members</h2>
                <button 
                    onClick={onInviteClick} 
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition"
                >
                    <FaUserPlus /> Invite Member
                </button>
            </div>
            <div className="bg-[var(--dark-card)] rounded-xl border border-gray-800">
                {members.map(member => {
                    const isOwner = member.role === 'ADMIN';
                    const isCurrentUser = user && user.user_id === member.user;
                    const isActive = activeMembers.includes(member.user);

                    return (
                        <div key={member.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0">
                            <div className="flex items-center">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary-purple)] flex items-center justify-center font-bold mr-4">
                                        {(member.first_name || member.email).charAt(0).toUpperCase()}
                                    </div>
                                    {isActive && <div className="absolute bottom-0 right-3 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--dark-card)]" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{isCurrentUser ? 'You' : (member.first_name || member.email)}</p>
                                    <p className="text-sm text-gray-400">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {isOwner && <FaCrown className="text-yellow-500" title="Owner" />}
                                <span className="text-sm text-gray-400 capitalize">{member.role.toLowerCase()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CollaboratorsTab;