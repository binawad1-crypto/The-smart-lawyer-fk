
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './hooks/useLanguage';
import { useSiteSettings } from './hooks/useSiteSettings';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import { Loader2, ShieldAlert } from 'lucide-react';

export type View = 'landing' | 'dashboard' | 'admin' | 'profile' | 'subscriptions';

const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { t, language, dir } = useLanguage();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<View>('dashboard');

  useEffect(() => {
    if (settings) {
      document.title = settings.siteName[language] || 'المساعد الذكي';

      // Update or create meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', settings.metaDescription[language] || '');

      // Update or create meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', settings.seoKeywords[language] || '');


      // Update or create favicon
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }
      if (settings.faviconUrl) {
          favicon.setAttribute('href', settings.faviconUrl);
      } else {
          favicon.setAttribute('href', '/vite.svg'); // Default
      }
    }
  }, [settings, language]);

  const handleNavigate = (newView: View) => {
      // Admin check
      if(newView === 'admin' && !currentUser?.isAdmin) {
          setView('dashboard');
          return;
      }
      setView(newView);
  }

  const handleLogoClick = () => {
      setView('dashboard');
  }
  
  const loading = authLoading || settingsLoading;

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center flex-grow"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;
    }
    
    // Maintenance Mode Check
    if (settings?.isMaintenanceMode && !currentUser?.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center flex-grow text-center p-4">
                <ShieldAlert size={64} className="text-yellow-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('maintenanceMode')}</h1>
                <p className="text-gray-600 dark:text-gray-400">{t('maintenanceMessage')}</p>
            </div>
        );
    }


    if (!currentUser) {
      return <LandingPage onSignUpClick={() => {
          setInitialAuthView('signup');
          setIsAuthModalOpen(true);
      }} />;
    }
    
    switch(view) {
        case 'landing':
             return <LandingPage onSignUpClick={() => setView('dashboard')} onGoToDashboard={() => setView('dashboard')} />;
        case 'admin':
            return <AdminPage />;
        case 'profile':
            return <ProfilePage onNavigate={handleNavigate} />;
        case 'subscriptions':
            return <SubscriptionPage />;
        case 'dashboard':
        default:
            return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg font-sans flex flex-col">
      <Header 
        onLoginClick={() => {
            setInitialAuthView('login');
            setIsAuthModalOpen(true);
        }} 
        onAdminClick={() => handleNavigate(view === 'admin' ? 'dashboard' : 'admin')} 
        onLogoClick={handleLogoClick}
        onProfileClick={() => handleNavigate('profile')}
        onHomeClick={() => setView('landing')}
      />
      <main className="flex-grow flex flex-col">
        {renderContent()}
      </main>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={initialAuthView}
      />
      <Footer />
    </div>
  );
};

export default App;
