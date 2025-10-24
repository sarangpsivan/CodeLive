// vertical activity bar on the left side of the editor page.
import React from 'react';
import { VscFiles, VscCommentDiscussion, VscBell, VscDebugStart, VscGear, VscAccount } from 'react-icons/vsc';

const ActivityBar = ({ activeTab, onTabChange, onRunCode, isRunButtonEnabled, isExecuting }) => {
    return (
        <div className="flex flex-col items-center justify-between w-12 bg-activity-bar-dark border-r border-gray-700 py-2 text-gray-300">
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={() => onTabChange('explorer')}
                    className={`p-2 rounded relative hover:bg-gray-700 ${activeTab === 'explorer' ? 'text-white' : ''}`}
                    title="Explorer"
                >
                    {activeTab === 'explorer' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"></div>}
                    <VscFiles size={22} />
                </button>

                <button
                    onClick={() => onTabChange('chat')}
                    className={`p-2 rounded relative hover:bg-gray-700 ${activeTab === 'chat' ? 'text-white' : ''}`}
                    title="Chat"
                >
                    {activeTab === 'chat' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"></div>}
                    <VscCommentDiscussion size={22} />
                </button>

                <button
                    onClick={() => onTabChange('alerts')}
                    className={`p-2 rounded relative hover:bg-gray-700 ${activeTab === 'alerts' ? 'text-white' : ''}`}
                    title="Alerts (Placeholder)"
                >
                    {activeTab === 'alerts' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"></div>}
                    <VscBell size={22} />
                </button>

                <button
                    onClick={onRunCode}
                    disabled={!isRunButtonEnabled || isExecuting}
                    className={`p-2 rounded relative hover:bg-green-700 ${(!isRunButtonEnabled || isExecuting) ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600'} text-white transition-colors`}
                    title={isRunButtonEnabled ? (isExecuting ? 'Running...' : 'Run Code') : 'Cannot execute this file type'}
                >
                    <VscDebugStart size={22} />
                </button>
            </div>

            <div className="flex flex-col items-center gap-4">
                <button className="p-2 rounded relative hover:bg-gray-700" title="Profile (Placeholder)">
                    <VscAccount size={22} />
                </button>

                <button className="p-2 rounded relative hover:bg-gray-700" title="Settings (Placeholder)">
                    <VscGear size={22} />
                </button>
            </div>
        </div>
    );
};

export default ActivityBar;