import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const ChangeRoleModal = ({ isOpen, onClose, member, onRoleChanged }) => {
    const [newRole, setNewRole] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (member) {
            setNewRole(member.role);
        }
    }, [member]);

    if (!isOpen || !member) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.patch(`/api/memberships/${member.id}/`, {
                role: newRole
            });
            onRoleChanged(response.data); // Notify parent component of the change
            onClose(); // Close the modal
        } catch (err) {
            console.error("Failed to change role", err);
            setError(err.response?.data?.error || 'Failed to update role. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-4">Change Role for</h2>
                <p className="text-lg text-[var(--accent-lavender)] mb-6 truncate">{member.email}</p>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">New Role</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full mt-1 px-4 py-3 text-white bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]"
                        >
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeRoleModal;