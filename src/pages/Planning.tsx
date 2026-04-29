import { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertCircle, PlusCircle, Calendar } from 'lucide-react';
import { api } from '../lib/api';

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: string;
}

interface FinancialForecast {
  predicted_balance_30d: number;
  predicted_balance_90d: number;
  safe_to_save: number;
  status: string;
  confidence: number;
}

export default function Planning() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // We will create the planning API next
      const [goalsRes, forecastRes] = await Promise.all([
        api.get('/api/planning/plans').catch(() => ({ data: [] })),
        api.get('/api/planning/forecast').catch(() => ({ data: null }))
      ]);
      setGoals(goalsRes.data || []);
      setForecast(forecastRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial planning data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Planning</h1>
          <p className="text-slate-500 mt-1">Set goals and forecast your financial health</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium">
          <PlusCircle className="w-5 h-5" />
          <span>New Goal</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* AI Forecast */}
      {forecast && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-indigo-900">AI Financial Forecast</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-indigo-600/80 mb-1">30-Day Projection</p>
              <p className="text-2xl font-bold text-indigo-900">₹{forecast.predicted_balance_30d?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-600/80 mb-1">90-Day Projection</p>
              <p className="text-2xl font-bold text-indigo-900">₹{forecast.predicted_balance_90d?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600/80 mb-1">Safe to Save Now</p>
              <p className="text-2xl font-bold text-emerald-700">₹{forecast.safe_to_save?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goals */}
      <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4">Your Savings Goals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                goal.status === 'on_track' ? 'bg-emerald-100 text-emerald-700' :
                goal.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {goal.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-1">{goal.name}</h3>
            <div className="flex items-center space-x-1 text-sm text-slate-500 mb-6">
              <Calendar className="w-4 h-4" />
              <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-900">₹{goal.current_amount.toLocaleString()}</span>
                <span className="text-slate-500">of ₹{goal.target_amount.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (goal.current_amount / goal.target_amount) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        
        {goals.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No goals set</h3>
            <p className="text-slate-500 text-sm mb-4">Start planning your financial future by creating a savings goal.</p>
            <button className="text-blue-600 font-medium hover:text-blue-700">Create your first goal →</button>
          </div>
        )}
      </div>
    </div>
  );
}
