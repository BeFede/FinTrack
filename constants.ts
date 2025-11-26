
import { FinancialState, TransactionType } from './types';

export const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Dividends', 'Other'],
  EXPENSE: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Travel', 'Debt Repayment']
};

// Icon names mapping for categories (using Lucide React icon names)
export const CATEGORY_ICONS = {
  // Expense Categories
  'Housing': 'Home',
  'Food': 'UtensilsCrossed',
  'Transport': 'Car',
  'Utilities': 'Zap',
  'Entertainment': 'Tv',
  'Health': 'Heart',
  'Shopping': 'ShoppingBag',
  'Travel': 'Plane',
  'Debt Repayment': 'CreditCard',
  // Income Categories
  'Salary': 'Briefcase',
  'Freelance': 'Laptop',
  'Dividends': 'TrendingUp',
  'Other': 'DollarSign'
} as const;

// Color schemes for categories (bg, text, border)
export const CATEGORY_COLORS = {
  // Expense Categories
  'Housing': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: 'text-blue-600',
    badge: 'bg-blue-50'
  },
  'Food': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    icon: 'text-orange-600',
    badge: 'bg-orange-50'
  },
  'Transport': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    icon: 'text-purple-600',
    badge: 'bg-purple-50'
  },
  'Utilities': {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-50'
  },
  'Entertainment': {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
    icon: 'text-pink-600',
    badge: 'bg-pink-50'
  },
  'Health': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: 'text-red-600',
    badge: 'bg-red-50'
  },
  'Shopping': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    icon: 'text-indigo-600',
    badge: 'bg-indigo-50'
  },
  'Travel': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-300',
    icon: 'text-cyan-600',
    badge: 'bg-cyan-50'
  },
  'Debt Repayment': {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    icon: 'text-rose-600',
    badge: 'bg-rose-50'
  },
  // Income Categories
  'Salary': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-50'
  },
  'Freelance': {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-300',
    icon: 'text-teal-600',
    badge: 'bg-teal-50'
  },
  'Dividends': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: 'text-green-600',
    badge: 'bg-green-50'
  },
  'Other': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: 'text-slate-600',
    badge: 'bg-slate-50'
  }
} as const;

// Asset type configuration
export const ASSET_TYPE_CONFIG = {
  'SAVINGS': {
    icon: 'PiggyBank',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon_color: 'text-emerald-600'
  },
  'INVESTMENT': {
    icon: 'TrendingUp',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon_color: 'text-blue-600'
  },
  'CASH': {
    icon: 'Wallet',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon_color: 'text-amber-600'
  }
} as const;

// Status color configuration
export const STATUS_COLORS = {
  'overdue': {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    icon: 'text-rose-600',
    badge: 'bg-rose-50'
  },
  'due_soon': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: 'text-amber-600',
    badge: 'bg-amber-50'
  },
  'on_track': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-50'
  },
  'paid': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: 'text-slate-600',
    badge: 'bg-slate-50'
  }
} as const;

// Transaction type configuration
export const TRANSACTION_TYPE_CONFIG = {
  'INCOME': {
    icon: 'TrendingUp',
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    icon_color: 'text-emerald-600'
  },
  'EXPENSE': {
    icon: 'TrendingDown',
    bg: 'bg-rose-100',
    text: 'text-rose-600',
    icon_color: 'text-rose-600'
  }
} as const;

export const TRANSLATIONS = {
  en: {
    dashboard: 'Overview',
    transactions: 'Transactions',
    creditCards: 'Credit Cards',
    budget: 'Budget & Future',
    savings: 'Savings',
    settings: 'Configuration',
    welcome: 'Financial Overview',
    welcomeSub: 'Welcome back. Here is your financial summary.',
    netBalance: 'Net Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpenses: 'Monthly Expenses',
    totalAssets: 'Total Assets',
    recentTransactions: 'Recent Transactions',
    aiAdvisor: 'AI Financial Advisor',
    analyze: 'Analyze My Finances',
    thinking: 'Thinking...',
    outstandingDebt: 'Outstanding Credit Debt',
    addNew: 'Add New',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    description: 'Description',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    type: 'Type',
    currency: 'Currency',
    exchangeRate: 'Exchange Rate',
    exchangeRateHelp: '(1 USD = ? Local)',
    installments: 'Installments',
    paid: 'Paid',
    total: 'Total',
    remaining: 'Remaining',
    nextDue: 'Next due',
    payOne: 'Pay 1 Month',
    fullyPaid: 'Fully Paid',
    projection: 'Next Month Projection',
    fixedBills: 'Fixed Bills',
    totalCommitted: 'Total Committed',
    recurringBills: 'Recurring Bills',
    addBill: 'Add Bill',
    assetName: 'Asset Name',
    currentValue: 'Current Value',
    language: 'Language',
    mainCurrency: 'Main Currency',
    installmentsPaidAlready: 'Installments Already Paid',
    settingsTitle: 'Application Configuration',
    settingsSub: 'Customize your experience',
    noTransactions: 'No transactions yet.',
    noTransactionsFilter: 'No transactions found for this filter.',
    trackInstallments: 'Track purchases paid in installments.',
    trackNetWorth: 'Track your net worth and asset growth.',
    totalLiquid: 'Total Liquid Savings',
    totalInvestments: 'Total Investments',
    planNextMonth: 'Plan your next month and manage recurring commitments.',
    getForecast: 'Get AI Forecast Advice',
    aiSuggestion: 'AI Suggestion',
    overBudget: 'Over Budget',
    onTrack: 'On Track',
    expense: 'Expense',
    income: 'Income',
    usdEq: 'USD Eq.',
    currencyDisplayNote: '* This updates the display symbol for totals. Transactions will maintain their original recorded value.',
    cardName: 'Card Name',
    monthlyPayment: 'Monthly',
    filterCurrency: 'Filter Currency',
    allCurrencies: 'All (USD Eq)',
    spendingTrend: 'Spending Trend',
    categoryBreakdown: 'Category Breakdown',
    last6Months: 'Last 6 Months',
    topCategories: 'Top Categories',
    upcomingPayments: 'Upcoming Payments',
    overdue: 'Overdue',
    dueIn: 'Due in',
    days: 'days',
    today: 'Today',
    markAsPaid: 'Mark as Paid',
    variableAmount: 'Variable Amount',
    enterAmount: 'Enter Amount',
    paidThisMonth: 'Paid this month',
    estimated: 'Estimated',
    variable: 'Variable',
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    loginDesc: 'Sign in to sync your data across devices.',
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    loggingIn: 'Logging in...',
    signingUp: 'Signing up...',
    syncing: 'Syncing...',
    synced: 'Synced',
    logout: 'Logout',
    cloudSync: 'Cloud Sync',
    cloudSyncDesc: 'Your data is backed up to the cloud.',
    loginToSync: 'Login to Sync',
    offlineMode: 'Offline Mode',
    googleLogin: 'Sign in with Google',
    orContinueWith: 'Or continue with',
  },
  es: {
    dashboard: 'Resumen',
    transactions: 'Transacciones',
    creditCards: 'Tarjetas',
    budget: 'Presupuesto',
    savings: 'Ahorros',
    settings: 'Configuración',
    welcome: 'Resumen Financiero',
    welcomeSub: 'Bienvenido. Aquí está tu resumen financiero.',
    netBalance: 'Balance Neto',
    monthlyIncome: 'Ingresos Mensuales',
    monthlyExpenses: 'Gastos Mensuales',
    totalAssets: 'Activos Totales',
    recentTransactions: 'Transacciones Recientes',
    aiAdvisor: 'Asesor Financiero IA',
    analyze: 'Analizar mis Finanzas',
    thinking: 'Pensando...',
    outstandingDebt: 'Deuda Pendiente',
    addNew: 'Agregar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    description: 'Descripción',
    amount: 'Monto',
    date: 'Fecha',
    category: 'Categoría',
    type: 'Tipo',
    currency: 'Moneda',
    exchangeRate: 'Tipo de Cambio',
    exchangeRateHelp: '(1 USD = ? Local)',
    installments: 'Cuotas',
    paid: 'Pagado',
    total: 'Total',
    remaining: 'Restante',
    nextDue: 'Vence',
    payOne: 'Pagar 1 Mes',
    fullyPaid: 'Pagado Totalmente',
    projection: 'Proyección Próximo Mes',
    fixedBills: 'Gastos Fijos',
    totalCommitted: 'Total Comprometido',
    recurringBills: 'Gastos Recurrentes',
    addBill: 'Agregar Factura',
    assetName: 'Nombre del Activo',
    currentValue: 'Valor Actual',
    language: 'Idioma',
    mainCurrency: 'Moneda Principal',
    installmentsPaidAlready: 'Cuotas Ya Pagadas',
    settingsTitle: 'Configuración de la Aplicación',
    settingsSub: 'Personaliza tu experiencia',
    noTransactions: 'No hay transacciones aún.',
    noTransactionsFilter: 'No se encontraron transacciones.',
    trackInstallments: 'Seguimiento de compras en cuotas.',
    trackNetWorth: 'Seguimiento de patrimonio y crecimiento.',
    totalLiquid: 'Ahorros Líquidos',
    totalInvestments: 'Inversiones Totales',
    planNextMonth: 'Planifica tu próximo mes y gastos recurrentes.',
    getForecast: 'Obtener Pronóstico IA',
    aiSuggestion: 'Sugerencia IA',
    overBudget: 'Presupuesto Excedido',
    onTrack: 'Bajo Control',
    expense: 'Gasto',
    income: 'Ingreso',
    usdEq: 'Eq. USD',
    currencyDisplayNote: '* Esto actualiza el símbolo de los totales. Las transacciones mantienen su valor original registrado.',
    cardName: 'Nombre Tarjeta',
    monthlyPayment: 'Mensual',
    filterCurrency: 'Filtrar Moneda',
    allCurrencies: 'Todas (Eq. USD)',
    spendingTrend: 'Tendencia de Gastos',
    categoryBreakdown: 'Desglose por Categoría',
    last6Months: 'Últimos 6 Meses',
    topCategories: 'Categorías Principales',
    upcomingPayments: 'Próximos Pagos',
    overdue: 'Vencido',
    dueIn: 'Vence en',
    days: 'días',
    today: 'Hoy',
    markAsPaid: 'Marcar Pagado',
    variableAmount: 'Monto Variable',
    enterAmount: 'Ingresar Monto',
    paidThisMonth: 'Pagado este mes',
    estimated: 'Estimado',
    variable: 'Variable',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    loginDesc: 'Inicia sesión para sincronizar tus datos.',
    noAccount: "¿No tienes cuenta?",
    haveAccount: "¿Ya tienes cuenta?",
    loggingIn: 'Iniciando...',
    signingUp: 'Registrando...',
    syncing: 'Sincronizando...',
    synced: 'Sincronizado',
    logout: 'Cerrar Sesión',
    cloudSync: 'Sincronización Nube',
    cloudSyncDesc: 'Tus datos están respaldados en la nube.',
    loginToSync: 'Ingresar para Sync',
    offlineMode: 'Modo Offline',
    googleLogin: 'Ingresar con Google',
    orContinueWith: 'O continuar con',
  }
};

const baseFields = {
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isSynced: false,
  isDeleted: false
};

export const INITIAL_STATE: FinancialState = {
  settings: {
    id: 'settings_default',
    language: 'en',
    mainCurrency: 'USD',
    exchangeRates: {
      USD: 1,
      EUR: 0.92,
      ARS: 1000,
    },
    ...baseFields
  },
  transactions: [],
  creditCards: [],
  recurring: [],
  assets: [],
  budgets: []
};
