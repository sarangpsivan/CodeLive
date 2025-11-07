// header bar component for editor page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscChevronLeft } from 'react-icons/vsc';
import ActiveCollaboratorsModal from './ActiveCollaboratorsModal';

const TopBar = ({ projectId, projectTitle, activeFileName, activeMembers = [] }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const visibleCollaborators = activeMembers.slice(0, 3);
    const remainingCollaborators = activeMembers.length > 3 ? activeMembers.length - 3 : 0;

    return (
        <>
            <div className="flex-shrink-0 bg-dark-card h-12 border-b border-gray-700 flex items-center justify-between px-4 font-sans text-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="text-gray-400 hover:text-white transition-colors pl-3 pr-2"
                        title="Back to Project Hub"
                    >
                        <VscChevronLeft size={20} />
                    </button>
                    <div className="bg-[var(--primary-purple)] h-full flex items-center justify-center px-4 rounded-full w-48 overflow-hidden">
                        <span className="text-black text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                            CodeLive - code together!
                        </span>
                    </div>
                </div>
                <div className="flex-grow flex justify-center items-center text-sm min-w-0 px-4 gap-2">
                    <div className="flex-shrink-0 bg-gray-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        CodeLive Editor
                    </div>
                    <div className="flex items-center min-w-0">
                        <span className="text-white font-semibold truncate">{projectTitle || "..."}</span>
                        <span className="text-white px-1.5 font-semibold">/</span>
                        {activeFileName && (
                            <span className="text-white font-semibold truncate">{activeFileName}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div 
                        className="flex items-center -space-x-2 cursor-pointer group relative"
                        onClick={() => setIsModalOpen(true)}
                        title="View active collaborators"
                    >
                        {visibleCollaborators.map((collab) => (
                            <div 
                                key={collab.id} 
                                className="w-7 h-7 bg-[var(--primary-purple)] rounded-full flex items-center justify-center text-xs font-bold border-2 border-dark-card"
                                title={collab.first_name || collab.email}
                            >
                                {(collab.first_name || collab.email).charAt(0).toUpperCase()}
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
            <ActiveCollaboratorsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activeMembers={activeMembers}
            />
        </>
    );
};

export default TopBar;