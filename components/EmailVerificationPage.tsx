
import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut, Send, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const EmailVerificationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResendEmail = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        setMessage(null);
        try {
            await sendEmailVerification(auth.currentUser);
            setMessage({ type: 'success', text: t('emailSentSuccess') });
        } catch (error: any) {
            console.error("Error sending verification email:", error);
            // Firebase throws an error if email was sent too recently
            const msg = error.code === 'auth/too-many-requests' 
                ? t('emailSentError') + ' (Wait a moment)' 
                : t('emailSentError');
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await auth.currentUser?.reload();
            // Force a hard reload of the page to pick up the new auth state if the context doesn't update immediately
            window.location.reload();
        } catch (error) {
            console.error("Error reloading user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-dark-card-bg rounded-3xl shadow-2xl border border-primary-100 dark:border-dark-border overflow-hidden animate-fade-in-up relative">
                
                {/* Decorative Header */}
                <div className="h-2 w-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -z-0"></div>

                <div className="p-8 flex flex-col items-center text-center relative z-10">
                    
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Mail size={40} className="text-primary-600 dark:text-primary-400" />
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        {t('verifyEmailTitle')}
                    </h1>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        <p>{t('verifyEmailMessage')}</p>
                        <p className="font-bold text-primary-700 dark:text-primary-400 my-1">{currentUser.email}</p>
                        <p>{t('verifyEmailInstruction')}</p>
                    </div>

                    {/* Spam Folder Notice */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 mb-6 text-start flex items-start gap-3">
                        <Info className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium leading-relaxed">
                            {t('checkSpamHint')}
                        </p>
                    </div>

                    {message && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-6 w-full justify-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={handleRefresh}
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            {t('iHaveVerified')}
                        </button>

                        <button 
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            {t('resendEmail')}
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="mt-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
                        >
                            <LogOut size={14} />
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;