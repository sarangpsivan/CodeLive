import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const JoinProjectModal = ({ isOpen, onClose }) => {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleClose = () => {
        // Reset state when closing the modal
        setRoomCode('');
        setError('');
        setSuccessMessage('');
        onClose();
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!roomCode.trim()) {
            setError('Room code cannot be empty.');
            return;
        }
        try {
            const response = await axiosInstance.post('/api/projects/join/', { room_code: roomCode });
            setSuccessMessage(response.data.message || 'Request sent successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send join request.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800 w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-6">Join a Project</h2>
                
                {successMessage ? (
                    <div>
                        <p className="text-center text-green-400 mb-8">{successMessage}</p>
                        <div className="flex justify-end">
                            <button onClick={handleClose} className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Close</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Invite Code</label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                placeholder="Enter the project's unique room code"
                                className="w-full mt-1 px-4 py-3 text-white bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="flex justify-end gap-4 mt-8">
                            <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-700 font-bold rounded-lg hover:bg-gray-600 transition">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition">Send Request</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default JoinProjectModal;