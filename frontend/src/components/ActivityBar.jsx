// vertical activity bar on the left side of the editor page.
import React from 'react';
import { VscFiles, VscCommentDiscussion, VscBell, VscDebugStart, VscGear } from 'react-icons/vsc';
import { FaRobot } from 'react-icons/fa';

const ActivityBar = ({ activeTab, onTabChange, onRunCode, isRunButtonEnabled, isExecuting, hasUnreadAlerts, hasUnreadChat }) => {
    return (
        <div className="flex flex-col items-center justify-between w-12 bg-[#09090b] border-r border-[#27272a] py-4 z-30 select-none">
            <div className="flex flex-col items-center gap-1 w-full">
                <button
                    onClick={() => onTabChange('explorer')}
                    className={`w-full h-12 flex items-center justify-center relative transition-colors text-white ${activeTab === 'explorer' ? '' : 'opacity-80 hover:opacity-100'}`}
                    title="Explorer"
                >
                    {activeTab === 'explorer' && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--primary-purple)]"></div>}
                    <VscFiles size={24} />
                </button>

                <button
                    onClick={() => onTabChange('chat')}
                    className={`w-full h-12 flex items-center justify-center relative transition-colors text-white ${activeTab === 'chat' ? '' : 'opacity-80 hover:opacity-100'}`}
                    title="Team Chat"
                >
                    {activeTab === 'chat' && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--primary-purple)]"></div>}
                    <VscCommentDiscussion size={24} />
                    {hasUnreadChat && (
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-[#09090b]"></span>
                    )}
                </button>

                <button
                    onClick={() => onTabChange('ai_chat')}
                    className={`w-full h-12 flex items-center justify-center relative transition-colors text-white ${activeTab === 'ai_chat' ? '' : 'opacity-80 hover:opacity-100'}`}
                    title="AI Assistant"
                >
                    {activeTab === 'ai_chat' && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--primary-purple)]"></div>}
                    <FaRobot size={20} className={activeTab === 'ai_chat' ? 'text-[var(--primary-purple)]' : ''} />
                </button>

                <button
                    onClick={() => onTabChange('alerts')}
                    className={`w-full h-12 flex items-center justify-center relative transition-colors text-white ${activeTab === 'alerts' ? '' : 'opacity-80 hover:opacity-100'}`}
                    title="Alerts"
                >
                    {activeTab === 'alerts' && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--primary-purple)]"></div>}
                    <VscBell size={24} />
                    {hasUnreadAlerts && (
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-[#09090b]"></span>
                    )}
                </button>

                <div className="w-6 h-[1px] bg-[#27272a] my-2"></div>

                <button
                    onClick={onRunCode}
                    disabled={!isRunButtonEnabled || isExecuting}
                    className={`w-full h-12 flex items-center justify-center relative transition-colors ${(!isRunButtonEnabled || isExecuting) ? 'opacity-80 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                    title={isRunButtonEnabled ? (isExecuting ? 'Running...' : 'Run Code') : 'Cannot execute this file type'}
                >
                    <VscDebugStart size={24} className={isExecuting ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex flex-col items-center w-full">
                <button className="w-full h-12 flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-colors" title="Settings">
                    <VscGear size={24} />
                </button>
            </div>
        </div>
    );
};

export default ActivityBar;