import React, { useState } from 'react';
import { Category, TransactionType, Language } from '../types';
import { TRANSLATIONS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface CategoryManagerProps {
    categories: Category[];
    language: Language;
    onAdd: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDeleted' | 'userId'>) => void;
    onUpdate: (category: Category) => void;
    onDelete: (id: string) => void;
}

const AVAILABLE_COLORS = [
    'text-slate-600', 'text-red-600', 'text-orange-600', 'text-amber-600',
    'text-yellow-600', 'text-lime-600', 'text-green-600', 'text-emerald-600',
    'text-teal-600', 'text-cyan-600', 'text-sky-600', 'text-blue-600',
    'text-indigo-600', 'text-violet-600', 'text-purple-600', 'text-fuchsia-600',
    'text-pink-600', 'text-rose-600'
];

const AVAILABLE_ICONS = [
    'Home', 'UtensilsCrossed', 'Car', 'Zap', 'Tv', 'Heart', 'ShoppingBag', 'Plane',
    'CreditCard', 'Briefcase', 'Laptop', 'TrendingUp', 'DollarSign', 'Smartphone',
    'Wifi', 'Coffee', 'Gift', 'Music', 'Book', 'Tool', 'Smile', 'Star'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories, language, onAdd, onUpdate, onDelete
}) => {
    const t = TRANSLATIONS[language];
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

    // Form State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('DollarSign');
    const [color, setColor] = useState('text-slate-600');
    const [budget, setBudget] = useState('');

    const resetForm = () => {
        setName('');
        setIcon('DollarSign');
        setColor('text-slate-600');
        setBudget('');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryData = {
            name,
            icon,
            color,
            type,
            budget: budget ? parseFloat(budget) : undefined
        };

        if (editingId) {
            const existing = categories.find(c => c.id === editingId);
            if (existing) {
                onUpdate({ ...existing, ...categoryData });
            }
        } else {
            onAdd(categoryData);
        }
        resetForm();
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color);
        setBudget(cat.budget?.toString() || '');
        setType(cat.type);
        setIsAdding(true);
    };

    const filteredCategories = categories.filter(c => c.type === type && !c.isDeleted);

    const IconRenderer = ({ iconName, className }: { iconName: string, className?: string }) => {
        const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
        return <Icon className={className} size={20} />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Categories</h3>
                <button
                    onClick={() => { resetForm(); setIsAdding(true); }}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <Plus size={16} />
                    {t.addNew}
                </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
                <button
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === TransactionType.EXPENSE ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {t.expense}
                </button>
                <button
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {t.income}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-slate-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.description}</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Category Name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                            <div className="grid grid-cols-6 gap-2 p-2 bg-white border border-slate-300 rounded-lg h-32 overflow-y-auto">
                                {AVAILABLE_ICONS.map(iconName => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setIcon(iconName)}
                                        className={`p-2 rounded hover:bg-slate-100 flex justify-center ${icon === iconName ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500' : 'text-slate-500'}`}
                                    >
                                        <IconRenderer iconName={iconName} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                            <div className="grid grid-cols-6 gap-2 p-2 bg-white border border-slate-300 rounded-lg h-32 overflow-y-auto">
                                {AVAILABLE_COLORS.map(colorName => (
                                    <button
                                        key={colorName}
                                        type="button"
                                        onClick={() => setColor(colorName)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 ${color === colorName ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-current ${colorName}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {type === TransactionType.EXPENSE && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Budget (Optional)</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={e => setBudget(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                        >
                            {editingId ? 'Update' : t.save}
                        </button>
                    </div>
                </form>
            )}

            <div className="divide-y divide-slate-100">
                {filteredCategories.map(cat => (
                    <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center ${cat.color}`}>
                                <IconRenderer iconName={cat.icon} />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-800">{cat.name}</h4>
                                {cat.budget && (
                                    <p className="text-xs text-slate-500">Budget: ${cat.budget}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(cat)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(cat.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredCategories.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No categories found.
                    </div>
                )}
            </div>
        </div>
    );
};
