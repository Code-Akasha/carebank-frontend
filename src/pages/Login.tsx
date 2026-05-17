import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shield, UserRoundPlus } from 'lucide-react';
import { MPINSetup } from '../components/MPINSetup';

export default function Login() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMpinSetup, setShowMpinSetup] = useState(false);
    const [redirectRole, setRedirectRole] = useState('user');
    const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
    const [businessName, setBusinessName] = useState('');
    const [businessCategory, setBusinessCategory] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = mode === 'login'
                ? await api.post('/api/auth/login', { email, password })
                : await api.post('/api/auth/register', {
                    email,
                    password,
                    full_name: fullName.trim(),
                    account_type: accountType,
                    ...(accountType === 'business' ? {
                        business_name: businessName.trim(),
                        business_category: businessCategory.trim(),
                    } : {}),
                });
            const { access_token, user_id, role, full_name } = response.data;

            login(access_token, { user_id, email, role, full_name });
            setRedirectRole(role || 'user');

            if (mode === 'register') {
                setShowMpinSetup(true);
                return;
            }

            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else if (role === 'business') {
                navigate('/business', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            const _err = err as { response?: { data?: { detail?: string } }; code?: string; message?: string };
            if (_err.response?.data?.detail) {
                setError(_err.response.data.detail);
            } else if (err instanceof TypeError && _err.message?.includes('URL')) {
                setError('API configuration error. Please restart the development server.');
            } else if (_err.code === 'ERR_NETWORK' || _err.message?.includes('Network Error')) {
                setError('Cannot connect to backend server. Please ensure it is running on http://localhost:8000.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
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
                        {mode === 'login' ? 'Welcome to CareBank' : 'Create CareBank Account'}
                    </h2>
                    <p className="text-center text-slate-500 mb-8">
                        {mode === 'login' ? 'Please sign in to your account' : 'Register and start testing all integrated flows'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError('');
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('register');
                                setError('');
                            }}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <UserRoundPlus className="w-4 h-4" />
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={mode === 'register'}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Your name"
                                />
                            </div>
                        )}

                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                    <button type="button" onClick={() => setAccountType('personal')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${accountType === 'personal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personal</button>
                                    <button type="button" onClick={() => setAccountType('business')} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${accountType === 'business' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Business</button>
                                </div>
                            </div>
                        )}

                        {mode === 'register' && accountType === 'business' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="e.g. City Gas Supply" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Business Category</label>
                                    <select value={businessCategory} onChange={e => setBusinessCategory(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                                        <option value="">Select category</option>
                                        <option value="gas">Gas</option>
                                        <option value="electricity">Electricity</option>
                                        <option value="telecom">Telecom</option>
                                        <option value="housing">Housing / Rent</option>
                                        <option value="water">Water</option>
                                        <option value="internet">Internet</option>
                                        <option value="insurance">Insurance</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}

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
                                mode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                </div>
            </div>
            {showMpinSetup && (
                <MPINSetup
                    onComplete={() => {
                        setShowMpinSetup(false);
                        if (redirectRole === 'admin') {
                            navigate('/admin', { replace: true });
                        } else if (redirectRole === 'business') {
                            navigate('/business', { replace: true });
                        } else {
                            navigate(from, { replace: true });
                        }
                    }}
                />
            )}
        </div>
    );
}
