import React, { useState, useEffect, useCallback } from 'react';
import { 
    VscChevronRight, 
    VscChevronDown, 
    VscNewFile, 
    VscNewFolder, 
    VscTrash 
} from 'react-icons/vsc';
import { FileIcon, defaultStyles } from 'react-file-icon';
import axiosInstance from '../utils/axiosInstance';

// Helper function outside the components in FileExplorer.jsx
const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const iconSize = 14;

    return (
        <div style={{ width: iconSize, height: iconSize }} className="flex-shrink-0">
            <FileIcon 
                extension={extension} 
                {...defaultStyles[extension]}
                size={iconSize}
            />
        </div>
    );
};

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
                className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm"
                autoFocus
            />
        </div>
    );
};

const FileItemComponent = ({ file, onSelect, onDelete, depth }) => (
    <div 
        className="group flex items-center justify-between gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm rounded" 
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
        <div className="flex items-center gap-2 flex-grow min-w-0" onClick={() => onSelect(file.id)}>
            {getFileIcon(file.name)}
            <span className="truncate text-white">{file.name}</span>
        </div>
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete('file', file.id); }} 
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition" 
            title="Delete file"
        >
            <VscTrash size={12} />
        </button>
    </div>
);

const FolderItemComponent = ({ folder, depth, ...props }) => {
    const { onFileSelect, onFolderSelect, selectedFolderId, expandedFolders, onToggleFolder, creatingItem, onCreateItem, onCancelCreate, onDelete } = props;

    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    const handleFolderClick = (e) => {
        e.stopPropagation();
        onFolderSelect(folder.id);
    };

    return (
        <div>
            <div 
                className={`group flex items-center justify-between gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm rounded ${isSelected ? 'bg-blue-900/50' : ''}`} 
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                <div className="flex items-center gap-2 flex-grow min-w-0" onClick={() => onToggleFolder(folder.id)}>
                    {isExpanded ? <VscChevronDown size={10} /> : <VscChevronRight size={10} />}
                    <span className="truncate font-semibold text-white" onClick={handleFolderClick}>
                        {folder.name}
                    </span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete('folder', folder.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition" 
                    title="Delete folder"
                >
                    <VscTrash size={12} />
                </button>
            </div>

            {isExpanded && (
                <div>
                    {folder.subfolders.map((sub) => (
                        <FolderItemComponent key={sub.id} folder={sub} depth={depth + 1} {...props} />
                    ))}
                    {folder.files.map((file) => (
                        <FileItemComponent key={file.id} file={file} onSelect={onFileSelect} onDelete={onDelete} depth={depth + 1} />
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

const FileExplorer = ({ projectId, onFileSelect, refreshKey }) => {
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
            } catch (error) {
                console.error(`Failed to delete ${type}:`, error);
            }
        }
    };

    return (
        <aside className="w-full bg-dark-card text-white font-sans flex flex-col h-full">
            <div className="flex items-center justify-between px-2 pt-2">
                <h3 className="text-xs font-bold uppercase text-gray-400">EXPLORER</h3>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setCreatingItem({ parentId: selectedFolderId, type: 'file' })} 
                        className="p-1 hover:bg-gray-700 rounded text-gray-400" 
                        title="New File"
                    >
                        <VscNewFile size={14} />
                    </button>
                    <button 
                        onClick={() => setCreatingItem({ parentId: selectedFolderId, type: 'folder' })} 
                        className="p-1 hover:bg-gray-700 rounded text-gray-400" 
                        title="New Folder"
                    >
                        <VscNewFolder size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-2">
                {fileTree.map((folder) => (
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
                    />
                ))}

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