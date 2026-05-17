import { useState, useEffect } from 'react';
import { api } from '../lib/api';


export default function Settings() {
    const [mpinThreshold, setMpinThreshold] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/api/payment-settings/');
            setMpinThreshold(res.data.mpin_threshold);
        } catch {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await api.put('/api/payment-settings/', {
                mpin_threshold: mpinThreshold
            });
            alert('Settings saved successfully!');
        } catch {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Payment Settings</h1>
            
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Security Thresholds</h2>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        MPIN Threshold (₹)
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                        Payments above this amount will require your MPIN to confirm.
                    </p>
                    <input
                        type="number"
                        value={mpinThreshold}
                        onChange={(e) => setMpinThreshold(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
