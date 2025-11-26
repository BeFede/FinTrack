import React, { useState } from 'react';
import { LayoutDashboard, Receipt, CreditCard, PieChart, PiggyBank, Settings, Menu, X } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface NavigationProps {
  currentView: string;
  onChangeView: (view: string) => void;
  language: Language;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, language }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const t = TRANSLATIONS[language];
  
  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'transactions', label: t.transactions, icon: Receipt },
    { id: 'credit-cards', label: t.creditCards, icon: CreditCard },
    { id: 'budget', label: t.budget, icon: PieChart },
    { id: 'savings', label: t.savings, icon: PiggyBank },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    onChangeView(viewId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      <nav className={`
        bg-slate-900 text-slate-300 
        w-full md:w-64 
        flex-shrink-0 flex flex-col 
        sticky top-0 z-40
        ${isMobileOpen ? 'h-auto' : 'h-auto'} 
        md:h-screen
      `}>
        {/* Header Section (Logo + Mobile Toggle) */}
        <div className="p-4 md:p-6 flex items-center justify-between md:block">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
              FP
            </div>
            FinTrack Pro
          </h1>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Navigation Items Container */}
        <div className={`
            flex-1 px-3 space-y-1 overflow-y-auto
            ${isMobileOpen ? 'block absolute top-full left-0 w-full bg-slate-900 border-t border-slate-800 shadow-2xl p-3 max-h-[80vh]' : 'hidden'}
            md:block md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:max-h-full
        `}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
          
          {/* Footer inside the collapsible area for mobile */}
          <div className="p-4 md:p-6 border-t border-slate-800 mt-2 md:mt-auto">
             <p className="text-xs text-slate-500">v1.2.0 • PWA</p>
          </div>
        </div>
      </nav>
    </>
  );
};