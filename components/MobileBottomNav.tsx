
import React from 'react';
import { Home, LayoutDashboard, User, CreditCard, Sparkles } from 'lucide-react';
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

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = currentView === item.view;
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => onNavigate(item.view)}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isActive 
            ? 'text-primary-600 dark:text-primary-400' 
            : 'text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
        }`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] sm:text-[11px] font-medium truncate max-w-[60px]">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-lg border-t border-gray-200 dark:border-dark-border lg:hidden pb-safe safe-area-inset-bottom">
      <div className="flex justify-between items-center h-18 min-h-[72px] relative px-2">
        {/* Left Items */}
        <div className="flex-1 flex justify-around">
            {leftItems.map((item) => <NavItem key={item.id} item={item} />)}
        </div>

        {/* Center Button Container */}
        <div className="relative w-20 flex justify-center">
             <button
                onClick={onAssistantClick}
                className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center hover:from-primary-700 hover:via-primary-600 hover:to-primary-700 focus:outline-none ring-4 ring-white/90 dark:ring-dark-bg/90 transition-all duration-300 hover:scale-110 active:scale-95 z-10 mb-4 sm:mb-5"
                aria-label={t('aiAssistant')}
            >
                <Sparkles size={28} className="sm:w-8 sm:h-8 animate-pulse" fill="white" />
            </button>
        </div>

        {/* Right Items */}
        <div className="flex-1 flex justify-around">
            {rightItems.map((item) => <NavItem key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
