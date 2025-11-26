import React, { useState } from 'react';
import { FinancialState, Transaction, TransactionType, Currency } from '../types';
import { CATEGORIES, TRANSLATIONS, CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { Plus, Trash2, Filter, Home, UtensilsCrossed, Car, Zap, Tv, Heart, ShoppingBag, Plane, CreditCard, Briefcase, Laptop, TrendingUp, DollarSign } from 'lucide-react';

interface TransactionsProps {
  data: FinancialState;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ data, onAddTransaction, onDeleteTransaction }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const t = TRANSLATIONS[data.settings.language];

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>(data.settings.mainCurrency);
  const [exchangeRate, setExchangeRate] = useState('1');

  const [loadingRate, setLoadingRate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    let rate = 1;

    setLoadingRate(true);

    if (currency !== 'USD') {
      // Fetch latest rate for this specific transaction
      // We can import fetchExchangeRates from services/currencyService
      // But we need to import it first. 
      // Since I cannot add import in this block, I will assume I will add it in a separate block or use a dynamic import if needed, 
      // but better to add import at top. 
      // For now, I'll write the logic assuming fetchExchangeRates is available.
      try {
        const rates = await import('../services/currencyService').then(m => m.fetchExchangeRates());
        if (rates && rates[currency]) {
          rate = rates[currency];
        } else {
          // Fallback to manual input or settings if fetch fails? 
          // User said "read from internet", so we try that. 
          // If fail, maybe use the one in settings? 
          // But we don't have access to settings here easily without prop drilling or context.
          // data.settings is available in props.
          rate = data.settings.exchangeRates[currency] || 1;
        }
      } catch (error) {
        console.error("Failed to fetch rate", error);
        rate = data.settings.exchangeRates[currency] || 1;
      }
    }

    let usdAmount = numAmount;
    if (currency !== 'USD') {
      usdAmount = numAmount / rate;
    }

    onAddTransaction({
      date: new Date(date).toISOString(),
      amount: numAmount,
      description,
      type,
      category,
      currency,
      exchangeRate: rate,
      usdAmount
    });

    setLoadingRate(false);
    setIsAdding(false);
    // Reset form
    setDescription('');
    setAmount('');
    setExchangeRate('1');
  };

  const filteredTransactions = data.transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  // Helper to get icon component for category
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Home': Home,
      'UtensilsCrossed': UtensilsCrossed,
      'Car': Car,
      'Zap': Zap,
      'Tv': Tv,
      'Heart': Heart,
      'ShoppingBag': ShoppingBag,
      'Plane': Plane,
      'CreditCard': CreditCard,
      'Briefcase': Briefcase,
      'Laptop': Laptop,
      'TrendingUp': TrendingUp,
      'DollarSign': DollarSign
    };
    const iconName = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
    return iconMap[iconName] || DollarSign;
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{t.transactions}</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} /> {t.addNew}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold mb-4">{t.addNew} {t.transactions}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.type}</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setType(TransactionType.EXPENSE); setCategory(CATEGORIES.EXPENSE[0]); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  {t.expense}
                </button>
                <button
                  type="button"
                  onClick={() => { setType(TransactionType.INCOME); setCategory(CATEGORIES.INCOME[0]); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  {t.income}
                </button>
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.currency}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.amount}</label>
              <input
                type="number"
                required
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {(type === TransactionType.INCOME ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.description}</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Weekly Groceries"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              {loadingRate ? 'Saving...' : t.save}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('INCOME')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filterType === 'INCOME' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
        >
          {t.income}
        </button>
        <button
          onClick={() => setFilterType('EXPENSE')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filterType === 'EXPENSE' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
        >
          {t.expense}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">{t.date}</th>
              <th className="p-4">{t.description}</th>
              <th className="p-4">{t.category}</th>
              <th className="p-4 text-right">{t.amount}</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map(tx => {
              const IconComponent = getCategoryIcon(tx.category);
              const colors = CATEGORY_COLORS[tx.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['Other'];
              return (
                <tr key={tx.id} className="hover:bg-slate-50/50 group">
                  <td className="p-4 text-sm text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium text-slate-800">
                    {tx.description}
                    {tx.currency && tx.currency !== 'USD' && (
                      <div className="text-xs text-slate-400">
                        {t.usdEq}: ${tx.usdAmount?.toFixed(2)} (@{tx.exchangeRate})
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    <span className={`${colors.badge} ${colors.text} px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5`}>
                      <IconComponent size={14} className={colors.icon} />
                      {tx.category}
                    </span>
                  </td>
                  <td className={`p-4 text-sm font-semibold text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'}
                    {tx.amount.toLocaleString(undefined, { style: 'currency', currency: tx.currency || 'USD' })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">{t.noTransactionsFilter}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};