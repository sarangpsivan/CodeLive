import React, { useState, useEffect } from 'react';
import { VscRefresh, VscLinkExternal, VscClose } from 'react-icons/vsc';

const PreviewPanel = ({ projectId, token, activeFile, onClose }) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

    const [previewPath, setPreviewPath] = useState('index.html');

    useEffect(() => {
        const currentFile = activeFile?.path || activeFile?.name;

        if (currentFile && currentFile.endsWith('.html')) {
            setPreviewPath(currentFile);
        }

    }, [activeFile]);

    useEffect(() => {
        setRefreshTrigger(Date.now());
    }, [activeFile]);

    const handleRefresh = () => {
        setRefreshTrigger(Date.now());
    };

    const previewUrl = `${apiBaseUrl}/api/projects/${projectId}/preview/${previewPath}?token=${token}&t=${refreshTrigger}`;

    return (
        <div className="h-full flex flex-col bg-black border-l border-gray-800 font-sans shadow-xl">
            <div className="h-10 px-4 border-b border-gray-800 flex items-center justify-between bg-[#1F242A] flex-shrink-0">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <VscLinkExternal className="text-[var(--primary-purple)]" size={16} />
                    <h3 className="text-xs uppercase tracking-wide text-gray-300">
                        Previewing: {previewPath}
                    </h3>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
                        title="Refresh Preview"
                    >
                        <VscRefresh size={16} />
                    </button>

                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
                        title="Open in New Tab"
                    >
                        <VscLinkExternal size={16} />
                    </a>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
                        title="Close Panel"
                    >
                        <VscClose size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-white">
                <iframe
                    title="Preview"
                    src={previewUrl}
                    className="w-full h-full border-none"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
            </div>
        </div>
    );
};

export default PreviewPanel;
