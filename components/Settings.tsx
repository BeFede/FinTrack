import React from 'react';
import { FinancialState, Language, Currency } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings as SettingsIcon, Globe, Coins } from 'lucide-react';

import { CategoryManager } from './CategoryManager';
import { Category } from '../types';

interface SettingsProps {
    data: FinancialState;
    onUpdateSettings: (settings: FinancialState['settings']) => void;
    onAddCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    data, onUpdateSettings, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
    const { language, mainCurrency } = data.settings;
    const t = TRANSLATIONS[language];

    const handleLanguageChange = (lang: Language) => {
        onUpdateSettings({ ...data.settings, language: lang });
    };

    const handleCurrencyChange = (curr: Currency) => {
        onUpdateSettings({ ...data.settings, mainCurrency: curr });
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
            </div>

            <CategoryManager
                categories={data.categories}
                language={language}
                onAdd={onAddCategory}
                onUpdate={onUpdateCategory}
                onDelete={onDeleteCategory}
            />
        </div>
    );
};