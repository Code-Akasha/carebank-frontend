import { useState } from "react";
import { api } from "../lib/api";
import {
    TrendingDown, TrendingUp, AlertTriangle, CheckCircle,
    Zap, ChevronRight, Loader2
} from "lucide-react";

interface SimulationResult {
    current_forecast: { end_of_month_balance: number; confidence: number };
    simulated_forecast: { predicted_balance: number };
    impact: {
        amount: number;
        retained_pct: number;
        retained_percentage: number;
        risk_level: "low" | "medium" | "high";
    };
    explanation: string;
    suggestions: { type: string; name: string; description: string }[];
}

const CATEGORIES = [
    { value: "food", label: "🍽️ Food & Dining" },
    { value: "entertainment", label: "🎬 Entertainment" },
    { value: "travel", label: "✈️ Travel" },
    { value: "shopping", label: "🛍️ Shopping" },
    { value: "health", label: "🏥 Health & Medical" },
    { value: "education", label: "📚 Education" },
    { value: "electronics", label: "💻 Electronics" },
    { value: "general", label: "📦 Other" },
];

const RISK_CONFIG = {
    low: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle, label: "Low Risk" },
    medium: { color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: AlertTriangle, label: "Medium Risk" },
    high: { color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: TrendingDown, label: "High Risk" },
};

export default function Simulator() {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("general");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSimulate = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        setError(null);
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post("/api/simulate", {
                expense_amount: Number(amount),
                category,
                description: description || `${category} expense`,
            });
            setResult(res.data);
        } catch (err) {
            setError("Simulation failed. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const risk = result ? RISK_CONFIG[result.impact.risk_level] : null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">What-If Simulator</h1>
                <p className="text-slate-500 mt-1">Predict the impact of a purchase on your finances before you spend.</p>
            </div>

            {/* Input Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Simulate a Purchase
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Flight to Goa"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                    <button
                        onClick={handleSimulate}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {loading ? "Simulating…" : "Run Simulation"}
                    </button>
                </div>
            </div>

            {/* Result */}
            {result && risk && (
                <div className="space-y-4">
                    {/* Risk Banner */}
                    <div className={`rounded-2xl border p-5 ${risk.bg} flex items-start gap-4`}>
                        <risk.icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${risk.color}`} />
                        <div>
                            <p className={`font-bold text-lg ${risk.color}`}>{risk.label}</p>
                            <p className="text-slate-700 mt-1">{result.explanation}</p>
                        </div>
                    </div>

                    {/* Forecast Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Current Forecast</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ₹{result.current_forecast.end_of_month_balance?.toLocaleString('en-IN') ?? '—'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Projected end-of-month</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">After Purchase</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                ₹{result.simulated_forecast.predicted_balance?.toLocaleString('en-IN')}
                            </p>
                            <p className={`text-sm font-semibold mt-1 ${result.impact.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {result.impact.amount < 0 ? '' : '+'}₹{result.impact.amount.toLocaleString('en-IN')} impact
                            </p>
                        </div>
                    </div>

                    {/* Balance Retained */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">Balance retained after purchase</span>
                            <span className={`font-bold ${risk.color}`}>{result.impact.retained_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${result.impact.risk_level === 'low' ? 'bg-emerald-500' :
                                        result.impact.risk_level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                style={{ width: `${Math.min(result.impact.retained_percentage, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Suggestions */}
                    {result.suggestions.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" /> Suggestions
                            </h3>
                            {result.suggestions.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div>
                                        <p className="font-semibold text-blue-900 text-sm">{s.name}</p>
                                        <p className="text-blue-700 text-xs mt-0.5">{s.description}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
