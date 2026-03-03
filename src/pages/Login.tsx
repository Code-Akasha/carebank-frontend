import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { access_token, user_id, role, full_name } = response.data;

            login(access_token, { user_id, email, role, full_name });

            // Redirect based on role logic
            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            const _err = err as { response?: { data?: { detail?: string } } };
            setError(_err.response?.data?.detail || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
                        Welcome to CareBank
                    </h2>
                    <p className="text-center text-slate-500 mb-8">
                        Please sign in to your account
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true' && (
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
                            For demo purposes, use <strong className="text-slate-700">user001@carebank.demo</strong> with <strong className="text-slate-700">CareBank001!</strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
