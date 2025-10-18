import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import CollaboratorsTab from '../components/CollaboratorsTab';
import SettingsTab from '../components/SettingsTab';
import InviteModal from '../components/InviteModal';
import JoinRequestsModal from '../components/JoinRequestsModal';
import { FaCode, FaSignOutAlt, FaUserClock } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [activeTab, setActiveTab] = useState('collaborators');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [activeMembers, setActiveMembers] = useState([]);
    const { user, authTokens } = useContext(AuthContext);
    const navigate = useNavigate();

    const isOwner = project && user && project.owner === user.user_id;

    const fetchData = () => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => {
                console.error("Failed to fetch project details.", err);
                alert("You do not have access to this project.");
                navigate('/dashboard');
            });
        
        axiosInstance.get(`/api/projects/${projectId}/members/`)
            .then(res => setMembers(res.data))
            .catch(err => console.error("Failed to fetch members:", err));

        if (isOwner) {
            axiosInstance.get(`/api/projects/${projectId}/requests/`)
                .then(res => setRequestCount(res.data.length))
                .catch(err => console.error("Failed to fetch requests:", err));
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId, isOwner]);

    useEffect(() => {
        let socket = null;
        let reconnectTimeoutId = null;

        const connectWebSocket = () => {
            if (reconnectTimeoutId) {
                clearTimeout(reconnectTimeoutId);
                reconnectTimeoutId = null;
            }

            // Read the LATEST tokens from localStorage
            const currentAuthTokens = localStorage.getItem('authTokens')
                ? JSON.parse(localStorage.getItem('authTokens'))
                : null;
            const currentUser = currentAuthTokens ? jwtDecode(currentAuthTokens.access) : null;

            if (!currentAuthTokens || !currentUser) {
                console.log("WebSocket connection skipped: No valid auth tokens found in localStorage.");
                return;
            }

            console.log("Attempting WebSocket connection (Project)...");
            socket = new WebSocket(
                `ws://localhost:8000/ws/project/${projectId}/?token=${currentAuthTokens.access}`
            );

            socket.onopen = () => {
                console.log("WebSocket connection established (Project).");
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'presence_update') {
                    setActiveMembers(data.active_user_ids);
                }
                
                if (data.type === 'collaborator_update') {
                    console.log("Received 'collaborator_update' signal:", data);
                    
                    fetchData();
                    
                    if (data.removed_user_id) {
                        const removedId = String(data.removed_user_id);
                        const currentUserId = String(user.user_id);

                        console.log(`Checking for redirect: removedId is '${removedId}', currentUserId is '${currentUserId}'`);

                        if (removedId === currentUserId) {
                            console.log("IDs match! Redirecting user.");
                            alert("You have been removed from this project.");
                            navigate('/dashboard');
                        }
                    }
                }

                if (data.type === 'new_join_request') {
                    setRequestCount(prev => prev + 1);
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error (Project):', error);
            };

            socket.onclose = (event) => {
                console.log("WebSocket connection closed (Project).", event.code, event.reason);
                const latestTokens = localStorage.getItem('authTokens');
                if (event.code !== 1000 && latestTokens) {
                    console.log("Attempting WebSocket reconnect (Project) in 5 seconds...");
                    reconnectTimeoutId = setTimeout(connectWebSocket, 5000);
                } else if (!latestTokens) {
                    console.log("WebSocket closed and user logged out, not reconnecting.");
                }
            };
        };

        const initialTokens = localStorage.getItem('authTokens');
        if (initialTokens) {
            connectWebSocket();
        } else {
            console.log("Skipping initial WebSocket connection: User not logged in.");
        }

        return () => {
            if (reconnectTimeoutId) {
                clearTimeout(reconnectTimeoutId);
            }
            if (socket) {
                console.log("Closing WebSocket connection (Project) due to component unmount/re-render.");
                socket.close(1000);
            }
        };
    }, [projectId, user?.user_id, navigate]);

    if (!project) {
        return <div className="p-8 text-white">Loading project details...</div>;
    }

    return (
        <>
            <InviteModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                project={project}
            />

            <JoinRequestsModal 
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
                projectId={projectId}
                onActionComplete={fetchData}
            />

            <main className="flex-1 p-8 text-white font-sans flex flex-col h-full">
                
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-4">
                                <FaSignOutAlt /> Exit
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
                            {isOwner && (
                                <button 
                                    onClick={() => setIsRequestsModalOpen(true)} 
                                    className="relative flex items-center gap-2 px-4 py-2 bg-dark-card font-bold rounded-lg border border-gray-700 hover:bg-gray-800 transition"
                                >
                                    <FaUserClock /> Join Requests
                                    {requestCount > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-purple)] text-xs">
                                            {requestCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            
                            <Link
                                to={`/project/${projectId}/editor`}
                                className="flex items-center justify-center px-6 py-3 bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition-colors"
                            >
                                <FaCode className="mr-2" />
                                Open Editor
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-b border-gray-800 flex-shrink-0">
                    <nav className="flex space-x-2">
                        <button 
                            onClick={() => setActiveTab('collaborators')} 
                            className={`px-4 py-3 font-semibold text-sm rounded-t-lg ${activeTab === 'collaborators' ? 'border-b-2 border-[var(--primary-purple)] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Collaborators
                        </button>
                        <button 
                            onClick={() => setActiveTab('documentation')} 
                            className={`px-4 py-3 font-semibold text-sm rounded-t-lg ${activeTab === 'documentation' ? 'border-b-2 border-[var(--primary-purple)] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Documentation
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')} 
                            className={`px-4 py-3 font-semibold text-sm rounded-t-lg ${activeTab === 'settings' ? 'border-b-2 border-[var(--primary-purple)] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Settings
                        </button>
                    </nav>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto scrollbar-hide">
                    {activeTab === 'collaborators' && (
                        <CollaboratorsTab 
                            members={members} 
                            activeMembers={activeMembers} 
                            user={user} 
                            onInviteClick={() => setIsInviteModalOpen(true)} 
                        />
                    )}
                    {activeTab === 'documentation' && (
                        <div className="text-gray-400 p-4">Documentation feature coming soon.</div>
                    )}
                    {activeTab === 'settings' && (
                        <SettingsTab 
                            projectId={projectId} 
                            isOwner={isOwner} 
                            members={members} 
                            onActionComplete={fetchData} 
                        />
                    )}
                </div>
            </main>
        </>
    );
};

export default ProjectDetailPage;