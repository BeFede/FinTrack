import React, { useState } from 'react';
import { FinancialState, Asset } from '../types';
import { TRANSLATIONS, ASSET_TYPE_CONFIG } from '../constants';
import { PiggyBank, Briefcase, Trash2, TrendingUp, Wallet } from 'lucide-react';

interface SavingsProps {
    data: FinancialState;
    onAddAsset: (a: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
    onDeleteAsset: (id: string) => void;
}

export const Savings: React.FC<SavingsProps> = ({ data, onAddAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<Asset['type']>('SAVINGS');
    const t = TRANSLATIONS[data.settings.language];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddAsset({
            name,
            value: parseFloat(value),
            type
        });
        setName('');
        setValue('');
    };

    const totalSavings = data.assets.filter(a => a.type === 'SAVINGS').reduce((acc, a) => acc + a.value, 0);
    const totalInvestments = data.assets.filter(a => a.type === 'INVESTMENT').reduce((acc, a) => acc + a.value, 0);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800">{t.savings} & Investments</h2>
                <p className="text-slate-500">{t.trackNetWorth}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-emerald-800 font-medium mb-1">{t.totalLiquid}</p>
                        <h3 className="text-3xl font-bold text-emerald-600">${totalSavings.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-3 rounded-full shadow-sm text-emerald-500">
                        <PiggyBank size={24} />
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-800 font-medium mb-1">{t.totalInvestments}</p>
                        <h3 className="text-3xl font-bold text-blue-600">${totalInvestments.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-500">
                        <Briefcase size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                            <tr>
                                <th className="p-4">{t.assetName}</th>
                                <th className="p-4">{t.type}</th>
                                <th className="p-4 text-right">{t.currentValue}</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.assets.map(asset => {
                                const assetConfig = ASSET_TYPE_CONFIG[asset.type];
                                const IconComponent = asset.type === 'SAVINGS' ? PiggyBank : asset.type === 'INVESTMENT' ? TrendingUp : Wallet;
                                return (
                                    <tr key={asset.id} className="hover:bg-slate-50 group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${assetConfig.bg} flex items-center justify-center`}>
                                                    <IconComponent className={`${assetConfig.icon_color}`} size={18} />
                                                </div>
                                                <span className="font-medium text-slate-800">{asset.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${assetConfig.badge} ${assetConfig.text}`}>
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-semibold text-slate-700">${asset.value.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => onDeleteAsset(asset.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.assets.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">
                                        No assets added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
                    <h3 className="font-semibold text-slate-800 mb-4">{t.addNew} Asset</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">{t.assetName}</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Crypto Wallet" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">{t.currentValue}</label>
                            <input type="number" required value={value} onChange={e => setValue(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">{t.type}</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="SAVINGS">Savings</option>
                                <option value="INVESTMENT">Investment</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                            {t.save}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};