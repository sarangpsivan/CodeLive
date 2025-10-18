import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import { FaSignOutAlt, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import ConfirmationModal from './ConfirmationModal'; // 1. Import the new modal

const SettingsTab = ({ projectId, isOwner, members, onActionComplete }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [activeSubTab, setActiveSubTab] = useState('editors');

    // 2. Add state to manage the confirmation modal
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const editors = members.filter(m => m.role === 'EDITOR');
    const viewers = members.filter(m => m.role === 'VIEWER');

    const performAction = async (action) => {
        try {
            await action();
            onActionComplete(); // Refresh parent data
        } catch (error) {
            console.error("Action failed:", error);
            alert("An error occurred. Please try again.");
        }
        setConfirmModal({ isOpen: false }); // Close modal on completion
    };

    const handleTerminateProject = () => {
        setConfirmModal({
            isOpen: true,
            title: "Terminate Project",
            message: "This will permanently delete the project and all its data, including files and member access. This action is irreversible.",
            onConfirm: () => performAction(async () => {
                await axiosInstance.delete(`/api/projects/${projectId}/terminate/`);
                navigate('/dashboard');
            })
        });
    };

    const handleExitProject = () => {
        const membership = members.find(m => m.user === user.user_id);
        if (!membership) return;
        setConfirmModal({
            isOpen: true,
            title: "Leave Project",
            message: "You will lose access to this project and its contents. You will need to be invited again to rejoin.",
            onConfirm: () => performAction(async () => {
                await axiosInstance.delete(`/api/memberships/${membership.id}/`);
                navigate('/dashboard');
            })
        });
    };

    const handleRemoveMember = (member) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Member",
            message: `Are you sure you want to remove ${member.first_name || member.email} from this project?`,
            onConfirm: () => performAction(async () => {
                await axiosInstance.delete(`/api/memberships/${member.id}/`);
            })
        });
    };

    const handleChangeRole = async (member, newRole) => {
        try {
            await axiosInstance.patch(`/api/memberships/${member.id}/`, { role: newRole });
            onActionComplete(); // Refresh the parent component
        } catch (error) {
            alert("Error changing role.");
        }
    };

    const renderMemberList = (list, newRole) => (
        list.length > 0 ? list.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                {/* MODIFICATION: Display name and email */}
                <div>
                    <p className="font-semibold">{member.first_name || member.email}</p>
                    {member.first_name && <p className="text-sm text-gray-400">{member.email}</p>}
                </div>
                
                {/* MODIFICATION 2: Only show these buttons if the user is the owner */}
                {isOwner && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleChangeRole(member, newRole)} 
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40" 
                            title={`Make ${newRole}`}
                        >
                            <FaExchangeAlt />
                        </button>
                        <button 
                            onClick={() => handleRemoveMember(member)} 
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40" 
                            title="Remove"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>
        )) : <p className="text-gray-500 p-3">No members in this category.</p>
    );

    return (
        <>
            {/* 3. Render the confirmation modal */}
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
            
            <div className="space-y-8">
                {/* Member Management Section */}
                <div>
                    {/* MODIFICATION 1: Rename the section heading */}
                    <h3 className="text-2xl font-bold mb-4">Member Roles</h3>
                    <div className="bg-[var(--dark-card)] p-6 rounded-xl border border-gray-800">
                        <div className="flex border-b border-gray-700 mb-4">
                            <button 
                                onClick={() => setActiveSubTab('editors')} 
                                className={`px-4 py-2 font-semibold ${activeSubTab === 'editors' ? 'text-white border-b-2 border-[var(--primary-purple)]' : 'text-gray-400'}`}
                            >
                                Editors
                            </button>
                            <button 
                                onClick={() => setActiveSubTab('viewers')} 
                                className={`px-4 py-2 font-semibold ${activeSubTab === 'viewers' ? 'text-white border-b-2 border-[var(--primary-purple)]' : 'text-gray-400'}`}
                            >
                                Viewers
                            </button>
                        </div>
                        <div className="space-y-3">
                            {activeSubTab === 'editors' && renderMemberList(editors, 'VIEWER')}
                            {activeSubTab === 'viewers' && renderMemberList(viewers, 'EDITOR')}
                        </div>
                    </div>
                </div>

                {/* Project Danger Zone */}
                <div>
                    <h3 className="text-2xl font-bold mb-4 text-red-500">Danger Zone</h3>
                    <div className="bg-[var(--dark-card)] p-6 rounded-xl border border-red-800/50 space-y-4">
                        {isOwner ? (
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">Terminate Project</h4>
                                    <p className="text-sm text-gray-400">Permanently delete this project and all its data. This action is irreversible.</p>
                                </div>
                                <button 
                                    onClick={handleTerminateProject} 
                                    className="px-4 py-2 bg-red-900/60 text-red-400 font-bold rounded-lg hover:bg-red-900/80 transition"
                                >
                                    Terminate
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">Leave Project</h4>
                                    <p className="text-sm text-gray-400">You will lose access to this project and its contents.</p>
                                </div>
                                <button 
                                    onClick={handleExitProject} 
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900/60 text-red-400 font-bold rounded-lg hover:bg-red-900/80 transition"
                                >
                                    <FaSignOutAlt /> Leave Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsTab;