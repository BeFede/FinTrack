import React, { useState } from 'react';
import { FinancialState, Language, Currency } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings as SettingsIcon, Globe, Coins, RefreshCw } from 'lucide-react';
import { fetchExchangeRates } from '../services/currencyService';

interface SettingsProps {
    data: FinancialState;
    onUpdateSettings: (settings: FinancialState['settings']) => void;
}

export const Settings: React.FC<SettingsProps> = ({ data, onUpdateSettings }) => {
    const { language, mainCurrency, exchangeRates } = data.settings;
    const t = TRANSLATIONS[language];
    const [loadingRates, setLoadingRates] = useState(false);

    const handleLanguageChange = (lang: Language) => {
        onUpdateSettings({ ...data.settings, language: lang });
    };

    const handleCurrencyChange = (curr: Currency) => {
        onUpdateSettings({ ...data.settings, mainCurrency: curr });
    };

    const handleUpdateRates = async () => {
        setLoadingRates(true);
        const newRates = await fetchExchangeRates();
        if (newRates) {
            onUpdateSettings({
                ...data.settings,
                exchangeRates: { ...exchangeRates, ...newRates },
                lastRatesUpdate: Date.now()
            });
        } else {
            alert('Failed to fetch rates. Please try again.');
        }
        setLoadingRates(false);
    };

    const handleRateChange = (curr: Currency, val: number) => {
        onUpdateSettings({
            ...data.settings,
            exchangeRates: {
                ...exchangeRates,
                [curr]: val
            }
        });
    };

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-lg">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{t.settingsTitle}</h1>
                        <p className="text-slate-500">{t.settingsSub}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">{t.language}</h3>
                    </div>
                    <div className="space-y-2">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${language === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('es')}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${language === 'es' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                            Español
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">{t.mainCurrency}</h3>
                    </div>
                    <div className="space-y-2">
                        {['USD', 'ARS', 'EUR'].map((curr) => (
                            <button
                                key={curr}
                                onClick={() => handleCurrencyChange(curr as Currency)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${mainCurrency === curr ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'border-slate-100 hover:bg-slate-50'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        {t.currencyDisplayNote}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="text-indigo-600" />
                            <h3 className="font-semibold text-slate-800">{t.exchangeRate}</h3>
                        </div>
                        <button
                            onClick={handleUpdateRates}
                            disabled={loadingRates}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loadingRates ? 'animate-spin' : ''} />
                            {loadingRates ? 'Updating...' : 'Update from Internet'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(Object.keys(exchangeRates || {}) as Currency[]).map((curr) => (
                            <div key={curr} className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">{curr} (vs USD)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={exchangeRates?.[curr] ?? 0}
                                        onChange={(e) => handleRateChange(curr, parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        * Base currency is USD. Enter how much 1 USD is worth in each currency.
                    </p>
                </div>
            </div>
        </div>
    );
};