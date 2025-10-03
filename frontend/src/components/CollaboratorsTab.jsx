// src/components/CollaboratorsTab.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { FaCrown } from 'react-icons/fa'; // Crown icon for owner

const CollaboratorsTab = ({ projectId }) => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (projectId) {
            axiosInstance.get(`/api/projects/${projectId}/members/`)
                .then(res => setMembers(res.data))
                .catch(err => console.error("Failed to fetch members", err));
        }
    }, [projectId]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Team Members</h2>
                <button className="px-4 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition">+ Invite Member</button>
            </div>
            <div className="bg-dark-card rounded-xl border border-gray-800">
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary-purple flex items-center justify-center font-bold mr-4">
                                {member.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold">{member.username}</p>
                                <p className="text-sm text-gray-400">{member.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {member.role === 'ADMIN' && <FaCrown className="text-yellow-500" title="Owner" />}
                            <span className="text-sm text-gray-400 capitalize">{member.role.toLowerCase()}</span>
                            <button className="px-4 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600">Manage</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollaboratorsTab;