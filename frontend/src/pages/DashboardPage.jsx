// src/pages/DashboardPage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { FaPlus, FaUserFriends } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import ActionCard from '../components/ActionCard';
import CreateProjectModal from '../components/CreateProjectModal';

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = () => {
         axiosInstance.get('/api/projects/')
            .then(res => setProjects(res.data))
            .catch(err => console.error("Failed to fetch projects", err));
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectCreated = (newProject) => {
        setProjects([...projects, newProject]);
    };

    return (
        <>
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
            <main className="flex flex-col lg:flex-row gap-8 p-8 font-sans h-full">
                {/* Sidebar Area */}
                <aside className="w-full lg:w-80 bg-[var(--dark-card)] rounded-xl p-6 border border-gray-800 flex flex-col flex-shrink-0">
                    {/* Added text-white to this heading */}
                    <h2 className="text-lg font-semibold mb-6 px-3 text-white">Your Projects</h2>
                    <nav className="flex-grow space-y-2">
                        {projects.length > 0 ? (
                            projects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        ) : (
                            <p className="px-3 text-sm text-gray-400">No projects yet.</p>
                        )}
                    </nav>
                    <button onClick={() => setIsModalOpen(true)} className="w-full mt-6 py-3 flex items-center justify-center bg-[var(--primary-purple)] text-white font-bold rounded-lg hover:brightness-110 transition-colors">
                        <FaPlus className="mr-2" /> Create New Project
                    </button>
                </aside>

                {/* Main Content Area */}
                <section className="flex-1 overflow-y-auto">
                    <div className="mb-10">
                        {/* Added text-white to this heading */}
                        <h1 className="text-4xl font-bold text-white">Welcome back, <span className="text-[var(--accent-lavender)]">{user?.first_name || user?.username}</span>!</h1>
                        <p className="text-gray-400 mt-2">Ready to build something amazing? Create a new project or join an existing one.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* The onClick handler is now passed as a prop, and the wrapper div is gone */}
                        <ActionCard
                            icon={<FaPlus />}
                            title="Create New Project"
                            description="Start a new project from scratch with our modern templates."
                            buttonText="Create Project"
                            primary
                            onClick={() => setIsModalOpen(true)}
                        />
                        <ActionCard
                            icon={<FaUserFriends />}
                            title="Join Project"
                            description="Collaborate on existing projects with your team."
                            buttonText="Join Project"
                            onClick={() => alert("Join project functionality coming soon!")}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard value={projects.length} label="Active Projects" />
                        <StatCard value="0" label="Collaborators" />
                        <StatCard value="0" label="Lines of Code" />
                    </div>
                </section>
            </main>
        </>
    );
};

export default DashboardPage;