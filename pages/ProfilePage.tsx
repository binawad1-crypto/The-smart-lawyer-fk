
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Loader2, CreditCard, Gem, User, Shield, KeyRound, X, CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '../services/firebase';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import { View } from '../App';
import { Plan } from '../types';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword } from 'firebase/auth';


interface ProfilePageProps {
  onNavigate: (view: View) => void;
}

type ProfileTab = 'overview' | 'edit' | 'security';

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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('reAuthRequired')}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('reAuthMessage')}</p>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('currentPassword')}
                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 font-semibold">{t('cancel')}</button>
                        <button type="submit" disabled={isAuthenticating} className="px-4 py-2 rounded-md bg-primary-600 text-white font-semibold flex items-center justify-center disabled:bg-primary-400">
                             {isAuthenticating && <Loader2 className="animate-spin mr-2" size={18} />}
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
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  
  // States for forms
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmNewPassword: '' });
  
  // State for UI feedback
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Re-authentication state
  const [reauth, setReauth] = useState({
    isOpen: false,
    onConfirm: async () => {},
    action: null as 'email' | 'password' | null,
    error: null as string | null
  });

  // Data fetching
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (currentUser) {
        setDisplayName(currentUser.displayName || '');
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

  const showSuccessMessage = (message: string) => {
    setUpdateSuccess(message);
    setTimeout(() => setUpdateSuccess(null), 3000);
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
        await updateProfile(currentUser, { displayName });
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { displayName });
        showSuccessMessage(t('profileUpdatedSuccess'));
    } catch (error) {
        setUpdateError((error as any).message || t('profileUpdatedError'));
    } finally {
        setIsUpdating(false);
    }
  };

  const handleReauthentication = async (password: string) => {
    if (!currentUser || !currentUser.email) return;
    setReauth(prev => ({ ...prev, error: null }));
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        // On success, trigger the intended action
        if (reauth.action === 'email') {
            await performEmailUpdate();
        } else if (reauth.action === 'password') {
            await performPasswordUpdate();
        }
        setReauth({ isOpen: false, onConfirm: async () => {}, action: null, error: null });
    } catch (error) {
        setReauth(prev => ({...prev, error: t('authenticationError')}));
    }
  };

  const triggerReauth = (action: 'email' | 'password') => {
      setReauth({
          isOpen: true,
          action: action,
          onConfirm: async () => {}, // this is handled by handleReauthentication now
          error: null
      });
  };

  const performEmailUpdate = async () => {
    if (!currentUser || !newEmail) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
        await verifyBeforeUpdateEmail(currentUser, newEmail);
        showSuccessMessage(t('emailUpdateSuccess'));
        setNewEmail('');
    } catch (error) {
        setUpdateError((error as any).message || t('emailUpdateError'));
    } finally {
        setIsUpdating(false);
    }
  };

  const performPasswordUpdate = async () => {
    if (!currentUser || passwords.newPassword !== passwords.confirmNewPassword) {
        setUpdateError(t('passwordsDontMatch'));
        return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    try {
        await updatePassword(currentUser, passwords.newPassword);
        showSuccessMessage(t('passwordUpdateSuccess'));
        setPasswords({ newPassword: '', confirmNewPassword: '' });
    } catch (error) {
        setUpdateError((error as any).message || t('passwordUpdateError'));
    } finally {
        setIsUpdating(false);
    }
  };
  
  const redirectToCustomerPortal = async () => {
    setIsPortalLoading(true);
    try {
      const createPortalLink = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await createPortalLink({ returnUrl: window.location.href });
      window.location.assign((data as any).url);
    } catch (error) {
      console.error("Error redirecting to customer portal:", error);
      alert(t('portalError'));
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (loading || loadingPlans) {
    return (
      <div className="flex justify-center items-center flex-grow">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return null; // Should be redirected by AuthProvider
  }

  const { subscription } = currentUser;
  const planDetails = subscription ? plans.find(p => p.id === subscription.planId) : null;

  const renderTabContent = () => {
      switch (activeTab) {
        case 'edit':
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">{t('editProfile')}</h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('fullName')}</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                             <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                             <input type="email" id="email" value={currentUser.email || ''} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 cursor-not-allowed"/>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isUpdating} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center">
                                {isUpdating && <Loader2 className="animate-spin mr-2" size={18}/>}
                                {t('saveChanges')}
                            </button>
                        </div>
                    </form>
                </div>
            );
        case 'security':
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">{t('security')}</h2>
                    <div className="space-y-8">
                        {/* Change Email */}
                        <form onSubmit={(e) => { e.preventDefault(); triggerReauth('email'); }} className="space-y-4">
                            <h3 className="text-lg font-semibold border-b dark:border-gray-600 pb-2">{t('changeEmail')}</h3>
                            <div>
                                <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                                <input type="email" id="currentEmail" value={currentUser.email || ''} readOnly className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 dark:border-gray-600 cursor-not-allowed" />
                            </div>
                             <div>
                                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('newEmail')}</label>
                                <input type="email" id="newEmail" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isUpdating || !newEmail} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center">
                                    {isUpdating && reauth.action === 'email' && <Loader2 className="animate-spin mr-2" size={18}/>}
                                    {t('updateEmail')}
                                </button>
                            </div>
                        </form>
                        {/* Change Password */}
                        <form onSubmit={(e) => { e.preventDefault(); triggerReauth('password'); }} className="space-y-4">
                             <h3 className="text-lg font-semibold border-t dark:border-gray-700 pt-8">{t('changePassword')}</h3>
                             <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('newPassword')}</label>
                                <input type="password" id="newPassword" value={passwords.newPassword} onChange={e => setPasswords(p => ({...p, newPassword: e.target.value}))} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirmNewPassword')}</label>
                                <input type="password" id="confirmNewPassword" value={passwords.confirmNewPassword} onChange={e => setPasswords(p => ({...p, confirmNewPassword: e.target.value}))} required className="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isUpdating || !passwords.newPassword || passwords.newPassword !== passwords.confirmNewPassword} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center">
                                    {isUpdating && reauth.action === 'password' && <Loader2 className="animate-spin mr-2" size={18}/>}
                                    {t('updatePassword')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        case 'overview':
        default:
          return (
            <div>
              <h2 className="text-2xl font-bold mb-6">{t('overview')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subscription Status */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('subscription')}</h3>
                  {subscription && planDetails ? (
                    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('currentPlan')}</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{planDetails.title[language]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{subscription.status === 'canceled' ? t('canceledOn') : t('renewsOn')}</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{new Date(subscription.current_period_end * 1000).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </div>
                      <button onClick={redirectToCustomerPortal} disabled={isPortalLoading} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-400">
                        {isPortalLoading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={16} />}
                        {t('manageSubscription')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed rounded-lg dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-300">{t('noActiveSubscription')}</p>
                      <button onClick={() => onNavigate('subscriptions')} className="mt-4 px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors">
                        {t('browsePlans')}
                      </button>
                    </div>
                  )}
                </div>
                {/* Token Balance */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('tokenBalance')}</h3>
                  <div className="flex items-center justify-center p-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg h-full">
                    <Gem className="text-primary-500 dark:text-primary-400" size={40} />
                    <div className="ml-4 rtl:mr-4 text-left rtl:text-right">
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">{currentUser.tokenBalance?.toLocaleString() || 0}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('tokens')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
      }
  }

  const NavButton: React.FC<{ tab: ProfileTab; icon: React.ReactNode; label: string }> = ({ tab, icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md text-left transition-colors ${activeTab === tab ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <>
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">{t('myProfile')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
            <div className="p-4 bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-md border dark:border-gray-700/50">
                <div className="text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/50 mx-auto flex items-center justify-center mb-3">
                        <User size={48} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="font-bold text-xl text-gray-800 dark:text-white">{currentUser.displayName || currentUser.email?.split('@')[0]}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>
                 <nav className="space-y-2">
                    <NavButton tab="overview" icon={<CreditCard size={18} />} label={t('overview')} />
                    <NavButton tab="edit" icon={<User size={18} />} label={t('editProfile')} />
                    <NavButton tab="security" icon={<Shield size={18} />} label={t('security')} />
                </nav>
            </div>
        </aside>
        
        <main className="md:col-span-3">
            <div className="bg-light-card-bg dark:bg-dark-card-bg p-8 rounded-lg shadow-md border dark:border-gray-700/50 min-h-[400px]">
                {updateError && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-600 rounded-md">{updateError}</div>}
                {updateSuccess && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-600 rounded-md flex items-center gap-2"><CheckCircle size={18}/> {updateSuccess}</div>}
                {renderTabContent()}
            </div>
        </main>
      </div>
    </div>
     <ReauthModal 
        isOpen={reauth.isOpen}
        onClose={() => setReauth(prev => ({...prev, isOpen: false, error: null}))}
        onConfirm={handleReauthentication}
        error={reauth.error}
    />
    </>
  );
};

export default ProfilePage;
