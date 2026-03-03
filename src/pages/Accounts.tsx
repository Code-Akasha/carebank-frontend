import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { TransactionModal } from "../components/TransactionModal";
import { WalletCards, Plus, ArrowRightLeft, CreditCard, Landmark } from "lucide-react";

interface Account {
    account_id: string;
    account_number: string;
    account_type: "checking" | "savings" | "credit_card";
    name: string;
    current_balance: number;
    available_balance: number;
    status: string;
    mask: string;
    currency: string;
    institution: string;
}

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const fetchAccounts = async () => {
        try {
            const response = await api.get("/api/accounts/");
            setAccounts(response.data);
        } catch (err) {
            console.error("Failed to load accounts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'credit_card': return <CreditCard className="w-6 h-6 text-rose-600" />;
            case 'savings': return <Landmark className="w-6 h-6 text-emerald-600" />;
            default: return <WalletCards className="w-6 h-6 text-blue-600" />;
        }
    };

    const getAccountColor = (type: string) => {
        switch (type) {
            case 'credit_card': return 'bg-rose-50 border-rose-100';
            case 'savings': return 'bg-emerald-50 border-emerald-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Accounts</h1>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 hover:bg-slate-800 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Open Account</span>
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map(account => (
                    <div key={account.account_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className={`p-6 border-b flex-1 ${getAccountColor(account.account_type)}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-white p-3 rounded-xl shadow-sm">
                                    {getAccountIcon(account.account_type)}
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${account.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                    {account.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{account.name}</h3>
                            <p className="text-sm font-mono text-slate-500 mb-4">
                                {account.institution} • ****{account.mask || account.account_number?.slice(-4)}
                            </p>

                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Balance</p>
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                                    ₹ {account.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                {account.available_balance !== account.current_balance && (
                                    <p className="text-xs text-slate-500">
                                        Available: ₹ {account.available_balance.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-white grid grid-cols-2 gap-3">
                            <button className="col-span-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                                Details
                            </button>
                            <button
                                onClick={() => setSelectedAccountId(account.account_id)}
                                className="col-span-1 px-4 py-2 bg-blue-50 flex items-center justify-center space-x-2 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
                                disabled={account.status !== 'active' || account.account_type === 'credit_card'}
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                                <span>Transact</span>
                            </button>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <WalletCards className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No accounts found</h3>
                        <p className="text-slate-500 mt-1">You don't have any active bank accounts yet.</p>
                    </div>
                )}
            </div>

            <TransactionModal
                isOpen={!!selectedAccountId}
                onClose={() => setSelectedAccountId(null)}
                accountId={selectedAccountId || ''}
                onSuccess={() => {
                    fetchAccounts();
                }}
            />
        </div>
    );
}
