import { useState } from 'react';
import { Receipt, Calendar, CreditCard, ChevronRight, AlertCircle, Plus } from 'lucide-react';

interface MockBill {
    id: string;
    biller: string;
    amount: number;
    dueDate: string;
    status: 'upcoming' | 'paid' | 'overdue';
    category: string;
    autoPay: boolean;
}

const mockBills: MockBill[] = [
    {
        id: '1',
        biller: 'City Electricity Board',
        amount: 850.00,
        dueDate: '2026-05-02',
        status: 'upcoming',
        category: 'Utilities',
        autoPay: true
    },
    {
        id: '2',
        biller: 'FiberNet Telecom',
        amount: 1200.00,
        dueDate: '2026-05-05',
        status: 'upcoming',
        category: 'Internet',
        autoPay: true
    },
    {
        id: '3',
        biller: 'Water Authority',
        amount: 320.00,
        dueDate: '2026-04-20',
        status: 'paid',
        category: 'Utilities',
        autoPay: false
    }
];

export default function Bills() {
    const [bills] = useState<MockBill[]>(mockBills);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bill Discovery</h1>
                    <p className="text-sm text-slate-600 mt-1">Manage and discover recurring payments.</p>
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Discover Bills</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Upcoming & Recent Bills
                    </h2>
                    
                    <div className="space-y-4">
                        {bills.map(bill => (
                            <div key={bill.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{bill.biller}</div>
                                        <div className="text-xs text-slate-500">Due: {new Date(bill.dueDate).toLocaleDateString()} • {bill.category}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(bill.amount)}</div>
                                    <div className="text-xs mt-1">
                                        {bill.status === 'paid' && <span className="text-green-600 font-medium">Paid</span>}
                                        {bill.status === 'upcoming' && <span className="text-amber-600 font-medium">Upcoming</span>}
                                        {bill.status === 'overdue' && <span className="text-red-600 font-medium">Overdue</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard className="w-24 h-24" />
                        </div>
                        <h3 className="font-medium text-indigo-100 mb-1">Auto-Pay Active</h3>
                        <div className="text-3xl font-bold mb-4">{formatCurrency(2050)}</div>
                        <p className="text-sm text-indigo-100/80 mb-6">Estimated upcoming auto-debits for the next 30 days.</p>
                        <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
                            Manage Auto-Pay
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900">Did you know?</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            CareBank can automatically discover your bills using your phone number via the BBPS network. Connect your accounts to never miss a payment.
                        </p>
                        <button className="mt-4 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
