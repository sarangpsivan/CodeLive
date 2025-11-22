import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axiosInstance from '../utils/axiosInstance';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Custom styles for Quill editor
const quillStyle = `
  body { background-color: #111827; } /* gray-900 for the whole page */
  .ql-toolbar {
    background: #374151; /* gray-700 */
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border: 1px solid #4B5563; /* gray-600 */
  }
  .ql-container {
    background: #1F2937; /* gray-800 */
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    border: 1px solid #4B5563; /* gray-600 */
    color: #F3F4F6; /* gray-100 */
    min-height: calc(100vh - 150px); /* Adjust based on header/footer height */
    font-size: 1rem;
  }
  .ql-editor {
      min-height: calc(100vh - 150px);
  }
  .ql-editor::before {
    color: #9CA3AF !important; /* gray-400 */
  }
  .ql-snow .ql-stroke { stroke: #D1D5DB; } /* gray-300 */
  .ql-snow .ql-picker-label { color: #D1D5DB; } /* gray-300 */
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
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

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
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            const currentAuthTokens = authTokens || (localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
            
            if (!currentAuthTokens?.access) {
                console.log("WebSocket connection skipped (Docs): Not logged in.");
                return;
            }
            
            try {
                jwtDecode(currentAuthTokens.access);
            } catch (error) {
                console.error("WebSocket connection skipped (Docs): Invalid token.");
                return;
            }

            console.log("Attempting WebSocket connection (Docs)...");
            const wsUrl = `${wsBaseUrl}/ws/project/${projectId}/?token=${currentAuthTokens.access}`;
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                console.log("WebSocket connection established (Docs).");
            };

            socketRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("DocEditor WS Message Received:", data);

                if (data.type === 'doc_content_update' && data.documentId === parseInt(documentId)) {
                    console.log(`DocEditor received remote save update for THIS document (ID: ${data.documentId})`);

                    setContent(data.content);
                    setTitle(data.title);
                    setInitialContent(data.content); 
                    setInitialTitle(data.title); 
                    setLastUpdatedBy(data.updater_username);
                    setLastUpdatedAt(new Date(data.updated_at).toLocaleString());

                    setStatus(`Synced: ${new Date(data.updated_at).toLocaleTimeString()}`);
                    setTimeout(() => {
                         setStatus(prevStatus => prevStatus.startsWith('Synced:') ? 'Saved' : prevStatus);
                     }, 2000);
                } else if (data.type === 'doc_content_update') {
                    console.log(`DocEditor received remote save update for DIFFERENT document (ID: ${data.documentId})`);
                }
            };

            socketRef.current.onerror = (error) => {
                console.error('WebSocket error (Docs):', error);
            };

            socketRef.current.onclose = (event) => {
                console.log("WebSocket connection closed (Docs).", event.code, event.reason);
                socketRef.current = null;
                
                const latestTokens = localStorage.getItem('authTokens');
                if (event.code !== 1000 && latestTokens) {
                    console.log("Attempting WebSocket reconnect (Docs) in 5 seconds...");
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                } else {
                    console.log("WebSocket not reconnecting (Docs).");
                }
            };
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                console.log("Closing WebSocket connection (Docs) due to cleanup.");
                socketRef.current.close(1000);
                socketRef.current = null;
            }
        };
    }, [projectId, authTokens, documentId]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setStatus('Saving...');
        try {
            const response = await axiosInstance.put(`/api/projects/${projectId}/documentation/${documentId}/`, {
                title: title,
                content: content
            });
            setInitialTitle(title);
            setInitialContent(content);
            setLastUpdatedBy(response.data.last_updated_by_username);
            setLastUpdatedAt(new Date(response.data.updated_at).toLocaleString());
            setStatus('Saved');
        } catch (err) {
            console.error("Failed to save document", err);
            setStatus('Error saving.');
        } finally {
            setIsSaving(false);
        }
    }, [projectId, documentId, title, content]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        if ((newContent !== initialContent || title !== initialTitle) && status !== 'Unsaved changes') {
            setStatus('Unsaved changes');
        } else if (newContent === initialContent && title === initialTitle && status === 'Unsaved changes') {
            setStatus('Saved');
        }
    };

    const handleTitleChange = (event) => {
        const newTitle = event.target.value;
        setTitle(newTitle);
        if ((content !== initialContent || newTitle !== initialTitle) && status !== 'Unsaved changes') {
            setStatus('Unsaved changes');
        } else if (content === initialContent && newTitle === initialTitle && status === 'Unsaved changes') {
            setStatus('Saved');
        }
    };

    const hasUnsavedChanges = content !== initialContent || title !== initialTitle;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link'],
            ['clean']
        ],
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
            <style>{quillStyle}</style>

            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                <div>
                    <button
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-2"
                    >
                        <FaArrowLeft /> Back to Project Hub
                    </button>
                    <input 
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Document Title"
                        className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
                        disabled={status === 'Loading...'}
                    />
                    <p className="text-xs text-gray-500 mt-1">Project: {projectName}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-sm italic ${
                        status === 'Unsaved changes' ? 'text-yellow-400' :
                        status.startsWith('Error') ? 'text-red-400' :
                        status.startsWith('Synced:') ? 'text-green-400' :
                        'text-gray-400'
                    }`}>
                         {status === 'Loaded' && lastUpdatedBy ? `Last saved: ${lastUpdatedAt} by ${lastUpdatedBy}` : status}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition ${
                            (!hasUnsavedChanges || isSaving)
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-[var(--primary-purple)] text-white hover:brightness-110'
                        }`}
                    >
                        <FaSave />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                 <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={handleContentChange}
                    modules={modules}
                    placeholder="Write your project documentation..."
                    readOnly={status === 'Loading...'}
                />
            </div>
        </div>
    );
};

export default DocumentationEditorPage;