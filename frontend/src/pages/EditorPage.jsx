import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import ChatPanel from '../components/ChatPanel';
import AlertsPanel from '../components/AlertsPanel';
import axiosInstance from '../utils/axiosInstance';
import { VscClose, VscRefresh, VscLinkExternal, VscKebabVertical, VscTerminal } from 'react-icons/vsc';
import AuthContext from '../context/AuthContext';
import AIChatPanel from '../components/AIChatPanel';

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
            <div className="flex-shrink-0 flex items-center justify-between bg-[#1F242A] h-10 px-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <button onClick={reloadIframe} title="Refresh" className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10">
                        <VscRefresh size={14} />
                    </button>
                    <div className="bg-black/50 text-gray-300 text-xs px-2 py-1 rounded w-64 truncate border border-gray-700">
                        https://preview.codelive.app
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={openInNewTab} title="Open in new tab" className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10">
                        <VscLinkExternal size={14} />
                    </button>
                    <button onClick={onClose} title="Close Panel" className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10">
                        <VscClose size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-grow bg-white">
                <iframe
                    ref={iframeRef}
                    srcDoc={htmlCode}
                    title="Live Preview"
                    sandbox="allow-scripts"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                />
            </div>
        </div>
    );
};

const SimulatedTerminalPanel = ({ lines, inputValue, onInputChange, onSubmit, onClose, isExecuting }) => {
    const endOfTerminalRef = useRef(null);

    useEffect(() => {
        endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-black border-l border-gray-800 font-sans">
            
            <div className="h-10 px-4 border-b border-gray-800 flex items-center justify-between bg-[#1F242A] flex-shrink-0">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <VscTerminal className="text-[var(--primary-purple)]" size={16} />
                    <h3 className="text-xs uppercase tracking-wide text-gray-300">Terminal</h3>
                </div>
                <button 
                    onClick={onClose} 
                    title="Close Panel" 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-white/10"
                >
                    <VscClose size={16} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 font-mono text-sm space-y-1 scrollbar-hide text-gray-300">
                {lines.length === 0 && (
                    <div className="text-gray-600 italic text-center mt-10 text-xs">
                        Ready to execute code...
                    </div>
                )}
                {lines.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap break-words">
                        {line.type === 'output' && (
                            <span>{line.content}</span>
                        )}
                        {line.type === 'input' && (
                            <span className="text-cyan-400 font-bold">{line.content}</span>
                        )}
                    </div>
                ))}
                <div ref={endOfTerminalRef} />
            </div>

            <div className="p-3 border-t border-gray-800 bg-[#1F242A] flex-shrink-0">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Standard Input</span>
                    <span className="text-[10px] text-gray-500">Press Enter to send</span>
                </div>
                
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <div className="flex-grow flex items-center bg-gray-900 rounded-lg px-3 py-2 border border-gray-700 focus-within:ring-1 focus-within:ring-[var(--primary-purple)]">
                        <span className="text-green-500 font-mono text-sm mr-2 select-none">➜</span>
                        <input
                            type="text"
                            className="flex-grow bg-transparent text-white font-mono text-sm focus:outline-none placeholder-gray-600"
                            placeholder={isExecuting ? 'Program is running...' : "Type input here..."}
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isExecuting}
                            autoComplete="off"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

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
                <VscKebabVertical />
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
    const [terminalLines, setTerminalLines] = useState([]);
    const [currentTerminalInput, setCurrentTerminalInput] = useState('');
    const [inputHistory, setInputHistory] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [messages, setMessages] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
    const [alertRefreshKey, setAlertRefreshKey] = useState(0);
    const [activeActivityBarTab, setActiveActivityBarTab] = useState('explorer');
    const [activeCollaboratorIds, setActiveCollaboratorIds] = useState([]);
    const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const socketRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const { authTokens, user } = useContext(AuthContext);

    const executableLanguages = ['python', 'javascript', 'cpp', 'java'];
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

    useEffect(() => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => console.error("Failed to fetch project details", err));

        axiosInstance.get(`/api/projects/${projectId}/members/`)
            .then(res => setAllMembers(res.data))
            .catch(err => console.error("Failed to fetch all members", err));

        if (authTokens) {
            const socket = new WebSocket(
                `${wsBaseUrl}/ws/project/${projectId}/?token=${authTokens.access}`
            );

            socketRef.current = socket;

            socket.onopen = () => console.log("WebSocket connection established");

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'code_update') {
                    setOpenFiles(prevOpenFiles => {
                        const isFileOpen = prevOpenFiles.some(f => f.id === data.fileId);
                        if (isFileOpen) {
                            return prevOpenFiles.map(f =>
                                f.id === data.fileId ? { ...f, content: data.message } : f
                            );
                        }
                        return prevOpenFiles;
                    });
                } else if (data.type === 'chat_message') {
                    setMessages(prevMessages => [...prevMessages, data]);
                    
                    if (activeActivityBarTab !== 'chat' && data.user_id !== user.user_id) {
                        setHasUnreadChat(true);
                    }
                } else if (data.type === 'file_tree_update') {
                    setExplorerRefreshKey(prevKey => prevKey + 1);
                }
                else if (data.type === 'alert_update') {
                    setAlertRefreshKey(prev => prev + 1);
                    
                    if (data.unresolved_count === 0) {
                        setHasUnreadAlerts(false);
                    } else if (activeActivityBarTab !== 'alerts') {
                        setHasUnreadAlerts(true);
                    }
                }
                else if (data.type === 'presence_update') {
                    setActiveCollaboratorIds(data.active_user_ids || []);
                }
            };

            socket.onclose = () => console.log("WebSocket connection closed");

            return () => socket.close();
        }
    }, [projectId, authTokens]);

    const handleTabChange = (tab) => {
        setActiveActivityBarTab(tab);
        if (tab === 'alerts') {
            setHasUnreadAlerts(false);
        }
        if (tab === 'chat') {
            setHasUnreadChat(false);
        }
    };

    const activeMembers = useMemo(() => {
        return allMembers.filter(member =>
            activeCollaboratorIds.includes(member.user)
        );
    }, [allMembers, activeCollaboratorIds]);

    const canEdit = useMemo(() => {
        if (!project || !user) return false;
        if (project.owner === user.user_id) return true; 
        
        const myMembership = allMembers.find(m => m.user === user.user_id);
        return myMembership?.role === 'ADMIN' || myMembership?.role === 'EDITOR';
    }, [project, user, allMembers]);

    const enrichedMessages = useMemo(() => {
        return messages.map(msg => {
            const member = allMembers.find(m => m.user === msg.user_id);
            
            return {
            ...msg,
            username: member?.first_name || member?.email || msg.username || 'Unknown User'
            };
        });
    }, [messages, allMembers]);

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
            }).catch(err => {
                console.error("Failed to load file content", err);
            });
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
                socketRef.current.send(JSON.stringify({
                    'type': 'code_update',
                    'message': value,
                    'fileId': activeFileId
                }));
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            const valueToSave = value;
            const fileIdToSave = activeFileId;
            saveTimeoutRef.current = setTimeout(() => {
                if (fileIdToSave) {
                    axiosInstance.patch(`/api/files/${fileIdToSave}/`, { content: valueToSave })
                        .then(res => console.log("File saved successfully!"))
                        .catch(err => console.error("Failed to save file", err));
                }
            }, 2000);
        }
    };

    const handleTerminalSubmit = () => {
        if (currentTerminalInput.trim() === '') return;
        setTerminalLines(prev => [...prev, { type: 'input', content: currentTerminalInput }]);
        
        setInputHistory(prev => [...prev, currentTerminalInput]);
        
        setCurrentTerminalInput('');
    };

    const handleRunCode = async () => {
        const activeFile = openFiles.find(f => f.id === activeFileId);
        if (!activeFile) return;
        setSidePanel('output');
        setIsExecuting(true);
        setTerminalLines([{ type: 'output', content: 'Executing...' }]);
        
        const stdin = inputHistory.join('\n');
        try {
            const response = await axiosInstance.post('/api/execute/', {
                language: activeFile.language,
                code: activeFile.content,
                input: stdin
            });
            
            const { stdout, stderr, compile_output, message, status } = response.data;
            let result = '';
            if (stdout) result += stdout;
            if (stderr) result += `Error:\n${stderr}`;
            if (compile_output) result += `Compile Error:\n${compile_output}`;
            if (message) result += `Message:\n${message}`;
            
            setTerminalLines([{ type: 'output', content: result || `Execution finished with status: ${status?.description || 'unknown'}` }]);
        } catch (error) {
            setTerminalLines([{ type: 'output', content: "An error occurred while executing the code." }]);
        }
        finally {
            setIsExecuting(false);
            setInputHistory([]);
            setCurrentTerminalInput('');
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
                activeFileName={activeFile?.name || ''}
                activeMembers={activeMembers}
            />
            <div className="flex flex-grow overflow-hidden">
                <ActivityBar
                    activeTab={activeActivityBarTab}
                    onTabChange={handleTabChange} 
                    onRunCode={handleRunCode}
                    isRunButtonEnabled={isRunButtonEnabled}
                    isExecuting={isExecuting}
                    hasUnreadAlerts={hasUnreadAlerts}
                    hasUnreadChat={hasUnreadChat}
                />
                <div className="w-80 flex-shrink-0 bg-dark-card border-r border-gray-700">
                    {activeActivityBarTab === 'explorer' && (
                        <FileExplorer projectId={projectId} onFileSelect={handleFileSelect} refreshKey={explorerRefreshKey} canEdit={canEdit} />
                    )}
                    {activeActivityBarTab === 'chat' && (
                        <ChatPanel messages={enrichedMessages} onSendMessage={handleSendMessage} currentUser={user} />
                    )}
                    
                    {activeActivityBarTab === 'ai_chat' && (
                        <AIChatPanel projectId={projectId} />
                    )}
                    {activeActivityBarTab === 'alerts' && (
                        <AlertsPanel
                            projectId={projectId}
                            canEdit={canEdit}
                            refreshKey={alertRefreshKey}
                        />
                    )}
                </div>
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between bg-tab-bar-dark border-b border-gray-700">
                        <div className="flex">
                            {openFiles.map(file => (
                                <div
                                    key={file.id}
                                    className={`flex items-center px-4 py-2 text-sm border-r border-gray-700 cursor-pointer
                                        ${activeFileId === file.id
                                            ? 'bg-[var(--editor-bg)] text-white'
                                            : 'bg-tab-bar-dark border-b border-gray-700'
                                        }`}
                                    onClick={() => handleFileSelect(file.id)}
                                >
                                    <span className="mr-2">{file.name}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCloseFile(file.id); }}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <VscClose size={12} />
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
                        <div className={sidePanel ? "w-1/2 h-full" : "w-full h-full"}>
                            {activeFile ? (
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language={activeFile.language}
                                    value={activeFile.content ?? ''}
                                    onChange={handleEditorChange}
                                    options={{
                                        readOnly: !canEdit,
                                        minimap: { enabled: false }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-[#1E1E1E] text-gray-500 italic px-4">
                                    # Select a file from the explorer
                                </div>
                            )}
                        </div>
                        {sidePanel && (
                            <div className="w-1/2 border-l border-gray-700">
                                {sidePanel === 'preview' && activeFile && (
                                    <PreviewPanel htmlCode={activeFile.content} onClose={() => setSidePanel(null)} />
                                )}
                                {sidePanel === 'output' && (
                                    <SimulatedTerminalPanel
                                        lines={terminalLines}
                                        inputValue={currentTerminalInput}
                                        onInputChange={setCurrentTerminalInput}
                                        onSubmit={handleTerminalSubmit}
                                        onClose={() => setSidePanel(null)}
                                        isExecuting={isExecuting}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <div className="flex-shrink-0 h-7 border-t border-gray-700 flex items-center text-sm text-white justify-between bg-header-dark">
                <div className="bg-[var(--primary-purple)] h-full flex items-center px-4">
                    <p className="text-black">CodeLive Status: Connected</p>
                </div>
                <div className="px-4">
                    <p>{activeCollaboratorIds.length} collaborators online</p>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;