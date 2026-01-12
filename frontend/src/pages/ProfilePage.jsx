import React, { useState, useEffect, useContext } from 'react';
import { FaUser, FaLock, FaLayerGroup, FaSave, FaArrowLeft, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import ConfirmationModal from '../components/ConfirmationModal';

const ProfilePage = () => {
    const { user, setUserDirectly, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/user/');
                const userData = response.data;

                setFirstName(userData.first_name || '');
                setLastName(userData.last_name || '');
                setUserDirectly(prev => ({ ...prev, ...userData }));

            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        };

        fetchUserData();
    }, [setUserDirectly]);

    useEffect(() => {
        if (activeTab === 'projects') {
            axiosInstance.get('/api/projects/')
                .then(res => setProjects(res.data))
                .catch(err => console.error(err));
        }
    }, [activeTab]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setStatus('Updating...');
        try {
            const response = await axiosInstance.patch('/api/auth/user/', {
                first_name: firstName,
                last_name: lastName
            });
            setUserDirectly(prev => ({ ...prev, ...response.data }));
            setStatus('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            setStatus('Failed to update profile.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            setStatus('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
            return;
        }
        setStatus('Changing password...');
        try {
            await axiosInstance.post('/api/auth/password/change/', {
                old_password: oldPassword,
                new_password1: newPassword,
                new_password2: confirmPassword
            });
            setStatus('Password changed successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            setStatus(error.response?.data?.detail || 'Failed to change password.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    const handleDeleteAccount = async () => {
        try {
            await axiosInstance.delete('/api/user/delete/');
            logoutUser();
        } catch (error) {
            console.error("Failed to delete account", error);
            alert("Failed to delete account. Please try again.");
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <FaUser /> },
        { id: 'security', label: 'Security', icon: <FaLock /> },
        { id: 'projects', label: 'My Projects', icon: <FaLayerGroup /> },
    ];

    return (
        <div className="h-full bg-[var(--dark-bg)] text-white font-sans flex flex-col overflow-y-auto lg:overflow-hidden">

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to permanently delete your account? This will delete all projects where you are the sole owner. This action cannot be undone."
            />

            <div className="flex-shrink-0 p-4 lg:p-8 pb-4">
                <div className="max-w-5xl mx-auto w-full">
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                </div>
            </div>

            <div className="flex-grow pb-8 px-4 lg:px-8">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 h-auto lg:h-full">

                    <nav className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-[var(--primary-purple)] text-white font-bold shadow-lg shadow-purple-900/20'
                                    : 'bg-[var(--dark-card)] text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}

                        <div className="h-px bg-gray-800 my-2 mx-2"></div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-[var(--dark-card)] text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                    </nav>

                    <div className="flex-1 bg-[var(--dark-card)] rounded-2xl border border-gray-800 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 p-6 lg:p-8 overflow-y-auto scrollbar-hide">

                            {status && (
                                <div className={`mb-6 p-3 rounded-lg text-sm font-bold text-center ${status.includes('Failed') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {status}
                                </div>
                            )}

                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                                        <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-6">Personal Information</h2>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Email (Username)</label>
                                            <input type="text" value={user?.email || ''} disabled className="w-full bg-gray-900 text-gray-500 border border-gray-700 rounded-lg px-4 py-3 cursor-not-allowed" />
                                            <p className="text-xs text-gray-600 mt-1">Email cannot be changed.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">First Name</label>
                                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--primary-purple)] focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--primary-purple)] focus:outline-none" />
                                            </div>
                                        </div>
                                        <button type="submit" className="px-6 py-3 bg-[var(--primary-purple)] font-bold rounded-lg hover:brightness-110 transition flex items-center gap-2">
                                            <FaSave /> Save Changes
                                        </button>
                                    </form>

                                    <div className="pt-8 mt-8 border-t border-gray-700">
                                        <h3 className="text-red-500 font-bold text-lg mb-2">Danger Zone</h3>
                                        <div className="bg-red-900/10 border border-red-900/50 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-200">Delete Account</h4>
                                                <p className="text-sm text-gray-400 mt-1">Permanently delete your account and all your data.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/50 rounded-lg transition font-semibold flex items-center gap-2"
                                            >
                                                <FaTrash /> Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                                    <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-6">Change Password</h2>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                                        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--primary-purple)] focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--primary-purple)] focus:outline-none" />
                                        <p className="text-xs text-gray-500 mt-1">(Must contain 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 symbol)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--primary-purple)] focus:outline-none" />
                                    </div>
                                    <button type="submit" className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition flex items-center gap-2">
                                        <FaLock /> Update Password
                                    </button>
                                </form>
                            )}

                            {activeTab === 'projects' && (
                                <div>
                                    <h2 className="text-xl font-bold border-b border-gray-700 pb-4 mb-6">My Projects</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {projects.length > 0 ? (
                                            projects.map(project => (
                                                <ProjectCard key={project.id} project={project} />
                                            ))
                                        ) : (
                                            <p className="text-gray-500">No projects found.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;