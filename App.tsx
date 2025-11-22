
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './hooks/useLanguage';
import { useSiteSettings } from './hooks/useSiteSettings';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
// FIX: The error "has no default export" is fixed by adding `export default` to AdminPage.tsx. No change is needed here.
import AdminPage from './pages/AdminPage';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import MobileBottomNav from './components/MobileBottomNav';
import PixelTracker from './components/PixelTracker';
import { Loader2, ShieldAlert } from 'lucide-react';
import SupportPanel from './components/SupportModal';
import ChatWidget from './components/ChatWidget';

export type View = 'landing' | 'dashboard' | 'admin' | 'profile' | 'subscriptions' | 'support' | 'payment-success';

// Helper to update or create a meta tag
const updateMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}='${key}']`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
};

const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { t, language, dir } = useLanguage();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<View>('dashboard');
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);

  // Check for Payment Success on Load
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (sessionId) {
          setView('payment-success');
      }
  }, []);

  useEffect(() => {
    if (settings) {
      const siteTitle = settings.siteName[language] || 'المساعد الذكي';
      const siteDescription = settings.metaDescription[language] || 'منصة مدعومة بالذكاء الاصطناعي تقدم خدمات متخصصة للمحامين والمستشارين القانونيين، مع ميزات لتحليل القضايا، وتلخيص المستندات، والبحث القانوني.';
      const siteKeywords = settings.seoKeywords[language] || '';

      const getAbsoluteUrl = (url: string) => {
          try {
              return new URL(url, window.location.origin).href;
          } catch (e) {
              return new URL('/vite.svg', window.location.origin).href;
          }
      };
      
      const imageUrl = settings.logoUrl ? getAbsoluteUrl(settings.logoUrl) : getAbsoluteUrl('/vite.svg');
      const faviconUrl = settings.faviconUrl ? getAbsoluteUrl(settings.faviconUrl) : getAbsoluteUrl('/vite.svg');

      document.title = siteTitle;

      // Standard Meta Tags
      updateMetaTag('name', 'description', siteDescription);
      updateMetaTag('name', 'keywords', siteKeywords);

      // Open Graph Tags for social sharing
      updateMetaTag('property', 'og:title', siteTitle);
      updateMetaTag('property', 'og:description', siteDescription);
      updateMetaTag('property', 'og:image', imageUrl);
      updateMetaTag('property', 'og:type', 'website');
      updateMetaTag('property', 'og:url', window.location.origin);

      // Twitter Card Tags
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', siteTitle);
      updateMetaTag('name', 'twitter:description', siteDescription);
      updateMetaTag('name', 'twitter:image', imageUrl);

      // Update favicon
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }
      favicon.setAttribute('href', faviconUrl);
    }
  }, [settings, language]);

  const handleNavigate = (newView: View) => {
      // Admin check
      if(newView === 'admin' && !currentUser?.isAdmin) {
          setView('dashboard');
          return;
      }
      
      // If navigating away from payment success, clean URL
      if (view === 'payment-success') {
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url);
      }

      setView(newView);
  }

  const handleLogoClick = () => {
      setView('landing');
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
        case 'payment-success':
            return <PaymentSuccessPage onGoToDashboard={() => handleNavigate('dashboard')} />;
        case 'support':
            return (
                <div className="flex flex-col flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)]">
                     <SupportPanel className="h-full shadow-lg border-0" />
                </div>
            );
        case 'dashboard':
        default:
            return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg font-sans flex flex-col">
      <PixelTracker />
      <Header 
        onLoginClick={() => {
            setInitialAuthView('login');
            setIsAuthModalOpen(true);
        }} 
        onAdminClick={() => handleNavigate(view === 'admin' ? 'dashboard' : 'admin')} 
        onLogoClick={handleLogoClick}
        onProfileClick={() => handleNavigate('profile')}
        onSupportClick={() => handleNavigate('support')}
        onHomeClick={() => setView('landing')}
        onServicesClick={() => setView('dashboard')}
        view={view}
      />
      <main className="flex-grow flex flex-col pb-16 md:pb-0">
        {renderContent()}
      </main>
      
      {currentUser && (
        <>
          <MobileBottomNav 
            currentView={view} 
            onNavigate={handleNavigate}
            onAssistantClick={() => setIsChatWidgetOpen(true)} 
          />
          <ChatWidget 
            isOpen={isChatWidgetOpen}
            onClose={() => setIsChatWidgetOpen(false)}
          />
        </>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={initialAuthView}
      />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default App;
