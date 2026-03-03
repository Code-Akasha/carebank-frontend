import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Terminal, Database, Clock, RefreshCw, Layers } from 'lucide-react';

interface AgentLog {
    id: number;
    session_id: string | null;
    user_id: string;
    user_message: string | null;
    intent: string | null;
    agent_used: string | null;
    agent_response: string | null;
    timestamp: string;
}

export default function AdminAgentMonitor() {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AgentLog | null>(null);
    const [activeTab, setActiveTab] = useState<'raw' | 'flow'>('raw');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/agent-logs?per_page=100');
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to load agent logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getAgentColor = (agentUsed: string | null) => {
        switch (agentUsed?.toLowerCase()) {
            case 'coordinator': return 'bg-slate-800 text-slate-100';
            case 'intelligence': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'communication': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'opportunity': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'autosavings': return 'bg-green-100 text-green-800 border-green-200';
            case 'compliance': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Agent Monitor</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time LLM inference logs and execution tracing.</p>
                </div>
                <div className="flex space-x-2">
                    <div className="bg-slate-100 p-1 rounded flex">
                        <button
                            onClick={() => setActiveTab('raw')}
                            className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === 'raw' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Terminal className="w-4 h-4 inline-block mr-1" /> Raw Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('flow')}
                            className={`px-4 py-1.5 text-sm font-medium rounded ${activeTab === 'flow' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="w-4 h-4 inline-block mr-1" /> Flow Viz
                        </button>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left pane: Log List */}
                <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center shrink-0">
                        <span className="text-sm font-semibold text-slate-700">Execution Trails</span>
                        <span className="text-xs text-slate-500">{logs.length} events found</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loading && logs.length === 0 ? (
                            <div className="p-8 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
                        ) : logs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No agent activity logged.</div>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedLog?.id === log.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded border ${getAgentColor(log.agent_used)}`}>
                                            {log.agent_used || 'system'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{log.intent || 'Agent Invoked'}</h4>
                                    <p className="text-xs text-slate-500 truncate mt-1">{log.user_message || ''}</p>
                                    <div className="flex justify-between items-center text-xs mt-2">
                                        <span className="text-slate-500 flex items-center font-mono">
                                            <UserCircle className="w-3 h-3 mr-1" /> {log.user_id?.substring(0, 12)}...
                                        </span>
                                        <span className="text-slate-400 flex items-center font-mono">
                                            <Clock className="w-3 h-3 mr-1" /> #{log.id}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right pane: Log Detail */}
                <div className="w-1/2 flex flex-col bg-slate-900 rounded-none shadow-sm overflow-hidden border border-slate-800">
                    {selectedLog ? (
                        <>
                            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 shrink-0 flex justify-between items-center">
                                <span className="text-sm font-mono text-slate-300 flex items-center">
                                    <Database className="w-4 h-4 mr-2 text-blue-400" />
                                    log_id: {selectedLog.id}
                                    {selectedLog.session_id && <span className="ml-2 text-slate-500 text-xs">session: {selectedLog.session_id.substring(0, 8)}...</span>}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                    {new Date(selectedLog.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">User Message</h5>
                                    <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-green-400 overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                                        {selectedLog.user_message || '(empty)'}
                                    </pre>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Agent Response</h5>
                                    <pre className="text-xs bg-slate-950 p-3 rounded font-mono text-blue-400 overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                                        {selectedLog.agent_response || '(empty)'}
                                    </pre>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Intent Detected</h5>
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded font-mono text-amber-400">
                                        {selectedLog.intent || 'unknown'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 flex-col">
                            <Terminal className="w-12 h-12 mb-4 opacity-50" />
                            <p>Select an execution trace to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React from 'react';

// Just for icon
function UserCircle(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
    );
}
