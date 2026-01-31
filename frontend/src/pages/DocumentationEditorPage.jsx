import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axiosInstance from '../utils/axiosInstance';
import { FaArrowLeft, FaSave, FaCheck, FaCloudUploadAlt, FaExclamationTriangle } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Custom styles for Quill editor to match the Glass/Dark theme
const quillStyle = `
  .ql-toolbar.ql-snow {
    background: rgba(22, 27, 34, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    padding: 16px;
    margin-bottom: 2px;
    z-index: 20;
    position: relative;
  }
  
  .ql-container.ql-snow {
    background: rgba(13, 17, 23, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom-left-radius: 1rem;
    border-bottom-right-radius: 1rem;
    color: #e5e7eb;
    font-family: 'Inter', sans-serif;
    font-size: 1.05rem;
  }
  
  .ql-editor {
    min-height: calc(100vh - 350px);
    padding: 40px;
    line-height: 1.8;
  }
  
  .ql-editor.ql-blank::before {
    color: #4b5563;
    font-style: italic;
  }
  
  .ql-snow .ql-stroke { stroke: #9ca3af; }
  .ql-snow .ql-fill { fill: #9ca3af; }
  .ql-snow .ql-picker { color: #9ca3af; }
  .ql-snow .ql-picker-options { 
    background-color: #161b22; 
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
    border-radius: 0.75rem;
    padding: 8px;
    z-index: 100 !important;
  }
  
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

    // Helper to check for dirty state, ignoring Quill's empty p tag
    const isContentDirty = (curr, init) => {
        const normalize = (html) => (html === '<p><br></p>' ? '' : html);
        return normalize(curr) !== normalize(init);
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        const dirty = isContentDirty(newContent, initialContent) || title !== initialTitle;
        if (dirty && status !== 'Unsaved changes') setStatus('Unsaved changes');
        else if (!dirty && status === 'Unsaved changes') setStatus('Saved');
    };

    const handleTitleChange = (event) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        const dirty = isContentDirty(content, initialContent) || newTitle !== initialTitle;
        if (dirty && status !== 'Unsaved changes') setStatus('Unsaved changes');
        else if (!dirty && status === 'Unsaved changes') setStatus('Saved');
    };

    const hasUnsavedChanges = isContentDirty(content, initialContent) || title !== initialTitle;

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
            color = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-lg shadow-yellow-900/10';
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
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color} transition-all duration-300`}>
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{status.startsWith('Synced') ? 'Synced' : status}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 lg:p-8 h-full overflow-hidden flex flex-col font-sans">
            <style>{quillStyle}</style>

            {/* Header */}
            <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8 shrink-0">
                <div className="flex-1 space-y-4">

                    <div className="space-y-2">
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Untitled Document"
                            className="w-full bg-transparent text-2xl md:text-4xl lg:text-5xl font-bold font-display text-white placeholder-gray-700 transition-all hover:bg-white/5 focus:bg-white/5 rounded-xl px-4 -ml-4 py-2 border border-transparent focus:border-white/10 outline-none"
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

                <div className="flex items-center gap-4 pt-4">
                    <StatusBadge status={status} />

                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`relative group flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all duration-300 ${(!hasUnsavedChanges || isSaving)
                            ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                            : 'bg-white text-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 border border-transparent'
                            }`}
                    >
                        <FaSave className={`w-4 h-4 ${hasUnsavedChanges && !isSaving ? 'group-hover:scale-110' : ''} transition-transform`} />
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                </div>
            </header>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 flex flex-col relative max-w-5xl mx-auto w-full">
                <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-transparent rounded-3xl pointer-events-none blur-xl" />
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={handleContentChange}
                    modules={modules}
                    placeholder="Start documenting your ideas..."
                    readOnly={status === 'Loading...'}
                    className="h-full flex flex-col overflow-hidden relative z-10"
                />
            </div>
        </div>
    );
};

export default DocumentationEditorPage;