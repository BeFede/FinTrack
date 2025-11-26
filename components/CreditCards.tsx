import React, { useState } from 'react';
import { CreditCardPurchase, FinancialState } from '../types';
import { TRANSLATIONS } from '../constants';
import { CreditCard, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

interface CreditCardsProps {
  data: FinancialState;
  onAddPurchase: (p: Omit<CreditCardPurchase, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
  onPayInstallment: (id: string) => void;
  onDeletePurchase: (id: string) => void;
}

export const CreditCards: React.FC<CreditCardsProps> = ({ data, onAddPurchase, onPayInstallment, onDeletePurchase }) => {
  const [isAdding, setIsAdding] = useState(false);
  const t = TRANSLATIONS[data.settings.language];
  
  // Form State
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('12');
  const [initialPaid, setInitialPaid] = useState('0');
  const [cardName, setCardName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPurchase({
      description,
      totalAmount: parseFloat(totalAmount),
      installmentsTotal: parseInt(installmentsTotal),
      installmentsPaid: parseInt(initialPaid),
      cardName,
      purchaseDate
    });
    setIsAdding(false);
    setDescription('');
    setTotalAmount('');
    setCardName('');
    setInitialPaid('0');
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.creditCards.map(p => {
            const monthlyPayment = p.totalAmount / p.installmentsTotal;
            const remaining = p.totalAmount - (monthlyPayment * p.installmentsPaid);
            const progress = (p.installmentsPaid / p.installmentsTotal) * 100;
            const isFinished = p.installmentsPaid >= p.installmentsTotal;

            return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">{p.description}</h3>
                                    <p className="text-xs text-slate-500">{p.cardName}</p>
                                </div>
                            </div>
                            <button onClick={() => onDeletePurchase(p.id)} className="text-slate-300 hover:text-rose-500">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">{t.monthlyPayment}</span>
                                <span className="font-medium text-slate-900">${monthlyPayment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">{t.remaining}</span>
                                <span className="font-medium text-rose-600">${remaining.toFixed(2)}</span>
                            </div>
                            
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>{p.installmentsPaid} / {p.installmentsTotal} {t.paid}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {!isFinished && (
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar size={14} /> {t.nextDue}: 1st
                            </span>
                            <button 
                                onClick={() => onPayInstallment(p.id)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                <CheckCircle2 size={16} /> {t.payOne}
                            </button>
                        </div>
                    )}
                     {isFinished && (
                        <div className="bg-emerald-50 p-4 border-t border-emerald-100 text-center text-emerald-700 text-sm font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> {t.fullyPaid}
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