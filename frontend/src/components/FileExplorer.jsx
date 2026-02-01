import React, { useState, useEffect, useCallback } from 'react';
import { VscChevronRight, VscChevronDown, VscNewFile, VscNewFolder, VscTrash, VscClose } from 'react-icons/vsc';
import axiosInstance from '../utils/axiosInstance';
import { getFileIcon } from '../utils/fileIcons';

const CreateInput = ({ onConfirm, onCancel, type, depth }) => {
    const [name, setName] = useState('');
    const placeholder = type === 'file' ? 'New file name...' : 'New folder name...';
    const Icon = VscNewFile;
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && name.trim()) {
            onConfirm(name.trim());
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };
    return (
        <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
            <Icon className="text-gray-400 flex-shrink-0" size={14} />
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={onCancel}
                placeholder={placeholder}
                className="w-full px-2 py-1 bg-[#1c1c1c] border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm shadow-inner"
                autoFocus
            />
        </div>
    );
};

const FileItemComponent = ({ file, onSelect, onDelete, depth, canEdit }) => (
    <div
        className="group flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#27272a] cursor-pointer text-sm transition-colors border-l-2 border-transparent hover:border-white/20 select-none"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
        <div className="flex items-center gap-2 flex-grow min-w-0" onClick={() => onSelect(file.id)}>
            <img src={getFileIcon(file.name)} alt={file.name} className="flex-shrink-0 w-4 h-4" />
            <span className="truncate text-gray-400 group-hover:text-gray-200 transition-colors">{file.name}</span>
        </div>

        {canEdit && (
            <button
                onClick={(e) => { e.stopPropagation(); onDelete('file', file.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                title="Delete file"
            >
                <VscTrash size={14} />
            </button>
        )}
    </div>
);

const FolderItemComponent = ({ folder, depth, ...props }) => {
    const { onFileSelect, onFolderSelect, selectedFolderId, expandedFolders, onToggleFolder, creatingItem, onCreateItem, onCancelCreate, onDelete, canEdit } = props;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const handleFolderClick = (e) => {
        e.stopPropagation();
        onFolderSelect(folder.id);
    };
    return (
        <div>
            <div
                className={`group flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#27272a] cursor-pointer text-sm transition-colors border-l-2 select-none ${isSelected ? 'bg-[#27272a] border-[var(--primary-purple)] text-white' : 'border-transparent text-gray-400'}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                <div className="flex items-center gap-2 flex-grow min-w-0" onClick={() => onToggleFolder(folder.id)}>
                    {isExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
                    <span className={`truncate font-medium ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`} onClick={handleFolderClick}>
                        {folder.name}
                    </span>
                </div>

                {canEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete('folder', folder.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                        title="Delete folder"
                    >
                        <VscTrash size={14} />
                    </button>
                )}
            </div>
            {isExpanded && (
                <div>
                    {folder.subfolders.map((sub) => (
                        <FolderItemComponent key={sub.id} folder={sub} depth={depth + 1} {...props} />
                    ))}
                    {folder.files.map((file) => (
                        <FileItemComponent key={file.id} file={file} onSelect={onFileSelect} onDelete={onDelete} depth={depth + 1} canEdit={canEdit} />
                    ))}
                    {creatingItem && creatingItem.parentId === folder.id && (
                        <CreateInput
                            type={creatingItem.type}
                            onConfirm={(name) => onCreateItem(name, creatingItem.type, folder.id)}
                            onCancel={onCancelCreate}
                            depth={depth + 1}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const FileExplorer = ({ projectId, onFileSelect, refreshKey, canEdit, onClose }) => {
    const [fileTree, setFileTree] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [creatingItem, setCreatingItem] = useState(null);
    const fetchFileTree = useCallback(() => {
        if (projectId) {
            axiosInstance.get(`/api/projects/${projectId}/files/`)
                .then(res => {
                    setFileTree(res.data);
                    if (res.data.length > 0 && selectedFolderId === null) {
                        const rootFolderId = res.data[0].id;
                        setSelectedFolderId(rootFolderId);
                        setExpandedFolders(prev => new Set(prev).add(rootFolderId));
                    }
                }).catch(err => console.error("Failed to fetch file tree", err));
        }
    }, [projectId, selectedFolderId]);
    useEffect(() => {
        fetchFileTree();
    }, [fetchFileTree, refreshKey]);
    const handleToggleFolder = (folderId) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
            return newSet;
        });
    };
    const handleCreateItem = async (name, type, parentId) => {
        const isFile = type === 'file';
        if (isFile && !parentId) {
            alert("Please select a folder to create the file in.");
            setCreatingItem(null);
            return;
        }
        const endpoint = isFile ? '/api/files/create/' : '/api/folders/create/';
        const payload = { name, project: projectId };
        if (isFile) { payload.folder = parentId; }
        else { payload.parent = parentId; }
        try {
            await axiosInstance.post(endpoint, payload);
            fetchFileTree();
        } catch (err) {
            console.error(`Failed to create ${type}:`, err);
        } finally {
            setCreatingItem(null);
        }
    };
    const handleDeleteItem = async (type, id) => {
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            const endpoint = type === 'file' ? `/api/files/${id}/` : `/api/folders/${id}/`;
            try {
                await axiosInstance.delete(endpoint);
                fetchFileTree();
            } catch (error) {
                console.error(`Failed to delete ${type}:`, error);
            }
        }
    };
    return (
        <aside className="w-full bg-[#09090b] text-gray-400 font-sans flex flex-col h-full border-r border-[#27272a]">
            <div className="flex items-center justify-between px-4 h-10 border-b border-[#27272a] bg-[#09090b] flex-shrink-0 select-none">
                <span className="text-xs font-bold tracking-wider uppercase text-white">Explorer</span>

                <div className="flex gap-1 items-center">
                    {canEdit && (
                        <>
                            <button
                                onClick={() => setCreatingItem({ parentId: selectedFolderId, type: 'file' })}
                                className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-white transition-colors"
                                title="New File"
                            >
                                <VscNewFile size={16} />
                            </button>
                            <button
                                onClick={() => setCreatingItem({ parentId: selectedFolderId, type: 'folder' })}
                                className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-white transition-colors"
                                title="New Folder"
                            >
                                <VscNewFolder size={16} />
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-[#27272a] rounded text-gray-400 md:hidden ml-2">
                            <VscClose size={18} />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                {fileTree.map((folder) => {
                    if (!folder) return null;
                    return (
                        <FolderItemComponent
                            key={folder.id}
                            folder={folder}
                            depth={0}
                            onFileSelect={onFileSelect}
                            onFolderSelect={setSelectedFolderId}
                            selectedFolderId={selectedFolderId}
                            expandedFolders={expandedFolders}
                            onToggleFolder={handleToggleFolder}
                            creatingItem={creatingItem}
                            onCreateItem={handleCreateItem}
                            onCancelCreate={() => setCreatingItem(null)}
                            onDelete={handleDeleteItem}
                            canEdit={canEdit}
                        />
                    );
                })}
                {creatingItem && creatingItem.parentId === null && (
                    <CreateInput
                        type={creatingItem.type}
                        onConfirm={(name) => handleCreateItem(name, creatingItem.type, null)}
                        onCancel={() => setCreatingItem(null)}
                        depth={0}
                    />
                )}
            </div>
        </aside>
    );
};

export default FileExplorer;