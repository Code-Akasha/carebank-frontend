import { useState, useEffect } from 'react';
import { Activity, RefreshCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api';

interface DeadLetter {
    id: string;
    event_type: string;
    payload: any;
    failed_at: string;
    attempts: number;
    last_error: string;
}

export default function AdminWebhooks() {
    const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replaying, setReplaying] = useState<string | null>(null);

    const fetchDeadLetters = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/admin/webhooks/dead-letter');
            const records = Array.isArray(res.data)
                ? res.data
                : (res.data?.records || []);
            setDeadLetters(records);
        } catch (err: any) {
            setError(err.message || 'Failed to load dead letters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeadLetters();
    }, []);

    const handleReplay = async (id: string) => {
        setReplaying(id);
        try {
            await api.post(`/api/admin/webhooks/dead-letter/${id}/replay`);
            setDeadLetters(prev => prev.filter(dl => dl.id !== id));
        } catch (err) {
            alert('Failed to replay webhook');
        } finally {
            setReplaying(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading dead letters...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-600" />
                    Webhook Reconciliation
                </h1>
                <p className="text-sm text-slate-600 mt-1">Manage and replay failed webhook deliveries from MockBank.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        Dead Letter Queue
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                            {deadLetters.length}
                        </span>
                    </h2>
                    <button 
                        onClick={fetchDeadLetters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
                
                {deadLetters.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Queue is empty</h3>
                        <p className="text-slate-500 text-sm">All webhooks have been delivered successfully.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {deadLetters.map((dl) => (
                            <div key={dl.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                                {dl.event_type}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">
                                                ID: {dl.id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            {dl.last_error}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Failed: {new Date(dl.failed_at).toLocaleString()}
                                            </span>
                                            <span>Attempts: {dl.attempts}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleReplay(dl.id)}
                                        disabled={replaying === dl.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCcw className={`w-4 h-4 ${replaying === dl.id ? 'animate-spin' : ''}`} />
                                        {replaying === dl.id ? 'Replaying...' : 'Replay Event'}
                                    </button>
                                </div>
                                <div className="mt-4 bg-slate-900 rounded-lg p-4 overflow-x-auto">
                                    <pre className="text-xs text-green-400 font-mono">
                                        {JSON.stringify(dl.payload, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
