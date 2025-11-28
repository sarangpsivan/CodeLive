import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { VscBell, VscCheck, VscTrash, VscWarning } from 'react-icons/vsc';

const AlertsPanel = ({ projectId, canEdit, refreshKey }) => {
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
        <div className="w-full bg-black border-l border-gray-800 flex flex-col h-full font-sans text-white">
            
            <div className="h-14 px-4 border-b border-gray-800 flex items-center gap-2 bg-[#1F242A] flex-shrink-0">
                <VscBell className="text-[var(--primary-purple)]" size={20} />
                <h2 className="font-bold text-sm">Project Alerts</h2>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-hide">
                {alerts.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center mt-10">No active alerts.</p>
                ) : (
                    alerts.map(alert => (
                        <div 
                            key={alert.id} 
                            className={`p-3 rounded-lg border ${alert.is_resolved ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${alert.is_resolved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                    <span className="text-xs font-bold text-gray-300">
                                        {alert.sender_name || 'Unknown'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(alert.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                            
                            <p className={`text-sm mb-3 ${alert.is_resolved ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {alert.message}
                            </p>

                            {canEdit && (
                                <div className="flex justify-end gap-2 border-t border-white/10 pt-2">
                                    <button 
                                        onClick={() => handleResolveAlert(alert.id, alert.is_resolved)}
                                        className={`p-1.5 rounded hover:bg-white/10 transition ${alert.is_resolved ? 'text-yellow-400' : 'text-green-400'}`}
                                        title={alert.is_resolved ? "Mark Unresolved" : "Mark Resolved"}
                                    >
                                        {alert.is_resolved ? <VscWarning size={14} /> : <VscCheck size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteAlert(alert.id)}
                                        className="p-1.5 rounded hover:bg-white/10 text-red-400 transition"
                                        title="Delete Alert"
                                    >
                                        <VscTrash size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-gray-800 bg-[#1F242A] flex-shrink-0">
                <form onSubmit={handleCreateAlert} className="flex flex-col gap-2">
                    <textarea
                        value={newAlertMessage}
                        onChange={(e) => setNewAlertMessage(e.target.value)}
                        placeholder="Spot an issue? Raise an alert..."
                        className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary-purple)] text-sm border border-gray-700 resize-none h-20"
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
                        className="w-full bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Raise Alert'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AlertsPanel;