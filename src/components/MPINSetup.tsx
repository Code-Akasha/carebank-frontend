import React, { useState } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { api } from '../lib/api';

interface MPINSetupProps {
    onComplete: () => void;
}

export const MPINSetup: React.FC<MPINSetupProps> = ({ onComplete }) => {
    const [mpin, setMpin] = useState('');
    const [confirmMpin, setConfirmMpin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetMpin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!mpin || !confirmMpin) {
            setError('Both MPIN fields are required.');
            return;
        }

        if (mpin.length !== 4 || !/^\d{4}$/.test(mpin)) {
            setError('MPIN must be exactly 4 digits.');
            return;
        }

        if (mpin !== confirmMpin) {
            setError('MPIN confirmation does not match.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/auth/mpin/set', {
                mpin,
                confirm_mpin: confirmMpin,
            });
            onComplete();
        } catch (err) {
            const typedError = err as { response?: { data?: { detail?: string } } };
            setError(typedError.response?.data?.detail || 'Failed to set MPIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">Set up your MPIN</h2>
                <p className="mb-6 text-center text-sm text-slate-600">
                    This 4-digit code protects sensitive actions and approvals.
                </p>

                <form onSubmit={handleSetMpin} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            MPIN (4 digits)
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={mpin}
                            onChange={(event) => setMpin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-widest focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Confirm MPIN
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={confirmMpin}
                            onChange={(event) => setConfirmMpin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-widest focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="rounded-xl bg-blue-50 p-4 text-xs text-blue-900">
                        <p className="mb-2 text-sm font-semibold">Security tips</p>
                        <ul className="space-y-1">
                            <li>Avoid simple sequences like 1234 or 0000.</li>
                            <li>Never share your MPIN.</li>
                            <li>We cannot recover lost MPINs.</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            'Continue to dashboard'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
