import React, { useState } from 'react';
import { VscCopy, VscCheck, VscClose } from 'react-icons/vsc';

const ShareProjectModal = ({ isOpen, onClose, projectId, roomCode, projectTitle }) => {
    if (!isOpen) return null;

    const displayCode = roomCode || projectId;
    const shareLink = roomCode
        ? `${window.location.origin}/join?code=${roomCode}`
        : `${window.location.origin}/join/${projectId}`;

    const [copiedId, setCopiedId] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'id') {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } else {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#09090b] border border-white/10 rounded-xl shadow-2xl p-6 font-sans animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Invite Collaborators</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <VscClose size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Project ID (Room Code)
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white font-bold font-mono text-sm tracking-widest text-center select-all break-all">
                                {displayCode || 'Loading...'}
                            </div>
                            <button
                                onClick={() => handleCopy(displayCode, 'id')}
                                className={`p-2 rounded-lg border transition-all flex-shrink-0 ${copiedId
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                title="Copy ID"
                            >
                                {copiedId ? <VscCheck size={18} /> : <VscCopy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Share Link
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs truncate">
                                {shareLink}
                            </div>
                            <button
                                onClick={() => handleCopy(shareLink, 'link')}
                                className={`p-2 rounded-lg border transition-all flex-shrink-0 ${copiedLink
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                title="Copy Link"
                            >
                                {copiedLink ? <VscCheck size={18} /> : <VscCopy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-200 text-xs">
                            Share this ID or link with others to collaborate on <strong>{projectTitle}</strong> in real-time.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShareProjectModal;
