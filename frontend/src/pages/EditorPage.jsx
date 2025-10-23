import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import ChatPanel from '../components/ChatPanel';
import axiosInstance from '../utils/axiosInstance';
import { FaTimes, FaSync, FaExternalLinkAlt, FaEllipsisV } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const PreviewPanel = ({ htmlCode, onClose }) => {
    const iframeRef = useRef(null);
    const reloadIframe = () => { 
        if (iframeRef.current) iframeRef.current.srcdoc = htmlCode; 
    };

    const openInNewTab = () => {
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full w-full flex flex-col bg-dark-card">
            <div className="flex-shrink-0 flex items-center justify-between bg-header-dark h-10 px-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <button onClick={reloadIframe} title="Refresh" className="text-gray-400 hover:text-white"><FaSync size={14} /></button>
                    <div className="bg-dark-bg text-gray-300 text-xs px-2 py-1 rounded w-64 truncate">https://preview.codelive.app</div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={openInNewTab} title="Open in new tab" className="text-gray-400 hover:text-white"><FaExternalLinkAlt size={14} /></button>
                    <button onClick={onClose} title="Close Panel" className="text-gray-400 hover:text-white"><FaTimes size={16} /></button>
                </div>
            </div>
            <div className="flex-grow bg-white">
                <iframe ref={iframeRef} srcDoc={htmlCode} title="Live Preview" sandbox="allow-scripts" width="100%" height="100%" style={{ border: 'none' }}/>
            </div>
        </div>
    );
};

const OutputPanel = ({ output, onClose }) => (
    <div className="h-full w-full flex flex-col bg-dark-card">
        <div className="flex-shrink-0 flex items-center justify-between bg-header-dark h-10 px-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold">Output</h3>
            <button onClick={onClose} title="Close Panel" className="text-gray-400 hover:text-white"><FaTimes size={16} /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
            <pre className="text-sm whitespace-pre-wrap">{output}</pre>
        </div>
    </div>
);

const EditorActions = ({ onShowOutput, onShowPreview, isPreviewEnabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
                <FaEllipsisV />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-dark-card border border-gray-700 rounded-md shadow-lg z-10">
                    <button 
                        onClick={() => { onShowOutput(); setIsOpen(false); }} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                        Show Output
                    </button>
                    {isPreviewEnabled && (
                        <button 
                            onClick={() => { onShowPreview(); setIsOpen(false); }} 
                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            Show Preview
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const EditorPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [sidePanel, setSidePanel] = useState(null);
    const [output, setOutput] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [messages, setMessages] = useState([]);
    const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
    const [activeActivityBarTab, setActiveActivityBarTab] = useState('explorer');
    const socketRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const { authTokens } = useContext(AuthContext);

    const executableLanguages = ['python', 'javascript', 'cpp', 'java'];
    const dummyCollaborators = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
    ];

    useEffect(() => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => console.error("Failed to fetch project details", err));

        if (authTokens) {
            const socket = new WebSocket(
                `ws://localhost:8000/ws/project/${projectId}/?token=${authTokens.access}`
            );
            socketRef.current = socket;

            socket.onopen = () => console.log("WebSocket connection established");
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'code_update') {
                    setOpenFiles(prevFiles => prevFiles.map(f =>
                        f.id === activeFileId ? { ...f, content: data.message } : f
                    ));
                }
                else if (data.type === 'chat_message') { 
                    setMessages(prev => [...prev, data]); 
                }
                else if (data.type === 'file_tree_update') { 
                    setExplorerRefreshKey(prev => prev + 1); 
                }
            };

            socket.onclose = () => console.log("WebSocket connection closed");

            return () => socket.close();
        }
    }, [projectId, activeFileId, authTokens]);

    const getLanguageFromFile = (fileName) => {
        const extension = fileName.split('.').pop();
        switch (extension) {
            case 'py': return 'python';
            case 'js': return 'javascript';
            case 'jsx': return 'javascript';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'cpp': return 'cpp';
            case 'java': return 'java';
            default: return 'plaintext';
        }
    };

    const handleFileSelect = (fileId) => {
        const existingFile = openFiles.find(f => f.id === fileId);
        if (existingFile) {
            setActiveFileId(fileId);
        } else {
            axiosInstance.get(`/api/files/${fileId}/`).then(res => {
                const newFile = {
                    id: res.data.id, 
                    name: res.data.name, 
                    content: res.data.content,
                    language: getLanguageFromFile(res.data.name),
                };
                setOpenFiles(prev => [...prev, newFile]);
                setActiveFileId(newFile.id);
            }).catch(err => console.error("Failed to load file content", err));
        }
    };

    const handleCloseFile = (fileIdToClose) => {
        const fileToClose = openFiles.find(f => f.id === fileIdToClose);
        setOpenFiles(prevFiles => prevFiles.filter(f => f.id !== fileIdToClose));
        if (activeFileId === fileIdToClose) {
            if (openFiles.length > 1) {
                const newActiveFile = openFiles.find(f => f.id !== fileIdToClose);
                setActiveFileId(newActiveFile.id);
            } else {
                setActiveFileId(null);
                setSidePanel(null);
            }
        }
        if (fileToClose?.language === 'html' && sidePanel === 'preview') {
            setSidePanel(null);
        }
    };

    const handleEditorChange = (value) => {
        if (activeFileId) {
            setOpenFiles(prevFiles =>
                prevFiles.map(f => f.id === activeFileId ? { ...f, content: value } : f)
            );
            
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ 'type': 'code_update', 'message': value }));
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                if (activeFileId) {
                    const fileToSave = openFiles.find(f => f.id === activeFileId);
                    if (fileToSave) {
                        axiosInstance.put(`/api/files/${fileToSave.id}/`, { ...fileToSave, content: value })
                            .then(res => console.log("File saved successfully!"))
                            .catch(err => console.error("Failed to save file", err));
                    }
                }
            }, 2000);
        }
    };

    const handleRunCode = async () => {
        const activeFile = openFiles.find(f => f.id === activeFileId);
        if (!activeFile) return;
        
        setSidePanel('output');
        setIsExecuting(true);
        setOutput('Executing...');
        try {
            const response = await axiosInstance.post('/api/execute/', { 
                language: activeFile.language, 
                code: activeFile.content 
            });
            const { stdout, stderr, compile_output, message, status } = response.data;
            let result = '';

            if (stdout) result += stdout;
            if (stderr) result += `Error:\n${stderr}`;
            if (compile_output) result += `Compile Error:\n${compile_output}`;
            if (message) result += `Message:\n${message}`;

            setOutput(result || `Execution finished with status: ${status?.description || 'unknown'}`);
        } catch (error) { 
            setOutput("An error occurred while executing the code."); 
        }
        finally { 
            setIsExecuting(false); 
        }
    };

    const handleSendMessage = (message) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ 'type': 'chat_message', 'message': message }));
        }
    };

    const activeFile = openFiles.find(f => f.id === activeFileId);
    const isRunButtonEnabled = activeFile && executableLanguages.includes(activeFile.language);
    const isPreviewEnabled = activeFile && activeFile.language === 'html';

    return (
        <div className="flex flex-col h-screen bg-dark-bg text-white font-sans">
            <TopBar 
                projectId={projectId}
                projectTitle={project?.name || 'Loading...'} 
                activeFileName={activeFile?.name || 'No file selected'}
                collaborators={dummyCollaborators} 
            />
            
            <div className="flex flex-grow overflow-hidden">
                <ActivityBar 
                    activeTab={activeActivityBarTab} 
                    onTabChange={setActiveActivityBarTab} 
                    onRunCode={handleRunCode} 
                    isRunButtonEnabled={isRunButtonEnabled} 
                    isExecuting={isExecuting} 
                />
                
                <div className="w-80 flex-shrink-0 bg-dark-card border-r border-gray-800">
                    {activeActivityBarTab === 'explorer' && (
                        <FileExplorer projectId={projectId} onFileSelect={handleFileSelect} refreshKey={explorerRefreshKey} />
                    )}
                    {activeActivityBarTab === 'chat' && (
                        <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
                    )}
                    {activeActivityBarTab === 'alerts' && (
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">Alerts</h3>
                            <p className="text-gray-400">No new alerts.</p>
                        </div>
                    )}
                </div>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between bg-tab-bar-dark border-b border-gray-800">
                        <div className="flex">
                            {openFiles.map(file => (
                                <div 
                                    key={file.id} 
                                    className={`flex items-center px-4 py-2 text-sm border-r border-gray-700 cursor-pointer ${activeFileId === file.id ? 'bg-editor-bg text-white' : 'bg-tab-bar-dark text-gray-400 hover:bg-gray-800'}`} 
                                    onClick={() => handleFileSelect(file.id)}
                                >
                                    <span className="mr-2">{file.name}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCloseFile(file.id); }} 
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="pr-2">
                            <EditorActions 
                                onShowOutput={() => setSidePanel('output')}
                                onShowPreview={() => setSidePanel('preview')}
                                isPreviewEnabled={isPreviewEnabled}
                            />
                        </div>
                    </div>

                    <div className="flex-grow flex flex-row">
                        <div className={sidePanel ? "w-1/2" : "w-full"}>
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language={activeFile?.language || 'plaintext'}
                                value={activeFile?.content || '# Select a file from the explorer'}
                                onChange={handleEditorChange}
                                options={{ 
                                    readOnly: !activeFileId, 
                                    minimap: { enabled: false } 
                                }}
                            />
                        </div>
                        {sidePanel && (
                            <div className="w-1/2 border-l-2 border-gray-700">
                                {sidePanel === 'preview' && activeFile && (
                                    <PreviewPanel htmlCode={activeFile.content} onClose={() => setSidePanel(null)} />
                                )}
                                {sidePanel === 'output' && (
                                    <OutputPanel output={output} onClose={() => setSidePanel(null)} />
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            
            <div className="flex-shrink-0 bg-[var(--primary-purple)] h-7 border-t border-gray-800 flex items-center px-4 text-sm text-white justify-between">
                <p>CodeLive Status: Connected</p>
                <p>{dummyCollaborators.length} collaborators online</p>
            </div>
        </div>
    );
};

export default EditorPage;