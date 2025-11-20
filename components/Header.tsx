import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Globe, LogOut, Shield, Gem, User as UserIcon, ChevronDown, Home, LayoutDashboard, Bell, Info, AlertTriangle, CheckCircle, LifeBuoy } from 'lucide-react';
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
                className="flex items-center gap-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            >
                <UserIcon size={20} />
                <span className="hidden sm:inline text-sm font-medium">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-light-card-bg dark:bg-dark-card-bg rounded-md shadow-lg py-1 border dark:border-gray-700">
                    <button 
                        onClick={() => { onProfileClick(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                        <UserIcon size={16} /> {t('myProfile')}
                    </button>
                    <button 
                        onClick={() => { onSupportClick(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                        <LifeBuoy size={16} /> {t('support')}
                    </button>
                    <button 
                        onClick={() => { onLogout(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                        <LogOut size={16} /> {t('logout')}
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
            // IMPORTANT: Removed orderBy('createdAt', 'desc') to avoid requiring a composite index.
            // Sorting is done client-side.
            const q = query(
                collection(db, 'system_notifications'),
                where('isActive', '==', true)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification));
                // Sort client-side
                data.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA; // Descending
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
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white">
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
                                <div key={notif.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors last:border-0">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {notif.type === 'info' && <Info size={18} className="text-blue-500" />}
                                            {notif.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
                                            {notif.type === 'warning' || notif.type === 'alert' ? <AlertTriangle size={18} className="text-amber-500" /> : null}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{notif.title[language]}</h5>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message[language]}</p>
                                            <span className="text-[10px] text-gray-400 mt-2 block">
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


const Header: React.FC<HeaderProps> = ({ onLoginClick, onAdminClick, onLogoClick, onProfileClick, onSupportClick, onHomeClick, onServicesClick, view }) => {
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
    <header className="bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={onLogoClick} className="flex-shrink flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md p-1 -m-1 min-w-0 max-w-[60%] sm:max-w-none">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={siteName} className="h-10 w-auto object-contain max-w-full" />
             ) : (
                <div className="flex flex-col items-start leading-none min-w-0 overflow-hidden">
                  <h1 className="text-lg sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate w-full">
                    {siteName}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 font-bold mt-1 truncate w-full">
                    {siteSubtitle}
                  </p>
                </div>
             )}
          </button>
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {currentUser && (
                <div className="hidden md:block">
                    {view === 'landing' && onServicesClick ? (
                        <button onClick={onServicesClick} className="flex items-center gap-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={t('services')}>
                            <LayoutDashboard size={20} />
                            <span className="text-sm font-semibold">{t('services')}</span>
                        </button>
                    ) : (
                        <button onClick={onHomeClick} className="flex items-center gap-2 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={t('home')}>
                            <Home size={20} />
                            <span className="text-sm font-semibold">{t('home')}</span>
                        </button>
                    )}
                </div>
            )}
            {currentUser && !currentUser.isAdmin && (
                <>
                    <div className="hidden md:flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full text-sm font-semibold">
                        <Gem size={14} />
                        <span>{currentUser.tokenBalance?.toLocaleString() || 0}</span>
                    </div>
                </>
            )}

             {/* Notification Bell */}
             {currentUser && <NotificationsMenu />}

             <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <button onClick={() => setLanguage(language === Language.EN ? Language.AR : Language.EN)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Globe size={20} />
                <span className="ml-2 font-semibold hidden sm:inline">{language === Language.EN ? 'AR' : 'EN'}</span>
             </button>
            {currentUser?.isAdmin && (
                <button onClick={onAdminClick} className="hidden md:block p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Shield size={20} />
                </button>
            )}
             {currentUser ? (
                 <div className="hidden md:block">
                    <UserMenu onProfileClick={onProfileClick} onSupportClick={onSupportClick} onLogout={handleLogout} />
                 </div>
             ) : (
                <button onClick={onLoginClick} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
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