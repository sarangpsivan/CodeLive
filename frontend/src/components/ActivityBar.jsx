// vertical activity bar on the left side of the editor page.
import React from 'react';
import { FaCode, FaCommentDots, FaBell, FaPlay, FaRegFileCode, FaCog, FaUserCircle } from 'react-icons/fa';

const ActivityBar = ({ activeTab, onTabChange, onRunCode, isRunButtonEnabled, isExecuting }) => {
    return (
        <div className="flex flex-col items-center justify-between w-12 bg-activity-bar-dark border-r border-gray-800 py-2 text-gray-400">
            <div className="flex flex-col items-center gap-4">
                <button onClick={() => onTabChange('explorer')} className={`p-2 rounded hover:bg-gray-700 ${activeTab === 'explorer' ? 'text-white bg-gray-700' : ''}`} title="Explorer">
                    <FaRegFileCode size={20} />
                </button>
                <button onClick={() => onTabChange('chat')} className={`p-2 rounded hover:bg-gray-700 ${activeTab === 'chat' ? 'text-white bg-gray-700' : ''}`} title="Chat">
                    <FaCommentDots size={20} />
                </button>
                <button onClick={() => onTabChange('alerts')} className={`p-2 rounded hover:bg-gray-700 ${activeTab === 'alerts' ? 'text-white bg-gray-700' : ''}`} title="Alerts (Placeholder)">
                    <FaBell size={20} />
                </button>
                <button
                    onClick={onRunCode}
                    disabled={!isRunButtonEnabled || isExecuting}
                    className={`p-2 rounded hover:bg-green-700 ${(!isRunButtonEnabled || isExecuting) ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600'} text-white transition-colors`}
                    title={isRunButtonEnabled ? (isExecuting ? 'Running...' : 'Run Code') : 'Cannot execute this file type'}
                >
                    <FaPlay size={20} />
                </button>
            </div>
            <div className="flex flex-col items-center gap-4">
                <button className="p-2 rounded hover:bg-gray-700" title="Profile (Placeholder)">
                    <FaUserCircle size={20} />
                </button>
                <button className="p-2 rounded hover:bg-gray-700" title="Settings (Placeholder)">
                    <FaCog size={20} />
                </button>
            </div>
        </div>
    );
};

export default ActivityBar;