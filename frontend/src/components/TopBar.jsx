// header bar component for editor page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscChevronLeft, VscMenu, VscLayoutSidebarRight, VscTerminal, VscPlay } from 'react-icons/vsc';
import { Terminal } from 'lucide-react';
import ActiveCollaboratorsModal from './ActiveCollaboratorsModal';
import ShareProjectModal from './ShareProjectModal';

const TopBar = ({ projectId, projectTitle, roomCode, activeFileName, activeMembers = [], onShowOutput, onShowPreview, isPreviewEnabled }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const visibleCollaborators = activeMembers.slice(0, 3);
    const remainingCollaborators = activeMembers.length > 3 ? activeMembers.length - 3 : 0;

    return (
        <>
            <div className="flex-shrink-0 relative z-30 h-10 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between px-3 font-sans text-white select-none">
                {/* Left: Menu & Branding */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 hover:bg-[#27272a] p-1.5 rounded-md transition-colors group"
                        title="Back to Dashboard"
                    >
                        <Terminal className="w-5 h-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
                        <span className="font-bold text-xs font-mono text-gray-300 group-hover:text-white transition-colors">CodeLive</span>
                    </button>
                </div>

                {/* Center: Command / Title Bar */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center p-1 w-full max-w-[40%] md:max-w-[60%] pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#1c1c1c] border border-[#27272a] rounded-md text-xs w-full justify-center text-gray-400 hover:border-gray-600 transition-colors cursor-pointer group shadow-sm pointer-events-auto truncate">
                        <span className="group-hover:text-gray-300 transition-colors truncate hidden md:inline">{projectTitle}</span>
                        <span className="text-gray-600 hidden md:inline">/</span>
                        <span className={`${activeFileName ? 'text-gray-200' : 'text-gray-600'} truncate`}>
                            {activeFileName || 'No file selected'}
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Layout Toggles */}
                    <div className="flex items-center gap-1 border-r border-[#27272a] pr-3 mr-1">
                        <button
                            onClick={onShowOutput}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#27272a] rounded transition-colors"
                            title="Toggle Terminal"
                        >
                            <VscTerminal size={16} />
                        </button>
                        <button
                            onClick={onShowPreview}
                            disabled={!isPreviewEnabled}
                            className={`p-1.5 rounded transition-colors ${isPreviewEnabled ? 'text-gray-500 hover:text-white hover:bg-[#27272a]' : 'text-gray-700 cursor-not-allowed'}`}
                            title="Toggle Preview"
                        >
                            <VscLayoutSidebarRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors shadow-sm"
                    >
                        Share
                    </button>

                    {/* Avatars */}
                    <div
                        className="flex items-center -space-x-2 cursor-pointer hover:opacity-100 transition"
                        onClick={() => setIsModalOpen(!isModalOpen)}
                        title="Collaborators"
                    >
                        {visibleCollaborators.map((collab) => {
                            if (!collab) return null;
                            return (
                                <div
                                    key={collab.id}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-[#09090b] bg-[#27272a] text-white relative z-10"
                                >
                                    {(collab.first_name || collab.email || '?').charAt(0).toUpperCase()}
                                </div>
                            );
                        })}
                        {remainingCollaborators > 0 && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-[#09090b] bg-[#1F242A] text-gray-400 relative z-0">
                                +{remainingCollaborators}
                            </div>
                        )}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-inner border border-[#09090b]">
                        ME
                    </div>
                </div>
            </div>

            <ActiveCollaboratorsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activeMembers={activeMembers}
            />

            <ShareProjectModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                projectId={projectId}
                roomCode={roomCode}
                projectTitle={projectTitle}
            />
        </>
    );
};

export default TopBar;