import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Send, FileText } from 'lucide-react';

interface ServicePlan { id: number; plan_name: string; unit_label: string; unit_price: number; }
interface IssuedBill { id: number; target_user_id: string; plan_name: string; quantity: number; amount: number; status: string; due_date: string | null; created_at: string; }

export default function IssueBills() {
    const [plans, setPlans] = useState<ServicePlan[]>([]);
    const [bills, setBills] = useState<IssuedBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ target_user_id: '', service_plan_id: '', quantity: '1', description: '', due_date: '' });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const [p, b] = await Promise.all([api.get('/api/service-plans'), api.get('/api/bills/issued')]);
            setPlans(Array.isArray(p.data) ? p.data : []);
            setBills(Array.isArray(b.data) ? b.data : []);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const selectedPlan = plans.find(p => p.id === Number(form.service_plan_id));
    const calcAmount = selectedPlan ? selectedPlan.unit_price * Number(form.quantity || 0) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSending(true);
        try {
            const payload: Record<string, string | number> = { target_user_id: form.target_user_id, quantity: parseFloat(form.quantity) };
            if (form.service_plan_id) payload.service_plan_id = Number(form.service_plan_id);
            if (form.description) payload.description = form.description;
            if (form.due_date) payload.due_date = form.due_date;
            const res = await api.post('/api/bills', payload);
            setSuccess(`Bill #${res.data.id} issued for ₹${res.data.amount.toLocaleString('en-IN')}`);
            setForm({ target_user_id: '', service_plan_id: '', quantity: '1', description: '', due_date: '' });
            await fetchData();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr.response?.data?.detail || 'Failed to issue bill');
        } finally { setSending(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-slate-900">Issue Bills</h1><p className="text-slate-500 mt-1">Send bills to users for services consumed</p></div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Target User ID</label><input type="text" value={form.target_user_id} onChange={e => setForm({...form, target_user_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500" placeholder="user_abc123" required /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Service Plan</label>
                            <select value={form.service_plan_id} onChange={e => setForm({...form, service_plan_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500" required>
                                <option value="">Select a plan</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.plan_name} — ₹{p.unit_price}/{p.unit_label}</option>)}
                            </select>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label><input type="number" step="0.01" min="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500" required /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 3x LPG Cylinders delivered May 2026" /></div>

                    {selectedPlan && <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium">Estimated Amount: ₹{calcAmount.toLocaleString('en-IN')} ({form.quantity} × ₹{selectedPlan.unit_price})</div>}
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
                    {success && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm">{success}</div>}

                    <button type="submit" disabled={sending} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"><Send className="w-4 h-4" />{sending ? 'Sending...' : 'Issue Bill'}</button>
                </form>
            </div>

            {/* Issued Bills History */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-semibold text-slate-900">Issued Bills</h2></div>
                <div className="divide-y divide-slate-50">
                    {bills.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-400"><FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />No bills issued yet.</div>
                    ) : bills.map(bill => (
                        <div key={bill.id} className="px-6 py-4 flex items-center justify-between">
                            <div><div className="font-medium text-slate-900">{bill.plan_name}</div><div className="text-sm text-slate-500">To: {bill.target_user_id} • Qty: {bill.quantity}</div></div>
                            <div className="flex items-center gap-4">
                                <div className="font-semibold text-slate-900">₹{bill.amount.toLocaleString('en-IN')}</div>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : bill.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{bill.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
