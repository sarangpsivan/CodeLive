import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import { FaSignOutAlt, FaTrash, FaExchangeAlt, FaUserShield, FaEye } from 'react-icons/fa';
import ConfirmationModal from './ConfirmationModal';
import { motion } from 'framer-motion';

const SettingsTab = ({ projectId, isOwner, members, onActionComplete }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [activeSubTab, setActiveSubTab] = useState('editors');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const editors = members.filter(m => m.role === 'EDITOR');
    const viewers = members.filter(m => m.role === 'VIEWER');

    const performAction = async (action) => {
        try {
            await action();
            onActionComplete();
        } catch (error) {
            console.error("Action failed:", error);
            alert("An error occurred. Please try again.");
        }
        setConfirmModal({ isOpen: false });
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
            onActionComplete();
        } catch (error) {
            alert("Error changing role.");
        }
    };

    const renderMemberList = (list, newRole) => (
        <div className="space-y-3">
            {list.length > 0 ? list.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-purple)]/20 flex items-center justify-center font-bold text-[var(--primary-purple)]">
                            {(member.first_name || member.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-white">{member.first_name || member.email}</p>
                            {member.first_name && <p className="text-xs text-gray-400 font-mono">{member.email}</p>}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleChangeRole(member, newRole)}
                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/10"
                                title={`Make ${newRole}`}
                            >
                                <FaExchangeAlt />
                            </button>
                            <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/10"
                                title="Remove"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    )}
                </div>
            )) : (
                <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-dashed border-gray-700">
                    No members with this role.
                </div>
            )}
        </div>
    );

    return (
        <>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Roles Management */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold font-display text-white">Member Roles</h3>
                    <div className="glass-card p-1 rounded-xl flex gap-1 bg-black/40 border border-white/10">
                        <button
                            onClick={() => setActiveSubTab('editors')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSubTab === 'editors'
                                ? 'bg-[var(--primary-purple)] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FaUserShield /> Editors
                        </button>
                        <button
                            onClick={() => setActiveSubTab('viewers')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeSubTab === 'viewers'
                                ? 'bg-[var(--primary-purple)] text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FaEye /> Viewers
                        </button>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-white/5">
                        {activeSubTab === 'editors' && renderMemberList(editors, 'VIEWER')}
                        {activeSubTab === 'viewers' && renderMemberList(viewers, 'EDITOR')}
                    </div>
                </div>

                {/* Danger Zone */}
                <div>
                    <h3 className="text-2xl font-bold font-display text-red-500 mb-6">Danger Zone</h3>
                    <div className="relative p-6 rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <FaTrash size={100} />
                        </div>

                        {isOwner ? (
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-lg">Terminate Project</h4>
                                <p className="text-sm text-gray-400 mt-2 mb-6 leading-relaxed">
                                    Permanently delete this project and all its data. This action is irreversible and will remove access for all associated members.
                                </p>
                                <button
                                    onClick={handleTerminateProject}
                                    className="w-full py-3 px-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <FaTrash /> Terminate Project
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-lg">Leave Project</h4>
                                <p className="text-sm text-gray-400 mt-2 mb-6 leading-relaxed">
                                    Revoke your own access to this project. You will not be able to view or edit contents unless re-invited.
                                </p>
                                <button
                                    onClick={handleExitProject}
                                    className="w-full py-3 px-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
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