
import React from 'react';
import { Home, LayoutDashboard, User, CreditCard, Shield } from 'lucide-react';
import { View } from '../App';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface MobileBottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
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
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
