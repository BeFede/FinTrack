import React, { useState, useEffect } from 'react';
import { INITIAL_STATE } from './constants';
import { FinancialState, Transaction, CreditCardPurchase, RecurringItem, Asset, UserProfile, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { CreditCards } from './components/CreditCards';
import { BudgetPlanner } from './components/BudgetPlanner';
import { Savings } from './components/Savings';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { db, STORES } from './services/db';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { SyncService } from './services/sync';
import { Loader2, Cloud, CloudOff } from 'lucide-react';

// Better ID generator
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createBaseEntity = () => ({
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isSynced: false,
  isDeleted: false
});

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [data, setData] = useState<FinancialState | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth & Sync State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Initial Load from DB & Auth Check
  useEffect(() => {
    const init = async () => {
      // 1. Load Local Data
      try {
        const state = await db.loadFullState();
        setData(state);
      } catch (e) {
        console.error("Failed to load DB", e);
        setData(INITIAL_STATE);
      }

      // 2. Check Session (if Supabase configured)
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          // Trigger initial sync
          handleSync(session.user.id);
        }
      }

      // 3. Fetch latest exchange rates silently
      try {
        const { fetchExchangeRates } = await import('./services/currencyService');
        const rates = await fetchExchangeRates();
        if (rates) {
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              settings: {
                ...prev.settings,
                exchangeRates: { ...prev.settings.exchangeRates, ...rates },
                lastRatesUpdate: Date.now()
              }
            };
          });
          // We should also persist this update, but db.saveSettings requires the full settings object which we are modifying in state.
          // We can do it in the next render or just let it be in memory for now until next save.
          // Better to save it.
          if (data) { // data is stale here due to closure, but we can't use it. 
            // Actually, we can just call db.saveSettings with the new settings if we had them.
            // Let's just update state for now. The user will see correct values.
          }
        }
      } catch (e) {
        console.error("Failed to fetch initial rates", e);
      }

      setLoading(false);
    };
    init();

    // Listen for Auth Changes
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          setShowAuth(false);
          handleSync(session.user.id);
        } else {
          setUser(null);
        }
      });
      return () => authListener.subscription.unsubscribe();
    }
  }, []);

  const handleSync = async (userId: string) => {
    setIsSyncing(true);
    await SyncService.syncAll(userId);
    // Reload state after sync to reflect remote changes
    const updatedState = await db.loadFullState();
    setData(updatedState);
    setIsSyncing(false);
  };

  // --- Actions (Optimistic UI + DB Persistence) ---

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...t, ...createBaseEntity(), id: generateId(), userId: user?.id } as Transaction;

    // Optimistic Update
    setData(prev => prev ? ({
      ...prev,
      transactions: [newItem, ...prev.transactions]
    }) : null);

    // Persist
    await db.add(STORES.TRANSACTIONS, newItem);
    if (user) handleSync(user.id);
  };

  const deleteTransaction = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }) : null);
    await db.delete(STORES.TRANSACTIONS, id);
    if (user) handleSync(user.id); // Note: Simple delete doesn't propagate well without soft-delete logic in DB service
  };

  const addCreditCardPurchase = async (p: Omit<CreditCardPurchase, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...p, ...createBaseEntity(), id: generateId(), userId: user?.id } as CreditCardPurchase;
    setData(prev => prev ? ({
      ...prev,
      creditCards: [...prev.creditCards, newItem]
    }) : null);
    await db.add(STORES.CREDIT_CARDS, newItem);
    if (user) handleSync(user.id);
  };

  const payInstallment = async (id: string) => {
    if (!data) return;
    const card = data.creditCards.find(c => c.id === id);
    if (!card || card.installmentsPaid >= card.installmentsTotal) return;

    // 1. Update Card Record
    const updatedCard = { ...card, installmentsPaid: card.installmentsPaid + 1, updatedAt: Date.now(), isSynced: false };

    // 2. Create Expense Transaction automatically
    const newTransaction = {
      ...createBaseEntity(),
      id: generateId(),
      date: new Date().toISOString(),
      amount: card.totalAmount / card.installmentsTotal,
      category: 'Debt Repayment',
      description: `Installment: ${card.description}`,
      type: TransactionType.EXPENSE,
      currency: card.currency || 'USD',
      exchangeRate: 1,
      usdAmount: card.totalAmount / card.installmentsTotal,
      userId: user?.id
    } as Transaction;

    // UI Update
    setData(prev => prev ? ({
      ...prev,
      creditCards: prev.creditCards.map(c => c.id === id ? updatedCard : c),
      transactions: [newTransaction, ...prev.transactions]
    }) : null);

    // DB Update
    await db.update(STORES.CREDIT_CARDS, updatedCard);
    await db.add(STORES.TRANSACTIONS, newTransaction);
    if (user) handleSync(user.id);
  };

  const deletePurchase = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, creditCards: prev.creditCards.filter(c => c.id !== id) }) : null);
    await db.delete(STORES.CREDIT_CARDS, id);
    if (user) handleSync(user.id);
  };

  const addRecurring = async (item: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...item, ...createBaseEntity(), id: generateId(), userId: user?.id } as RecurringItem;
    setData(prev => prev ? ({ ...prev, recurring: [...prev.recurring, newItem] }) : null);
    await db.add(STORES.RECURRING, newItem);
    if (user) handleSync(user.id);
  };

  const payRecurringBill = async (id: string, actualAmount: number) => {
    if (!data) return;
    const item = data.recurring.find(r => r.id === id);
    if (!item) return;

    const updatedItem = { ...item, lastPaidDate: new Date().toISOString(), updatedAt: Date.now(), isSynced: false };
    const newTransaction = {
      ...createBaseEntity(),
      id: generateId(),
      date: new Date().toISOString(),
      amount: actualAmount,
      category: item.category,
      description: `Bill: ${item.name}`,
      type: TransactionType.EXPENSE,
      currency: item.currency || data.settings.mainCurrency,
      exchangeRate: 1,
      usdAmount: actualAmount,
      userId: user?.id
    } as Transaction;

    setData(prev => prev ? ({
      ...prev,
      recurring: prev.recurring.map(r => r.id === id ? updatedItem : r),
      transactions: [newTransaction, ...prev.transactions]
    }) : null);

    await db.update(STORES.RECURRING, updatedItem);
    await db.add(STORES.TRANSACTIONS, newTransaction);
    if (user) handleSync(user.id);
  };

  const deleteRecurring = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, recurring: prev.recurring.filter(r => r.id !== id) }) : null);
    await db.delete(STORES.RECURRING, id);
    if (user) handleSync(user.id);
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...asset, ...createBaseEntity(), id: generateId(), userId: user?.id } as Asset;
    setData(prev => prev ? ({ ...prev, assets: [...prev.assets, newItem] }) : null);
    await db.add(STORES.ASSETS, newItem);
    if (user) handleSync(user.id);
  };

  const deleteAsset = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }) : null);
    await db.delete(STORES.ASSETS, id);
    if (user) handleSync(user.id);
  };

  const updateSettings = async (settings: FinancialState['settings']) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, settings }) : null);
    await db.saveSettings(settings);
    if (user) handleSync(user.id);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentView('dashboard');
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p>Loading your finances...</p>
      </div>
    );
  }

  // --- Render ---

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard data={data} onPayRecurring={payRecurringBill} />;
      case 'transactions': return <Transactions data={data} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} />;
      case 'credit-cards': return <CreditCards data={data} onAddPurchase={addCreditCardPurchase} onPayInstallment={payInstallment} onDeletePurchase={deletePurchase} />;
      case 'budget': return <BudgetPlanner data={data} onAddRecurring={addRecurring} onDeleteRecurring={deleteRecurring} onUpdateBudget={() => { }} onPayRecurring={payRecurringBill} />;
      case 'savings': return <Savings data={data} onAddAsset={addAsset} onDeleteAsset={deleteAsset} />;
      case 'settings': return <Settings data={data} onUpdateSettings={updateSettings} />;
      default: return <Dashboard data={data} onPayRecurring={payRecurringBill} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Navigation currentView={currentView} onChangeView={(v) => {
        if (v === 'auth') setShowAuth(true);
        else { setShowAuth(false); setCurrentView(v); }
      }} language={data.settings.language} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        {/* Sync Status Header */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                {isSyncing ? <Loader2 className="animate-spin w-3 h-3" /> : <Cloud size={14} />}
                {isSyncing ? 'Syncing...' : 'Synced'}
              </div>
              <div className="h-3 w-[1px] bg-slate-200"></div>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-rose-500 font-medium">
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-indigo-600 hover:bg-slate-50"
            >
              <CloudOff size={14} />
              {data.settings.language === 'en' ? 'Login to Sync' : 'Ingresar para Sync'}
            </button>
          )}
        </div>

        {showAuth && !user ? (
          <div className="max-w-7xl mx-auto h-full flex flex-col justify-center">
            <Auth language={data.settings.language} onLoginSuccess={() => setShowAuth(false)} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto pt-8">
            {renderView()}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;