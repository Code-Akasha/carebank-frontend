import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Receipt, IndianRupee, CheckCircle } from 'lucide-react';

interface ReceivedBill {
    id: number;
    business_name: string | null;
    plan_name: string;
    quantity: number;
    amount: number;
    status: string;
    due_date: string | null;
    created_at: string;
    paid_at: string | null;
}

export default function BillsReceived() {
    const [bills, setBills] = useState<ReceivedBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingBillId, setPayingBillId] = useState<number | null>(null);
    const [mpin, setMpin] = useState('');
    const [showMpinModal, setShowMpinModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<ReceivedBill | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchBills = async () => {
        try {
            const res = await api.get('/api/bills/received');
            setBills(Array.isArray(res.data) ? res.data : []);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchBills(); }, []);

    const handlePayClick = (bill: ReceivedBill) => {
        setSelectedBill(bill);
        setMpin('');
        setError('');
        setShowMpinModal(true);
    };

    const handlePay = async () => {
        if (!selectedBill || mpin.length < 4) return;
        setPayingBillId(selectedBill.id);
        setError('');
        try {
            await api.post(`/api/bills/${selectedBill.id}/pay`, { mpin, payment_method: 'upi' });
            setSuccess(`Bill #${selectedBill.id} paid successfully!`);
            setShowMpinModal(false);
            setSelectedBill(null);
            await fetchBills();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } }; setError(axiosErr.response?.data?.detail || 'Payment failed');
        } finally { setPayingBillId(null); }
    };

    const pending = bills.filter(b => b.status === 'pending');
    const paid = bills.filter(b => b.status === 'paid');

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-slate-900">My Bills</h1><p className="text-slate-500 mt-1">Bills from service providers</p></div>

            {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-2"><CheckCircle className="w-5 h-5" />{success}</div>}

            {/* Pending */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-semibold text-slate-900">Pending ({pending.length})</h2></div>
                <div className="divide-y divide-slate-50">
                    {pending.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-400">No pending bills</div>
                    ) : pending.map(bill => (
                        <div key={bill.id} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Receipt className="w-5 h-5 text-amber-600" /></div>
                                <div>
                                    <div className="font-medium text-slate-900">{bill.plan_name}</div>
                                    <div className="text-sm text-slate-500">{bill.business_name || 'Unknown'} • Qty: {bill.quantity}</div>
                                    {bill.due_date && <div className="text-xs text-slate-400">Due: {new Date(bill.due_date).toLocaleDateString()}</div>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-lg font-bold text-slate-900">₹{bill.amount.toLocaleString('en-IN')}</div>
                                <button onClick={() => handlePayClick(bill)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Pay Now</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Paid */}
            {paid.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100"><h2 className="text-lg font-semibold text-slate-900">Paid ({paid.length})</h2></div>
                    <div className="divide-y divide-slate-50">
                        {paid.map(bill => (
                            <div key={bill.id} className="px-6 py-4 flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                                    <div><div className="font-medium text-slate-900">{bill.plan_name}</div><div className="text-sm text-slate-500">{bill.business_name || 'Unknown'}</div></div>
                                </div>
                                <div className="text-right"><div className="font-semibold text-slate-900">₹{bill.amount.toLocaleString('en-IN')}</div>{bill.paid_at && <div className="text-xs text-slate-400">Paid {new Date(bill.paid_at).toLocaleDateString()}</div>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MPIN Payment Modal */}
            {showMpinModal && selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Payment</h3>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                            <div className="text-sm text-slate-500">{selectedBill.business_name}</div>
                            <div className="font-medium text-slate-900">{selectedBill.plan_name}</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">₹{selectedBill.amount.toLocaleString('en-IN')}</div>
                        </div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Enter MPIN</label>
                        <input type="password" maxLength={6} value={mpin} onChange={e => setMpin(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.5em] font-mono" placeholder="••••" autoFocus />
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mt-3">{error}</div>}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowMpinModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
                            <button onClick={handlePay} disabled={mpin.length < 4 || payingBillId === selectedBill.id} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                <IndianRupee className="w-4 h-4" />{payingBillId === selectedBill.id ? 'Processing...' : 'Pay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
