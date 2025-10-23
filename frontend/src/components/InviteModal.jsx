// pop-up modal to invite collaborators via code or link
import React, { useState } from 'react';

const InviteModal = ({ isOpen, onClose, project }) => {
    const [codeCopied, setCodeCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const inviteLink = `${window.location.origin}/join?code=${project?.room_code}`;

    if (!isOpen) return null;

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'code') {
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        } else {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-lg text-white">
                <h2 className="text-2xl font-bold mb-4">Add Collaborators</h2>
                <p className="text-gray-400 mb-6">Share this code or link with others to invite them to your project.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Invite Code</label>
                        <div className="flex gap-2 mt-1">
                            <p className="flex-grow font-mono bg-gray-900 px-4 py-2 rounded-md border border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                {project.room_code}
                            </p>
                            <button onClick={() => handleCopy(project.room_code, 'code')} className="px-4 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition flex-shrink-0 w-32">
                                {codeCopied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Invite Link</label>
                        <div className="flex gap-2 mt-1">
                            <p className="flex-grow font-mono bg-gray-900 px-4 py-2 rounded-md border border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                {inviteLink}
                            </p>
                            <button onClick={() => handleCopy(inviteLink, 'link')} className="px-4 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition flex-shrink-0 w-32">
                                {linkCopied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Done</button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;