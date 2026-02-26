export default function Simulator() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">What-If Simulator</h1>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-64 flex flex-col items-center justify-center space-y-4">
                <p className="text-slate-500">Curious about a purchase? Ask here.</p>
                <div className="w-full max-w-md relative">
                    <input
                        type="text"
                        placeholder="What if I spend ₹5,000 on a flight?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled
                    />
                </div>
                <p className="text-xs text-slate-400">Simulator AI integration coming soon.</p>
            </div>
        </div>
    );
}
