import { useEffect, useState } from "react";
import { HealthScoreMeter } from "../components/HealthScoreMeter";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, ArrowDownLeft, Clock, Wallet } from "lucide-react";

interface Balance {
    current_balance: number;
    available_balance: number;
}

interface Transaction {
    id: number;
    amount: number;
    date: string;
    merchant: string;
    category: string;
    description: string;
}

function safeNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<Balance | null>(null);
    const [healthScore, setHealthScore] = useState<{ score: number; message: string } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [balRes, healthRes, txRes] = await Promise.all([
                    api.get("/api/balances/"),
                    api.get("/api/health-score/"),
                    api.get("/api/transactions/?limit=5"),
                ]);
                setBalance(balRes.data);
                setHealthScore(healthRes.data);
                setTransactions(txRes.data.transactions || []);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back, {user?.full_name.split(' ')[0]} 👋
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Balance Card */}
                <div className="bg-blue-600 rounded-2xl p-6 shadow-lg text-white col-span-1 lg:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 text-blue-100 mb-2">
                            <Wallet className="w-5 h-5" />
                            <h2 className="text-sm font-medium uppercase tracking-wider">Total Balance</h2>
                        </div>
                        <p className="text-4xl font-bold tracking-tight mb-2">
                            ₹ {safeNumber(balance?.available_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-blue-200 text-sm">
                            Current Balance: ₹ {safeNumber(balance?.current_balance).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {/* Health Score */}
                {healthScore && (
                    <div className="col-span-1">
                        <HealthScoreMeter
                            score={healthScore.score}
                            message={healthScore.message}
                        />
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount < 0 ? 'bg-orange-100' : 'bg-emerald-100'}`}>
                                    {tx.amount < 0 ? (
                                        <ArrowDownLeft className="w-5 h-5 text-orange-600" />
                                    ) : (
                                        <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{tx.merchant || tx.description || 'Transaction'}</p>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <p className="text-xs text-slate-500">
                                            {new Date(tx.date).toLocaleDateString('en-IN')}
                                        </p>
                                        {tx.category && (
                                            <span className="text-xs text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                                                {tx.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No recent transactions found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
