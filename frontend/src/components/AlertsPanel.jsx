import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { VscBell, VscCheck, VscTrash, VscWarning, VscClose } from 'react-icons/vsc';

const AlertsPanel = ({ projectId, canEdit, refreshKey, onClose }) => {
    const [alerts, setAlerts] = useState([]);
    const [newAlertMessage, setNewAlertMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        axiosInstance.get(`/api/projects/${projectId}/alerts/`)
            .then(res => setAlerts(res.data))
            .catch(err => console.error("Failed to fetch alerts", err));
    }, [projectId, refreshKey]);

    const handleCreateAlert = async (e) => {
        e.preventDefault();
        if (!newAlertMessage.trim()) return;

        setIsLoading(true);
        try {
            await axiosInstance.post(`/api/projects/${projectId}/alerts/`, {
                message: newAlertMessage
            });
            setNewAlertMessage('');
        } catch (error) {
            console.error("Failed to create alert:", error);
            alert("Failed to raise alert.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolveAlert = async (alertId, currentStatus) => {
        if (!canEdit) return;
        try {
            await axiosInstance.patch(`/api/alerts/${alertId}/`, {
                is_resolved: !currentStatus
            });
        } catch (error) {
            console.error("Failed to update alert:", error);
        }
    };

    const handleDeleteAlert = async (alertId) => {
        if (!canEdit) return;
        if (!window.confirm("Delete this alert?")) return;
        try {
            await axiosInstance.delete(`/api/alerts/${alertId}/`);
        } catch (error) {
            console.error("Failed to delete alert:", error);
        }
    };

    return (
        <div className="w-full bg-[#09090b] border-l border-[#27272a] flex flex-col h-full font-sans text-white">

            <div className="h-10 px-4 border-b border-[#27272a] flex items-center gap-2 bg-[#09090b] flex-shrink-0">
                <VscBell className="text-white" size={16} />
                <h2 className="font-bold text-xs uppercase tracking-wider text-white flex-grow">Project Alerts</h2>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-white md:hidden">
                        <VscClose size={16} />
                    </button>
                )}
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-hide">
                {alerts.length === 0 ? (
                    <p className="text-gray-600 text-xs text-center mt-10 italic">No active alerts.</p>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-3 rounded-md border transition-all ${alert.is_resolved
                                ? 'border-[#27272a] bg-transparent text-gray-500'
                                : 'border-red-900/30 bg-red-950/10'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${alert.is_resolved ? 'bg-green-500/50' : 'bg-red-500 animate-pulse'}`} />
                                    <span className="text-xs font-bold text-gray-400">
                                        {alert.sender_name || 'Unknown'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-600">
                                    {new Date(alert.created_at).toLocaleTimeString()}
                                </span>
                            </div>

                            <p className={`text-sm mb-3 leadin-relaxed ${alert.is_resolved ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                                {alert.message}
                            </p>

                            {canEdit && (
                                <div className="flex justify-end gap-2 border-t border-[#27272a] pt-2">
                                    <button
                                        onClick={() => handleResolveAlert(alert.id, alert.is_resolved)}
                                        className={`p-1 rounded hover:bg-[#27272a] transition ${alert.is_resolved ? 'text-yellow-600 hover:text-yellow-400' : 'text-green-600 hover:text-green-400'}`}
                                        title={alert.is_resolved ? "Mark Unresolved" : "Mark Resolved"}
                                    >
                                        {alert.is_resolved ? <VscWarning size={12} /> : <VscCheck size={12} />}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAlert(alert.id)}
                                        className="p-1 rounded hover:bg-[#27272a] text-red-800 hover:text-red-400 transition"
                                        title="Delete Alert"
                                    >
                                        <VscTrash size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-[#27272a] bg-[#09090b] flex-shrink-0">
                <form onSubmit={handleCreateAlert} className="flex flex-col gap-2">
                    <textarea
                        value={newAlertMessage}
                        onChange={(e) => setNewAlertMessage(e.target.value)}
                        placeholder="Spot an issue? Raise an alert..."
                        className="w-full bg-[#1c1c1c] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm border border-[#27272a] resize-none h-20 placeholder-gray-600 shadow-inner"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCreateAlert(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newAlertMessage.trim()}
                        className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-semibold py-2 rounded-md transition text-xs border border-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Raise Alert'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AlertsPanel;