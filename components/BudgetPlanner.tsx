import React, { useState } from 'react';
import { FinancialState, RecurringItem } from '../types';
import { CalendarRange, Target, TrendingUp, Trash2, CheckCircle } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { predictNextMonthExpenses } from '../services/geminiService';

interface BudgetPlannerProps {
    data: FinancialState;
    onAddRecurring: (item: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
    onDeleteRecurring: (id: string) => void;
    onUpdateBudget: (category: string, limit: number) => void;
    onPayRecurring?: (id: string, amount: number) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ data, onAddRecurring, onDeleteRecurring, onPayRecurring }) => {
    const [prediction, setPrediction] = useState<{ estimatedFixedCosts: number; advice: string } | null>(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const t = TRANSLATIONS[data.settings.language];

    // Add Recurring Form
    const expenseCategories = data.categories.filter(c => c.type === 'EXPENSE' && !c.isDeleted);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemCategory, setNewItemCategory] = useState(expenseCategories[0]?.name || '');
    const [newItemDay, setNewItemDay] = useState('1');
    const [isVariable, setIsVariable] = useState(false);

    // Calculate Fixed Costs (Recurring + Installments)
    const monthlyInstallments = data.creditCards.reduce((acc, card) => {
        if (card.installmentsPaid >= card.installmentsTotal) return acc;
        return acc + (card.totalAmount / card.installmentsTotal);
    }, 0);

    const monthlyRecurring = data.recurring.reduce((acc, item) => acc + item.amount, 0);
    const totalFixedNextMonth = monthlyInstallments + monthlyRecurring;

    // Actual Spend per Category (Current Month)
    const currentMonthSpend = data.transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.usdAmount;
            return acc;
        }, {} as Record<string, number>);

    const handleAddRecurring = (e: React.FormEvent) => {
        e.preventDefault();
        onAddRecurring({
            name: newItemName,
            amount: parseFloat(newItemAmount),
            isVariable,
            category: newItemCategory,
            dayOfMonth: parseInt(newItemDay)
        });
        setNewItemName('');
        setNewItemAmount('');
        setIsVariable(false);
    };

    const handlePayBill = (item: RecurringItem) => {
        let amountToPay = item.amount;
        if (item.isVariable) {
            const input = window.prompt(`${t.enterAmount} for ${item.name}:`, item.amount.toString());
            if (input === null) return;
            amountToPay = parseFloat(input);
            if (isNaN(amountToPay)) return;
        }
        if (onPayRecurring) onPayRecurring(item.id, amountToPay);
    };

    const handleForecast = async () => {
        setLoadingPrediction(true);
        const result = await predictNextMonthExpenses(data);
        if (result) {
            setPrediction(result);
        }
        setLoadingPrediction(false);
    }

    // Filter categories that have a budget set
    const budgetedCategories = data.categories.filter(c => c.budget && c.budget > 0 && !c.isDeleted);

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-slate-800">{t.budget}</h2>
                <p className="text-slate-500">{t.planNextMonth}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Future Projection Card */}
                <div className="lg:col-span-2 bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                            <CalendarRange className="text-indigo-400" />
                            {t.projection}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">{t.fixedBills}</p>
                                <p className="text-2xl font-bold">${monthlyRecurring.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm mb-1">{t.installments}</p>
                                <p className="text-2xl font-bold">${monthlyInstallments.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-indigo-400 text-sm mb-1 font-semibold">{t.totalCommitted}</p>
                                <p className="text-3xl font-bold text-indigo-400">${totalFixedNextMonth.toFixed(0)}</p>
                            </div>
                        </div>

                        {!prediction ? (
                            <button
                                onClick={handleForecast}
                                disabled={loadingPrediction}
                                className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors disabled:opacity-70"
                            >
                                {loadingPrediction ? t.thinking : t.getForecast}
                            </button>
                        ) : (
                            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="w-5 h-5 text-emerald-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-emerald-400 mb-1">{t.aiSuggestion}</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{prediction.advice}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recurring Bills List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                    <h3 className="font-semibold text-slate-800 mb-4">{t.recurringBills}</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[300px]">
                        {data.recurring.map(item => {
                            const today = new Date();
                            const lastPaid = item.lastPaidDate ? new Date(item.lastPaidDate) : null;
                            const isPaidThisMonth = lastPaid && lastPaid.getMonth() === today.getMonth() && lastPaid.getFullYear() === today.getFullYear();

                            return (
                                <div key={item.id} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all group">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-800">{item.name}</p>
                                            {item.isVariable && <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full">{t.variable}</span>}
                                        </div>
                                        <p className="text-xs text-slate-500">Day {item.dayOfMonth} • {item.category}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="font-semibold text-slate-700 block">${item.amount}</span>
                                            {isPaidThisMonth ? (
                                                <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                                                    <CheckCircle size={10} /> {t.paid}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handlePayBill(item)}
                                                    className="text-[10px] text-indigo-600 font-medium hover:underline"
                                                >
                                                    {t.markAsPaid}
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onDeleteRecurring(item.id)}
                                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Small Form */}
                    <form onSubmit={handleAddRecurring} className="border-t pt-4 border-slate-100">
                        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">{t.addBill}</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input placeholder="Name" className="border rounded px-2 py-1 text-sm" value={newItemName} onChange={e => setNewItemName(e.target.value)} required />
                            <input placeholder={t.amount} type="number" className="border rounded px-2 py-1 text-sm" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} required />
                            <input placeholder="Day (1-31)" type="number" min="1" max="31" className="border rounded px-2 py-1 text-sm" value={newItemDay} onChange={e => setNewItemDay(e.target.value)} required />
                            <select
                                value={newItemCategory}
                                onChange={e => setNewItemCategory(e.target.value)}
                                className="border rounded px-2 py-1 text-sm bg-white"
                            >
                                {expenseCategories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="isVariable"
                                checked={isVariable}
                                onChange={e => setIsVariable(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="isVariable" className="text-xs cursor-pointer select-none text-slate-600">{t.variableAmount}</label>
                        </div>
                        <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold py-2 rounded">
                            {t.save}
                        </button>
                    </form>
                </div>
            </div>

            {/* Category Budgets */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <Target className="text-rose-500" size={20} />
                    Category Budgets ({t.usdEq})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgetedCategories.map((cat) => {
                        const spent = currentMonthSpend[cat.name] || 0;
                        const limit = cat.budget || 0;
                        const percentage = Math.min(100, (spent / limit) * 100);
                        const isOver = spent > limit;

                        return (
                            <div key={cat.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="font-medium text-slate-800">{cat.name}</p>
                                        <p className="text-xs text-slate-500">{isOver ? t.overBudget : t.onTrack}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>${spent.toFixed(0)}</span>
                                        <span className="text-slate-400 text-sm"> / ${limit}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                    {budgetedCategories.length === 0 && (
                        <div className="col-span-full text-center text-slate-400 py-8">
                            No budgets set. Go to Settings to add budgets to your categories.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};