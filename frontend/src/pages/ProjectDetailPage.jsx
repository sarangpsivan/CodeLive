import React, { useState, useEffect, useContext } from 'react';
import {
    FaCode, FaUsers, FaFileAlt, FaCog, FaPlus, FaTrash,
    FaLayerGroup, FaClock, FaCheckCircle, FaUserClock,
    FaChartLine, FaShieldAlt
} from 'react-icons/fa';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { timeAgo } from '../utils/dateUtils';
import CollaboratorsTab from '../components/CollaboratorsTab';
import SettingsTab from '../components/SettingsTab';
import JoinRequestsTab from '../components/JoinRequestsTab';
import InviteModal from '../components/InviteModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

// --- Reusable Components (Local for now to avoid large refactors) ---

const SectionHeader = ({ title, description }) => (
    <div className="pb-4 mb-8 border-b border-indigo-500/20">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">{title}</h2>
        {description && <p className="text-gray-400 mt-1 text-sm font-medium">{description}</p>}
    </div>
);

const SidebarLink = ({ label, id, active, icon: Icon, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 group relative overflow-hidden ${active
            ? 'text-white bg-[var(--primary-purple)]/10 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)] border border-[var(--primary-purple)]/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
    >
        <div className="flex items-center gap-3 relative z-10">
            {active && <div className="absolute left-[-16px] top-0 bottom-0 w-1 bg-[var(--primary-purple)] rounded-r-xl" />}
            {Icon && <Icon className={`w-4 h-4 ${active ? 'text-[var(--primary-purple)]' : 'text-gray-500 group-hover:text-white'}`} />}
            <span>{label}</span>
        </div>
        {badge > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-500/20 text-xs text-red-300 font-bold border border-red-500/20">
                {badge}
            </span>
        )}
    </button>
);

const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#161b22]/60 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={48} />
        </div>
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${color.replace('text-', 'bg-')}/10 ${color}`}>
                <Icon size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1 font-display tracking-tight">{value}</div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{label}</div>
            {subtext && <div className="mt-2 text-xs text-gray-500 font-mono">{subtext}</div>}
        </div>
    </div>
);

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [activeSection, setActiveSection] = useState('overview'); // sidebar selection
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [activeMembers, setActiveMembers] = useState([]);
    const { user, authTokens } = useContext(AuthContext);
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, docId: null, docTitle: '' });

    const isOwner = project && user && project.owner === user.user_id;

    // Derived State for UI
    const sortedDocs = [...documents].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const currentUserMember = members.find(m => String(m.user) === String(user?.user_id));
    const welcomeName = currentUserMember?.first_name || (user?.email || '').split('@')[0] || user?.username || 'User';

    // --- Data Fetching & Websockets ---

    const getWsUrl = () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        if (apiBase.startsWith('https')) return apiBase.replace('https', 'wss');
        return apiBase.replace('http', 'ws');
    };
    const wsBaseUrl = import.meta.env.VITE_WS_URL || getWsUrl();

    const fetchData = () => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => {
                console.error("Failed to fetch project details.", err);
                alert("You do not have access to this project.");
                navigate('/dashboard');
            });

        axiosInstance.get(`/api/projects/${projectId}/members/`)
            .then(res => setMembers(res.data))
            .catch(err => console.error("Failed to fetch members:", err));

        setDocsLoading(true);
        axiosInstance.get(`/api/projects/${projectId}/documentation/`)
            .then(res => setDocuments(res.data))
            .catch(err => console.error("Failed to fetch documents list", err))
            .finally(() => setDocsLoading(false));

        if (isOwner) {
            axiosInstance.get(`/api/projects/${projectId}/requests/`)
                .then(res => setRequestCount(res.data.length))
                .catch(err => console.error("Failed to fetch requests:", err));
        }
    };

    useEffect(() => { fetchData(); }, [projectId, isOwner]);

    useEffect(() => {
        let socket = null;
        const connectWebSocket = () => {
            const currentAuthTokens = authTokens || (localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
            if (!currentAuthTokens?.access) return;
            try { if (jwtDecode(currentAuthTokens.access).exp * 1000 < Date.now()) return; } catch (e) { return; }

            socket = new WebSocket(`${wsBaseUrl}/ws/project/${projectId}/?token=${currentAuthTokens.access}`);
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'presence_update') setActiveMembers(data.active_user_ids);
                if (data.type === 'new_join_request') setRequestCount(prev => prev + 1);
                if (data.type === 'collaborator_update') {
                    fetchData();
                    if (data.removed_user_id && String(data.removed_user_id) === String(user?.user_id)) {
                        alert("You have been removed from this project.");
                        navigate('/dashboard');
                    }
                }
                if (data.type === 'doc_list_update') fetchData();
                if (data.type === 'doc_content_update') {
                    setDocuments(prevDocs => prevDocs.map(doc =>
                        doc.id === data.documentId ? { ...doc, title: data.title ?? doc.title, updated_at: data.updated_at, last_updated_by_username: data.updater_username } : doc
                    ));
                }
            };
        };
        connectWebSocket();
        return () => { if (socket) socket.close(); };
    }, [projectId, authTokens]);

    // --- Actions ---

    const handleNewDocument = async () => {
        try {
            const response = await axiosInstance.post(`/api/projects/${projectId}/documentation/`, { title: "New Document", content: "" });
            navigate(`/project/${projectId}/documentation/${response.data.id}`);
        } catch (error) { console.error("Failed to create document:", error); }
    };
    const handleDeleteClick = (docId, docTitle) => setConfirmDeleteModal({ isOpen: true, docId, docTitle });
    const confirmDeleteDocument = async () => {
        if (!confirmDeleteModal.docId) return;
        try {
            await axiosInstance.delete(`/api/projects/${projectId}/documentation/${confirmDeleteModal.docId}/`);
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== confirmDeleteModal.docId));
        } catch (error) { console.error("Failed to delete document:", error); }
        finally { setConfirmDeleteModal({ isOpen: false, docId: null, docTitle: '' }); }
    };

    if (!project) return <LoadingScreen text="Loading Project..." />;

    // --- Layout & Render ---

    return (
        <div className="min-h-full font-sans selection:bg-purple-500/30 flex flex-col lg:block relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

            <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} project={project} />
            <ConfirmationModal isOpen={confirmDeleteModal.isOpen} onClose={() => setConfirmDeleteModal({ isOpen: false, docId: null, docTitle: '' })} onConfirm={confirmDeleteDocument} title="Delete Document" message={`Permanently delete "${confirmDeleteModal.docTitle}"?`} />

            {/* Sidebar */}
            <aside className="lg:w-72 w-full flex-shrink-0 border-r border-white/5 bg-[#161b22]/50 backdrop-blur-xl z-20 lg:fixed lg:top-16 lg:bottom-0 lg:left-0 flex flex-col h-auto">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-[1px] shadow-lg shadow-purple-900/20 shrink-0">
                            <div className="w-full h-full bg-[#161b22] rounded-xl flex items-center justify-center">
                                <span className="text-xl font-bold text-white">{project.name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-white truncate font-display tracking-tight">{project.name}</h1>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Online
                            </div>
                        </div>
                    </div>

                    <Link
                        to={`/project/${projectId}/editor`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--primary-purple)] to-indigo-600 text-white font-bold rounded-xl hover:brightness-110 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] transition-all mb-8"
                    >
                        <FaCode className="w-4 h-4" />
                        <span>Launch Editor</span>
                    </Link>

                    <nav className="space-y-1">
                        <SidebarLink label="Overview" id="overview" active={activeSection === 'overview'} icon={FaChartLine} onClick={() => setActiveSection('overview')} />
                        <SidebarLink label="Team" id="team" active={activeSection === 'team'} icon={FaUsers} onClick={() => setActiveSection('team')} />
                        {isOwner && (
                            <SidebarLink
                                label="Join Requests"
                                id="requests"
                                active={activeSection === 'requests'}
                                icon={FaUserClock}
                                onClick={() => setActiveSection('requests')}
                                badge={requestCount}
                            />
                        )}
                        <SidebarLink label="Documentation" id="docs" active={activeSection === 'docs'} icon={FaFileAlt} onClick={() => setActiveSection('docs')} />
                        <SidebarLink label="Settings" id="settings" active={activeSection === 'settings'} icon={FaCog} onClick={() => setActiveSection('settings')} />
                    </nav>
                </div>


                <div className="mt-auto p-6">
                    {/* Back button removed as per request */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 relative z-10 lg:ml-72">
                <div className="max-w-6xl mx-auto">

                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeSection === 'overview' && (
                                <div className="space-y-6">
                                    <SectionHeader title="Project Overview" description={`Welcome back, ${welcomeName}. Here's what's happening.`} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard label="Total Members" value={project.member_count} icon={FaUsers} color="text-blue-400" />
                                        <StatCard label="Active Now" value={activeMembers.length} icon={FaUsers} color="text-green-400" subtext="Collaborating" />
                                        <StatCard label="Documents" value={documents.length} icon={FaFileAlt} color="text-purple-400" />
                                        <StatCard label="Days Active" value={Math.ceil((Date.now() - new Date(project.created_at)) / (1000 * 60 * 60 * 24))} icon={FaClock} color="text-orange-400" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Quick Actions Card */}
                                        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#161b22]/40">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <FaCheckCircle className="text-gray-500" /> Quick Actions
                                            </h3>
                                            <div className="space-y-3">
                                                <button onClick={handleNewDocument} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group text-left">
                                                    <span className="font-medium text-gray-300 group-hover:text-white">Write new documentation</span>
                                                    <FaPlus className="text-gray-500 group-hover:text-white" />
                                                </button>
                                                <button onClick={() => setIsInviteModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group text-left">
                                                    <span className="font-medium text-gray-300 group-hover:text-white">Invite a team member</span>
                                                    <FaUsers className="text-gray-500 group-hover:text-white" />
                                                </button>
                                                {isOwner && (
                                                    <button onClick={() => setActiveSection('settings')} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group text-left">
                                                        <span className="font-medium text-gray-300 group-hover:text-white">Project Settings</span>
                                                        <FaCog className="text-gray-500 group-hover:text-white" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Docs Card */}
                                        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#161b22]/40">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <FaFileAlt className="text-purple-500" /> Recent Docs
                                            </h3>
                                            <div className="space-y-3">
                                                {sortedDocs.slice(0, 3).map(doc => (
                                                    <Link key={doc.id} to={`/project/${projectId}/documentation/${doc.id}`} className="block p-4 rounded-xl bg-white/5 hover:bg-[var(--primary-purple)]/10 border border-white/5 hover:border-[var(--primary-purple)]/30 transition-all group">
                                                        <div className="font-bold text-gray-200 group-hover:text-white mb-1">{doc.title}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                                            <span>Updated {timeAgo(doc.updated_at)}</span>
                                                            <span>by {doc.last_updated_by_username}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                                {documents.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500 text-sm">No documents yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'team' && (
                                <div>
                                    <SectionHeader title="Team & Collaborators" description="Manage who has access to this project." />
                                    <CollaboratorsTab members={members} activeMembers={activeMembers} user={user} onInviteClick={() => setIsInviteModalOpen(true)} />
                                </div>
                            )}

                            {activeSection === 'docs' && (
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                        <SectionHeader title="Documentation" description="Technical specs, requirements, and notes." />
                                        <button onClick={handleNewDocument} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all hover:border-white/20 hover:shadow-lg">
                                            <FaPlus className="text-[var(--primary-purple)]" /> <span>New Page</span>
                                        </button>
                                    </div>

                                    {documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {documents.map(doc => (
                                                <div key={doc.id} className="group relative glass-card p-6 rounded-2xl border border-white/5 bg-[#161b22]/40 hover:bg-[#161b22]/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10 overflow-hidden">
                                                    <div className="absolute inset-0 border border-transparent group-hover:border-[var(--primary-purple)]/30 rounded-2xl transition-colors pointer-events-none" />
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-blue-400 group-hover:text-blue-300 ring-1 ring-white/5 group-hover:ring-white/10 transition-colors">
                                                            <FaFileAlt size={22} />
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(doc.id, doc.title); }}
                                                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors z-20"
                                                            title="Delete Document"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                    <Link to={`/project/${projectId}/documentation/${doc.id}`} className="block relative z-10">
                                                        <h3 className="text-xl font-bold text-gray-100 mb-2 line-clamp-1 group-hover:text-[var(--primary-purple)] transition-colors">{doc.title}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                            <span>Edited {timeAgo(doc.updated_at)}</span>
                                                            <span className="text-gray-700">•</span>
                                                            <span>{doc.last_updated_by_username}</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-24 rounded-3xl border border-dashed border-white/10 bg-white/5">
                                            <FaFileAlt className="text-gray-600 text-4xl mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-gray-300">No documentation yet</h3>
                                            <button onClick={handleNewDocument} className="mt-6 text-[var(--primary-purple)] hover:underline font-bold">Create First Doc</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'requests' && isOwner && (
                                <JoinRequestsTab projectId={projectId} onActionComplete={fetchData} />
                            )}

                            {activeSection === 'settings' && (
                                <div>
                                    <SectionHeader title="Project Settings" description="Configure project details and danger zone." />
                                    <SettingsTab projectId={projectId} isOwner={isOwner} members={members} onActionComplete={fetchData} />
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                </div>
            </main>
        </div>
    );
};

export default ProjectDetailPage;