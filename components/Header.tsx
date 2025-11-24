
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Globe, LogOut, Shield, Gem, User as UserIcon, ChevronDown, Home, LayoutDashboard, Bell, Info, AlertTriangle, CheckCircle, LifeBuoy, HelpCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { Language, SystemNotification } from '../types';
import { View } from '../App';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface HeaderProps {
    onLoginClick: () => void;
    onAdminClick: () => void;
    onLogoClick: () => void;
    onProfileClick: () => void;
    onSupportClick: () => void;
    onHomeClick: () => void;
    onServicesClick?: () => void;
    onTutorialClick?: () => void;
    view?: View;
}

const UserMenu: React.FC<{onProfileClick: () => void, onSupportClick: () => void, onLogout: () => void}> = ({ onProfileClick, onSupportClick, onLogout }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 p-2 rounded-full text-slate-700 dark:text-primary-50 hover:bg-primary-50 dark:hover:bg-dark-card-bg relative border border-transparent dark:border-dark-border"
            >
                <UserIcon size={20} className="text-primary-600 dark:text-primary-400" />
                <span className="hidden sm:inline text-sm font-medium">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-light-card-bg dark:bg-dark-bg rounded-md shadow-lg py-1 border border-gray-100 dark:border-dark-border z-50">
                    <button 
                        onClick={() => { onProfileClick(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-primary-50 hover:bg-primary-50 dark:hover:bg-dark-card-bg flex items-center gap-3"
                    >
                        <UserIcon size={16} className="text-primary-600" /> {t('myProfile')}
                    </button>
                    <button 
                        onClick={() => { onSupportClick(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-primary-50 hover:bg-primary-50 dark:hover:bg-dark-card-bg flex items-center gap-3"
                    >
                        <LifeBuoy size={16} className="text-primary-600" /> {t('support')}
                    </button>
                    <button 
                        onClick={() => { onLogout(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-primary-50 hover:bg-primary-50 dark:hover:bg-dark-card-bg flex items-center gap-3"
                    >
                        <LogOut size={16} className="text-primary-600" /> {t('logout')}
                    </button>
                </div>
            )}
        </div>
    )
}

const NotificationsMenu: React.FC = () => {
    const { language } = useLanguage();
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentUser) return;

        try {
            const q = query(
                collection(db, 'system_notifications'),
                where('isActive', '==', true)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification));
                data.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });
                setNotifications(data);
            }, (error) => {
                console.warn("Notifications subscription error:", error.message);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Failed to setup notifications listener", e);
        }
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg relative"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white dark:border-dark-bg"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 bg-white dark:bg-dark-bg rounded-xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-primary-600 to-primary-500">
                        <h4 className="font-bold text-sm text-white">
                            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                                {language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="p-4 border-b border-gray-100 dark:border-dark-border hover:bg-primary-50 dark:hover:bg-dark-card-bg transition-colors last:border-0">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {notif.type === 'info' && <Info size={18} className="text-primary-500" />}
                                            {notif.type === 'success' && <CheckCircle size={18} className="text-primary-600" />}
                                            {notif.type === 'warning' || notif.type === 'alert' ? <AlertTriangle size={18} className="text-primary-700" /> : null}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-800 dark:text-primary-100 mb-1">{notif.title[language]}</h5>
                                            <p className="text-xs text-gray-600 dark:text-primary-300 leading-relaxed">{notif.message[language]}</p>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                                                {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ onLoginClick, onAdminClick, onLogoClick, onProfileClick, onSupportClick, onHomeClick, onServicesClick, onTutorialClick, view }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currentUser } = useAuth();
  const { settings } = useSiteSettings();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  const siteName = settings?.siteName[language] || t('appName');
  const siteSubtitle = settings?.siteSubtitle?.[language] || t('appSubtitle');
  
  return (
    <header className="bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-dark-border shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={onLogoClick} className="flex flex-shrink items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md p-1 -m-1 min-w-0 max-w-[60%] sm:max-w-none group">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={siteName} className="h-10 w-auto object-contain max-w-full" />
             ) : (
                <div className="flex flex-col items-start min-w-0 overflow-hidden">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate w-full group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {siteName}
                  </h1>
                  <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-bold tracking-wide truncate w-full mt-0.5">
                    {siteSubtitle}
                  </p>
                </div>
             )}
          </button>
          {/* Spacer for mobile/tablet centering if needed, or just allow tools to flex right */}
          <div className="lg:hidden flex-grow"></div>

          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0" data-tutorial="header-buttons">
            {currentUser && onServicesClick && (
                <div className="hidden lg:block">
                    <button onClick={onServicesClick} className="flex items-center gap-2 p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg transition-colors" title={t('services')}>
                        <LayoutDashboard size={20} />
                        <span className="text-sm font-semibold">{t('services')}</span>
                    </button>
                </div>
            )}
            {currentUser && !currentUser.isAdmin && (
                <>
                    <div className="hidden lg:flex items-center gap-1.5 bg-primary-50 dark:bg-dark-card-bg text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full text-sm font-semibold border border-primary-100 dark:border-dark-border">
                        <Gem size={14} className="text-primary-600" />
                        <span>{currentUser.tokenBalance?.toLocaleString() || 0}</span>
                    </div>
                </>
            )}

             {/* Notification Bell */}
             {currentUser && <NotificationsMenu />}

             {/* Tutorial Button */}
             {currentUser && onTutorialClick && (
                <button 
                    onClick={onTutorialClick} 
                    className="p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg transition-colors"
                    title={language === 'ar' ? 'تعلم استخدام التطبيق' : 'Learn how to use the app'}
                >
                    <HelpCircle size={20} />
                </button>
             )}

             <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg transition-colors">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={() => setLanguage(language === Language.EN ? Language.AR : Language.EN)} className="p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg flex items-center transition-colors">
                <Globe size={20} />
                <span className="ml-2 font-semibold hidden sm:inline">{language === Language.EN ? 'AR' : 'EN'}</span>
             </button>
            {currentUser?.isAdmin && (
                <button onClick={onAdminClick} className="hidden lg:block p-2 rounded-full text-slate-600 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-dark-card-bg transition-colors">
                    <Shield size={20} />
                </button>
            )}
             {currentUser ? (
                 <div className="hidden lg:block">
                    <UserMenu onProfileClick={onProfileClick} onSupportClick={onSupportClick} onLogout={handleLogout} />
                 </div>
             ) : (
                <button onClick={onLoginClick} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-md hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md">
                    {t('login')}
                </button>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
