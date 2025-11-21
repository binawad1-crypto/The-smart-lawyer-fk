

import React from 'react';
import { Home, LayoutDashboard, User, CreditCard, Shield, Sparkles } from 'lucide-react';
import { View } from '../App';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface MobileBottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onAssistantClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate, onAssistantClick }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const navItems = [
    {
      id: 'landing',
      label: t('home'),
      icon: Home,
      view: 'landing' as View,
    },
    {
      id: 'dashboard',
      label: t('services'),
      icon: LayoutDashboard,
      view: 'dashboard' as View,
    },
    {
      id: 'subscriptions',
      label: t('subscription'),
      icon: CreditCard,
      view: 'subscriptions' as View,
    },
    {
      id: 'profile',
      label: t('myProfile'),
      icon: User,
      view: 'profile' as View,
    },
  ];

  if (currentUser.isAdmin) {
    navItems.push({
      id: 'admin',
      label: t('adminPanel'),
      icon: Shield,
      view: 'admin' as View,
    });
  }

  const midIndex = Math.ceil(navItems.length / 2);
  const leftItems = navItems.slice(0, midIndex);
  const rightItems = navItems.slice(midIndex);

  // FIX: Changed to React.FC to correctly type the component and allow the 'key' prop.
  // When mapping over an array to create components, React requires a 'key' prop.
  // The original function definition didn't account for this special prop, causing a TypeScript error.
  // Using React.FC correctly types the component to accept standard React props like 'key'.
  const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = currentView === item.view;
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => onNavigate(item.view)}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isActive 
            ? 'text-primary-600 dark:text-primary-400' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium truncate max-w-[60px]">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16 relative">
        {leftItems.map((item) => <NavItem key={item.id} item={item} />)}

        {/* Placeholder for the raised button */}
        <div className="w-16 h-16" />

        {rightItems.map((item) => <NavItem key={item.id} item={item} />)}
        
        {/* The actual button, absolutely positioned in the center */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/3">
             <button
                onClick={onAssistantClick}
                className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 focus:outline-none ring-4 ring-white/90 dark:ring-slate-900/90 transition-transform duration-200 hover:scale-110"
                aria-label={t('aiAssistant')}
            >
                <Sparkles size={28} />
            </button>
            <span className="text-[10px] text-center font-medium text-primary-600 dark:text-primary-400 mt-1 block">
                {t('aiAssistant')}
            </span>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;