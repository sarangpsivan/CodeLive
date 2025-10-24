// header bar component for editor page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VscArrowLeft } from 'react-icons/vsc';

const TopBar = ({ projectId, projectTitle, collaborators = [] }) => {
    const navigate = useNavigate();

    const visibleCollaborators = collaborators.slice(0, 3);
    const remainingCollaborators = collaborators.length > 3 ? collaborators.length - 3 : 0;

    return (
        <div className="flex-shrink-0 bg-dark-card h-12 border-b border-gray-700 flex items-center justify-between px-4 font-sans text-white">
            <div className="flex items-center gap-4 flex-grow min-w-0">
                <button
                    onClick={() => navigate(`/project/${projectId}`)}
                    className="text-gray-400 hover:text-white transition-colors pl-3 pr-2"
                    title="Back to Project Hub"
                >
                    <VscArrowLeft size={16} />
                </button>

                <div className="bg-[var(--primary-purple)] h-full flex items-center justify-center px-4 rounded-full w-48 overflow-hidden">
                    <span className="text-black text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                        CodeLive - code together!
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center -space-x-2 cursor-pointer group relative">
                    {visibleCollaborators.map((collab, index) => (
                        <div key={index} className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-card">
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