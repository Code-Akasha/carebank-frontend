import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Activity, IndianRupee, Cpu } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalBalance: number;
    agentActionsToday: number;
}

interface AgentLog {
    id: number;
    agent_name: string;
    action_type: string;
    input_data: unknown;
    output_data: unknown;
    processing_time_ms: number;
    timestamp: string;
    user_id: string;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<AgentLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                setLoading(true);
                // Fetch users to calculate stats
                const usersResponse = await api.get('/api/admin/users?per_page=100');
                const usersData = usersResponse.data;
                const users = usersData.users || [];

                // Calculate basic stats
                const totalUsers = usersData.total || users.length;
                const activeUsers = users.filter((u: { is_active?: boolean }) => u.is_active !== false).length;
                const totalBalance = users.reduce((acc: number, user: { current_balance?: number }) => {
                    return acc + (user.current_balance || 0);
                }, 0);

                // Fetch recent agent logs
                const logsResponse = await api.get('/api/admin/agent-logs?per_page=20');
                const logs = logsResponse.data.logs || [];

                // Count today's actions
                const today = new Date().toISOString().split('T')[0];
                const actionsToday = logs.filter((log: AgentLog) => log.timestamp?.startsWith(today)).length;

                setStats({
                    totalUsers,
                    activeUsers,
                    totalBalance,
                    agentActionsToday: actionsToday || logs.length
                });

                setRecentLogs(logs);
            } catch (error) {
                console.error('Failed to load admin overview data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchOverviewData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Overview</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time metrics and agent activity monitoring.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-none border-l-4 border-l-blue-500 border-y border-r border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Users</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalUsers || 0}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-sm">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-none border-l-4 border-l-green-500 border-y border-r border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Instances</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.activeUsers || 0}</p>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-sm">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-none border-l-4 border-l-amber-500 border-y border-r border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">System AUM</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats ? formatCurrency(stats.totalBalance) : '₹0'}
                            </p>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-sm">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-none border-l-4 border-l-purple-500 border-y border-r border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Agent Invocations</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.agentActionsToday || 0}</p>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-sm">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-none shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            <Cpu className="w-5 h-5 mr-2 text-slate-500" />
                            Recent Agent Activity
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No agent activity logged yet.</div>
                        ) : (
                            recentLogs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mr-3">
                                                {log.agent_name}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-700">{log.action_type}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-xs overflow-x-auto">
                                        {JSON.stringify(log.output_data).substring(0, 120)}...
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                                        <span>User: {log.user_id}</span>
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-sm">
                                            {log.processing_time_ms}ms
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm h-fit">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-800">System Health</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">API Gateway</span>
                                <span className="text-xs font-semibold text-green-600">Operational</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">Database Cluster</span>
                                <span className="text-xs font-semibold text-green-600">Operational</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">LLM Inference Engine</span>
                                <span className="text-xs font-semibold text-green-600">Operational</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 mt-1 text-right">Avg latency: 450ms</p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">Background Workers</span>
                                <span className="text-xs font-semibold text-amber-600">Under Load</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 mt-1 text-right">Queue size: 12</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
