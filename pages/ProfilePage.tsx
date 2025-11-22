
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Loader2, CreditCard, Gem, User, Shield, KeyRound, X, CheckCircle, AlertCircle, Calendar, Mail, Edit2, ChevronRight, LogOut, MapPin } from 'lucide-react';
// @ts-ignore: Suppressing missing type definitions for firebase/functions
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../services/firebase';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import { View } from '../App';
import { Plan } from '../types';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import SupportPanel from '../components/SupportModal';

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-primary-600" size={24} />
                        {t('reAuthRequired')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={24} /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
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
                            className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
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

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { currentUser, loading } = useAuth();
  const { t, language } = useLanguage();
  
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

  // Re-authentication state
  const [reauth, setReauth] = useState({
    isOpen: false,
    action: null as 'email' | 'password' | null,
    error: null as string | null
  });

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

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000); // Increased timeout for visibility
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use auth.currentUser specifically for SDK operations to avoid "i.getIdToken is not a function"
    if (!auth.currentUser) return;
    
    setIsUpdatingProfile(true);
    setFeedback(null);
    try {
        // FIX: Use auth.currentUser instead of currentUser context object
        await updateProfile(auth.currentUser, { displayName });
        
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { 
            displayName,
            location: location 
        });
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
        // On success, trigger the intended action
        if (reauth.action === 'email') {
            await performEmailUpdate();
        } else if (reauth.action === 'password') {
            await performPasswordUpdate();
        }
        setReauth({ isOpen: false, action: null, error: null });
    } catch (error) {
        console.error("Reauth error:", error);
        setReauth(prev => ({...prev, error: t('authenticationError')}));
    }
  };

  const triggerReauth = (action: 'email' | 'password') => {
      setReauth({
          isOpen: true,
          action: action,
          error: null
      });
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
    // Prevent redirect for manually granted subscriptions
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
      // User-friendly mapping for common errors
      if (errorMessage.includes('internal')) errorMessage = 'System error (Internal). Check console.';
      if (errorMessage.includes('permission')) errorMessage = 'Permission denied.';
      
      showFeedback('error', `${t('portalError')} (${errorMessage})`);
    } finally {
      setIsPortalLoading(false);
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
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
        
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
            <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${feedback.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-500 text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-red-500 text-red-700 dark:text-red-400'} animate-fade-in-down`}>
                {feedback.type === 'success' ? <CheckCircle size={24} className="text-green-500"/> : <AlertCircle size={24} className="text-red-500"/>}
                <span className="font-medium">{feedback.message}</span>
            </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Stats & Subscription */}
            <div className="space-y-6 lg:col-span-1">
                
                {/* User Identity Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 text-2xl font-bold shadow-inner">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {currentUser.displayName || t('profile')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${currentUser.isAdmin ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {currentUser.isAdmin ? <Shield size={10}/> : <User size={10}/>}
                                {currentUser.isAdmin ? 'Admin' : 'User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Token Balance Card */}
                <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-900/20 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2">
                        <Gem size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium flex items-center gap-2 mb-2">
                            <Gem size={18} />
                            {t('tokenBalance')}
                        </p>
                        <h3 className="text-4xl font-black tracking-tight">
                            {currentUser.tokenBalance?.toLocaleString() || 0}
                        </h3>
                        <p className="text-blue-200 text-sm mt-2">Tokens Available</p>
                        
                        <button 
                            onClick={() => onNavigate('subscriptions')}
                            className="mt-6 w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-semibold transition-colors border border-white/20"
                        >
                            {t('addTokens')}
                        </button>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className={`rounded-2xl p-6 relative overflow-hidden border transition-all ${isPlanActive ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-transparent shadow-lg shadow-teal-900/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className={`text-sm font-medium flex items-center gap-2 ${isPlanActive ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
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
                            <div className={`text-sm mb-6 flex items-center gap-2 ${isPlanActive ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
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
                                className="w-full py-2.5 bg-white text-teal-800 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
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

            {/* Right Column: Settings Forms */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User className="text-primary-500" size={20}/>
                            {t('editProfile')}
                        </h2>
                    </div>
                    <div className="p-6">
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
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="text-primary-500" size={20}/>
                            {t('security')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-8">
                        
                        {/* Change Email */}
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

                        {/* Change Password */}
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
            </div>
            
            {/* Support Panel - Full Width */}
            <div className="lg:col-span-3">
               <SupportPanel className="h-[600px]" />
            </div>
        </div>

        <ReauthModal 
            isOpen={reauth.isOpen}
            onClose={() => setReauth(prev => ({...prev, isOpen: false, error: null}))}
            onConfirm={handleReauthentication}
            error={reauth.error}
        />
    </div>
  );
};

export default ProfilePage;
