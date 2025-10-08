import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FaCrown, FaEllipsisV, FaSignOutAlt } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

// MemberActions component
const MemberActions = ({ member, isOwnerView, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleBlur = () => { setTimeout(() => setIsOpen(false), 200); };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} onBlur={handleBlur} className="p-2 text-gray-400 hover:text-white rounded-full">
                <FaEllipsisV />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                    {isOwnerView ? (
                        <>
                            <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600">Change Role</button>
                            <button onClick={() => onAction('remove', member)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Remove</button>
                        </>
                    ) : (
                        <button onClick={() => onAction('exit', member)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Exit Project</button>
                    )}
                </div>
            )}
        </div>
    );
};

const CollaboratorsTab = ({ projectId, refreshKey, onInviteClick, activeMembers = [] }) => {
    const [members, setMembers] = useState([]);
    const [projectOwnerId, setProjectOwnerId] = useState(null);
    const { user } = useContext(AuthContext);

    const fetchMembers = () => {
        if (projectId) {
            axiosInstance.get(`/api/projects/${projectId}/`).then(res => setProjectOwnerId(res.data.owner));
            axiosInstance.get(`/api/projects/${projectId}/members/`)
                .then(res => setMembers(res.data))
                .catch(err => console.error("Failed to fetch members", err));
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [projectId, refreshKey]);

    const isCurrentUserOwner = user && user.user_id === projectOwnerId;

    const handleAction = async (action, member) => {
        const confirmText = action === 'remove' 
            ? `Are you sure you want to remove ${member.email} from the project?`
            : 'Are you sure you want to exit this project?';

        if (window.confirm(confirmText)) {
            try {
                await axiosInstance.delete(`/api/memberships/${member.id}/`);
                fetchMembers(); // Refresh the members list
            } catch (error) {
                console.error(`Failed to ${action} member`, error);
                alert(`Error: Could not ${action} member.`);
            }
        }
    };

    const currentUserMembership = members.find(m => user && m.user === user.user_id);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Team Members</h2>
                <div className="flex items-center gap-4">
                    {/* Conditionally render Exit or Invite button */}
                    {!isCurrentUserOwner && currentUserMembership ? (
                        <button
                            onClick={() => handleAction('exit', currentUserMembership)}
                            className="flex items-center gap-2 px-4 py-2 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 transition"
                        >
                            <FaSignOutAlt /> Exit Project
                        </button>
                    ) : (
                        <button 
                            onClick={onInviteClick}
                            className="px-4 py-2 bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition"
                        >
                            + Invite Member
                        </button>
                    )}
                </div>
            </div>
            <div className="bg-[var(--dark-card)] rounded-xl border border-gray-800">
                {members.map(member => {
                    const isThisMemberTheOwner = member.role === 'ADMIN';
                    const isThisMemberTheCurrentUser = user && user.user_id === member.user;

                    // Only the project owner sees the "three dot" menu for other members
                    const showActions = isCurrentUserOwner && !isThisMemberTheCurrentUser;
                    
                    // Check if this member is in the active list
                    const isActive = activeMembers.includes(member.user);

                    return (
                        <div key={member.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0">
                            <div className="flex items-center">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary-purple)] flex items-center justify-center font-bold mr-4">
                                        {(member.first_name || member.email).charAt(0).toUpperCase()}
                                    </div>
                                    {/* Green dot for active members */}
                                    {isActive && <div className="absolute bottom-0 right-3 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--dark-card)]" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{isThisMemberTheCurrentUser ? 'You' : (member.first_name || member.email)}</p>
                                    <p className="text-sm text-gray-400">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {isThisMemberTheOwner && <FaCrown className="text-yellow-500" title="Owner" />}
                                <span className="text-sm text-gray-400 capitalize">{member.role.toLowerCase()}</span>
                                {showActions && <MemberActions member={member} isOwnerView={true} onAction={handleAction} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CollaboratorsTab;