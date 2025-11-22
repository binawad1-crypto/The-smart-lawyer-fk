
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Loader2, CreditCard, Gem, User, Shield, KeyRound, X, CheckCircle, AlertCircle, Calendar, Mail, Edit2, ChevronRight, LogOut, MapPin, History, Clock, FileText, ArrowRight, ArrowLeft, Copy, Printer, Trash2, LifeBuoy } from 'lucide-react';
// @ts-ignore: Suppressing missing type definitions for firebase/functions
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../services/firebase';
import { collection, getDocs, query, doc, updateDoc, where, orderBy, onSnapshot, limit, deleteDoc } from 'firebase/firestore';
import { View } from '../App';
import { Plan, ServiceHistoryEntry } from '../types';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import SupportPanel from '../components/SupportModal';
import { iconMap } from '../constants';

interface ProfilePageProps {
  onNavigate: (view: View) => void;
}

const ReauthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  error: string | null;
}> = ({ isOpen, onClose, onConfirm, error }) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthenticating(true);
        await onConfirm(password);
        setIsAuthenticating(false);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-primary-600" size={24} />
                        {t('reAuthRequired')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={24} /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-gray-100 dark:border-dark-border">
                    {t('reAuthMessage')}
                </p>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <KeyRound className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('currentPassword')}
                            className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-3 border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={isAuthenticating} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:bg-primary-400 shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-all">
                             {isAuthenticating && <Loader2 className="animate-spin" size={18} />}
                            {t('authenticate')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    entry: ServiceHistoryEntry | null;
}> = ({ isOpen, onClose, entry }) => {
    const { t, language } = useLanguage();
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen || !entry) return null;

    const copyToClipboard = () => {
        const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');
        navigator.clipboard.writeText(stripHtml(entry.result));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const contentToPrint = entry.result.trim().startsWith('<section')
                ? entry.result
                : `<pre style="font-family: Calibri, sans-serif;">${entry.result}</pre>`;

            printWindow.document.write(`
              <html>
                <head>
                  <title>${entry.serviceTitle[language] || 'Print'}</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
                    body { font-family: 'Calibri', 'Noto Naskh Arabic', 'Tajawal', sans-serif; direction: ${language === 'ar' ? 'rtl' : 'ltr'}; padding: 20px; }
                    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
                  </style>
                </head>
                <body>${contentToPrint}</body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] transform transition-all scale-100 border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{entry.serviceTitle[language]}</h3>
                        <p className="text-xs text-gray-500">{new Date(entry.createdAt.seconds * 1000).toLocaleDateString()} - {new Date(entry.createdAt.seconds * 1000).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 bg-[#fcfaf6] dark:bg-slate-900/50">
                    {entry.result.trim().startsWith('<section') ? (
                        <div dangerouslySetInnerHTML={{ __html: entry.result }} className="text-gray-800 dark:text-gray-200" />
                    ) : (
                        <pre className="whitespace-pre-wrap leading-loose text-left rtl:text-right font-sans text-gray-800 dark:text-gray-200">
                            {entry.result}
                        </pre>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card-bg flex justify-end gap-3">
                    <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                        {isCopied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                        {isCopied ? t('copied') : t('copy')}
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                        <Printer size={16} />
                        {t('print')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[80] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative animate-fade-in-up border border-gray-200 dark:border-dark-border">
                 <button onClick={onClose} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm">
                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                 <SupportPanel className="h-full border-0 shadow-none" />
            </div>
        </div>
    );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { currentUser, loading } = useAuth();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'history'>('info');

  // States for forms
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmNewPassword: '' });
  
  // State for UI feedback
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // History State
  const [history, setHistory] = useState<ServiceHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ServiceHistoryEntry | null>(null);

  // Re-authentication state
  const [reauth, setReauth] = useState({
    isOpen: false,
    action: null as 'email' | 'password' | null,
    error: null as string | null
  });

  // Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Data fetching
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        setLocation(currentUser.location || '');
    }
  }, [currentUser]);
  
  useEffect(() => {
      const fetchPlans = async () => {
          setLoadingPlans(true);
          try {
              const plansCollection = collection(db, 'subscription_plans');
              const snapshot = await getDocs(query(plansCollection));
              const plansData = snapshot.docs.map(doc => doc.data() as Plan);
              setPlans(plansData);
          } catch (error) {
              console.error("Error fetching plans:", error);
          } finally {
              setLoadingPlans(false);
          }
      };
      fetchPlans();
  }, []);

  useEffect(() => {
      if (!currentUser || activeTab !== 'history') return;
      setLoadingHistory(true);
      
      const historyRef = collection(db, 'service_history');
      const q = query(
          historyRef, 
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
      );

      // Using onSnapshot for real-time updates and better auth state handling
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceHistoryEntry));
          setHistory(historyData);
          setLoadingHistory(false);
      }, (error) => {
          console.error("Error fetching history:", error);
          setLoadingHistory(false);
      });

      return () => unsubscribe();
  }, [currentUser, activeTab]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsUpdatingProfile(true);
    setFeedback(null);
    try {
        await updateProfile(auth.currentUser, { displayName });
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { displayName, location });
        showFeedback('success', t('profileUpdatedSuccess'));
    } catch (error) {
        console.error("Error updating profile:", error);
        showFeedback('error', (error as any).message || t('profileUpdatedError'));
    } finally {
        setIsUpdatingProfile(false);
    }
  };

  const handleReauthentication = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    setReauth(prev => ({ ...prev, error: null }));
    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
        if (reauth.action === 'email') await performEmailUpdate();
        else if (reauth.action === 'password') await performPasswordUpdate();
        setReauth({ isOpen: false, action: null, error: null });
    } catch (error) {
        console.error("Reauth error:", error);
        setReauth(prev => ({...prev, error: t('authenticationError')}));
    }
  };

  const triggerReauth = (action: 'email' | 'password') => {
      setReauth({ isOpen: true, action: action, error: null });
  };

  const performEmailUpdate = async () => {
    if (!auth.currentUser || !newEmail) return;
    setIsUpdatingSecurity(true);
    try {
        await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
        showFeedback('success', t('emailUpdateSuccess'));
        setNewEmail('');
    } catch (error) {
        showFeedback('error', (error as any).message || t('emailUpdateError'));
    } finally {
        setIsUpdatingSecurity(false);
    }
  };

  const performPasswordUpdate = async () => {
    if (!auth.currentUser || passwords.newPassword !== passwords.confirmNewPassword) {
        showFeedback('error', t('passwordsDontMatch'));
        return;
    }
    setIsUpdatingSecurity(true);
    try {
        await updatePassword(auth.currentUser, passwords.newPassword);
        showFeedback('success', t('passwordUpdateSuccess'));
        setPasswords({ newPassword: '', confirmNewPassword: '' });
    } catch (error) {
        showFeedback('error', (error as any).message || t('passwordUpdateError'));
    } finally {
        setIsUpdatingSecurity(false);
    }
  };
  
  const redirectToCustomerPortal = async () => {
    if (currentUser?.subscription?.isManual) {
        const msg = language === 'ar' 
            ? 'عذراً، هذا الاشتراك تم منحه يدوياً ولا يمكن إدارته عبر بوابة الدفع الإلكترونية. يرجى التواصل مع الإدارة.' 
            : 'Sorry, this subscription was granted manually and cannot be managed via the payment portal. Please contact administration.';
        showFeedback('error', msg);
        return;
    }

    setIsPortalLoading(true);
    try {
      const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await createPortalLink({ returnUrl: window.location.href });
      
      if (data && (data as any).url) {
        window.location.assign((data as any).url);
      } else {
          throw new Error("No URL returned from payment portal.");
      }
    } catch (error) {
      console.error("Error redirecting to customer portal:", error);
      let errorMessage = (error as any).message || 'Unknown error';
      if (errorMessage.includes('internal')) errorMessage = 'System error (Internal). Check console.';
      if (errorMessage.includes('permission')) errorMessage = 'Permission denied.';
      
      showFeedback('error', `${t('portalError')} (${errorMessage})`);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
      if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this history item?')) {
          return;
      }
      try {
          await deleteDoc(doc(db, 'service_history', id));
          // No need to manually update state as onSnapshot will handle it
      } catch (error) {
          console.error("Error deleting history:", error);
          alert('Failed to delete history item.');
      }
  };

  const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
  };

  if (loading || loadingPlans) {
    return (
      <div className="flex justify-center items-center flex-grow h-[80vh]">
        <div className="relative">
            <div className="absolute inset-0 bg-primary-200 rounded-full opacity-20 animate-ping"></div>
            <Loader2 className="animate-spin text-primary-600 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const { subscription } = currentUser;
  const planDetails = subscription ? plans.find(p => p.id === subscription.planId) : null;
  const isPlanActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 relative min-h-[80vh]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('myProfile')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('overview')}</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <LogOut size={18} />
                    {t('logout')}
                </button>
            </div>
        </div>

        {/* Feedback Toast */}
        {feedback && (
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${feedback.type === 'success' ? 'bg-white dark:bg-dark-card-bg border-primary-500 text-primary-700 dark:text-primary-400' : 'bg-white dark:bg-dark-card-bg border-red-500 text-red-700 dark:text-red-400'} animate-fade-in-down`}>
                {feedback.type === 'success' ? <CheckCircle size={24} className="text-primary-500"/> : <AlertCircle size={24} className="text-red-500"/>}
                <span className="font-medium">{feedback.message}</span>
            </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Stats & Subscription */}
            <div className="space-y-6 lg:col-span-1">
                
                {/* User Identity Card */}
                <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 text-2xl font-bold shadow-inner">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {currentUser.displayName || t('profile')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${currentUser.isAdmin ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {currentUser.isAdmin ? <Shield size={10}/> : <User size={10}/>}
                                {currentUser.isAdmin ? 'Admin' : 'User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Token Balance Card */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-900/20 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2">
                        <Gem size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-primary-100 font-medium flex items-center gap-2 mb-2">
                            <Gem size={18} />
                            {t('tokenBalance')}
                        </p>
                        <h3 className="text-4xl font-black tracking-tight">
                            {currentUser.tokenBalance?.toLocaleString() || 0}
                        </h3>
                        <p className="text-primary-200 text-sm mt-2">Tokens Available</p>
                        
                        <button 
                            onClick={() => onNavigate('subscriptions')}
                            className="mt-6 w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-semibold transition-colors border border-white/20"
                        >
                            {t('addTokens')}
                        </button>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className={`rounded-2xl p-6 relative overflow-hidden border transition-all ${isPlanActive ? 'bg-gradient-to-br from-primary-700 to-primary-600 text-white border-transparent shadow-lg shadow-primary-900/20' : 'bg-white dark:bg-dark-card-bg border-gray-200 dark:border-dark-border'}`}>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className={`text-sm font-medium flex items-center gap-2 ${isPlanActive ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <CreditCard size={18} />
                                    {t('subscription')}
                                </p>
                                <h3 className={`text-2xl font-bold mt-1 ${isPlanActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {planDetails ? planDetails.title[language] : t('noSubscription')}
                                </h3>
                            </div>
                            {isPlanActive ? (
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle size={12} fill="currentColor" className="text-white"/>
                                    Active
                                </span>
                            ) : (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                                    Inactive
                                </span>
                            )}
                        </div>

                        {subscription && (
                            <div className={`text-sm mb-6 flex items-center gap-2 ${isPlanActive ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                <Calendar size={14} />
                                {subscription.status === 'canceled' ? t('canceledOn') : t('renewsOn')}: 
                                <span className="font-mono font-semibold ml-1">
                                    {new Date(subscription.current_period_end * 1000).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                            </div>
                        )}

                        {isPlanActive ? (
                            <button 
                                onClick={redirectToCustomerPortal} 
                                disabled={isPortalLoading}
                                className="w-full py-2.5 bg-white text-primary-800 font-bold rounded-lg hover:bg-primary-50 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isPortalLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                                {t('manageSubscription')}
                            </button>
                        ) : (
                             <button 
                                onClick={() => onNavigate('subscriptions')}
                                className="w-full py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {t('upgradeNow')} <ChevronRight size={16} className="rtl:rotate-180"/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Tabbed Interface */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Tabs Navigation */}
                <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'info' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-dark-card-bg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <User size={16} /> {t('editProfile')}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'security' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-dark-card-bg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Shield size={16} /> {t('security')}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-dark-card-bg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <History size={16} /> {t('requestHistory')}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden min-h-[400px]">
                    
                    {activeTab === 'info' && (
                        <div className="p-6 animate-fade-in-up">
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-dark-border">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('editProfile')}</h3>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label htmlFor="displayName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('fullName')}</label>
                                        <div className="relative">
                                            <User className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                id="displayName"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('email')}</label>
                                        <div className="relative">
                                            <Mail className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                            <input 
                                                type="email" 
                                                value={currentUser.email || ''} 
                                                readOnly 
                                                disabled
                                                className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label htmlFor="location" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('location')}</label>
                                        <div className="relative">
                                            <MapPin className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                id="location"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                                placeholder={t('locationPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isUpdatingProfile} 
                                        className="px-6 py-2.5 bg-gray-900 dark:bg-primary-600 text-white font-medium rounded-xl hover:bg-black dark:hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {isUpdatingProfile ? <Loader2 className="animate-spin" size={18}/> : <Edit2 size={18} />}
                                        {t('saveChanges')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="p-6 animate-fade-in-up">
                            <div className="mb-6 pb-4 border-b border-gray-100 dark:border-dark-border">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('security')}</h3>
                            </div>
                            <div className="space-y-8">
                                <form onSubmit={(e) => { e.preventDefault(); triggerReauth('email'); }} className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                                        <div className="flex-grow space-y-1.5">
                                            <label htmlFor="newEmail" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('changeEmail')}</label>
                                            <div className="relative">
                                                <Mail className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                                <input 
                                                    type="email" 
                                                    id="newEmail" 
                                                    value={newEmail} 
                                                    onChange={e => setNewEmail(e.target.value)} 
                                                    className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                                    placeholder={t('newEmail')}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingSecurity || !newEmail} 
                                            className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {t('updateEmail')}
                                        </button>
                                    </div>
                                </form>

                                <div className="border-t border-gray-100 dark:border-gray-700"></div>

                                <form onSubmit={(e) => { e.preventDefault(); triggerReauth('password'); }} className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('changePassword')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <KeyRound className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                                <input 
                                                    type="password" 
                                                    id="newPassword" 
                                                    value={passwords.newPassword} 
                                                    onChange={e => setPasswords(p => ({...p, newPassword: e.target.value}))} 
                                                    placeholder={t('newPassword')}
                                                    className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                                />
                                            </div>
                                            <div className="relative">
                                                <KeyRound className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                                                <input 
                                                    type="password" 
                                                    id="confirmNewPassword" 
                                                    value={passwords.confirmNewPassword} 
                                                    onChange={e => setPasswords(p => ({...p, confirmNewPassword: e.target.value}))} 
                                                    placeholder={t('confirmNewPassword')}
                                                    className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingSecurity || !passwords.newPassword || passwords.newPassword !== passwords.confirmNewPassword} 
                                            className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                        >
                                            {t('updatePassword')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="p-6 animate-fade-in-up h-full flex flex-col">
                            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('requestHistory')}</h3>
                            </div>
                            
                            {loadingHistory ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                        <History size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">{t('noHistory')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map(entry => {
                                        const Icon = iconMap[entry.serviceIcon || 'FileText'] || FileText;
                                        return (
                                            <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-primary-600 dark:text-primary-400 border border-gray-100 dark:border-gray-600 flex-shrink-0">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">{entry.serviceTitle[language]}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            <Clock size={12} />
                                                            <span>
                                                                {entry.createdAt?.seconds ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button 
                                                        onClick={() => setSelectedHistoryEntry(entry)}
                                                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 transition-all flex items-center gap-2"
                                                    >
                                                        {t('viewResult')}
                                                        {language === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteHistory(entry.id)}
                                                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Floating Support Button */}
        <button
            onClick={() => setIsSupportModalOpen(true)}
            className="fixed bottom-24 left-6 rtl:left-auto rtl:right-6 md:bottom-8 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
            title={t('support')}
        >
            <LifeBuoy size={28} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute left-full ml-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none rtl:left-auto rtl:right-full rtl:mr-3 rtl:ml-0">
                {t('support')}
            </span>
        </button>

        <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />

        <ReauthModal 
            isOpen={reauth.isOpen}
            onClose={() => setReauth(prev => ({...prev, isOpen: false, error: null}))}
            onConfirm={handleReauthentication}
            error={reauth.error}
        />

        <HistoryModal 
            isOpen={!!selectedHistoryEntry}
            onClose={() => setSelectedHistoryEntry(null)}
            entry={selectedHistoryEntry}
        />
    </div>
  );
};

export default ProfilePage;
