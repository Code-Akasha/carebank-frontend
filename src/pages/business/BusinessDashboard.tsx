import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Package, FileText, TrendingUp, IndianRupee } from 'lucide-react';

interface BillSummary {
    id: number;
    target_user_id: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
}

interface PlanSummary {
    id: number;
    plan_name: string;
    unit_label: string;
    unit_price: number;
}

export default function BusinessDashboard() {
    const [bills, setBills] = useState<BillSummary[]>([]);
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [billsRes, plansRes] = await Promise.all([
                    api.get('/api/bills/issued'),
                    api.get('/api/service-plans'),
                ]);
                setBills(Array.isArray(billsRes.data) ? billsRes.data : []);
                setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
            } catch {
                // Silently handle for now
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenue = bills
        .filter((b) => b.status === 'paid')
        .reduce((sum, b) => sum + b.amount, 0);
    const pendingBills = bills.filter((b) => b.status === 'pending').length;

    const stats = [
        { label: 'Service Plans', value: plans.length, icon: Package, color: 'bg-blue-100 text-blue-600' },
        { label: 'Total Bills Issued', value: bills.length, icon: FileText, color: 'bg-amber-100 text-amber-600' },
        { label: 'Pending', value: pendingBills, icon: TrendingUp, color: 'bg-rose-100 text-rose-600' },
        { label: 'Revenue Collected', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-emerald-100 text-emerald-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Business Dashboard</h1>
                <p className="text-slate-500 mt-1">Manage your service plans and bills</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Bills */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Bills</h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {bills.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-400">
                            No bills issued yet. Create a service plan first, then issue bills.
                        </div>
                    ) : (
                        bills.slice(0, 10).map((bill) => (
                            <div key={bill.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">{bill.plan_name}</div>
                                    <div className="text-sm text-slate-500">To: {bill.target_user_id}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-semibold text-slate-900">₹{bill.amount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                        bill.status === 'paid'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : bill.status === 'pending'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {bill.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
