import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axiosInstance from '../utils/axiosInstance';
import { FaArrowLeft, FaSave, FaCheck, FaCloudUploadAlt, FaExclamationTriangle } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Custom styles for Quill editor to match the Glass/Dark theme
// Custom styles for Quill editor to match the Glass/Dark theme
const quillStyle = `
  .ql-toolbar.ql-snow {
    background: rgba(22, 27, 34, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    backdrop-filter: blur(12px);
    padding: 16px;
    margin-bottom: 8px;
  }
  
  .ql-container.ql-snow {
    background: rgba(22, 27, 34, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    color: #e5e7eb;
    font-family: 'Inter', sans-serif;
    font-size: 1.05rem;
    backdrop-filter: blur(12px);
  }
  
  .ql-editor {
    min-height: calc(100vh - 350px);
    padding: 32px;
    line-height: 1.7;
  }
  
  .ql-editor.ql-blank::before {
    color: #6b7280;
    font-style: normal;
    font-size: 1.05rem;
  }
  
  .ql-snow .ql-stroke { stroke: #9ca3af; }
  .ql-snow .ql-fill { fill: #9ca3af; }
  .ql-snow .ql-picker { color: #9ca3af; }
  .ql-snow .ql-picker-options { 
    background-color: #1f242a; 
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
    border-radius: 0.5rem;
    padding: 4px;
  }
  
  /* Hover effects */
  .ql-snow .ql-picker:hover .ql-picker-label { color: #fff; }
  .ql-snow .ql-picker-label.ql-active { color: #8b5cf6; }
  .ql-snow .ql-picker-item:hover { color: #8b5cf6; }
  .ql-snow button:hover .ql-stroke { stroke: #fff; }
  .ql-snow button.ql-active .ql-stroke { stroke: #8b5cf6; }
`;

const DocumentationEditorPage = () => {
    const { projectId, documentId } = useParams();
    const navigate = useNavigate();
    const { user, authTokens } = useContext(AuthContext);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [initialContent, setInitialContent] = useState('');
    const [initialTitle, setInitialTitle] = useState('');
    const [lastUpdatedBy, setLastUpdatedBy] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState('');
    const [status, setStatus] = useState('Loading...');
    const [isSaving, setIsSaving] = useState(false);
    const [projectName, setProjectName] = useState('');

    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const getWsUrl = () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        if (apiBase.startsWith('https')) return apiBase.replace('https', 'wss');
        return apiBase.replace('http', 'ws');
    };
    const wsBaseUrl = import.meta.env.VITE_WS_URL || getWsUrl();

    useEffect(() => {
        setStatus('Loading...');
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProjectName(res.data.name))
            .catch(err => console.error("Failed to fetch project name", err));

        axiosInstance.get(`/api/projects/${projectId}/documentation/${documentId}/`)
            .then(res => {
                setTitle(res.data.title);
                setInitialTitle(res.data.title);
                setContent(res.data.content);
                setInitialContent(res.data.content);
                setLastUpdatedBy(res.data.last_updated_by_username);
                setLastUpdatedAt(new Date(res.data.updated_at).toLocaleString());
                setStatus('Loaded');
            })
            .catch(err => {
                console.error("Failed to fetch document", err);
                setStatus('Error loading document.');
                alert("Could not load the requested document.");
                navigate(`/project/${projectId}`);
            });
    }, [projectId, documentId, navigate]);

    useEffect(() => {
        const connectWebSocket = () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            const currentAuthTokens = authTokens || (localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
            if (!currentAuthTokens?.access) return;

            try { jwtDecode(currentAuthTokens.access); } catch (error) { return; }

            const ws = new WebSocket(`${wsBaseUrl}/ws/project/${projectId}/?token=${currentAuthTokens.access}`);
            socketRef.current = ws;

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'doc_content_update' && data.documentId === parseInt(documentId)) {
                    setContent(data.content);
                    setTitle(data.title);
                    setInitialContent(data.content);
                    setInitialTitle(data.title);
                    setLastUpdatedBy(data.updater_username);
                    setLastUpdatedAt(new Date(data.updated_at).toLocaleString());
                    setStatus(`Synced: ${new Date(data.updated_at).toLocaleTimeString()}`);
                    setTimeout(() => setStatus(prev => prev.startsWith('Synced:') ? 'Saved' : prev), 2000);
                }
            };

            ws.onclose = (event) => {
                if (socketRef.current !== ws) return;
                socketRef.current = null;
                if (event.code !== 1000) reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
            };
        };
        connectWebSocket();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) socketRef.current.close(1000);
        };
    }, [projectId, authTokens, documentId]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setStatus('Saving...');
        try {
            const response = await axiosInstance.put(`/api/projects/${projectId}/documentation/${documentId}/`, { title, content });
            setInitialTitle(title);
            setInitialContent(content);
            setLastUpdatedBy(response.data.last_updated_by_username);
            setLastUpdatedAt(new Date(response.data.updated_at).toLocaleString());
            setStatus('Saved');
        } catch (err) {
            console.error("Failed to save document", err);
            setStatus('Error saving.');
        } finally { setIsSaving(false); }
    }, [projectId, documentId, title, content]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        if ((newContent !== initialContent || title !== initialTitle) && status !== 'Unsaved changes') setStatus('Unsaved changes');
        else if (newContent === initialContent && title === initialTitle && status === 'Unsaved changes') setStatus('Saved');
    };

    const handleTitleChange = (event) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        if ((content !== initialContent || newTitle !== initialTitle) && status !== 'Unsaved changes') setStatus('Unsaved changes');
        else if (content === initialContent && newTitle === initialTitle && status === 'Unsaved changes') setStatus('Saved');
    };

    const hasUnsavedChanges = content !== initialContent || title !== initialTitle;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link'], ['clean']
        ],
    };

    const StatusBadge = ({ status }) => {
        let color = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        let icon = null;

        if (status === 'Unsaved changes') {
            color = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            icon = <FaExclamationTriangle className="text-xs" />;
        } else if (status === 'Saved' || status === 'Loaded' || status.startsWith('Synced')) {
            color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            icon = <FaCheck className="text-xs" />;
        } else if (status === 'Saving...') {
            color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            icon = <FaCloudUploadAlt className="animate-bounce text-xs" />;
        } else if (status.startsWith('Error')) {
            color = 'bg-red-500/10 text-red-400 border-red-500/20';
            icon = <FaExclamationTriangle className="text-xs" />;
        }

        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color} transition-all duration-300`}>
                {icon}
                <span className="text-xs font-bold uppercase tracking-wider">{status.startsWith('Synced') ? 'Synced' : status}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 lg:p-8 h-full overflow-hidden flex flex-col font-sans">
            <style>{quillStyle}</style>

            {/* Header */}
            <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8 shrink-0">
                <div className="flex-1 space-y-4">
                    <button
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit"
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <FaArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="font-medium">Back to Project</span>
                    </button>

                    <div className="space-y-1">
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Untitled Document"
                            className="w-full bg-transparent text-4xl lg:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 focus:outline-none focus:to-white placeholder-gray-700 transition-all"
                            disabled={status === 'Loading...'}
                        />
                        <div className="flex items-center gap-3 text-sm text-gray-500 font-mono pl-1">
                            <span>{projectName}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                            <span>Last edited by <span className="text-gray-300">{lastUpdatedBy || 'you'}</span></span>
                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                            <span>{lastUpdatedAt}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <StatusBadge status={status} />

                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`relative group flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all duration-300 ${(!hasUnsavedChanges || isSaving)
                                ? 'bg-[#161b22] text-gray-600 border border-white/5 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[var(--primary-purple)] to-blue-600 text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 border border-transparent'
                            }`}
                    >
                        <FaSave className={`w-4 h-4 ${hasUnsavedChanges && !isSaving ? 'group-hover:scale-110' : ''} transition-transform`} />
                        <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                </div>
            </header>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 flex flex-col relative max-w-7xl mx-auto w-full">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-2xl pointer-events-none" />
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={handleContentChange}
                    modules={modules}
                    placeholder="Start documenting your ideas..."
                    readOnly={status === 'Loading...'}
                    className="h-full flex flex-col overflow-hidden"
                />
            </div>
        </div>
    );
};

export default DocumentationEditorPage;