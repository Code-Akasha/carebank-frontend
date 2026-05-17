import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Plus, Package, Pencil } from 'lucide-react';

interface ServicePlan {
    id: number;
    plan_name: string;
    unit_label: string;
    unit_price: number;
    currency: string;
    is_active: boolean;
}

export default function ServicePlans() {
    const [plans, setPlans] = useState<ServicePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
    const [formData, setFormData] = useState({ plan_name: '', unit_label: '', unit_price: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchPlans = async () => {
        try {
            const res = await api.get('/api/service-plans');
            setPlans(Array.isArray(res.data) ? res.data : []);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSaving(true);
        try {
            const payload = { plan_name: formData.plan_name, unit_label: formData.unit_label, unit_price: parseFloat(formData.unit_price) };
            if (editingPlan) await api.put(`/api/service-plans/${editingPlan.id}`, payload);
            else await api.post('/api/service-plans', payload);
            setShowForm(false); setEditingPlan(null);
            setFormData({ plan_name: '', unit_label: '', unit_price: '' });
            await fetchPlans();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr.response?.data?.detail || 'Failed to save plan');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900">Service Plans</h1><p className="text-slate-500 mt-1">Define pricing for your services</p></div>
                <button onClick={() => { setEditingPlan(null); setFormData({ plan_name: '', unit_label: '', unit_price: '' }); setShowForm(true); }} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"><Plus className="w-4 h-4" />New Plan</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label><input type="text" value={formData.plan_name} onChange={e => setFormData({...formData, plan_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g. LPG Cylinder (14.2 kg)" required /></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit Label</label><input type="text" value={formData.unit_label} onChange={e => setFormData({...formData, unit_label: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g. cylinder, unit, GB" required /></div>
                            <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (₹)</label><input type="number" step="0.01" min="0.01" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="888.00" required /></div>
                        </div>
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50">{saving ? 'Saving...' : editingPlan ? 'Update' : 'Create'}</button>
                            <button type="button" onClick={() => { setShowForm(false); setEditingPlan(null); }} className="text-slate-600 hover:text-slate-900 px-4 py-2.5">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {plans.length === 0 ? (
                    <div className="px-6 py-12 text-center"><Package className="w-12 h-12 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No plans yet. Create your first one above.</div></div>
                ) : plans.map(plan => (
                    <div key={plan.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Package className="w-5 h-5 text-emerald-600" /></div>
                            <div><div className="font-medium text-slate-900">{plan.plan_name}</div><div className="text-sm text-slate-500">per {plan.unit_label}</div></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-lg font-bold text-slate-900">₹{plan.unit_price.toLocaleString('en-IN')}</div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{plan.is_active ? 'Active' : 'Inactive'}</span>
                            <button onClick={() => { setEditingPlan(plan); setFormData({ plan_name: plan.plan_name, unit_label: plan.unit_label, unit_price: plan.unit_price.toString() }); setShowForm(true); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
