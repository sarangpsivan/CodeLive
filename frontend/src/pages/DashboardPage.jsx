import React, { useContext, useState, useEffect } from 'react';
import { FaPlus, FaUserFriends, FaTerminal } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import ActionCard from '../components/ActionCard';
import CreateProjectModal from '../components/CreateProjectModal';
import JoinProjectModal from '../components/JoinProjectModal';

import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';

const DashboardPage = () => {
    const { user, authTokens } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const [stats, setStats] = useState({ collaborators: 0, files: 0 });

    const getWsUrl = () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        if (apiBase.startsWith('https')) {
            return apiBase.replace('https', 'wss');
        }
        return apiBase.replace('http', 'ws');
    };
    const wsBaseUrl = import.meta.env.VITE_WS_URL || getWsUrl();

    const fetchProjects = () => {
        axiosInstance.get('/api/projects/')
            .then(res => setProjects(res.data))
            .catch(err => console.error("Failed to fetch projects", err));
    };

    const fetchStats = () => {
        axiosInstance.get('/api/dashboard-stats/')
            .then(res => {
                setStats({
                    collaborators: res.data.total_collaborators,
                    files: res.data.total_files
                });
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

            const currentAuthTokens = authTokens || (localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);

            if (!currentAuthTokens?.access) return;

            try {
                const decoded = jwtDecode(currentAuthTokens.access);
                if (decoded.exp * 1000 < Date.now()) return;
            } catch (error) {
                return;
            }

            socket = new WebSocket(`${wsBaseUrl}/ws/user/?token=${currentAuthTokens.access}`);

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'project_approved') {
                    fetchProjects();
                    fetchStats();
                }
            };

            socket.onclose = (event) => {
                if (event.code !== 1000) {
                    reconnectTimeoutId = setTimeout(connectWebSocket, 1000);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
            if (socket) socket.close(1000);
        };
    }, [user?.user_id, authTokens?.access]);

    const handleProjectCreated = (newProject) => {
        setProjects(prev => [...prev, newProject]);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
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


            <main className="flex-1 p-6 lg:p-10 overflow-y-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-3">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-purple)] to-blue-500">{user?.first_name || user?.username}</span>
                            </h1>
                            <p className="text-gray-400 text-lg">Your creative workspace is ready. Let's build something new.</p>
                        </div>
                        <div className="flex gap-4">
                            <StatCard value={projects.length} label="Projects" />
                            <StatCard value={stats.collaborators} label="Collabs" />
                            <div className="hidden md:block">
                                <StatCard value={stats.files} label="Files" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ActionCard
                            icon={<FaPlus />}
                            title="New Project"
                            description="Start fresh with a new dev environment. Python & React supported."
                            buttonText="Create Workspace"
                            primary
                            onClick={() => setIsModalOpen(true)}
                        />
                        <ActionCard
                            icon={<FaUserFriends />}
                            title="Join Team"
                            description="Have an invite code? Join an existing project to collaborate in real-time."
                            buttonText="Enter Code"
                            onClick={() => setIsJoinModalOpen(true)}
                        />

                    </div>

                    {/* Projects Grid */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <FaTerminal className="text-[var(--primary-purple)]" />
                            <h2 className="text-2xl font-bold text-white font-display">Recent Projects</h2>
                        </div>

                        {projects.length > 0 ? (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {projects.map(project => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-700 bg-white/5">
                                <h3 className="text-xl font-bold text-gray-300 mb-2">No projects found</h3>
                                <p className="text-gray-500 mb-6">Get started by creating your first workspace.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-6 py-2 bg-[var(--primary-purple)] text-white rounded-lg font-bold hover:brightness-110 transition"
                                >
                                    Create Project
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default DashboardPage;