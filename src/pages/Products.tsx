import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ShieldCheck, TrendingUp, PiggyBank, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Product {
    id: number;
    name: string;
    type: string;
    description: string;
    interest_rate: number;
    min_balance_required: number;
    eligibility_rules: Record<string, number>;
    provider_id: string;
}

interface Balance {
    current_balance: number;
}

const PRODUCT_ICONS: Record<string, React.ElementType> = {
    savings_plan: PiggyBank,
    loan: TrendingUp,
    fixed_deposit: ShieldCheck,
    credit_card: CreditCard,
};

const PRODUCT_COLORS: Record<string, string> = {
    savings_plan: "from-emerald-500 to-teal-600",
    loan: "from-blue-500 to-indigo-600",
    fixed_deposit: "from-amber-500 to-orange-600",
    credit_card: "from-slate-600 to-slate-800",
};

const TYPE_LABELS: Record<string, string> = {
    savings_plan: "Savings Plan",
    loan: "Personal Loan",
    fixed_deposit: "Fixed Deposit",
    credit_card: "Credit Card",
};

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [balance, setBalance] = useState<Balance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, balanceRes] = await Promise.all([
                    api.get("/api/products/"),
                    api.get("/api/balances/"),
                ]);
                setProducts(productsRes.data);
                setBalance(balanceRes.data);
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isEligible = (product: Product): boolean => {
        if (!balance) return false;
        const minBal = product.eligibility_rules?.min_balance ?? product.min_balance_required ?? 0;
        return balance.current_balance >= minBal;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Products</h1>
                <p className="text-slate-500 mt-1">Curated opportunities matched to your financial profile.</p>
            </div>

            {balance && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-800">
                        Eligibility is calculated based on your current balance of{" "}
                        <span className="font-bold">₹{balance.current_balance.toLocaleString('en-IN')}</span>
                    </span>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                    const eligible = isEligible(product);
                    const Icon = PRODUCT_ICONS[product.type] || ShieldCheck;
                    const gradient = PRODUCT_COLORS[product.type] || "from-slate-500 to-slate-700";

                    return (
                        <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            {/* Header gradient */}
                            <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
                                <div className="flex items-start justify-between">
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        {TYPE_LABELS[product.type] || product.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mt-4">{product.name}</h3>
                                <p className="text-white/80 text-sm mt-1 line-clamp-2">{product.description}</p>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Interest Rate</span>
                                    <span className="font-bold text-slate-900">{product.interest_rate}% p.a.</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Min. Balance</span>
                                    <span className="font-semibold text-slate-700">
                                        ₹{product.min_balance_required.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${eligible
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                    {eligible
                                        ? <><CheckCircle className="w-4 h-4" /> You're eligible!</>
                                        : <><XCircle className="w-4 h-4" /> Balance too low</>
                                    }
                                </div>
                            </div>

                            <div className="px-5 pb-5">
                                <button
                                    disabled={!eligible}
                                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${eligible
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {eligible ? "Apply Now" : "Not Eligible"}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {products.length === 0 && (
                    <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No products available</h3>
                        <p className="text-slate-500 mt-1">Check back later for curated financial products.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
