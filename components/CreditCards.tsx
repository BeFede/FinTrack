import React, { useState, useMemo } from 'react';
import { CreditCardPurchase, FinancialState } from '../types';
import { TRANSLATIONS } from '../constants';
import { CreditCard, Plus, Trash2, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface CreditCardsProps {
  data: FinancialState;
  onAddPurchase: (p: Omit<CreditCardPurchase, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
  onPayInstallment: (id: string) => void;
  onDeletePurchase: (id: string) => void;
  onPayCardBill: (cardName: string, payments: { currency: any, amount: number }[]) => void;
  onDeleteCard: (cardName: string) => void;
}

export const CreditCards: React.FC<CreditCardsProps> = ({ data, onAddPurchase, onPayInstallment, onDeletePurchase, onPayCardBill, onDeleteCard }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [paymentModalCard, setPaymentModalCard] = useState<string | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});

  const t = TRANSLATIONS[data.settings.language];

  // ... (Form State remains same)
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('12');
  const [initialPaid, setInitialPaid] = useState('0');
  const [cardName, setCardName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState(data.settings.mainCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPurchase({
      description,
      totalAmount: parseFloat(totalAmount),
      installmentsTotal: parseInt(installmentsTotal),
      installmentsPaid: parseInt(initialPaid),
      cardName,
      purchaseDate,
      currency
    });
    setIsAdding(false);
    setDescription('');
    setTotalAmount('');
    setCardName('');
    setInitialPaid('0');
  };

  // Group purchases by card name
  const groupedCards = useMemo(() => {
    const groups: Record<string, CreditCardPurchase[]> = {};
    data.creditCards.forEach(card => {
      if (!groups[card.cardName]) {
        groups[card.cardName] = [];
      }
      groups[card.cardName].push(card);
    });
    return groups;
  }, [data.creditCards]);

  const toggleCard = (name: string) => {
    if (expandedCard === name) {
      setExpandedCard(null);
    } else {
      setExpandedCard(name);
    }
  };

  // Helper to find last payment date
  const getLastPaymentDate = (cardName: string) => {
    const payments = data.transactions
      .filter(t => t.metadata?.cardName === cardName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return payments.length > 0 ? new Date(payments[0].date).toLocaleDateString() : null;
  };

  const openPaymentModal = (cardName: string, purchases: CreditCardPurchase[]) => {
    // Calculate totals per currency
    const totals: Record<string, number> = {};
    purchases.forEach(p => {
      if (p.installmentsPaid < p.installmentsTotal) {
        const amount = p.totalAmount / p.installmentsTotal;
        const curr = p.currency || 'USD';
        totals[curr] = (totals[curr] || 0) + amount;
      }
    });

    // Convert to string for inputs
    const initialAmounts: Record<string, string> = {};
    Object.entries(totals).forEach(([curr, amount]) => {
      initialAmounts[curr] = amount.toFixed(2);
    });

    setPaymentAmounts(initialAmounts);
    setPaymentModalCard(cardName);
  };

  const handleConfirmPayment = () => {
    if (!paymentModalCard) return;

    const payments = Object.entries(paymentAmounts)
      .filter(([_, amount]) => parseFloat(amount as string) > 0)
      .map(([curr, amount]) => ({
        currency: curr as any,
        amount: parseFloat(amount as string)
      }));

    onPayCardBill(paymentModalCard, payments);
    setPaymentModalCard(null);
    setPaymentAmounts({});
  };

  return (
    <div className="space-y-6">
      {/* Payment Modal */}
      {paymentModalCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Confirm Payment for {paymentModalCard}</h3>
            <p className="text-slate-500 text-sm mb-6">
              Review and adjust the payment amounts. You can add extra fees or taxes here.
            </p>

            <div className="space-y-4 mb-6">
              {Object.keys(paymentAmounts).length === 0 && (
                <p className="text-center text-slate-400 italic">No pending items found.</p>
              )}
              {Object.entries(paymentAmounts).map(([curr, amount]) => (
                <div key={curr}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total {curr}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{curr}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setPaymentAmounts(prev => ({ ...prev, [curr]: e.target.value }))}
                      className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg"
                    />
                  </div>
                </div>
              ))}

              {/* Allow adding a currency not present? Maybe later. For now assume items define currencies. */}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPaymentModalCard(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 size={18} /> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.creditCards}</h2>
          <p className="text-slate-500 text-sm">{t.trackInstallments}</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} /> {t.addNew}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* ... Form Content (Keep as is, just need to make sure I don't delete it by accident in replacement) ... */}
          {/* Actually, since I'm replacing the whole block, I need to include the form content or use a smaller chunk.
                 Let's use a smaller chunk for the props and then another for the render loop.
                 Wait, the user wants me to replace the whole file content or a block?
                 The tool is replace_file_content. I should be careful.
                 I will replace the top part first to add the prop.
             */}
          <h3 className="text-lg font-semibold mb-4">{t.addNew} {t.creditCards}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.description}</label>
              <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. iPhone 15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.total} {t.amount}</label>
              <input type="number" required step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.installments}</label>
              <input type="number" required min="1" value={installmentsTotal} onChange={(e) => setInstallmentsTotal(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.currency}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* New Field: Initial Paid */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.installmentsPaidAlready}</label>
              <input
                type="number"
                required
                min="0"
                max={parseInt(installmentsTotal) || 12}
                value={initialPaid}
                onChange={(e) => setInitialPaid(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.cardName}</label>
              <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="e.g. Visa Gold" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.date}</label>
              <input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">{t.cancel}</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t.save}</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {Object.entries(groupedCards).map(([cardName, purchases]: [string, CreditCardPurchase[]]) => {
          // Calculate totals for this card
          const totalMonthlyPayment = purchases.reduce((sum, p) => {
            if (p.installmentsPaid >= p.installmentsTotal) return sum;
            return sum + (p.totalAmount / p.installmentsTotal);
          }, 0);

          const totalRemaining = purchases.reduce((sum, p) => {
            const monthly = p.totalAmount / p.installmentsTotal;
            return sum + (p.totalAmount - (monthly * p.installmentsPaid));
          }, 0);

          const hasPendingPayments = purchases.some(p => p.installmentsPaid < p.installmentsTotal);
          const lastPaidDate = getLastPaymentDate(cardName);

          return (
            <div key={cardName} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleCard(cardName)}>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {cardName}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete card "${cardName}" and all its history?`)) {
                            onDeleteCard(cardName);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 size={14} />
                      </button>
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{purchases.length} items</span>
                      <span>•</span>
                      <span>Total Monthly: <span className="font-semibold text-slate-700">${totalMonthlyPayment.toFixed(2)}</span></span>
                      {lastPaidDate && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-emerald-600">Last Paid: {lastPaidDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {expandedCard === cardName ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>

                {hasPendingPayments && (
                  <button
                    onClick={() => openPaymentModal(cardName, purchases)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    <CheckCircle2 size={16} /> Pay Bill
                  </button>
                )}
              </div>

              {/* Card Items (Collapsible) */}
              {(expandedCard === cardName || true) && ( // Keeping it always expanded for now as per common UX, or toggleable
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 ${expandedCard === cardName ? '' : 'hidden'}`}>
                  {purchases.map(p => {
                    const monthlyPayment = p.totalAmount / p.installmentsTotal;
                    const remaining = p.totalAmount - (monthlyPayment * p.installmentsPaid);
                    const progress = (p.installmentsPaid / p.installmentsTotal) * 100;
                    const isFinished = p.installmentsPaid >= p.installmentsTotal;

                    return (
                      <div key={p.id} className="bg-white rounded-lg border border-slate-100 shadow-sm flex flex-col relative group">
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-slate-800 line-clamp-1" title={p.description}>{p.description}</h4>
                            <button onClick={() => onDeletePurchase(p.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">{t.monthlyPayment}</span>
                              <span className="font-medium text-slate-900">${monthlyPayment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">{t.remaining}</span>
                              <span className="font-medium text-rose-600">${remaining.toFixed(2)}</span>
                            </div>

                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>{p.installmentsPaid}/{p.installmentsTotal}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isFinished && (
                          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> Due: 1st
                            </span>
                            <button
                              onClick={() => onPayInstallment(p.id)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              Pay 1
                            </button>
                          </div>
                        )}
                        {isFinished && (
                          <div className="bg-emerald-50 px-4 py-2 border-t border-emerald-100 text-center text-emerald-700 text-xs font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> {t.fullyPaid}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {data.creditCards.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            {t.noTransactionsFilter}
          </div>
        )}
      </div>
    </div>
  );
};