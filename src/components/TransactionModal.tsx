import { useState } from 'react';
import { api } from '../lib/api';
import { ArrowDownLeft, ArrowUpRight, X, Loader2 } from 'lucide-react';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Minimal validation
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        setLoading(true);

        const normalizedAmount = type === 'withdrawal' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
        const merchantLabel = type === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal';

        try {
            await api.post('/api/transactions/trigger', {
                amount: normalizedAmount,
                merchant: merchantLabel,
                category: 'manual',
                description: description || merchantLabel,
            });

            onSuccess();
            onClose();
        } catch (err) {
            const _err = err as { 
                response?: { 
                    data?: { 
                        detail?: string | object;
                        errors?: Array<{ msg: string }>;
                    } 
                } 
            };
            
            // Handle Pydantic validation errors
            if (_err.response?.data) {
                const data = _err.response.data;
                if (Array.isArray(data)) {
                    // Pydantic validation error format
                    const messages = data
                        .map((item: unknown) => {
                            if (
                                typeof item === 'object' &&
                                item !== null &&
                                'msg' in item &&
                                typeof (item as { msg?: unknown }).msg === 'string'
                            ) {
                                return (item as { msg: string }).msg;
                            }
                            return 'Invalid field';
                        })
                        .join(', ');
                    setError(messages);
                } else if (typeof data === 'object' && 'detail' in data) {
                    setError(typeof data.detail === 'string' ? data.detail : 'Transaction failed. Please try again.');
                } else {
                    setError(JSON.stringify(data).substring(0, 100) || 'Transaction failed. Please try again.');
                }
            } else {
                setError('Transaction failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => setType('deposit')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${type === 'deposit'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <div className={`p-2 rounded-full mb-2 ${type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                                <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">Deposit</span>
                        </button>

                        <button
                            onClick={() => setType('withdrawal')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${type === 'withdrawal'
                                ? 'border-orange-600 bg-orange-50 text-orange-700'
                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                }`}
                        >
                            <div className={`p-2 rounded-full mb-2 ${type === 'withdrawal' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100'}`}>
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">Withdrawal</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1000.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Salary, Rent, Groceries"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-colors flex items-center justify-center mt-2 ${type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                `Confirm ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
