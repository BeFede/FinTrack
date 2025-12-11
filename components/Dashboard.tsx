import React, { useState, useMemo } from 'react';
import { FinancialState, TransactionType, Currency, RecurringItem } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { TrendingUp, TrendingDown, Wallet, PieChart, Sparkles, Loader2, Filter, BarChart3, Bell, DollarSign } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DashboardProps {
  data: FinancialState;
  onPayRecurring?: (id: string, amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onPayRecurring }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  // Default to mainCurrency from settings instead of ALL
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | Currency>(data.settings.mainCurrency);

  const t = TRANSLATIONS[data.settings.language];
  const mainCurrency = data.settings.mainCurrency;

  const { exchangeRates } = data.settings;

  // Helper to convert currency
  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency) => {
    if (fromCurrency === toCurrency) return amount;
    // Convert to USD first (Base)
    const amountInUSD = amount / (exchangeRates[fromCurrency] || 1);
    // Convert to Target
    return amountInUSD * (exchangeRates[toCurrency] || 1);
  };

  // --- Alert Logic for Recurring Bills ---
  const billAlerts = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    return data.recurring.map(item => {
      const lastPaid = item.lastPaidDate ? new Date(item.lastPaidDate) : null;
      const isPaidThisMonth = lastPaid && lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear;

      if (isPaidThisMonth) return null;

      // Calculate due date for this month
      const dueDate = new Date(currentYear, currentMonth, item.dayOfMonth);

      // Calculate days diff
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert if Overdue (diffDays < 0) or Due Soon (diffDays <= 7)
      if (diffDays <= 7) {
        return { item, diffDays };
      }
      return null;
    }).filter(Boolean) as { item: RecurringItem, diffDays: number }[];
  }, [data.recurring]);

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

  // Filter Transactions logic
  const filteredTransactions = useMemo(() => {
    if (currencyFilter === 'ALL') return data.transactions;
    return data.transactions.filter(t => t.currency === currencyFilter);
  }, [data.transactions, currencyFilter]);

  // Calculate Totals based on filter
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    console.log('Dashboard Calculation Start');
    console.log('Currency Filter:', currencyFilter);
    console.log('Main Currency:', mainCurrency);
    console.log('Filtered Transactions Length:', filteredTransactions.length);

    let inc = 0;
    let exp = 0;
    const targetCurrency = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;

    filteredTransactions.forEach(t => {
      const val = convertCurrency(t.amount, t.currency, targetCurrency);
      // console.log(`Tx: ${t.description}, Amount: ${t.amount} ${t.currency} -> ${val} ${targetCurrency}, Type: ${t.type}`);

      if (t.type === TransactionType.INCOME) inc += val;
      else if (t.type === TransactionType.EXPENSE) exp += val;
    });

    console.log('Calculated Totals:', { inc, exp });
    return { totalIncome: inc, totalExpense: exp, netBalance: inc - exp };
  }, [filteredTransactions, currencyFilter, mainCurrency, exchangeRates]);

  // Calculate Assets based on filter
  const totalInvestments = useMemo(() => {
    const targetCurrency = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;

    return data.assets.reduce((sum, a) => {
      // If asset has no currency defined, assume USD
      const assetCurrency = a.currency || 'USD';

      // If filtering specific currency, only include matching assets (or convert if we want to show value of all assets in that currency? 
      // Usually "Filter by USD" means "Show me my USD assets". But "ALL" means "Show me everything converted to Main".
      // Let's stick to: Filter = Show only items in that currency. ALL = Show all converted to Main.

      if (currencyFilter !== 'ALL' && assetCurrency !== currencyFilter) {
        return sum;
      }

      const val = convertCurrency(a.value, assetCurrency, targetCurrency);
      return sum + val;
    }, 0);
  }, [data.assets, currencyFilter, mainCurrency, exchangeRates]);

  const totalCreditDebt = data.creditCards.reduce((sum, card) => {
    const targetCurrency = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;

    // Only count debt if it matches filter or if filter is ALL
    if (currencyFilter !== 'ALL' && card.currency && card.currency !== currencyFilter) return sum;

    const remainingInstallments = card.installmentsTotal - card.installmentsPaid;
    const monthlyAmount = card.totalAmount / card.installmentsTotal;
    const debtAmount = remainingInstallments * monthlyAmount;

    return sum + convertCurrency(debtAmount, card.currency || 'USD', targetCurrency);
  }, 0);

  // --- Chart Data Preparation ---

  // 1. Spending Trend (Last 6 months)
  const spendingTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const today = new Date();
    const targetCurrency = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = 0;
    }

    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const d = new Date(t.date);
        // Simple check if within last ~6 months roughly
        const key = d.toLocaleString('default', { month: 'short' });
        if (months[key] !== undefined) {
          const val = convertCurrency(t.amount, t.currency, targetCurrency);
          months[key] += val;
        }
      });

    return Object.entries(months).map(([month, amount]) => ({ month, amount }));
  }, [filteredTransactions, currencyFilter, mainCurrency, exchangeRates]);

  const maxSpend = Math.max(...spendingTrend.map(d => d.amount), 1); // Avoid div by 0

  // 2. Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    const targetCurrency = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;

    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const val = convertCurrency(t.amount, t.currency, targetCurrency);
        cats[t.category] = (cats[t.category] || 0) + val;
      });

    // Sort and take top 4
    const sorted = Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const totalCtxExpense = sorted.reduce((sum, [, val]) => sum + val, 0);

    return sorted.map(([cat, val]) => ({
      cat,
      val,
      percent: totalCtxExpense > 0 ? (val / totalCtxExpense) * 100 : 0
    }));
  }, [filteredTransactions, currencyFilter, mainCurrency, exchangeRates]);

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    const result = await getFinancialInsights(data);
    setInsights(result);
    setLoadingInsights(false);
  };

  const formatMoney = (amount: number) => {
    // If ALL, we display mainCurrency. If specific, display that currency.
    let code = currencyFilter === 'ALL' ? mainCurrency : currencyFilter;
    if (!code) code = 'USD'; // Fallback safety
    try {
      return amount.toLocaleString(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 });
    } catch (e) {
      console.error("Format money error", e);
      return `$${amount.toFixed(0)}`;
    }
  }

  const IconRenderer = ({ iconName, className }: { iconName: string, className?: string }) => {
    try {
      // Safety check for LucideIcons namespace
      const Icon = (LucideIcons as any)?.[iconName] || LucideIcons.HelpCircle;
      return <Icon className={className} size={14} />;
    } catch (e) {
      return <LucideIcons.HelpCircle className={className} size={14} />;
    }
  };

  const getCategoryDetails = (catName: string) => {
    const cat = data.categories.find(c => c.name === catName);
    if (cat) {
      return {
        icon: cat.icon,
        color: cat.color,
        bg: 'bg-slate-100', // Default bg
        badge: 'bg-slate-100'
      };
    }
    return {
      icon: 'DollarSign',
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      badge: 'bg-slate-100'
    };
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.welcome}</h1>
          <p className="text-slate-500">{t.welcomeSub}</p>
        </div>

        {/* Currency Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <div className="px-2 text-slate-400">
            <Filter size={16} />
          </div>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2 py-1 cursor-pointer"
          >
            <option value="ALL">{t.allCurrencies}</option>
            <option value="USD">USD Only</option>
            <option value="ARS">ARS Only</option>
            <option value="EUR">EUR Only</option>
          </select>
        </div>
      </header>

      {/* Bill Alerts Section */}
      {billAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="text-amber-600 w-5 h-5" />
            <h3 className="font-semibold text-amber-900">{t.upcomingPayments}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {billAlerts.map(({ item, diffDays }) => {
              const isOverdue = diffDays < 0;
              return (
                <div key={item.id} className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${isOverdue ? 'border-l-rose-500' : 'border-l-amber-400'} flex justify-between items-center`}>
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className={`text-xs font-semibold ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                      {isOverdue ? `${t.overdue} ${Math.abs(diffDays)} ${t.days}` : diffDays === 0 ? t.today : `${t.dueIn} ${diffDays} ${t.days}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePayBill(item)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors"
                  >
                    {t.markAsPaid}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">{t.netBalance}</span>
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatMoney(netBalance)}</div>
          <div className="text-xs text-slate-400 mt-1">{currencyFilter === 'ALL' ? `${mainCurrency} Eq.` : currencyFilter}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">{t.monthlyIncome}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">+{formatMoney(totalIncome)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">{t.monthlyExpenses}</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">-{formatMoney(totalExpense)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">{t.totalAssets}</span>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {totalInvestments.toLocaleString(undefined, { style: 'currency', currency: currencyFilter === 'ALL' ? mainCurrency : currencyFilter, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">{t.savings} {currencyFilter === 'ALL' ? '(Global)' : `(${currencyFilter})`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart - Spending Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-slate-400 w-5 h-5" />
                <h3 className="font-semibold text-slate-800">{t.spendingTrend}</h3>
              </div>
              <div className="flex items-end justify-between h-40 gap-2">
                {spendingTrend.map((item, idx) => {
                  const heightPerc = maxSpend > 0 ? (item.amount / maxSpend) * 100 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                        {formatMoney(item.amount)}
                      </div>
                      <div
                        className="w-full bg-indigo-100 hover:bg-indigo-200 rounded-t-sm transition-all duration-500 relative"
                        style={{ height: `${Math.max(heightPerc, 5)}%` }} // min height for visibility
                      >
                        <div className="absolute bottom-0 w-full bg-indigo-500 opacity-20 h-full"></div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Donut/List Chart - Categories */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="text-slate-400 w-5 h-5" />
                <h3 className="font-semibold text-slate-800">{t.categoryBreakdown}</h3>
              </div>
              <div className="space-y-4">
                {categoryBreakdown.map((item, idx) => {
                  const details = getCategoryDetails(item.cat);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${details.bg} flex items-center justify-center`}>
                            <IconRenderer iconName={details.icon} className={`w-4 h-4 ${details.color}`} />
                          </div>
                          <span className="text-slate-600 font-medium">{item.cat}</span>
                        </div>
                        <span className="text-slate-800 font-bold">{formatMoney(item.val)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${details.color.replace('text-', 'bg-')}`}
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {categoryBreakdown.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-8">{t.noTransactionsFilter}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions Preview */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.recentTransactions}</h3>
            <div className="space-y-4">
              {filteredTransactions.slice(0, 5).map(tx => {
                const details = getCategoryDetails(tx.category);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${details.bg} flex items-center justify-center`}>
                        <IconRenderer iconName={details.icon} className={`${details.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{tx.description}</p>
                        <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {tx.type === TransactionType.INCOME ? '+' : '-'}
                      {tx.amount.toLocaleString(undefined, { style: 'currency', currency: tx.currency || 'USD' })}
                    </span>
                  </div>
                );
              })}
              {filteredTransactions.length === 0 && <p className="text-slate-500 text-center py-4">{t.noTransactions}</p>}
            </div>
          </div>
        </div>

        {/* Sidebar / Insights Area */}
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-indigo-600 w-5 h-5" />
              <h3 className="text-lg font-semibold text-indigo-900">{t.aiAdvisor}</h3>
            </div>

            {!insights && !loadingInsights && (
              <div className="text-center py-6">
                <p className="text-indigo-800/70 text-sm mb-4">Get personalized insights based on your spending, debts, and budgets.</p>
                <button
                  onClick={handleGenerateInsights}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {t.analyze}
                </button>
              </div>
            )}

            {loadingInsights && (
              <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm font-medium">{t.thinking}</span>
              </div>
            )}

            {insights && (
              <div className="bg-white/60 p-4 rounded-lg text-sm text-indigo-900 leading-relaxed border border-indigo-100/50">
                <div className="markdown-prose whitespace-pre-wrap font-medium">
                  {insights}
                </div>
                <button
                  onClick={() => setInsights(null)}
                  className="mt-4 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  {t.delete}
                </button>
              </div>
            )}
          </div>

          {/* Quick Debt Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t.outstandingDebt}</h3>
            <div className="text-3xl font-bold text-slate-800">{formatMoney(totalCreditDebt)}</div>
            <p className="text-xs text-slate-500 mt-2">{t.total} {t.remaining} {t.installments}</p>
          </div>
        </div>
      </div>
    </div>
  );
};