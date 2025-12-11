import React, { useState } from 'react';
import { FinancialState, Transaction, TransactionType, Currency } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Filter, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface TransactionsProps {
  data: FinancialState;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ data, onAddTransaction, onDeleteTransaction }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const t = TRANSLATIONS[data.settings.language];

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  // Default category selection based on type
  const availableCategories = data.categories.filter(c => c.type === type && !c.isDeleted);
  const [category, setCategory] = useState(availableCategories[0]?.name || '');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>(data.settings.mainCurrency);
  const [exchangeRate, setExchangeRate] = useState('1');

  const [loadingRate, setLoadingRate] = useState(false);

  // Update category when type changes
  React.useEffect(() => {
    const cats = data.categories.filter(c => c.type === type && !c.isDeleted);
    if (cats.length > 0) {
      setCategory(cats[0].name);
    } else {
      setCategory('');
    }
  }, [type, data.categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    let rate = 1;

    setLoadingRate(true);

    if (currency !== 'USD') {
      try {
        const rates = await import('../services/currencyService').then(m => m.fetchExchangeRates());
        if (rates && rates[currency]) {
          rate = rates[currency];
        } else {
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

  const IconRenderer = ({ iconName, className }: { iconName: string, className?: string }) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return <Icon className={className} size={14} />;
  };

  const getCategoryDetails = (catName: string) => {
    const cat = data.categories.find(c => c.name === catName);
    if (cat) {
      return {
        icon: cat.icon,
        color: cat.color,
        badge: 'bg-slate-100' // Default badge background
      };
    }
    return {
      icon: 'DollarSign',
      color: 'text-slate-600',
      badge: 'bg-slate-100'
    };
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
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  {t.expense}
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
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
                {availableCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="p-4 whitespace-nowrap">{t.date}</th>
                <th className="p-4 whitespace-nowrap">{t.description}</th>
                <th className="p-4 whitespace-nowrap">{t.category}</th>
                <th className="p-4 text-right whitespace-nowrap">{t.amount}</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const details = getCategoryDetails(tx.category);
                const hasDetails = tx.metadata?.relatedItems && tx.metadata.relatedItems.length > 0;
                const isExpanded = expandedTx === tx.id;

                return (
                  <React.Fragment key={tx.id}>
                    <tr className="hover:bg-slate-50/50 group transition-colors">
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium text-slate-800">
                        <div className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            {tx.description}
                            {hasDetails && (
                              <button
                                onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1 transition-colors"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                                {isExpanded ? <LucideIcons.ChevronUp size={12} /> : <LucideIcons.ChevronDown size={12} />}
                              </button>
                            )}
                          </div>
                          {tx.currency && tx.currency !== 'USD' && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {t.usdEq}: ${tx.usdAmount?.toFixed(2)} (@{tx.exchangeRate})
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        <span className={`${details.badge} ${details.color} px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap`}>
                          <IconRenderer iconName={details.icon} className={details.color} />
                          {tx.category}
                        </span>
                      </td>
                      <td className={`p-4 text-sm font-semibold text-right whitespace-nowrap ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}
                        {tx.amount.toLocaleString(undefined, { style: 'currency', currency: tx.currency || 'USD' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <td colSpan={5} className="p-4 pl-12">
                          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Payment Breakdown ({tx.metadata?.cardName})
                            </div>
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-slate-400 bg-slate-50/50">
                                <tr>
                                  <th className="px-4 py-2 font-medium">Item</th>
                                  <th className="px-4 py-2 font-medium">Installment</th>
                                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tx.metadata!.relatedItems!.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-700">{item.description}</td>
                                    <td className="px-4 py-2 text-slate-500">
                                      {item.installment} / {item.totalInstallments}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700 font-medium text-right">
                                      {item.amount.toLocaleString(undefined, { style: 'currency', currency: tx.currency || 'USD' })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
    </div>
  );
};