import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const TopBar = ({ projectId, projectTitle, collaborators = [] }) => {
    const navigate = useNavigate();

    const visibleCollaborators = collaborators.slice(0, 3);
    const remainingCollaborators = collaborators.length > 3 ? collaborators.length - 3 : 0;

    return (
        <div className="flex-shrink-0 bg-dark-card h-12 border-b border-gray-800 flex items-center justify-between px-4 font-sans text-white">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/project/${projectId}`)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Back to Project Hub"
                >
                    <FaArrowLeft size={16} />
                </button>
                <span className="text-gray-300 text-sm font-semibold">
                    {projectTitle}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2 cursor-pointer group relative">
                    {visibleCollaborators.map((collab, index) => (
                        <div key={index} className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-card">
                            {/* In a real app, you'd get the name from the collaborator object */}
                            {`U${index + 1}`}
                        </div>
                    ))}
                    {remainingCollaborators > 0 && (
                        <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-card">
                            +{remainingCollaborators}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopBar;