// popup window to create a new project
import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) {
            setError('Project name cannot be empty.');
            return;
        }
        try {
            const response = await axiosInstance.post('/api/projects/', { name: projectName });
            onProjectCreated(response.data);
            onClose();
            setProjectName('');
            setError('');
        } catch (err) {
            console.error("Failed to create project", err);
            setError('Failed to create project. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Project Name</label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="My awesome project"
                            className="w-full mt-1 px-4 py-3 text-white bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;