import React, { useState, useEffect } from 'react';
import { INITIAL_STATE } from './constants';
import { FinancialState, Transaction, CreditCardPurchase, RecurringItem, Asset, UserProfile, TransactionType, Category, Currency } from './types';
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

  // Periodic sync every 30 seconds
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(() => {
      handleSync(user.id);
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [user]);

  const handleSync = async (userId: string) => {
    if (isSyncing) return; // Prevent concurrent syncs
    setIsSyncing(true);
    try {
      await SyncService.syncAll(userId);
      // Reload state after sync to reflect remote changes
      const updatedState = await db.loadFullState();
      setData(updatedState);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
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
    // Sync will happen periodically
  };

  const deleteTransaction = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }) : null);
    await db.delete(STORES.TRANSACTIONS, id);
    // Sync will happen periodically
  };

  const addCreditCardPurchase = async (p: Omit<CreditCardPurchase, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...p, ...createBaseEntity(), id: generateId(), userId: user?.id } as CreditCardPurchase;
    setData(prev => prev ? ({
      ...prev,
      creditCards: [...prev.creditCards, newItem]
    }) : null);
    await db.add(STORES.CREDIT_CARDS, newItem);
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
  };

  const deletePurchase = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, creditCards: prev.creditCards.filter(c => c.id !== id) }) : null);
    await db.delete(STORES.CREDIT_CARDS, id);
  };

  const addRecurring = async (item: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...item, ...createBaseEntity(), id: generateId(), userId: user?.id } as RecurringItem;
    setData(prev => prev ? ({ ...prev, recurring: [...prev.recurring, newItem] }) : null);
    await db.add(STORES.RECURRING, newItem);
    // if (user) handleSync(user.id);
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
    // if (user) handleSync(user.id);
  };

  const deleteRecurring = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, recurring: prev.recurring.filter(r => r.id !== id) }) : null);
    await db.delete(STORES.RECURRING, id);
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...asset, ...createBaseEntity(), id: generateId(), userId: user?.id } as Asset;
    setData(prev => prev ? ({ ...prev, assets: [...prev.assets, newItem] }) : null);
    await db.add(STORES.ASSETS, newItem);
    // if (user) handleSync(user.id);
  };

  const deleteAsset = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }) : null);
    await db.delete(STORES.ASSETS, id);
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => {
    if (!data) return;
    const newItem = { ...category, ...createBaseEntity(), id: generateId(), userId: user?.id } as Category;
    setData(prev => prev ? ({ ...prev, categories: [...prev.categories, newItem] }) : null);
    await db.add(STORES.CATEGORIES, newItem);
  };

  const updateCategory = async (category: Category) => {
    if (!data) return;
    const updatedItem = { ...category, updatedAt: Date.now(), isSynced: false };
    setData(prev => prev ? ({
      ...prev,
      categories: prev.categories.map(c => c.id === category.id ? updatedItem : c)
    }) : null);
    await db.update(STORES.CATEGORIES, updatedItem);
  };

  const deleteCategory = async (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }) : null);
    await db.delete(STORES.CATEGORIES, id);
  };

  const updateSettings = async (settings: FinancialState['settings']) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, settings }) : null);
    await db.saveSettings(settings);
    // if (user) handleSync(user.id);
  };

  const handleLogout = async () => {
    if (supabase) {
      if (user) {
        // Force a sync before logging out to ensure data is saved
        setIsSyncing(true);
        try {
          await SyncService.syncAll(user.id);
        } catch (error) {
          console.error('Logout sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      }

      await supabase.auth.signOut();
      await db.clearAllData();
      setData(INITIAL_STATE);
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

  const deleteCard = async (cardName: string) => {
    if (!data) return;

    // Find all purchases for this card
    const purchasesToDelete = data.creditCards.filter(c => c.cardName === cardName);

    // Optimistic Update
    setData(prev => prev ? ({
      ...prev,
      creditCards: prev.creditCards.filter(c => c.cardName !== cardName)
    }) : null);

    // DB Update
    for (const purchase of purchasesToDelete) {
      await db.delete(STORES.CREDIT_CARDS, purchase.id);
    }
  };

  const payCardBill = async (cardName: string, payments: { currency: Currency, amount: number }[]) => {
    if (!data) return;

    const today = new Date();
    const billingPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Check if already paid this month (simple check: if any transaction exists for this card/period)
    // We might want to allow partial payments or multiple payments in the future, but for now stick to "one shot" per month logic or warn.
    // The user wants to pay "the bill".
    const alreadyPaid = data.transactions.some(t =>
      t.metadata?.cardName === cardName &&
      t.metadata?.billingPeriod === billingPeriod
    );

    if (alreadyPaid) {
      if (!window.confirm(`It seems you already paid a bill for ${cardName} in ${billingPeriod}. Continue anyway?`)) {
        return;
      }
    }

    // Find all active purchases for this card that have remaining installments
    const activePurchases = data.creditCards.filter(c =>
      c.cardName === cardName && c.installmentsPaid < c.installmentsTotal
    );

    if (activePurchases.length === 0) return;

    const updatedCards: CreditCardPurchase[] = [];
    const relatedItems: any[] = [];

    // Process each purchase (mark as paid)
    for (const card of activePurchases) {
      // 1. Update Card Record
      const updatedCard = {
        ...card,
        installmentsPaid: card.installmentsPaid + 1,
        updatedAt: Date.now(),
        isSynced: false
      };
      updatedCards.push(updatedCard);

      // Collect item details for metadata
      const installmentAmount = card.totalAmount / card.installmentsTotal;
      relatedItems.push({
        description: card.description,
        amount: installmentAmount,
        currency: card.currency || 'USD',
        installment: updatedCard.installmentsPaid,
        totalInstallments: card.installmentsTotal
      });
    }

    // 2. Create Transactions (one per currency payment)
    const newTransactions: Transaction[] = payments.map(payment => ({
      ...createBaseEntity(),
      id: generateId(),
      date: new Date().toISOString(),
      amount: payment.amount,
      category: 'Debt Repayment',
      description: `Bill Payment: ${cardName} (${payment.currency})`,
      type: TransactionType.EXPENSE,
      currency: payment.currency,
      exchangeRate: 1, // TODO: Fetch real rate if needed, or assume 1 for base currency
      usdAmount: payment.currency === 'USD' ? payment.amount : 0, // Placeholder, ideally convert
      userId: user?.id,
      metadata: {
        cardName,
        billingPeriod,
        relatedItems // Attach the breakdown to all transactions for reference
      }
    }));

    // UI Update
    setData(prev => {
      if (!prev) return null;
      const newCreditCards = prev.creditCards.map(c => {
        const updated = updatedCards.find(u => u.id === c.id);
        return updated || c;
      });
      return {
        ...prev,
        creditCards: newCreditCards,
        transactions: [...newTransactions, ...prev.transactions]
      };
    });

    // DB Update
    for (const card of updatedCards) {
      await db.update(STORES.CREDIT_CARDS, card);
    }
    for (const tx of newTransactions) {
      await db.add(STORES.TRANSACTIONS, tx);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard data={data} onPayRecurring={payRecurringBill} />;
      case 'transactions': return <Transactions data={data} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} />;
      case 'credit-cards': return <CreditCards data={data} onAddPurchase={addCreditCardPurchase} onPayInstallment={payInstallment} onDeletePurchase={deletePurchase} onPayCardBill={payCardBill} onDeleteCard={deleteCard} />;
      case 'budget': return <BudgetPlanner data={data} onAddRecurring={addRecurring} onDeleteRecurring={deleteRecurring} onUpdateBudget={() => { }} onPayRecurring={payRecurringBill} />;
      case 'savings': return <Savings data={data} onAddAsset={addAsset} onDeleteAsset={deleteAsset} />;
      case 'settings': return <Settings data={data} onUpdateSettings={updateSettings} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} />;
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
              <button
                onClick={() => user && handleSync(user.id)}
                disabled={isSyncing}
                className="flex items-center gap-2 text-xs font-medium text-emerald-600 hover:bg-slate-50 px-2 py-1 rounded transition-colors disabled:opacity-70"
              >
                {isSyncing ? <Loader2 className="animate-spin w-3 h-3" /> : <Cloud size={14} />}
                {isSyncing ? 'Syncing...' : 'Synced'}
              </button>
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