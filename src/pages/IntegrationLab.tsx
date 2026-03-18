import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
    CalendarClock,
    CheckCircle2,
    CircleAlert,
    CircleX,
    ListChecks,
    Loader2,
    Play,
    RefreshCw,
    Save,
    ShieldCheck,
    UserRoundPlus,
    Workflow,
} from "lucide-react";
import { api } from "../lib/api";

type NoticeType = "success" | "error";

interface Notice {
    type: NoticeType;
    message: string;
}

interface PersistentExpense {
    name: string;
    amount: number;
    day_of_month: number;
    category: string;
}

interface UserProfileResponse {
    user_id: string;
    monthly_salary: number;
    currency: string;
    min_safe_balance: number;
    savings_goal_pct: number;
    risk_tolerance: string;
    persistent_expenses: PersistentExpense[];
    total_persistent_expenses: number;
    projected_free_cashflow: number;
    notes?: string | null;
}

interface FinancialPlan {
    id: number;
    user_id: string;
    title: string;
    goal_type: string;
    monthly_budget?: number | null;
    created_at: string;
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
}

interface ChecklistItem {
    id: number;
    title: string;
    due_date: string;
    amount?: number | null;
    status: string;
    recurring_rule_id?: number | null;
}

interface Beneficiary {
    id: string;
    name: string;
    payment_rail: string;
    status: string;
    created_at: string;
    verified_at?: string | null;
    cooldown_expires_at?: string | null;
    upi_handle?: string | null;
    account_number?: string | null;
    ifsc?: string | null;
    nickname?: string | null;
}

interface SettlementWindows {
    country: string;
    date: string;
    rails: Record<
        string,
        {
            mode?: string;
            window_start_hour_utc?: number;
            window_end_hour_utc?: number;
            notes?: string;
        }
    >;
}

interface BankSchedule {
    id: string;
    status: string;
    action_type: string;
    amount: number;
    merchant: string;
    category: string;
    payment_rail?: string | null;
    frequency: string;
    day_of_month: number;
    next_run_date: string;
    last_run_at?: string | null;
}

interface ActionRequest {
    id: number;
    action_type: string;
    status: string;
    decision_reason?: string | null;
    linked_execution_id?: number | null;
    created_at: string;
    action_payload: Record<string, unknown>;
}

interface ActionExecution {
    id: number;
    action_type: string;
    status: string;
    attempt_count: number;
    last_error?: string | null;
    created_at: string;
    finished_at?: string | null;
    result_payload?: Record<string, unknown> | null;
}

interface ProfileDraft {
    monthly_salary: string;
    currency: string;
    min_safe_balance: string;
    savings_goal_pct: string;
    risk_tolerance: string;
    notes: string;
    persistent_expenses: PersistentExpense[];
}

interface PlanDraft {
    title: string;
    goal_type: string;
    monthly_budget: string;
}

interface ScheduleTextDraft {
    text: string;
    default_amount: string;
    autopay_enabled: boolean;
    requires_approval: boolean;
}

interface BeneficiaryDraft {
    name: string;
    payment_rail: string;
    upi_handle: string;
    account_number: string;
    ifsc: string;
    nickname: string;
}

interface BankScheduleDraft {
    action_type: string;
    amount: string;
    merchant: string;
    category: string;
    payment_rail: string;
    day_of_month: string;
}

interface ActionDraft {
    action_type: string;
    amount: string;
    description: string;
    beneficiary_id: string;
}

const DEFAULT_PROFILE_DRAFT: ProfileDraft = {
    monthly_salary: "0",
    currency: "INR",
    min_safe_balance: "5000",
    savings_goal_pct: "0.2",
    risk_tolerance: "moderate",
    notes: "",
    persistent_expenses: [],
};

const DEFAULT_PLAN_DRAFT: PlanDraft = {
    title: "",
    goal_type: "expense_control",
    monthly_budget: "",
};

const DEFAULT_SCHEDULE_TEXT_DRAFT: ScheduleTextDraft = {
    text: "",
    default_amount: "",
    autopay_enabled: false,
    requires_approval: true,
};

const DEFAULT_BENEFICIARY_DRAFT: BeneficiaryDraft = {
    name: "",
    payment_rail: "UPI",
    upi_handle: "",
    account_number: "",
    ifsc: "",
    nickname: "",
};

const DEFAULT_BANK_SCHEDULE_DRAFT: BankScheduleDraft = {
    action_type: "pay_bill",
    amount: "",
    merchant: "",
    category: "utilities",
    payment_rail: "UPI",
    day_of_month: "10",
};

const DEFAULT_ACTION_DRAFT: ActionDraft = {
    action_type: "pay_bill",
    amount: "",
    description: "",
    beneficiary_id: "",
};

function toErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") {
        return "Request failed";
    }

    const maybe = error as {
        response?: { data?: { detail?: unknown } };
        message?: string;
    };

    const detail = maybe.response?.data?.detail;
    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }
                if (item && typeof item === "object" && "msg" in item) {
                    return String((item as { msg: unknown }).msg);
                }
                return JSON.stringify(item);
            })
            .join("; ");
    }

    if (typeof maybe.message === "string") {
        return maybe.message;
    }

    return "Request failed";
}

function formatDate(value?: string | null): string {
    if (!value) {
        return "-";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleString("en-IN");
}

export default function IntegrationLab() {
    const [notice, setNotice] = useState<Notice | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [profileDraft, setProfileDraft] = useState<ProfileDraft>(DEFAULT_PROFILE_DRAFT);
    const [expenseName, setExpenseName] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDay, setExpenseDay] = useState("1");
    const [expenseCategory, setExpenseCategory] = useState("other");

    const [plans, setPlans] = useState<FinancialPlan[]>([]);
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [planDraft, setPlanDraft] = useState<PlanDraft>(DEFAULT_PLAN_DRAFT);
    const [scheduleTextDraft, setScheduleTextDraft] = useState<ScheduleTextDraft>(
        DEFAULT_SCHEDULE_TEXT_DRAFT,
    );
    const [materializeDays, setMaterializeDays] = useState("30");

    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [beneficiaryDraft, setBeneficiaryDraft] = useState<BeneficiaryDraft>(
        DEFAULT_BENEFICIARY_DRAFT,
    );

    const [settlementDate, setSettlementDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [settlementWindows, setSettlementWindows] = useState<SettlementWindows | null>(
        null,
    );
    const [schedules, setSchedules] = useState<BankSchedule[]>([]);
    const [bankScheduleDraft, setBankScheduleDraft] =
        useState<BankScheduleDraft>(DEFAULT_BANK_SCHEDULE_DRAFT);

    const [actionRequests, setActionRequests] = useState<ActionRequest[]>([]);
    const [executions, setExecutions] = useState<ActionExecution[]>([]);
    const [actionDraft, setActionDraft] = useState<ActionDraft>(DEFAULT_ACTION_DRAFT);

    useEffect(() => {
        let timeoutId: number | undefined;
        if (notice) {
            timeoutId = window.setTimeout(() => setNotice(null), 5000);
        }

        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [notice]);

    useEffect(() => {
        void refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pushNotice = (type: NoticeType, message: string) => {
        setNotice({ type, message });
    };

    const runBusy = async (task: () => Promise<void>) => {
        setBusy(true);
        try {
            await task();
        } finally {
            setBusy(false);
        }
    };

    const refreshProfile = async () => {
        const response = await api.get<UserProfileResponse>("/api/profile");
        setProfile(response.data);
        setProfileDraft({
            monthly_salary: String(response.data.monthly_salary ?? 0),
            currency: response.data.currency || "INR",
            min_safe_balance: String(response.data.min_safe_balance ?? 5000),
            savings_goal_pct: String(response.data.savings_goal_pct ?? 0.2),
            risk_tolerance: response.data.risk_tolerance || "moderate",
            notes: response.data.notes || "",
            persistent_expenses: response.data.persistent_expenses || [],
        });
    };

    const refreshPlanning = async () => {
        const [plansRes, rulesRes, checklistRes] = await Promise.all([
            api.get<FinancialPlan[]>("/api/planning/plans"),
            api.get<RecurringRule[]>("/api/planning/recurring-rules"),
            api.get<ChecklistItem[]>("/api/planning/checklist"),
        ]);
        setPlans(plansRes.data);
        setRules(rulesRes.data);
        setChecklist(checklistRes.data);
    };

    const refreshBeneficiaries = async () => {
        const response = await api.get<Beneficiary[]>("/api/beneficiaries/");
        setBeneficiaries(response.data);
    };

    const refreshSchedules = async () => {
        const [windowsRes, schedulesRes] = await Promise.all([
            api.get<SettlementWindows>("/api/bank-schedules/settlement-windows", {
                params: { for_date: settlementDate },
            }),
            api.get<BankSchedule[]>("/api/bank-schedules/", {
                params: { include_inactive: true },
            }),
        ]);
        setSettlementWindows(windowsRes.data);
        setSchedules(schedulesRes.data);
    };

    const refreshActions = async () => {
        const [requestsRes, executionsRes] = await Promise.all([
            api.get<ActionRequest[]>("/api/actions/requests"),
            api.get<ActionExecution[]>("/api/actions/executions"),
        ]);
        setActionRequests(requestsRes.data);
        setExecutions(executionsRes.data);
    };

    const refreshAll = async () => {
        setInitialLoading(true);
        const results = await Promise.allSettled([
            refreshProfile(),
            refreshPlanning(),
            refreshBeneficiaries(),
            refreshSchedules(),
            refreshActions(),
        ]);
        setInitialLoading(false);

        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length) {
            pushNotice(
                "error",
                `Loaded with ${failed.length} section error(s). Check backend/mockbank runtime.`,
            );
        }
    };

    const addExpenseDraft = () => {
        const amount = Number(expenseAmount);
        const day = Number(expenseDay);
        if (!expenseName.trim() || Number.isNaN(amount) || amount < 0 || day < 1 || day > 31) {
            pushNotice("error", "Provide valid expense name, amount, and day (1-31).");
            return;
        }

        const next = [
            ...profileDraft.persistent_expenses,
            {
                name: expenseName.trim(),
                amount,
                day_of_month: day,
                category: expenseCategory.trim() || "other",
            },
        ];
        setProfileDraft((prev) => ({ ...prev, persistent_expenses: next }));
        setExpenseName("");
        setExpenseAmount("");
        setExpenseDay("1");
        setExpenseCategory("other");
    };

    const removeExpenseDraft = (index: number) => {
        setProfileDraft((prev) => ({
            ...prev,
            persistent_expenses: prev.persistent_expenses.filter((_, i) => i !== index),
        }));
    };

    const saveProfile = async (e: FormEvent) => {
        e.preventDefault();
        await runBusy(async () => {
            try {
                const response = await api.put<UserProfileResponse>("/api/profile", {
                    monthly_salary: Number(profileDraft.monthly_salary || 0),
                    currency: (profileDraft.currency || "INR").toUpperCase(),
                    min_safe_balance: Number(profileDraft.min_safe_balance || 0),
                    savings_goal_pct: Number(profileDraft.savings_goal_pct || 0),
                    risk_tolerance: profileDraft.risk_tolerance || "moderate",
                    persistent_expenses: profileDraft.persistent_expenses,
                    notes: profileDraft.notes || null,
                });
                setProfile(response.data);
                pushNotice("success", "Profile updated.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const createPlan = async (e: FormEvent) => {
        e.preventDefault();
        if (!planDraft.title.trim()) {
            pushNotice("error", "Plan title is required.");
            return;
        }

        await runBusy(async () => {
            try {
                await api.post("/api/planning/plans", {
                    title: planDraft.title.trim(),
                    goal_type: planDraft.goal_type,
                    monthly_budget: planDraft.monthly_budget
                        ? Number(planDraft.monthly_budget)
                        : null,
                });
                setPlanDraft(DEFAULT_PLAN_DRAFT);
                await refreshPlanning();
                pushNotice("success", "Plan created.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const createRuleFromText = async (e: FormEvent) => {
        e.preventDefault();
        if (!scheduleTextDraft.text.trim()) {
            pushNotice("error", "Schedule text is required.");
            return;
        }

        await runBusy(async () => {
            try {
                await api.post("/api/planning/schedule-from-text", {
                    text: scheduleTextDraft.text.trim(),
                    default_amount: scheduleTextDraft.default_amount
                        ? Number(scheduleTextDraft.default_amount)
                        : 0,
                    autopay_enabled: scheduleTextDraft.autopay_enabled,
                    requires_approval: scheduleTextDraft.requires_approval,
                });
                setScheduleTextDraft(DEFAULT_SCHEDULE_TEXT_DRAFT);
                await refreshPlanning();
                pushNotice("success", "Recurring rule created from text.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const materializeChecklist = async () => {
        await runBusy(async () => {
            try {
                const response = await api.post<{ materialized_count: number }>(
                    "/api/planning/scheduler/materialize-due",
                    {
                        until_days: Number(materializeDays || 30),
                    },
                );
                await refreshPlanning();
                pushNotice(
                    "success",
                    `Materialized ${response.data.materialized_count} checklist item(s).`,
                );
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const completeChecklistItem = async (itemId: number) => {
        await runBusy(async () => {
            try {
                await api.patch(`/api/planning/checklist/${itemId}`, { status: "completed" });
                await refreshPlanning();
                pushNotice("success", "Checklist item marked completed.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const createBeneficiary = async (e: FormEvent) => {
        e.preventDefault();
        if (!beneficiaryDraft.name.trim()) {
            pushNotice("error", "Beneficiary name is required.");
            return;
        }

        const rail = beneficiaryDraft.payment_rail.toUpperCase();
        if (rail === "UPI" && !beneficiaryDraft.upi_handle.trim()) {
            pushNotice("error", "UPI handle is required for UPI beneficiaries.");
            return;
        }

        if (rail !== "UPI" && (!beneficiaryDraft.account_number.trim() || !beneficiaryDraft.ifsc.trim())) {
            pushNotice("error", "Account number and IFSC are required for bank transfer rails.");
            return;
        }

        await runBusy(async () => {
            try {
                await api.post("/api/beneficiaries/", {
                    name: beneficiaryDraft.name.trim(),
                    payment_rail: rail,
                    upi_handle: beneficiaryDraft.upi_handle.trim() || null,
                    account_number: beneficiaryDraft.account_number.trim() || null,
                    ifsc: beneficiaryDraft.ifsc.trim() || null,
                    nickname: beneficiaryDraft.nickname.trim() || null,
                });
                setBeneficiaryDraft(DEFAULT_BENEFICIARY_DRAFT);
                await refreshBeneficiaries();
                pushNotice("success", "Beneficiary created.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const verifyBeneficiary = async (beneficiaryId: string) => {
        await runBusy(async () => {
            try {
                await api.put(`/api/beneficiaries/${beneficiaryId}/verify`);
                await refreshBeneficiaries();
                pushNotice("success", "Beneficiary verified.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const fetchSettlementWindows = async () => {
        await runBusy(async () => {
            try {
                const response = await api.get<SettlementWindows>(
                    "/api/bank-schedules/settlement-windows",
                    {
                        params: { for_date: settlementDate },
                    },
                );
                setSettlementWindows(response.data);
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const createBankSchedule = async (e: FormEvent) => {
        e.preventDefault();
        if (!bankScheduleDraft.amount || !bankScheduleDraft.merchant.trim()) {
            pushNotice("error", "Schedule amount and merchant are required.");
            return;
        }

        await runBusy(async () => {
            try {
                await api.post("/api/bank-schedules/", {
                    action_type: bankScheduleDraft.action_type,
                    amount: Number(bankScheduleDraft.amount),
                    merchant: bankScheduleDraft.merchant.trim(),
                    category: bankScheduleDraft.category.trim() || "utilities",
                    payment_rail: bankScheduleDraft.payment_rail.toUpperCase(),
                    frequency: "monthly",
                    day_of_month: Number(bankScheduleDraft.day_of_month || 1),
                });
                setBankScheduleDraft(DEFAULT_BANK_SCHEDULE_DRAFT);
                await refreshSchedules();
                pushNotice("success", "Bank schedule created.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const runScheduleNow = async (scheduleId: string) => {
        await runBusy(async () => {
            try {
                await api.post(`/api/bank-schedules/${scheduleId}/run`, null, {
                    params: { force: true },
                });
                await refreshSchedules();
                await refreshActions();
                pushNotice("success", "Schedule run triggered.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const cancelSchedule = async (scheduleId: string) => {
        await runBusy(async () => {
            try {
                await api.delete(`/api/bank-schedules/${scheduleId}`);
                await refreshSchedules();
                pushNotice("success", "Schedule cancelled.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const createActionRequest = async (e: FormEvent) => {
        e.preventDefault();
        if (!actionDraft.amount) {
            pushNotice("error", "Action amount is required.");
            return;
        }

        await runBusy(async () => {
            try {
                await api.post("/api/actions/requests", {
                    action_type: actionDraft.action_type,
                    action_payload: {
                        amount: Number(actionDraft.amount),
                        description:
                            actionDraft.description.trim() ||
                            `${actionDraft.action_type} requested from integration lab`,
                        beneficiary_id: actionDraft.beneficiary_id.trim() || undefined,
                    },
                    idempotency_key: `ui-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                });
                setActionDraft(DEFAULT_ACTION_DRAFT);
                await refreshActions();
                pushNotice("success", "Action request submitted.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const approveRequest = async (requestId: number) => {
        await runBusy(async () => {
            try {
                await api.post(`/api/actions/requests/${requestId}/approve`, {
                    reason: "Approved from integration lab",
                });
                await refreshActions();
                pushNotice("success", `Request ${requestId} approved.`);
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const rejectRequest = async (requestId: number) => {
        await runBusy(async () => {
            try {
                await api.post(`/api/actions/requests/${requestId}/reject`, {
                    reason: "Rejected from integration lab",
                });
                await refreshActions();
                pushNotice("success", `Request ${requestId} rejected.`);
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const reconcileExecution = async (executionId: number) => {
        await runBusy(async () => {
            try {
                await api.post("/api/actions/executions/reconcile", {
                    execution_id: executionId,
                });
                await refreshActions();
                pushNotice("success", `Execution ${executionId} reconciled.`);
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    const reconcileRecentExecutions = async () => {
        await runBusy(async () => {
            try {
                await api.post("/api/actions/executions/reconcile", {
                    lookback_hours: 168,
                    max_items: 50,
                });
                await refreshActions();
                pushNotice("success", "Recent executions reconciled.");
            } catch (error) {
                pushNotice("error", toErrorMessage(error));
            }
        });
    };

    if (initialLoading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Integration Lab</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Test profile, planning, beneficiaries, schedules, settlements, actions, approvals, and reconciliation against live backend+mockbank.
                    </p>
                </div>
                <button
                    onClick={() => void runBusy(refreshAll)}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh All
                </button>
            </div>

            {notice && (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                        notice.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                >
                    {notice.message}
                </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Profile Configuration</h2>
                </div>
                <form onSubmit={saveProfile} className="grid gap-3 md:grid-cols-2">
                    <input
                        value={profileDraft.monthly_salary}
                        onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, monthly_salary: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Monthly salary"
                        type="number"
                    />
                    <input
                        value={profileDraft.min_safe_balance}
                        onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, min_safe_balance: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Minimum safe balance"
                        type="number"
                    />
                    <input
                        value={profileDraft.savings_goal_pct}
                        onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, savings_goal_pct: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Savings goal percentage (0-1)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                    />
                    <input
                        value={profileDraft.risk_tolerance}
                        onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, risk_tolerance: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Risk tolerance"
                    />
                    <textarea
                        value={profileDraft.notes}
                        onChange={(e) =>
                            setProfileDraft((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                        placeholder="Notes"
                        rows={2}
                    />

                    <div className="rounded-xl border border-slate-200 p-3 md:col-span-2">
                        <p className="mb-2 text-sm font-medium text-slate-700">Persistent expenses</p>
                        <div className="grid gap-2 md:grid-cols-5">
                            <input
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                placeholder="Name"
                                value={expenseName}
                                onChange={(e) => setExpenseName(e.target.value)}
                            />
                            <input
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                placeholder="Amount"
                                type="number"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                            />
                            <input
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                placeholder="Day"
                                type="number"
                                min="1"
                                max="31"
                                value={expenseDay}
                                onChange={(e) => setExpenseDay(e.target.value)}
                            />
                            <input
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                                placeholder="Category"
                                value={expenseCategory}
                                onChange={(e) => setExpenseCategory(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={addExpenseDraft}
                                className="rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700"
                            >
                                Add Expense
                            </button>
                        </div>

                        <div className="mt-3 space-y-2">
                            {profileDraft.persistent_expenses.map((expense, index) => (
                                <div
                                    key={`${expense.name}-${index}`}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                                >
                                    <span>
                                        {expense.name} · INR {expense.amount.toLocaleString("en-IN")} · day {expense.day_of_month} · {expense.category}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeExpenseDraft(index)}
                                        className="text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {profileDraft.persistent_expenses.length === 0 && (
                                <p className="text-xs text-slate-400">No persistent expenses configured.</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Profile
                    </button>
                </form>

                {profile && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        User {profile.user_id} · Total persistent expenses INR {profile.total_persistent_expenses.toLocaleString("en-IN")} · Projected free cashflow INR {profile.projected_free_cashflow.toLocaleString("en-IN")}
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Planning and Checklist</h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <form onSubmit={createPlan} className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-700">Create financial plan</p>
                        <input
                            value={planDraft.title}
                            onChange={(e) =>
                                setPlanDraft((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Plan title"
                        />
                        <select
                            value={planDraft.goal_type}
                            onChange={(e) =>
                                setPlanDraft((prev) => ({ ...prev, goal_type: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="expense_control">expense_control</option>
                            <option value="save">save</option>
                            <option value="invest">invest</option>
                            <option value="debt">debt</option>
                            <option value="custom">custom</option>
                        </select>
                        <input
                            value={planDraft.monthly_budget}
                            onChange={(e) =>
                                setPlanDraft((prev) => ({ ...prev, monthly_budget: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Monthly budget (optional)"
                            type="number"
                        />
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            Create Plan
                        </button>
                    </form>

                    <form onSubmit={createRuleFromText} className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-700">Create recurring rule from text</p>
                        <textarea
                            value={scheduleTextDraft.text}
                            onChange={(e) =>
                                setScheduleTextDraft((prev) => ({ ...prev, text: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Example: Please pay my rent of 25000 every month on 10th and remind me"
                        />
                        <input
                            value={scheduleTextDraft.default_amount}
                            onChange={(e) =>
                                setScheduleTextDraft((prev) => ({
                                    ...prev,
                                    default_amount: e.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Default amount (optional)"
                            type="number"
                        />
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                                type="checkbox"
                                checked={scheduleTextDraft.autopay_enabled}
                                onChange={(e) =>
                                    setScheduleTextDraft((prev) => ({
                                        ...prev,
                                        autopay_enabled: e.target.checked,
                                    }))
                                }
                            />
                            Enable autopay
                        </label>
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            Create Rule
                        </button>
                    </form>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <input
                            value={materializeDays}
                            onChange={(e) => setMaterializeDays(e.target.value)}
                            type="number"
                            min="1"
                            max="90"
                            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => void materializeChecklist()}
                            disabled={busy}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            Materialize Checklist
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">Plans: {plans.length} · Rules: {rules.length} · Checklist: {checklist.length}</p>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                        <p className="mb-2 text-sm font-medium text-slate-700">Recurring rules</p>
                        <div className="space-y-2 text-xs">
                            {rules.map((rule) => (
                                <div key={rule.id} className="rounded-lg bg-slate-50 p-2">
                                    {rule.title} · INR {rule.amount.toLocaleString("en-IN")} · day {rule.day_of_month} · next {rule.next_run_date} · {rule.trusted_recurring ? "trusted" : "manual"}
                                </div>
                            ))}
                            {rules.length === 0 && <p className="text-slate-400">No rules yet.</p>}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                        <p className="mb-2 text-sm font-medium text-slate-700">Checklist</p>
                        <div className="space-y-2 text-xs">
                            {checklist.map((item) => (
                                <div key={item.id} className="rounded-lg bg-slate-50 p-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>
                                            #{item.id} {item.title} · due {item.due_date} · {item.status}
                                        </span>
                                        {item.status !== "completed" && (
                                            <button
                                                onClick={() => void completeChecklistItem(item.id)}
                                                disabled={busy}
                                                className="rounded bg-emerald-100 px-2 py-1 text-emerald-700"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {checklist.length === 0 && <p className="text-slate-400">No checklist items yet.</p>}
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <UserRoundPlus className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Beneficiaries</h2>
                </div>

                <form onSubmit={createBeneficiary} className="grid gap-2 md:grid-cols-3">
                    <input
                        value={beneficiaryDraft.name}
                        onChange={(e) =>
                            setBeneficiaryDraft((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Name"
                    />
                    <select
                        value={beneficiaryDraft.payment_rail}
                        onChange={(e) =>
                            setBeneficiaryDraft((prev) => ({
                                ...prev,
                                payment_rail: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="UPI">UPI</option>
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                        <option value="IMPS">IMPS</option>
                    </select>
                    <input
                        value={beneficiaryDraft.nickname}
                        onChange={(e) =>
                            setBeneficiaryDraft((prev) => ({ ...prev, nickname: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Nickname (optional)"
                    />

                    {beneficiaryDraft.payment_rail === "UPI" ? (
                        <input
                            value={beneficiaryDraft.upi_handle}
                            onChange={(e) =>
                                setBeneficiaryDraft((prev) => ({
                                    ...prev,
                                    upi_handle: e.target.value,
                                }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                            placeholder="UPI handle"
                        />
                    ) : (
                        <>
                            <input
                                value={beneficiaryDraft.account_number}
                                onChange={(e) =>
                                    setBeneficiaryDraft((prev) => ({
                                        ...prev,
                                        account_number: e.target.value,
                                    }))
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Account number"
                            />
                            <input
                                value={beneficiaryDraft.ifsc}
                                onChange={(e) =>
                                    setBeneficiaryDraft((prev) => ({
                                        ...prev,
                                        ifsc: e.target.value,
                                    }))
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="IFSC"
                            />
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-3"
                    >
                        Create Beneficiary
                    </button>
                </form>

                <div className="mt-4 space-y-2 text-xs">
                    {beneficiaries.map((beneficiary) => (
                        <div
                            key={beneficiary.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                            <span>
                                {beneficiary.name} · {beneficiary.payment_rail} · {beneficiary.status}
                                {beneficiary.upi_handle ? ` · ${beneficiary.upi_handle}` : ""}
                                {beneficiary.account_number ? ` · ****${beneficiary.account_number.slice(-4)}` : ""}
                            </span>
                            {beneficiary.status !== "verified" && (
                                <button
                                    onClick={() => void verifyBeneficiary(beneficiary.id)}
                                    disabled={busy}
                                    className="rounded bg-emerald-100 px-2 py-1 text-emerald-700"
                                >
                                    Verify
                                </button>
                            )}
                        </div>
                    ))}
                    {beneficiaries.length === 0 && (
                        <p className="text-slate-400">No beneficiaries yet.</p>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Bank Schedules and Settlement Windows</h2>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                    <input
                        type="date"
                        value={settlementDate}
                        onChange={(e) => setSettlementDate(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                        onClick={() => void fetchSettlementWindows()}
                        disabled={busy}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        Fetch Settlement Windows
                    </button>
                    <button
                        onClick={() => void refreshSchedules()}
                        disabled={busy}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-60"
                    >
                        Refresh Schedules
                    </button>
                </div>

                {settlementWindows && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                        <p className="mb-2 font-medium text-slate-700">
                            Settlement windows for {settlementWindows.date}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                            {Object.entries(settlementWindows.rails).map(([rail, windowData]) => (
                                <div key={rail} className="rounded-lg bg-white p-2">
                                    <p className="font-semibold text-slate-800">{rail}</p>
                                    <p className="text-slate-600">Mode: {windowData.mode || "-"}</p>
                                    <p className="text-slate-600">
                                        Window: {windowData.window_start_hour_utc ?? "-"} - {windowData.window_end_hour_utc ?? "-"} UTC
                                    </p>
                                    <p className="text-slate-500">{windowData.notes || ""}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={createBankSchedule} className="grid gap-2 md:grid-cols-3">
                    <select
                        value={bankScheduleDraft.action_type}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({
                                ...prev,
                                action_type: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="pay_bill">pay_bill</option>
                        <option value="pay_rent">pay_rent</option>
                        <option value="pay_gas">pay_gas</option>
                        <option value="pay_utility">pay_utility</option>
                        <option value="transfer_savings">transfer_savings</option>
                    </select>
                    <input
                        value={bankScheduleDraft.amount}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Amount"
                        type="number"
                    />
                    <input
                        value={bankScheduleDraft.day_of_month}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({
                                ...prev,
                                day_of_month: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Day of month"
                        min="1"
                        max="31"
                        type="number"
                    />
                    <input
                        value={bankScheduleDraft.merchant}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({ ...prev, merchant: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Merchant"
                    />
                    <input
                        value={bankScheduleDraft.category}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({ ...prev, category: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Category"
                    />
                    <input
                        value={bankScheduleDraft.payment_rail}
                        onChange={(e) =>
                            setBankScheduleDraft((prev) => ({
                                ...prev,
                                payment_rail: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Payment rail"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-3"
                    >
                        Create Bank Schedule
                    </button>
                </form>

                <div className="mt-4 space-y-2 text-xs">
                    {schedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>
                                    {schedule.id} · {schedule.action_type} · INR {schedule.amount.toLocaleString("en-IN")} · {schedule.status} · next {schedule.next_run_date}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => void runScheduleNow(schedule.id)}
                                        disabled={busy || schedule.status !== "active"}
                                        className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-emerald-700 disabled:opacity-50"
                                    >
                                        <Play className="h-3 w-3" />
                                        Run Now
                                    </button>
                                    <button
                                        onClick={() => void cancelSchedule(schedule.id)}
                                        disabled={busy || schedule.status !== "active"}
                                        className="rounded bg-rose-100 px-2 py-1 text-rose-700 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {schedules.length === 0 && <p className="text-slate-400">No schedules yet.</p>}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Action Engine</h2>
                </div>

                <form onSubmit={createActionRequest} className="grid gap-2 md:grid-cols-4">
                    <select
                        value={actionDraft.action_type}
                        onChange={(e) =>
                            setActionDraft((prev) => ({ ...prev, action_type: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="pay_bill">pay_bill</option>
                        <option value="pay_rent">pay_rent</option>
                        <option value="pay_gas">pay_gas</option>
                        <option value="pay_utility">pay_utility</option>
                        <option value="transfer_savings">transfer_savings</option>
                    </select>
                    <input
                        value={actionDraft.amount}
                        onChange={(e) =>
                            setActionDraft((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Amount"
                        type="number"
                    />
                    <input
                        value={actionDraft.beneficiary_id}
                        onChange={(e) =>
                            setActionDraft((prev) => ({
                                ...prev,
                                beneficiary_id: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Beneficiary id (optional)"
                    />
                    <input
                        value={actionDraft.description}
                        onChange={(e) =>
                            setActionDraft((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Description"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-4"
                    >
                        Create Action Request
                    </button>
                </form>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Requests</p>
                            <button
                                onClick={() => void refreshActions()}
                                disabled={busy}
                                className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            >
                                Refresh
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            {actionRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                                >
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                                        <span>
                                            #{request.id} {request.action_type} · {request.status}
                                        </span>
                                        <span>{formatDate(request.created_at)}</span>
                                    </div>
                                    <p className="text-slate-500">
                                        amount: {String(request.action_payload.amount ?? "-")}
                                    </p>
                                    {request.status === "pending" && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                onClick={() => void approveRequest(request.id)}
                                                disabled={busy}
                                                className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-emerald-700"
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => void rejectRequest(request.id)}
                                                disabled={busy}
                                                className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-1 text-rose-700"
                                            >
                                                <CircleX className="h-3 w-3" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {actionRequests.length === 0 && (
                                <p className="text-slate-400">No action requests yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Executions</p>
                            <button
                                onClick={() => void reconcileRecentExecutions()}
                                disabled={busy}
                                className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                            >
                                Reconcile Recent
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            {executions.map((execution) => (
                                <div
                                    key={execution.id}
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                                >
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                                        <span>
                                            #{execution.id} {execution.action_type} · {execution.status}
                                        </span>
                                        <span>{formatDate(execution.created_at)}</span>
                                    </div>
                                    <p className="text-slate-500">
                                        attempts: {execution.attempt_count} · finished: {formatDate(execution.finished_at)}
                                    </p>
                                    {execution.last_error && (
                                        <p className="mt-1 text-rose-600">error: {execution.last_error}</p>
                                    )}
                                    <button
                                        onClick={() => void reconcileExecution(execution.id)}
                                        disabled={busy}
                                        className="mt-2 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-700"
                                    >
                                        <CircleAlert className="h-3 w-3" />
                                        Reconcile
                                    </button>
                                </div>
                            ))}
                            {executions.length === 0 && (
                                <p className="text-slate-400">No executions yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
