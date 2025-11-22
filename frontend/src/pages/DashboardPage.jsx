import React, { useContext, useState, useEffect } from 'react';
import { FaPlus, FaUserFriends } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import ActionCard from '../components/ActionCard';
import CreateProjectModal from '../components/CreateProjectModal';
import JoinProjectModal from '../components/JoinProjectModal';
import { jwtDecode } from 'jwt-decode';

const DashboardPage = () => {
    const { user, authTokens } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [stats, setStats] = useState({ collaborators: 0 });

    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

    const fetchProjects = () => {
        axiosInstance.get('/api/projects/')
            .then(res => setProjects(res.data))
            .catch(err => console.error("Failed to fetch projects", err));
    };

    const fetchStats = () => {
        axiosInstance.get('/api/dashboard-stats/')
            .then(res => {
                setStats(prev => ({ ...prev, collaborators: res.data.total_collaborators }));
            })
            .catch(err => console.error("Failed to fetch stats", err));
    };

    useEffect(() => {
        fetchProjects();
        fetchStats();
    }, []);

    useEffect(() => {
        let socket = null;
        let reconnectTimeoutId = null;

        const connectWebSocket = () => {
            if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);

            const currentAuthTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            if (!currentAuthTokens || !user) {
                console.log("WebSocket connection skipped (Dashboard): Not logged in.");
                return;
            }

             try {
                jwtDecode(currentAuthTokens.access);
            } catch (error) {
                console.error("WebSocket connection skipped (Dashboard): Invalid token.");
                return;
            }

            console.log("Attempting WebSocket connection (Dashboard)...");
            socket = new WebSocket(
                `${wsBaseUrl}/ws/user/?token=${currentAuthTokens.access}`
            );

            socket.onopen = () => console.log("WebSocket connection established (Dashboard).");

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'project_approved') {
                    fetchProjects();
                    fetchStats();
                }
            };

            socket.onerror = (err) => console.error("User WebSocket error (Dashboard):", err);

            socket.onclose = (event) => {
                console.log("WebSocket connection closed (Dashboard).", event.code, event.reason);
                const latestTokens = localStorage.getItem('authTokens');
                if (event.code !== 1000 && latestTokens) {
                    console.log("Attempting WebSocket reconnect (Dashboard) in 5 seconds...");
                    reconnectTimeoutId = setTimeout(connectWebSocket, 5000);
                } else {
                     console.log("WebSocket not reconnecting (Dashboard).");
                }
            };
        };

        connectWebSocket(); 

        return () => { 
            if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
            if (socket) {
                console.log("Closing WebSocket connection (Dashboard) due to cleanup.");
                socket.close(1000);
            }
        };
    }, [user?.user_id]);  

    const handleProjectCreated = (newProject) => {
        setProjects(prev => [...prev, newProject]);
    };

    return (
        <>
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
            <JoinProjectModal 
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
            />
            <main className="flex flex-col lg:flex-row gap-8 p-8 font-sans h-full">
                <aside className="w-full lg:w-80 bg-[var(--dark-card)] rounded-xl p-6 border border-gray-800 flex flex-col flex-shrink-0">
                    <h2 className="text-lg font-semibold mb-6 px-3 text-white">Your Projects</h2>
                    <nav className="flex-grow space-y-2">
                        {projects.length > 0 ? (
                            projects.map(project => <ProjectCard key={project.id} project={project} />)
                        ) : (
                            <p className="px-3 text-sm text-gray-400">No projects yet.</p>
                        )}
                    </nav>
                    <button onClick={() => setIsModalOpen(true)} className="w-full mt-6 py-3 flex items-center justify-center bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition-colors">
                        <FaPlus className="mr-2" /> Create New Project
                    </button>
                </aside>

                <section className="flex-1 overflow-y-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-white">Welcome back, <span className="text-[var(--accent-lavender)]">{user?.first_name || user?.username}</span>!</h1>
                        <p className="text-gray-400 mt-2">Ready to build something amazing? Create a new project or join an existing one.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <ActionCard icon={<FaPlus />} title="Create New Project" description="Start a new project from scratch with our modern templates." buttonText="Create Project" primary onClick={() => setIsModalOpen(true)} />
                        <ActionCard icon={<FaUserFriends />} title="Join Project" description="Collaborate on existing projects with your team." buttonText="Join Project" onClick={() => setIsJoinModalOpen(true)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard value={projects.length} label="Active Projects" />
                        <StatCard value={stats.collaborators} label="Collaborators" />
                        <StatCard value="0" label="Lines of Code" />
                    </div>
                </section>
            </main>
        </>
    );
};

export default DashboardPage;