import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

import TopBar from '../components/TopBar';
import ActivityBar from '../components/ActivityBar';
import FileExplorer from '../components/FileExplorer';
import ChatPanel from '../components/ChatPanel';
import AlertsPanel from '../components/AlertsPanel';
import axiosInstance from '../utils/axiosInstance';
import { getFileIcon } from '../utils/fileIcons';
import { VscClose, VscKebabVertical, VscFiles, VscRemote } from 'react-icons/vsc';

import AuthContext from '../context/AuthContext';
import AIChatPanel from '../components/AIChatPanel';
import PreviewPanel from '../components/PreviewPanel';
import TerminalPanel from '../components/TerminalPanel';
import { Terminal } from 'lucide-react';



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
    const getWsUrl = () => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        // Handle https -> wss (Production) and http -> ws (Development)
        if (apiBase.startsWith('https')) {
            return apiBase.replace('https', 'wss');
        }
        return apiBase.replace('http', 'ws');
    };
    const wsBaseUrl = import.meta.env.VITE_WS_URL || getWsUrl();

    useEffect(() => {
        axiosInstance.get(`/api/projects/${projectId}/`)
            .then(res => setProject(res.data))
            .catch(err => console.error("Failed to fetch project details", err));

        axiosInstance.get(`/api/projects/${projectId}/members/`)
            .then(res => setAllMembers(res.data))
            .catch(err => console.error("Failed to fetch all members", err));

        if (authTokens || localStorage.getItem('authTokens')) {
            const currentAuthTokens = authTokens || JSON.parse(localStorage.getItem('authTokens'));
            const socket = new WebSocket(
                `${wsBaseUrl}/ws/project/${projectId}/?token=${currentAuthTokens.access}`
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
                                f.id === data.fileId ? { ...f, content: data.content } : f
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
    }, [projectId, authTokens?.access]);

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
                username: ((member?.first_name ? member.first_name + ' ' : '') + (member?.last_name || '')).trim() || member?.email || msg.username || 'Unknown User'
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
        // On mobile, close sidebar after selecting a file
        if (window.innerWidth < 768) {
            setActiveActivityBarTab(null);
        }

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
                    path: res.data.path,
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
                    'content': value,
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
            const errorMessage = error.response?.data?.error || "An error occurred while executing the code.";
            setTerminalLines([{ type: 'output', content: `Error: ${errorMessage}` }]);
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

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading || !project) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
            {/* Background Atmosphere - More Minimal */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0a] to-transparent pointer-events-none" />

            <TopBar
                projectId={projectId}
                projectTitle={project?.name || 'Loading...'}
                roomCode={project?.room_code}
                activeFileName={activeFile?.name || ''}
                activeMembers={activeMembers || []}
                onShowOutput={() => setSidePanel('output')}
                onShowPreview={() => setSidePanel('preview')}
                isPreviewEnabled={isPreviewEnabled}
            />
            <div className="flex flex-grow overflow-hidden relative z-10">
                <ActivityBar
                    activeTab={activeActivityBarTab}
                    onTabChange={handleTabChange}
                    onRunCode={handleRunCode}
                    isRunButtonEnabled={isRunButtonEnabled}
                    isExecuting={isExecuting}
                    hasUnreadAlerts={hasUnreadAlerts}
                    hasUnreadChat={hasUnreadChat}
                />
                <div className={`${activeActivityBarTab ? 'block' : 'hidden'} md:block w-full md:w-80 flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-[#27272a] absolute md:static z-20 h-full shadow-2xl`}>
                    {activeActivityBarTab === 'explorer' && (
                        <FileExplorer
                            projectId={projectId}
                            onFileSelect={handleFileSelect}
                            refreshKey={explorerRefreshKey}
                            canEdit={canEdit}
                            onClose={() => setActiveActivityBarTab(null)}
                        />
                    )}
                    {activeActivityBarTab === 'chat' && (
                        <ChatPanel
                            messages={enrichedMessages}
                            onSendMessage={handleSendMessage}
                            currentUser={user}
                            onClose={() => setActiveActivityBarTab(null)}
                        />
                    )}

                    {activeActivityBarTab === 'ai_chat' && (
                        <AIChatPanel
                            projectId={projectId}
                            activeFile={activeFile}
                            onClose={() => setActiveActivityBarTab(null)}
                        />
                    )}
                    {activeActivityBarTab === 'alerts' && (
                        <AlertsPanel
                            projectId={projectId}
                            canEdit={canEdit}
                            refreshKey={alertRefreshKey}
                            onClose={() => setActiveActivityBarTab(null)}
                        />
                    )}
                </div>
                <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                    {openFiles.length > 0 && (
                        <div className="flex-shrink-0 flex items-center justify-between bg-[#0a0a0a] border-b border-[#27272a] h-10 px-0">
                            <div className="flex h-full overflow-x-auto scrollbar-hide">
                                {openFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className={`flex items-center px-4 text-xs border-r border-[#27272a] cursor-pointer h-full min-w-[120px] max-w-[200px] transition-all select-none group
                                            ${activeFileId === file.id
                                                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[var(--primary-purple)]'
                                                : 'bg-[#09090b] text-gray-500 hover:bg-[#27272a] hover:text-gray-300'
                                            }`}
                                        onClick={() => handleFileSelect(file.id)}
                                    >
                                        <img src={getFileIcon(file.name)} alt="" className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate flex-1 font-sans">{file.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCloseFile(file.id); }}
                                            className={`text-gray-500 hover:text-white hover:bg-[#3f3f46] p-0.5 rounded transition-opacity ml-2 ${activeFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <VscClose size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex-grow flex flex-col md:flex-row relative">
                        <div className={sidePanel ? "hidden md:block w-full md:w-1/2 h-full" : "w-full h-full"}>
                            {activeFile ? (
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language={activeFile.language}
                                    value={activeFile.content ?? ''}
                                    onChange={handleEditorChange}
                                    options={{
                                        readOnly: !canEdit,
                                        minimap: { enabled: false },
                                        padding: { top: 16 },
                                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                        fontSize: 14,
                                        lineHeight: 24,
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none bg-[#000000]">
                                    <div className="mb-6 opacity-80 transform scale-110">
                                        <Terminal size={120} strokeWidth={3} className="text-white" />
                                    </div>
                                    <p className="font-mono text-sm opacity-50 text-gray-300">Select a file from the explorer to start</p>
                                </div>
                            )}
                        </div>
                        {sidePanel && (
                            <div className="w-full md:w-1/2 h-full border-l border-[#27272a] bg-[#0a0a0a] absolute md:static top-0 bottom-0 z-20 flex flex-col shadow-xl">
                                <div className="flex justify-between items-center p-2 md:hidden bg-[#09090b] border-b border-[#27272a]">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">{sidePanel}</span>
                                    <button onClick={() => setSidePanel(null)} className="text-gray-400 hover:text-white">
                                        <VscClose size={20} />
                                    </button>
                                </div>
                                {sidePanel === 'preview' && (
                                    <PreviewPanel
                                        projectId={projectId}
                                        token={authTokens?.access}
                                        activeFile={activeFile}
                                        onClose={() => setSidePanel(null)}
                                    />
                                )}
                                {sidePanel === 'output' && (
                                    <TerminalPanel
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
            <div className="flex-shrink-0 h-6 border-t border-[#27272a] flex items-center text-[10px] justify-between bg-[#09090b] relative z-30 select-none">
                <div className="h-full bg-purple-600 hover:bg-purple-500 text-black flex items-center gap-2 px-4 text-sm font-normal transition-colors cursor-pointer">
                    <Terminal size={14} className="text-black" />
                    <span>CodeLive Status: Connected</span>
                </div>
                <div className="flex items-center gap-3 px-3 text-gray-500">
                    <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors cursor-pointer">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span>{activeCollaboratorIds.length} Online</span>
                    </div>
                    <div className="h-3 w-[1px] bg-[#27272a]"></div>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer">Prettier: On</span>
                    <div className="h-3 w-[1px] bg-[#27272a]"></div>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer">UTF-8</span>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;