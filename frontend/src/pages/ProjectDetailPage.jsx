import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import CollaboratorsTab from '../components/CollaboratorsTab';
import InviteModal from '../components/InviteModal';
import { FaCode, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('collaborators');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [collaboratorRefreshKey, setCollaboratorRefreshKey] = useState(0);
    const [activeMembers, setActiveMembers] = useState([]);
    const { authTokens } = useContext(AuthContext);

    const fetchProjectDetails = () => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => console.error("Failed to fetch project details", err));
    };

    useEffect(() => {
        fetchProjectDetails(); // Fetch initial data
        
        // Establish WebSocket connection for this page with authentication
        if (authTokens) {
            const socket = new WebSocket(
                `ws://localhost:8000/ws/project/${projectId}/?token=${authTokens.access}`
            );
            
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'presence_update') {
                    setActiveMembers(data.active_user_ids);
                }
                // Listen for collaborator updates
                if (data.type === 'collaborator_update') {
                    // When a signal is received, re-fetch the project details (for the count)
                    // and trigger a refresh for the collaborators list.
                    fetchProjectDetails();
                    setCollaboratorRefreshKey(prevKey => prevKey + 1);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            // Cleanup on component unmount
            return () => socket.close();
        }
    }, [projectId, authTokens]);

    if (!project) {
        return <div className="text-white p-8">Loading project...</div>;
    }

    return (
        <>
            <InviteModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                project={project}
                onInviteSuccess={() => setCollaboratorRefreshKey(prev => prev + 1)}
            />
            <main className="flex-1 p-8 text-white font-sans">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-4">
                            <FaSignOutAlt /> Exit Project
                        </Link>
                        <h1 className="text-5xl font-bold">{project.name}</h1>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            <span>{project.member_count || 0} collaborators</span>
                            <span className="text-gray-600">|</span>
                            <span className="bg-green-500/20 text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {activeMembers.length} active
                            </span>
                            <span className="text-gray-600">|</span>
                            <span>Last updated 2 hours ago</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button 
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-dark-card font-bold rounded-lg border border-gray-700 hover:bg-gray-800 transition"
                        >
                            <FaUserPlus />
                            Invite
                        </button>
                        <Link
                            to={`/project/${projectId}/editor`}
                            className="flex items-center justify-center px-6 py-3 bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition-colors"
                        >
                            <FaCode className="mr-2" />
                            Open Editor
                        </Link>
                    </div>
                </div>

                <div className="border-b border-gray-800">
                    <nav className="flex space-x-2">
                        <button onClick={() => setActiveTab('collaborators')} className={`px-4 py-3 font-semibold text-sm rounded-t-lg ${activeTab === 'collaborators' ? 'bg-dark-card text-white' : 'text-gray-400 hover:text-white'}`}>
                            Collaborators
                        </button>
                        <button onClick={() => setActiveTab('documentation')} className={`px-4 py-3 font-semibold text-sm rounded-t-lg ${activeTab === 'documentation' ? 'bg-dark-card text-white' : 'text-gray-400 hover:text-white'}`}>
                            Documentation
                        </button>
                    </nav>
                </div>

                <div className="mt-6">
                    {activeTab === 'collaborators' && (
                        <CollaboratorsTab 
                            projectId={projectId} 
                            refreshKey={collaboratorRefreshKey}
                            onInviteClick={() => setIsInviteModalOpen(true)}
                            activeMembers={activeMembers}
                        />
                    )}
                    {activeTab === 'documentation' && (
                        <div className="text-gray-400 p-4">Documentation feature coming soon.</div>
                    )}
                </div>
            </main>
        </>
    );
};

export default ProjectDetailPage;