import { HealthScoreMeter } from "../components/HealthScoreMeter";

export default function Dashboard() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <HealthScoreMeter
                    score={68}
                    message="You're saving well, but dining out is volatile."
                />

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-center">
                    <p className="text-slate-400">Transactions List (Coming Soon)</p>
                </div>
            </div>
        </div>
    );
}
