import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { CreditCard, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  type: string;
  date: string;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/transactions?limit=100');
      if (res.data && Array.isArray(res.data.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
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

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  // Calculate stats
  const debits = transactions.filter(t => t.type === 'debit');
  const totalSpent = debits.reduce((acc, t) => acc + t.amount, 0);
  
  // Group by category
  const categoryMap: Record<string, number> = {};
  debits.forEach(t => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Group by month
  const monthMap: Record<string, number> = {};
  debits.forEach(t => {
    const d = new Date(t.date);
    const month = d.toLocaleString('default', { month: 'short' });
    monthMap[month] = (monthMap[month] || 0) + t.amount;
  });

  const trendData = Object.entries(monthMap).map(([name, amount]) => ({ name, amount }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spending Analytics</h1>
          <p className="text-slate-500 mt-1">Track and analyze your expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Total Spent</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{totalSpent.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Top Category</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 truncate">
            {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Transactions</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{debits.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Spending by Category</h3>
          <div className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) =>
                      typeof value === 'number' ? `₹${value.toLocaleString()}` : value
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Monthly Trend</h3>
          <div className="h-80">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => [
                      typeof value === 'number' ? `₹${value.toLocaleString()}` : String(value ?? ''),
                      name,
                    ]}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
