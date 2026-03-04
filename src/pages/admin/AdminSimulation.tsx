import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PlayCircle, StopCircle, Zap, RefreshCw, Send } from 'lucide-react';

interface SimulationStatus {
    enabled: boolean;
    interval?: number;
}

interface User {
    user_id: string;
    email: string;
    full_name: string;
}

export default function AdminSimulation() {
    const [status, setStatus] = useState<SimulationStatus>({ enabled: false });
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    // Scenario triggering state
    const [selectedUser, setSelectedUser] = useState('');
    const [scenarioType, setScenarioType] = useState('large_medical_expense');
    const [triggering, setTriggering] = useState(false);
    const [triggerResult, setTriggerResult] = useState<{ success?: boolean, message?: string } | null>(null);

    useEffect(() => {
        fetchStatus();
        fetchUsers();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await api.get('/api/admin/simulation/status');
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to load simulation status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/admin/users?per_page=50');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleToggle = async () => {
        try {
            setToggling(true);
            await api.post('/api/admin/simulation/toggle', { enabled: !status.enabled });
            await fetchStatus();
        } catch (error) {
            console.error('Failed to toggle simulation:', error);
        } finally {
            setToggling(false);
        }
    };

    const handleTriggerScenario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setTriggering(true);
            setTriggerResult(null);
            await api.post('/api/admin/scenario', {
                user_id: selectedUser,
                scenario_type: scenarioType
            });
            setTriggerResult({ success: true, message: 'Scenario triggered successfully!' });
        } catch (error: unknown) {
            const _error = error as { response?: { data?: { detail?: string } } };
            setTriggerResult({
                success: false,
                message: _error.response?.data?.detail || 'Failed to trigger scenario'
            });
        } finally {
            setTriggering(false);
            setTimeout(() => setTriggerResult(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Simulation Engine</h2>
                <p className="text-slate-500 text-sm mt-1">Control background data generation and trigger specific user scenarios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Master Switch */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-slate-500" />
                            Master Control
                        </h3>
                    </div>
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-colors ${status.enabled ? 'bg-green-100' : 'bg-slate-100'}`}>
                            {status.enabled ? (
                                <PlayCircle className="w-16 h-16 text-green-600" />
                            ) : (
                                <StopCircle className="w-16 h-16 text-slate-400" />
                            )}
                        </div>

                        <h4 className="text-xl font-bold mb-2">
                            Auto-Simulation is <span className={status.enabled ? 'text-green-600' : 'text-slate-500'}>{status.enabled ? 'ACTIVE' : 'STOPPED'}</span>
                        </h4>
                        <p className="text-slate-500 text-sm mb-8">
                            {status.enabled
                                ? 'The background engine is generating transaction data for all active users.'
                                : 'Background data generation is currently paused.'}
                        </p>

                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`w-full max-w-xs py-3 px-6 rounded-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${status.enabled
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-red-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900'
                                } disabled:opacity-50 flex items-center justify-center`}
                        >
                            {toggling ? <RefreshCw className="w-5 h-5 animate-spin" /> : (status.enabled ? 'Stop Simulation' : 'Start Simulation')}
                        </button>
                    </div>
                </div>

                {/* Manual Scenario Trigger */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            <Send className="w-5 h-5 mr-2 text-slate-500" />
                            Trigger Scenario
                        </h3>
                    </div>
                    <div className="p-6 flex-1">
                        <form onSubmit={handleTriggerScenario} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Target User</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="" disabled>Select a user...</option>
                                    {users.map((user) => (
                                        <option key={user.user_id} value={user.user_id}>
                                            {user.full_name} ({user.email}) - {user.user_id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Scenario Type</label>
                                <div className="space-y-3">
                                    <label className="flex items-center p-3 border border-slate-200 rounded-sm cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            name="scenario"
                                            value="large_medical_expense"
                                            checked={scenarioType === 'large_medical_expense'}
                                            onChange={() => setScenarioType('large_medical_expense')}
                                            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-slate-900">Unexpected Large Expense</span>
                                            <span className="block text-xs text-slate-500">Injects a localized high-value transaction (e.g. Medical, Repair)</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border border-slate-200 rounded-sm cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            name="scenario"
                                            value="salary_credit"
                                            checked={scenarioType === 'salary_credit'}
                                            onChange={() => setScenarioType('salary_credit')}
                                            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-slate-900">Salary Deposit</span>
                                            <span className="block text-xs text-slate-500">Injects regular income to reset balance and test surplus logic</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {triggerResult && (
                                <div className={`p-4 rounded-sm text-sm font-medium ${triggerResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                    {triggerResult.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={triggering || !selectedUser}
                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {triggering ? 'Triggering...' : 'Fire Scenario'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
