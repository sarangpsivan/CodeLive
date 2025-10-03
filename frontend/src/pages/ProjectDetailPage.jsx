import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import CollaboratorsTab from '../components/CollaboratorsTab';
import { FaCode } from 'react-icons/fa';

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('collaborators');

    useEffect(() => {
        // Fetches the specific project's details from the new API endpoint
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => {
                setProject(res.data);
            })
            .catch(err => console.error("Failed to fetch project details", err));
    }, [projectId]);

    if (!project) {
        return <div className="text-white p-8">Loading project...</div>;
    }

    return (
        <main className="flex-1 p-8 text-white font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">← Back to Dashboard</Link>
                    {/* Displays the dynamic project name */}
                    <h1 className="text-4xl font-bold mt-2">{project.name}</h1>
                    <p className="text-gray-500 text-sm mt-1">Last modified 2 hours ago</p>
                </div>
                <Link
                    to={`/project/${projectId}/editor`}
                    className="flex items-center justify-center px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <FaCode className="mr-2" />
                    Open Code Editor
                </Link>
            </div>


            <div className="mt-8 border-b border-gray-700">
                <nav className="flex space-x-8">
                    <button onClick={() => setActiveTab('collaborators')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'collaborators' ? 'border-accent-lavender text-accent-lavender' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        Collaborators
                    </button>
                    <button className="py-4 px-1 border-b-2 font-medium border-transparent text-gray-400 hover:text-white">Documentation</button>
                    <button className="py-4 px-1 border-b-2 font-medium border-transparent text-gray-400 hover:text-white">Meetings</button>
                </nav>
            </div>

            <div className="mt-8">
                {activeTab === 'collaborators' && <CollaboratorsTab projectId={projectId} />}
            </div>
        </main>
    );
};

export default ProjectDetailPage;