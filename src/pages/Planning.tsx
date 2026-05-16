import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, AlertCircle, PlusCircle, ClipboardList, ListChecks, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface FinancialPlan {
  id: number;
  title: string;
  goal_type: string;
  target_amount: number | null;
  monthly_budget: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FinancialForecast {
  predicted_balance_30d: number;
  predicted_balance_90d: number;
  safe_to_save: number;
  status: string;
  confidence: number;
}

interface RecurringRule {
  id: number;
  title: string;
  category: string;
  amount: number;
  day_of_month: number;
  next_run_date: string;
  autopay_enabled: boolean;
  requires_approval: boolean;
  trusted_recurring: boolean;
  is_active: boolean;
  reminder_days_before: number;
}

interface ChecklistItem {
  id: number;
  title: string;
  due_date: string;
  amount: number | null;
  status: string;
  recurring_rule_id: number | null;
}

interface ActionRequest {
  id: number;
  action_type: string;
  status: string;
  action_payload: Record<string, unknown>;
  linked_execution_id: number | null;
  created_at: string;
}

interface ActionExecution {
  id: number;
  action_type: string;
  status: string;
  last_error: string | null;
  created_at: string;
}

export default function Planning() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<FinancialPlan[]>([]);
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [actionRequests, setActionRequests] = useState<ActionRequest[]>([]);
  const [actionExecutions, setActionExecutions] = useState<ActionExecution[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    goal_type: 'custom',
    target_amount: '',
    monthly_budget: '',
    notes: '',
  });
  const [ruleForm, setRuleForm] = useState({
    title: '',
    category: 'custom',
    amount: '',
    day_of_month: '',
    reminder_days_before: '1',
    autopay_enabled: false,
    requires_approval: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [goalsRes, forecastRes, rulesRes, checklistRes, requestsRes, executionsRes] = await Promise.all([
        api.get('/api/planning/plans').catch(() => ({ data: [] })),
        api.get('/api/planning/forecast').catch(() => ({ data: null })),
        api.get('/api/planning/recurring-rules').catch(() => ({ data: [] })),
        api.get('/api/planning/checklist').catch(() => ({ data: [] })),
        api.get('/api/actions/requests').catch(() => ({ data: [] })),
        api.get('/api/actions/executions').catch(() => ({ data: [] })),
      ]);
      setGoals(goalsRes.data || []);
      setForecast(forecastRes.data);
      setRecurringRules(rulesRes.data || []);
      setChecklist(checklistRes.data || []);
      setActionRequests(requestsRes.data || []);
      setActionExecutions(executionsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial planning data');
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = useMemo(
    () => actionRequests.filter((item) => item.status === 'pending'),
    [actionRequests]
  );

  const recentExecutions = useMemo(
    () => actionExecutions.slice(0, 6),
    [actionExecutions]
  );

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  };

  const resolveActionLabel = (actionType: string) => {
    const map: Record<string, string> = {
      pay_rent: 'Pay rent',
      pay_bill: 'Pay bill',
      pay_gas: 'Pay gas bill',
      pay_utility: 'Pay utility',
      transfer_savings: 'Transfer to savings',
      record_note: 'Record note',
    };
    return map[actionType] || actionType.replace(/_/g, ' ');
  };

  const statusBadge = (status: string) => {
    const base = 'px-2.5 py-1 text-xs font-semibold rounded-full';
    if (status === 'pending') return `${base} bg-amber-100 text-amber-700`;
    if (status === 'approved') return `${base} bg-emerald-100 text-emerald-700`;
    if (status === 'rejected') return `${base} bg-rose-100 text-rose-700`;
    if (status === 'expired') return `${base} bg-slate-200 text-slate-600`;
    if (status === 'success') return `${base} bg-emerald-100 text-emerald-700`;
    if (status === 'failure') return `${base} bg-rose-100 text-rose-700`;
    if (status === 'running') return `${base} bg-blue-100 text-blue-700`;
    if (status === 'queued') return `${base} bg-slate-200 text-slate-700`;
    if (status === 'rollback') return `${base} bg-orange-100 text-orange-700`;
    return `${base} bg-slate-100 text-slate-600`;
  };

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    setGoalError(null);

    if (!goalForm.title.trim()) {
      setGoalError('Please provide a goal title.');
      return;
    }

    const hasTargetAmount = goalForm.target_amount.trim() !== '';
    const hasMonthlyBudget = goalForm.monthly_budget.trim() !== '';
    const targetAmountInput = Number(goalForm.target_amount);
    const monthlyBudgetInput = Number(goalForm.monthly_budget);
    const targetAmount = hasTargetAmount ? targetAmountInput : null;
    const monthlyBudget = hasMonthlyBudget ? monthlyBudgetInput : null;

    if (hasTargetAmount && (!Number.isFinite(targetAmountInput) || targetAmountInput < 0)) {
      setGoalError('Target amount must be a positive number.');
      return;
    }

    if (hasMonthlyBudget && (!Number.isFinite(monthlyBudgetInput) || monthlyBudgetInput < 0)) {
      setGoalError('Monthly budget must be a positive number.');
      return;
    }

    setGoalSubmitting(true);
    try {
      const response = await api.post('/api/planning/plans', {
        title: goalForm.title.trim(),
        goal_type: goalForm.goal_type,
        target_amount: targetAmount,
        monthly_budget: monthlyBudget,
        notes: goalForm.notes.trim() || null,
      });
      setGoals((prev) => [response.data, ...prev]);
      setGoalForm({
        title: '',
        goal_type: 'custom',
        target_amount: '',
        monthly_budget: '',
        notes: '',
      });
      setShowGoalForm(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setGoalError(typeof detail === 'string' ? detail : 'Failed to create goal.');
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();
    setRuleError(null);

    if (!ruleForm.title.trim()) {
      setRuleError('Please provide a rule title.');
      return;
    }

    const amountValue = Number(ruleForm.amount);
    const dayValue = Number(ruleForm.day_of_month);
    const reminderValue = Number(ruleForm.reminder_days_before || 1);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setRuleError('Amount must be greater than 0.');
      return;
    }

    if (!Number.isFinite(dayValue) || dayValue < 1 || dayValue > 31) {
      setRuleError('Day of month must be between 1 and 31.');
      return;
    }

    if (!Number.isFinite(reminderValue) || reminderValue < 0 || reminderValue > 14) {
      setRuleError('Reminder days must be between 0 and 14.');
      return;
    }

    setRuleSubmitting(true);
    try {
      const response = await api.post('/api/planning/recurring-rules', {
        title: ruleForm.title.trim(),
        category: ruleForm.category,
        amount: amountValue,
        day_of_month: dayValue,
        reminder_days_before: reminderValue,
        autopay_enabled: ruleForm.autopay_enabled,
        requires_approval: ruleForm.requires_approval,
      });
      setRecurringRules((prev) => [response.data, ...prev]);
      setRuleForm({
        title: '',
        category: 'custom',
        amount: '',
        day_of_month: '',
        reminder_days_before: '1',
        autopay_enabled: false,
        requires_approval: true,
      });
      setShowRuleForm(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setRuleError(typeof detail === 'string' ? detail : 'Failed to create recurring rule.');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleChecklistToggle = async (item: ChecklistItem) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      const response = await api.patch(`/api/planning/checklist/${item.id}`, {
        status: nextStatus,
      });
      setChecklist((prev) => prev.map((entry) => entry.id === item.id ? response.data : entry));
    } catch (err) {
      setError('Failed to update checklist status.');
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await api.post(`/api/actions/requests/${requestId}/approve`, {
        reason: 'Approved via UI',
      });
      const updated = response.data?.request;
      const execution = response.data?.execution;
      if (updated) {
        setActionRequests((prev) => prev.map((entry) => entry.id === requestId ? updated : entry));
      }
      if (execution) {
        setActionExecutions((prev) => [execution, ...prev.filter((entry) => entry.id !== execution.id)]);
      }
    } catch (err) {
      setError('Failed to approve action request.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await api.post(`/api/actions/requests/${requestId}/reject`, {
        reason: 'Rejected via UI',
      });
      const updated = response.data?.request;
      if (updated) {
        setActionRequests((prev) => prev.map((entry) => entry.id === requestId ? updated : entry));
      }
    } catch (err) {
      setError('Failed to reject action request.');
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
        <button
          onClick={() => setShowGoalForm((prev) => !prev)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{showGoalForm ? 'Close form' : 'New Goal'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {showGoalForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create a new goal</h2>
          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Goal title</label>
              <input
                value={goalForm.title}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Emergency fund, Vacation, Debt payoff"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Goal type</label>
              <select
                value={goalForm.goal_type}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, goal_type: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              >
                <option value="save">Save</option>
                <option value="invest">Invest</option>
                <option value="debt">Debt</option>
                <option value="expense_control">Expense control</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={goalForm.target_amount}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, target_amount: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly budget (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={goalForm.monthly_budget}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, monthly_budget: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
                placeholder="10000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={goalForm.notes}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 min-h-[96px]"
                placeholder="What does success look like?"
              />
            </div>
            {goalError && (
              <div className="md:col-span-2 text-sm text-red-600 font-medium">{goalError}</div>
            )}
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={goalSubmitting}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {goalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create goal'}
              </button>
            </div>
          </form>
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
              <span className={statusBadge(goal.status)}>
                {goal.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">{goal.title}</h3>
            <div className="text-xs text-slate-500 mb-4">{goal.goal_type.replace('_', ' ').toUpperCase()}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target amount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(goal.target_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Monthly budget</span>
                <span className="font-semibold text-slate-900">{formatCurrency(goal.monthly_budget)}</span>
              </div>
            </div>
            {goal.notes && (
              <div className="mt-4 text-xs text-slate-500">{goal.notes}</div>
            )}
          </div>
        ))}
        
        {goals.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No goals set</h3>
            <p className="text-slate-500 text-sm mb-4">Start planning your financial future by creating a savings goal.</p>
            <button onClick={() => setShowGoalForm(true)} className="text-blue-600 font-medium hover:text-blue-700">Create your first goal →</button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-10">
        <h2 className="text-lg font-bold text-slate-900">Recurring Payment Rules</h2>
        <button
          onClick={() => setShowRuleForm((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <PlusCircle className="w-4 h-4" />
          {showRuleForm ? 'Close' : 'Add rule'}
        </button>
      </div>

      {showRuleForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rule title</label>
              <input
                value={ruleForm.title}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
                placeholder="Rent, Electricity, SIP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={ruleForm.category}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              >
                <option value="rent">Rent</option>
                <option value="bill">Bill</option>
                <option value="gas">Gas</option>
                <option value="saving">Saving</option>
                <option value="investment">Investment</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={ruleForm.amount}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day of month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={ruleForm.day_of_month}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, day_of_month: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reminder days</label>
              <input
                type="number"
                min="0"
                max="14"
                value={ruleForm.reminder_days_before}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, reminder_days_before: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleForm.autopay_enabled}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, autopay_enabled: event.target.checked }))}
                className="w-4 h-4"
              />
              <label className="text-sm text-slate-700">Autopay enabled</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ruleForm.requires_approval}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, requires_approval: event.target.checked }))}
                className="w-4 h-4"
              />
              <label className="text-sm text-slate-700">Requires approval</label>
            </div>
            {ruleError && (
              <div className="md:col-span-3 text-sm text-red-600 font-medium">{ruleError}</div>
            )}
            <div className="md:col-span-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ruleSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {ruleSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Upcoming recurring rules</h3>
          </div>
          <div className="space-y-3">
            {recurringRules.slice(0, 6).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <div className="font-medium text-slate-900">{rule.title}</div>
                  <div className="text-xs text-slate-500">Next run: {formatDate(rule.next_run_date)} • Day {rule.day_of_month}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{formatCurrency(rule.amount)}</div>
                  <div className="text-xs text-slate-500">{rule.autopay_enabled ? 'Autopay' : 'Manual approval'}</div>
                </div>
              </div>
            ))}
            {recurringRules.length === 0 && (
              <div className="text-sm text-slate-500">No recurring rules yet. Add one to automate future bills.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Checklist</h3>
          </div>
          <div className="space-y-3">
            {checklist.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">Due {formatDate(item.due_date)} • {formatCurrency(item.amount)}</div>
                </div>
                <button
                  onClick={() => handleChecklistToggle(item)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                >
                  {item.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {item.status === 'completed' ? 'Completed' : 'Mark done'}
                </button>
              </div>
            ))}
            {checklist.length === 0 && (
              <div className="text-sm text-slate-500">No checklist items yet. Upcoming reminders will appear here.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Action requests</h3>
          </div>
          <div className="space-y-3">
            {(pendingRequests.length ? pendingRequests : actionRequests.slice(0, 6)).map((request) => (
              <div key={request.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-900">{resolveActionLabel(request.action_type)}</div>
                  <span className={statusBadge(request.status)}>{request.status.toUpperCase()}</span>
                </div>
                <div className="text-xs text-slate-500">Created {formatDate(request.created_at)}</div>
                <div className="text-sm text-slate-700 mt-2">
                  Amount: {formatCurrency(Number(request.action_payload?.amount || 0))}
                </div>
                {request.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {actionRequests.length === 0 && (
              <div className="text-sm text-slate-500">No action requests yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Execution status</h3>
          </div>
          <div className="space-y-3">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-900">{resolveActionLabel(execution.action_type)}</div>
                  <span className={statusBadge(execution.status)}>{execution.status.toUpperCase()}</span>
                </div>
                <div className="text-xs text-slate-500">Started {formatDate(execution.created_at)}</div>
                {execution.last_error && (
                  <div className="mt-2 text-xs text-rose-600">{execution.last_error}</div>
                )}
              </div>
            ))}
            {actionExecutions.length === 0 && (
              <div className="text-sm text-slate-500">No execution history yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
