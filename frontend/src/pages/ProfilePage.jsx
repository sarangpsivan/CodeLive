import React, { useState, useEffect, useContext } from 'react';
import { FaUser, FaLock, FaLayerGroup, FaSave, FaTrash, FaShieldAlt, FaEnvelope, FaFingerprint, FaGithub } from 'react-icons/fa';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import ConfirmationModal from '../components/ConfirmationModal';

// --- Reusable Deep Space Components ---

const SectionHeader = ({ title, description }) => (
    <div className="pb-4 mb-8 border-b border-indigo-500/20">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">{title}</h2>
        {description && <p className="text-gray-400 mt-1 text-sm font-medium">{description}</p>}
    </div>
);

const FormGroup = ({ label, children, helpText }) => (
    <div className="mb-6 group">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-[var(--primary-purple)] transition-colors">{label}</label>
        {children}
        {helpText && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}
    </div>
);

const StyledInput = (props) => (
    <div className="relative">
        <input
            {...props}
            className={`w-full bg-[#161b22]/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm 
            focus:outline-none focus:border-[var(--primary-purple)] focus:ring-1 focus:ring-[var(--primary-purple)]/50 
            transition-all placeholder-gray-600 shadow-inner backdrop-blur-sm ${props.className || ''}`}
        />
    </div>
);

const SidebarLink = ({ label, href, active, icon: Icon }) => (
    <a
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 group relative overflow-hidden ${active
            ? 'text-white bg-[var(--primary-purple)]/10 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)] border border-[var(--primary-purple)]/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
    >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary-purple)] rounded-l-xl" />}
        {Icon && <Icon className={`w-4 h-4 ${active ? 'text-[var(--primary-purple)]' : 'text-gray-500 group-hover:text-white'}`} />}
        <span className="relative z-10">{label}</span>
    </a>
);

const ProfilePage = () => {
    const { user, setUserDirectly, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [hasUsablePassword, setHasUsablePassword] = useState(true);
    const [activeSection, setActiveSection] = useState('profile');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Password validation checks
    const checks = [
        { label: "8+ characters", valid: newPassword.length >= 8 },
        { label: "1 uppercase", valid: /[A-Z]/.test(newPassword) },
        { label: "1 lowercase", valid: /[a-z]/.test(newPassword) },
        { label: "1 number", valid: /\d/.test(newPassword) },
        { label: "1 symbol", valid: /[@$!%*?&]/.test(newPassword) },
    ];
    const allValid = checks.every(c => c.valid);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/user/');
                setFirstName(response.data.first_name || '');
                setLastName(response.data.last_name || '');
                setHasUsablePassword(response.data.has_usable_password);
                setUserDirectly(prev => ({ ...prev, ...response.data }));
            } catch (error) { console.error(error); }
        };
        fetchUserData();

        axiosInstance.get('/api/projects/').then(res => setProjects(res.data)).catch(err => console.error(err));

        // Scroll spy
        const handleScroll = () => {
            const sections = ['profile', 'security', 'projects', 'danger'];
            const scrollPosition = window.scrollY + 150; // Offset for sticky header

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
                    setActiveSection(section);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);

    }, [setUserDirectly]);

    const showStatus = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        showStatus('loading', 'Updating profile...');
        try {
            const response = await axiosInstance.patch('/api/auth/user/', { first_name: firstName, last_name: lastName });
            setUserDirectly(prev => ({ ...prev, ...response.data }));
            showStatus('success', 'Profile updated successfully.');
        } catch (error) { showStatus('error', 'Failed to update profile.'); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showStatus('error', 'Passwords do not match.');
            return;
        }
        showStatus('loading', 'Updating password...');
        try {
            await axiosInstance.post('/api/auth/password/change/', { old_password: oldPassword, new_password1: newPassword, new_password2: confirmPassword });
            showStatus('success', 'Password changed successfully.');
            setHasUsablePassword(true);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) { showStatus('error', error.response?.data?.detail || 'Failed to change password.'); }
    };

    const handleDeleteAccount = async () => {
        try { await axiosInstance.delete('/api/user/delete/'); logoutUser(); }
        catch (error) { alert("Failed to delete account."); }
    };

    const initials = (user?.first_name || user?.username || '?').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen font-sans selection:bg-purple-500/30">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} title="Delete Account" message="This is extremely dangerous. You will lose all your projects and data permanently." />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">

                {/* Hero Header */}
                {/* Hero Header Card */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 bg-[#161b22]/60 mb-12 flex items-center gap-6 relative overflow-hidden group">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary-purple)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[var(--primary-purple)]/10 transition-all duration-700" />

                    <div className="w-24 h-24 flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-[1px] shadow-2xl shadow-purple-900/20 relative z-10">
                        <div className="w-full h-full bg-[#161b22] rounded-2xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <span className="text-4xl font-bold text-white relative z-10">{initials}</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-white lg:text-4xl font-display tracking-tight mb-2">{user?.first_name || user?.username}</h1>
                        <div className="text-gray-400 font-mono text-sm flex flex-col items-start lg:flex-row lg:items-center gap-1 lg:gap-2">
                            <div className="flex items-center gap-1">
                                <span className="text-[var(--primary-purple)]">@</span>{user?.username}
                            </div>
                            <span className="hidden lg:inline w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>Personal Profile</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Sticky Sidebar */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <nav className="sticky top-24 space-y-2">
                            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Account Settings</h3>
                            <SidebarLink label="Public Profile" href="#profile" active={activeSection === 'profile'} icon={FaUser} />
                            <SidebarLink label="Account Security" href="#security" active={activeSection === 'security'} icon={FaShieldAlt} />
                            <SidebarLink label="Projects" href="#projects" active={activeSection === 'projects'} icon={FaLayerGroup} />
                            <div className="my-6 border-t border-white/5"></div>
                            <SidebarLink label="Danger Zone" href="#danger" active={activeSection === 'danger'} icon={FaShieldAlt} />
                        </nav>
                    </aside>

                    {/* Main Content Stream */}
                    <main className="flex-1 space-y-20 pb-20">

                        {/* Status Notification Toast */}
                        {status.message && (
                            <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-slide-up ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${status.type === 'error' ? 'bg-red-500' : status.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <span className="font-semibold">{status.message}</span>
                            </div>
                        )}

                        {/* SECTION: Public Profile */}
                        <section id="profile" className="scroll-mt-24">
                            <SectionHeader title="Public Profile" description="This information will be displayed to other users within your projects." />

                            <form onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormGroup label="First Name">
                                        <StyledInput value={firstName} onChange={e => setFirstName(e.target.value)} />
                                    </FormGroup>
                                    <FormGroup label="Last Name">
                                        <StyledInput value={lastName} onChange={e => setLastName(e.target.value)} />
                                    </FormGroup>
                                </div>
                                <FormGroup label="Public Email">
                                    <StyledInput value={user?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
                                </FormGroup>
                                <div className="mt-8">
                                    <button type="submit" className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* SECTION: Security */}
                        <section id="security" className="scroll-mt-24">
                            <SectionHeader title="Account Security" description="Manage your password and security preferences." />

                            <form onSubmit={handleChangePassword}>
                                {hasUsablePassword && (
                                    <FormGroup label="Old Password">
                                        <StyledInput type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} icon={FaLock} />
                                    </FormGroup>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormGroup label="New Password">
                                        <div className="relative">
                                            <StyledInput
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                onFocus={() => setIsPasswordFocused(true)}
                                                onBlur={() => { if (newPassword.length === 0) setIsPasswordFocused(false) }}
                                                icon={FaLock}
                                            />
                                            {/* Floating Password Rules Popup */}
                                            <AnimatePresence>
                                                {(isPasswordFocused || newPassword.length > 0) && !allValid && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute bottom-full left-0 mb-3 w-full bg-[#1F242A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20"
                                                    >
                                                        <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-[#1F242A] border-b border-r border-white/10 rotate-45"></div>
                                                        <div className="text-xs font-semibold text-gray-300 mb-2">Password Requirements</div>
                                                        <div className="space-y-1.5">
                                                            {checks.map((check, i) => (
                                                                <div key={i} className={`flex items-center text-[11px] transition-colors ${check.valid ? 'text-green-400' : 'text-gray-500'}`}>
                                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center mr-2 border ${check.valid ? 'bg-green-500/10 border-green-500/50' : 'border-gray-600 bg-transparent'}`}>
                                                                        {check.valid && <Check className="w-2 h-2" />}
                                                                    </div>
                                                                    {check.label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </FormGroup>
                                    <FormGroup label="Confirm Password">
                                        <StyledInput type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} icon={FaLock} />
                                    </FormGroup>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button type="submit" className="px-6 py-2.5 bg-[var(--primary-purple)] text-white text-sm font-bold rounded-xl hover:bg-[#7c3aed] transition shadow-lg shadow-purple-900/20">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* SECTION: Projects */}
                        <section id="projects" className="scroll-mt-24">
                            <SectionHeader title="Your Projects" description="View and manage the projects you are part of." />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.length > 0 ? (
                                    projects.map(project => <ProjectCard key={project.id} project={project} />)
                                ) : (
                                    <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#161b22]/30">
                                        <FaLayerGroup className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-white">No projects yet</h3>
                                        <p className="text-gray-500 text-sm mt-1">Join or create a project to get started.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SECTION: Danger Zone */}
                        <section id="danger" className="scroll-mt-24 pt-8">
                            <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                                <FaShieldAlt className="w-5 h-5" /> Danger Zone
                            </h2>
                            <div className="border border-red-500/20 rounded-2xl overflow-hidden bg-[#161b22]/50 backdrop-blur-sm">
                                <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-base font-bold text-white">Delete this account</h3>
                                        <p className="text-sm text-gray-400 mt-1 max-w-lg">
                                            Once you delete an account, there is no going back. Please be certain. All your projects, files, and data will be permanently removed.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="whitespace-nowrap px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white hover:border-transparent transition shadow-lg shadow-red-900/10"
                                    >
                                        Delete Action
                                    </button>
                                </div>
                            </div>
                        </section>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;