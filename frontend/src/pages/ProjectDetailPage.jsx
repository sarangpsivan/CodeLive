import React, { useState, useEffect, useContext } from 'react';
import { FaCode, FaSignOutAlt, FaUserClock, FaFileAlt, FaEdit, FaPlus, FaTrash, FaCheckCircle, FaUsers, FaArrowLeft, FaEnvelopeOpenText } from 'react-icons/fa';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { timeAgo } from '../utils/dateUtils';
import CollaboratorsTab from '../components/CollaboratorsTab';
import SettingsTab from '../components/SettingsTab';
import InviteModal from '../components/InviteModal';
import JoinRequestsModal from '../components/JoinRequestsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [activeTab, setActiveTab] = useState('collaborators');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [activeMembers, setActiveMembers] = useState([]);
    const { user, authTokens } = useContext(AuthContext);
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, docId: null, docTitle: '' });

    const isOwner = project && user && project.owner === user.user_id;

    const getWsUrl = () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        if (apiBase.startsWith('https')) {
            return apiBase.replace('https', 'wss');
        }
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

            try {
                if (jwtDecode(currentAuthTokens.access).exp * 1000 < Date.now()) return;
            } catch (e) { return; }

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

    const handleNewDocument = async () => {
        try {
            const response = await axiosInstance.post(`/api/projects/${projectId}/documentation/`, { title: "New Document", content: "" });
            navigate(`/project/${projectId}/documentation/${response.data.id}`);
        } catch (error) {
            console.error("Failed to create document:", error);
        }
    };

    const handleDeleteClick = (docId, docTitle) => setConfirmDeleteModal({ isOpen: true, docId, docTitle });

    const confirmDeleteDocument = async () => {
        if (!confirmDeleteModal.docId) return;
        try {
            await axiosInstance.delete(`/api/projects/${projectId}/documentation/${confirmDeleteModal.docId}/`);
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== confirmDeleteModal.docId));
        } catch (error) {
            console.error("Failed to delete document:", error);
        } finally {
            setConfirmDeleteModal({ isOpen: false, docId: null, docTitle: '' });
        }
    };

    if (!project) return <div className="p-8 text-white flex items-center justify-center min-h-[50vh]">Loading project...</div>;

    const tabs = ['collaborators', 'documentation', 'settings'];

    return (
        <>
            <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} project={project} />
            <JoinRequestsModal isOpen={isRequestsModalOpen} onClose={() => setIsRequestsModalOpen(false)} projectId={projectId} onActionComplete={fetchData} />
            <ConfirmationModal isOpen={confirmDeleteModal.isOpen} onClose={() => setConfirmDeleteModal({ isOpen: false, docId: null, docTitle: '' })} onConfirm={confirmDeleteDocument} title="Delete Document" message={`Permanently delete "${confirmDeleteModal.docTitle}"?`} />

            <main className="flex-1 p-6 lg:p-10 text-white font-sans flex flex-col h-full overflow-y-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto w-full">

                    {/* Hero Section */}
                    <div className="relative mb-12 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-700" />

                        <div className="relative glass-card p-8 lg:p-10 rounded-3xl border border-white/10 bg-[#161b22]/80 backdrop-blur-xl overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary-purple)]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                                <div className="space-y-6">
                                    {/* Removed Back to Dashboard Link */}

                                    <div>
                                        <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 mb-4">
                                            {project.name}
                                        </h1>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                                                <FaUsers className="text-gray-400" />
                                                <span className="text-gray-200 font-medium">{project.member_count} Members</span>
                                            </div>

                                            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-md transition-all ${activeMembers.length > 0
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]'
                                                : 'bg-white/5 border-white/5 text-gray-400'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${activeMembers.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                                                <span className="font-medium">{activeMembers.length} Active Now</span>
                                            </div>

                                            <div className="px-4 py-2 text-gray-500 font-mono text-xs">
                                                Updated {timeAgo(project.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 lg:pt-0">
                                    <Link
                                        to={`/project/${projectId}/editor`}
                                        className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[var(--primary-purple)] to-indigo-600 text-white font-bold rounded-xl hover:brightness-110 shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_-5px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5"
                                    >
                                        <FaCode className="w-5 h-5" />
                                        <span>Launch Editor</span>
                                    </Link>

                                    {isOwner && (
                                        <button
                                            onClick={() => setIsRequestsModalOpen(true)}
                                            className={`relative flex items-center gap-3 px-6 py-3.5 font-bold rounded-xl border transition-all shadow-lg group/req ${requestCount > 0
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:shadow-red-500/10'
                                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="relative">
                                                <FaUserClock className="w-5 h-5" />
                                                {requestCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <span>Join Requests</span>
                                            {requestCount > 0 && (
                                                <span className="ml-1 px-2 py-0.5 rounded-md bg-red-500/20 text-xs text-red-300">{requestCount}</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="p-1.5 rounded-2xl bg-[#0d1117]/50 border border-white/10 backdrop-blur-md inline-flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-6 py-2.5 text-sm font-bold tracking-wide capitalize rounded-xl transition-all duration-300 ${activeTab === tab
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                        }`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-[#21262d] rounded-xl shadow-lg border border-white/5"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {tab === 'collaborators' && <FaUsers className={activeTab === tab ? 'text-[var(--primary-purple)]' : ''} />}
                                        {tab === 'documentation' && <FaFileAlt className={activeTab === tab ? 'text-[var(--primary-purple)]' : ''} />}
                                        {tab === 'settings' && <FaCheckCircle className={activeTab === tab ? 'text-[var(--primary-purple)]' : ''} />}
                                        {tab}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'collaborators' && (
                            <CollaboratorsTab members={members} activeMembers={activeMembers} user={user} onInviteClick={() => setIsInviteModalOpen(true)} />
                        )}

                        {activeTab === 'documentation' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-white">Documentation</h2>
                                        <p className="text-gray-400 text-sm mt-1">Manage project requirements and technical docs.</p>
                                    </div>
                                    <button
                                        onClick={handleNewDocument}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all hover:border-white/20 hover:shadow-lg"
                                    >
                                        <FaPlus className="text-[var(--primary-purple)]" />
                                        <span>New Page</span>
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
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-[var(--primary-purple)] transition-colors" />
                                                        <span>Edited {timeAgo(doc.updated_at)}</span>
                                                        <span className="text-gray-700 mx-1">•</span>
                                                        <span>{doc.last_updated_by_username}</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-white/10 bg-white/5">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <FaFileAlt className="text-gray-600 text-2xl" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-300 mb-2">No documentation yet</h3>
                                        <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">Start writing documentation to keep your team aligned.</p>
                                        <button
                                            onClick={handleNewDocument}
                                            className="px-6 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-bold rounded-xl border border-white/10 transition-colors"
                                        >
                                            Create First Doc
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <SettingsTab projectId={projectId} isOwner={isOwner} members={members} onActionComplete={fetchData} />
                        )}
                    </motion.div>
                </div>
            </main>
        </>
    );
};

export default ProjectDetailPage;