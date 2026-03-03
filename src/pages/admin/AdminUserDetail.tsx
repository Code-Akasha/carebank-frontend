import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, User, CreditCard, Activity, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface Account {
    id: number;
    balance: number;
    type: string;
    account_number: string;
}

interface Transaction {
    id: number;
    amount: number;
    type: string;
    description: string;
    timestamp: string;
}

interface AgentLog {
    id: number;
    agent_name: string;
    action_type: string;
    processing_time_ms: number;
    timestamp: string;
    output_data?: {
        response?: string;
        action?: string;
    };
}

interface UserProfile {
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    health_score?: number;
}

export default function AdminUserDetail() {
    const { userId } = useParams<{ userId: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                // We assume /api/admin/users/{userId} returns the full profile
                const userRes = await api.get(`/api/admin/users/${userId}`);
                setUser(userRes.data);
                setAccounts(userRes.data.accounts || []);
                setTransactions(userRes.data.recent_transactions || []);

                // Also fetch agent logs specifically for this user
                try {
                    const logsRes = await api.get(`/api/admin/agent-logs/${userId}`);
                    setAgentLogs(logsRes.data.logs || []);
                } catch (e) {
                    console.error("Could not load agent logs for user", e);
                }
            } catch (error) {
                console.error('Failed to load user details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500">User not found</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
                <Link to="/admin/users" className="p-2 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{user.full_name}</h2>
                    <p className="text-slate-500 font-mono text-sm mt-1">{user.user_id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Summary */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900">{user.email}</div>
                            <div className="text-sm border inline-block px-2 py-0.5 rounded-sm border-slate-200 bg-slate-50 mt-1">
                                Role: {user.role}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Joined</span>
                            <span className="text-sm font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Status</span>
                            <span className="text-sm font-medium text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 border border-blue-100 rounded-sm">
                            <span className="text-sm font-semibold text-blue-900">Health Score</span>
                            <span className="text-lg font-bold text-blue-600">{user.health_score || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Accounts List */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-none shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                        <h3 className="font-semibold text-slate-800 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-slate-500" />
                            Connected Accounts
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                        {accounts.map(acc => (
                            <div key={acc.id} className="border border-slate-200 p-4 rounded-sm hover:border-blue-300 transition-colors bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-1 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-700 rounded-sm">
                                        {acc.type}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">{acc.account_number}</span>
                                </div>
                                <div className="mt-4">
                                    <div className="text-sm text-slate-500">Current Balance</div>
                                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</div>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-slate-500 flex flex-col items-center">
                                <CreditCard className="w-12 h-12 text-slate-300 mb-2" />
                                <p>No accounts found for this user.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm flex flex-col h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                        <h3 className="font-semibold text-slate-800 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-slate-500" />
                            Recent Transactions
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No transactions recorded.</div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {tx.type === 'deposit' ? '+' : '-'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{tx.description}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-slate-900'}`}>
                                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Agent Interactions */}
                <div className="bg-slate-900 border border-slate-800 rounded-none shadow-sm flex flex-col h-[400px]">
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-blue-400" />
                            Agent Coordination Trace
                        </h3>
                        <span className="text-xs text-slate-400">{agentLogs.length} events logged</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 relative">
                        <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-800"></div>
                        {agentLogs.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">No agent actions recorded for this user.</div>
                        ) : (
                            <div className="space-y-6">
                                {agentLogs.map((log) => (
                                    <div key={log.id} className="relative flex items-start pl-8 group">
                                        <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 group-hover:scale-125 transition-transform"></div>
                                        <div className="bg-slate-800 border border-slate-700 p-3 rounded-sm w-full hover:border-slate-600 transition-colors">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{log.agent_name}</span>
                                                <span className="text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()} ({log.processing_time_ms}ms)</span>
                                            </div>
                                            <div className="text-sm text-slate-200 font-semibold mb-2">{log.action_type}</div>

                                            {/* Summary of output if text based */}
                                            {log.output_data?.response && (
                                                <div className="text-xs bg-slate-900 p-2 rounded text-slate-300 border-l-2 border-l-blue-500 italic">
                                                    "{log.output_data.response}"
                                                </div>
                                            )}
                                            {log.output_data?.action && (
                                                <div className="text-xs bg-slate-900 p-2 rounded text-amber-200 border border-amber-900 mt-2 font-mono">
                                                    EXEC: {log.output_data.action}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
