
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Frequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export type Currency = 'USD' | 'ARS' | 'EUR';
export type Language = 'en' | 'es';

export interface UserProfile {
  id: string;
  email: string;
}

// Base interface for all persistable entities to support future backend sync
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean; // false = needs to be pushed to backend
  isDeleted: boolean; // true = soft deleted, needs to be removed from backend
  userId?: string; // For backend RLS
}

export interface AppSettings extends BaseEntity {
  language: Language;
  mainCurrency: Currency;
  exchangeRates: Record<Currency, number>; // Rate relative to USD (e.g. USD: 1, ARS: 1000)
  lastRatesUpdate?: number;
}

export interface Transaction extends BaseEntity {
  date: string; // ISO Date string
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  currency: Currency;
  exchangeRate: number;
  usdAmount: number;
  metadata?: {
    relatedItems?: {
      description: string;
      amount: number;
      installment: number;
      totalInstallments: number;
    }[];
    cardName?: string;
    billingPeriod?: string;
  };
}

export interface CreditCardPurchase extends BaseEntity {
  description: string;
  totalAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  purchaseDate: string;
  cardName: string;
  currency?: Currency;
}

export interface RecurringItem extends BaseEntity {
  name: string;
  amount: number; // If variable, this is the estimated average
  isVariable: boolean;
  category: string;
  dayOfMonth: number; // 1-31
  currency?: Currency;
  lastPaidDate?: string; // ISO Date string of the last payment
}

export interface Asset extends BaseEntity {
  name: string;
  value: number;
  type: 'SAVINGS' | 'INVESTMENT' | 'CASH';
  currency?: Currency;
}

export interface BudgetCategory extends BaseEntity {
  category: string;
  limit: number;
}

export interface Category extends BaseEntity {
  name: string;
  icon: string; // Name of the Lucide icon
  color: string; // Tailwind color class or hex
  budget?: number; // Optional monthly budget
  type: TransactionType; // INCOME or EXPENSE
}

export interface FinancialState {
  transactions: Transaction[];
  creditCards: CreditCardPurchase[];
  recurring: RecurringItem[];
  assets: Asset[];
  budgets: BudgetCategory[];
  categories: Category[];
  settings: AppSettings;
}
