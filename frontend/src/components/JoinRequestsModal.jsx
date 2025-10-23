// pop-up window to manage join requests for a project for the project owner
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FaCheck, FaTimes } from 'react-icons/fa';

const JoinRequestsModal = ({ isOpen, onClose, projectId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && projectId) {
            setLoading(true);
            axiosInstance.get(`/api/projects/${projectId}/requests/`)
                .then(res => {
                    setRequests(res.data);
                })
                .catch(err => console.error("Failed to fetch join requests", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, projectId]);

    const handleAction = async (membershipId, action) => {
        try {
            await axiosInstance.post(`/api/requests/${membershipId}/action/`, { action });
            setRequests(prev => prev.filter(req => req.id !== membershipId));
            onActionComplete();
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
            alert(`Could not ${action} the request. Please try again.`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-lg text-white">
                <h2 className="text-2xl font-bold mb-6">Join Requests</h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {loading ? (
                        <p className="text-gray-400">Loading requests...</p>
                    ) : requests.length > 0 ? (
                        requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div>
                                    <p className="font-semibold">{req.first_name || 'User'}</p>
                                    <p className="text-sm text-gray-400">{req.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAction(req.id, 'reject')}
                                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition" 
                                        title="Reject"
                                    >
                                        <FaTimes />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, 'approve')}
                                        className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/40 transition" 
                                        title="Approve"
                                    >
                                        <FaCheck />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No pending requests.</p>
                    )}
                </div>

                <div className="flex justify-end mt-8">
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Close</button>
                </div>
            </div>
        </div>
    );
};

export default JoinRequestsModal;