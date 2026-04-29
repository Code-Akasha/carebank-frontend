import { useEffect, useMemo, useState } from 'react';
import { Receipt, Calendar, CreditCard, ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { api } from '../lib/api';

interface BillCandidate {
    source_type: string;
    source_id: number;
    recurring_rule_id?: number | null;
    title: string;
    category?: string | null;
    amount?: number | null;
    due_date: string;
    action_type: string;
    metadata?: Record<string, unknown> | null;
}

interface BillItem {
    id: string;
    biller: string;
    amount: number;
    dueDate: string;
    status: 'upcoming' | 'paid' | 'overdue';
    category: string;
    autoPay: boolean;
}

export default function Bills() {
    const [bills, setBills] = useState<BillItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get('/api/bills/discover', {
                params: {
                    action_type: 'pay_bill',
                    limit: 12,
                }
            });
            const rawCandidates: BillCandidate[] = Array.isArray(res.data)
                ? res.data
                : (res.data?.candidates || []);

            const today = new Date();
            const mapped = rawCandidates.map((candidate) => {
                const dueDate = candidate.due_date || '';
                const dueDateValue = dueDate ? new Date(dueDate) : null;
                const isOverdue = dueDateValue ? dueDateValue < today : false;
                const category = (candidate.category || 'Utilities').toString();
                return {
                    id: `${candidate.source_type}:${candidate.source_id}`,
                    biller: candidate.title || 'Bill Payment',
                    amount: Number(candidate.amount || 0),
                    dueDate: dueDate,
                    status: isOverdue ? 'overdue' : 'upcoming',
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    autoPay: candidate.source_type === 'recurring_rule'
                } as BillItem;
            });

            setBills(mapped);
        } catch (err: any) {
            setError(err.message || 'Failed to load bill discovery data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const autoPayTotal = useMemo(() => {
        return bills.reduce((sum, bill) => sum + (bill.autoPay ? bill.amount : 0), 0);
    }, [bills]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bill Discovery</h1>
                    <p className="text-sm text-slate-600 mt-1">Manage and discover recurring payments.</p>
                </div>
                <button
                    onClick={fetchBills}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? 'Refreshing...' : 'Discover Bills'}</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Upcoming & Recent Bills
                    </h2>
                    
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading bills...</div>
                    ) : (
                        <div className="space-y-4">
                            {bills.map(bill => (
                            <div key={bill.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{bill.biller}</div>
                                        <div className="text-xs text-slate-500">
                                            Due: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'TBD'} • {bill.category}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(bill.amount)}</div>
                                    <div className="text-xs mt-1">
                                        {bill.status === 'paid' && <span className="text-green-600 font-medium">Paid</span>}
                                        {bill.status === 'upcoming' && <span className="text-amber-600 font-medium">Upcoming</span>}
                                        {bill.status === 'overdue' && <span className="text-red-600 font-medium">Overdue</span>}
                                    </div>
                                </div>
                            </div>
                            ))}
                            {bills.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No upcoming bills found yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard className="w-24 h-24" />
                        </div>
                        <h3 className="font-medium text-indigo-100 mb-1">Auto-Pay Active</h3>
                        <div className="text-3xl font-bold mb-4">{formatCurrency(autoPayTotal)}</div>
                        <p className="text-sm text-indigo-100/80 mb-6">Estimated upcoming auto-debits for the next 30 days.</p>
                        <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
                            Manage Auto-Pay
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900">Did you know?</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            CareBank can automatically discover your bills using your phone number via the BBPS network. Connect your accounts to never miss a payment.
                        </p>
                        <button className="mt-4 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
