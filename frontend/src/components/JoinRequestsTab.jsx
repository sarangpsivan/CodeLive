import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FaCheck, FaTimes, FaUserClock, FaEnvelope } from 'react-icons/fa';

const JoinRequestsTab = ({ projectId, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            setLoading(true);
            axiosInstance.get(`/api/projects/${projectId}/requests/`)
                .then(res => {
                    setRequests(res.data);
                })
                .catch(err => console.error("Failed to fetch join requests", err))
                .finally(() => setLoading(false));
        }
    }, [projectId]);

    const handleAction = async (membershipId, action) => {
        try {
            await axiosInstance.post(`/api/requests/${membershipId}/action/`, { action });
            setRequests(prev => prev.filter(req => req.id !== membershipId));
            if (onActionComplete) onActionComplete();
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
            alert(`Could not ${action} the request. Please try again.`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="pb-4 mb-8 border-b border-indigo-500/20">
                <h2 className="text-2xl font-bold font-display text-white tracking-tight">Join Requests</h2>
                <p className="text-gray-400 mt-1 text-sm font-medium">Manage users waiting to join this project.</p>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading requests...</div>
                ) : requests.length > 0 ? (
                    <div className="grid grid-cols-1 divide-y divide-white/5">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-lg text-white ring-1 ring-white/10 group-hover:ring-white/20 transition-all shrink-0">
                                        {(req.first_name || req.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-lg">
                                            {req.first_name || 'User'}
                                        </p>
                                        <p className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                            <FaEnvelope className="text-xs opacity-50" />
                                            {req.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleAction(req.id, 'reject')}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                                    >
                                        <FaTimes /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'approve')}
                                        className="px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-green-900/10"
                                    >
                                        <FaCheck /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <FaCheck className="text-green-500 text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300">All Caught Up</h3>
                        <p className="text-gray-500 mt-1 max-w-sm">There are no pending join requests for this project right now.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinRequestsTab;
