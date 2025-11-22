
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, KeyRound } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useLanguage } from '../hooks/useLanguage';
import { ADMIN_EMAIL } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'reset';

const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني الذي أدخلته غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من بياناتك.';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.';
    case 'auth/too-many-requests':
      return 'تم تعطيل الوصول إلى هذا الحساب مؤقتًا بسبب كثرة محاولات تسجيل الدخول الفاشلة. يمكنك استعادته عن طريق إعادة تعيين كلمة المرور أو المحاولة مرة أخرى لاحقًا.';
    case 'auth/popup-closed-by-user':
        return 'تم إغلاق النافذة قبل إتمام تسجيل الدخول.';
    case 'auth/operation-not-allowed':
        return 'طريقة الدخول هذه غير مفعلة. يرجى تفعيل مزود الدخول في إعدادات Firebase.';
    case 'auth/unauthorized-domain':
        return `النطاق الحالي (${window.location.hostname}) غير مصرح له. يرجى إضافته في Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
    default:
      console.error(`Unhandled Firebase Auth Error: ${errorCode}`);
      return `حدث خطأ غير متوقع (${errorCode}). يرجى المحاولة مرة أخرى.`;
  }
};


const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { t, language } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setMode(initialView);
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, initialView]);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const handleGoogleLogin = async () => {
      setError('');
      const provider = new GoogleAuthProvider();
      auth.languageCode = language; 
      
      try {
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
             const customerDocRef = doc(db, "customers", user.uid);
             const batch = writeBatch(db);

             batch.set(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
                status: 'active',
                tokenBalance: 10000,
             });

             batch.set(customerDocRef, {
                 email: user.email,
             });
             
             await batch.commit();
          }
          handleClose();

      } catch (err) {
          const errorCode = (err as any).code;
          console.error("Google Sign In Error:", err);
          setError(getFirebaseAuthErrorMessage(errorCode));
      }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');
      auth.languageCode = language;

      try {
          await sendPasswordResetEmail(auth, email);
          setSuccessMessage(t('resetEmailSent'));
      } catch (err) {
          setError(getFirebaseAuthErrorMessage((err as any).code));
      }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    auth.languageCode = language;

    if (mode === 'login') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        handleClose();
      } catch (err) {
        setError(getFirebaseAuthErrorMessage((err as any).code));
      }
    } else if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError(t('passwordsDontMatch'));
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const customerDocRef = doc(db, "customers", user.uid);

        const batch = writeBatch(db);

        batch.set(userDocRef, {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
          status: 'active',
          tokenBalance: 10000,
        });

        batch.set(customerDocRef, {
            email: user.email,
        });

        await batch.commit();
        
        await sendEmailVerification(user);
        alert(t('verificationEmailSent'));

        handleClose();
      } catch (err) {
        setError(getFirebaseAuthErrorMessage((err as any).code));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative border border-gray-200 dark:border-dark-border transform transition-all">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X size={24} />
        </button>

        {mode === 'reset' ? (
            // RESET PASSWORD VIEW
            <>
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 mb-4">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('resetPassword')}
                    </h2>
                </div>

                {successMessage ? (
                    <div className="text-center">
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 text-sm font-medium">
                            {successMessage}
                        </div>
                        <button
                            onClick={() => setMode('login')}
                            className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            {t('backToLogin')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordReset}>
                        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm text-center" dir="rtl">{error}</div>}
                        
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="reset-email">
                                {t('email')}
                            </label>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border rounded-xl text-slate-900 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                required
                                placeholder="name@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg shadow-primary-600/20"
                        >
                            {t('sendResetLink')}
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className="w-full mt-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {language === 'ar' ? <ArrowLeft size={16}/> : null}
                            {t('backToLogin')}
                            {language !== 'ar' ? <ArrowLeft size={16} className="rotate-180"/> : null}
                        </button>
                    </form>
                )}
            </>
        ) : (
            // LOGIN / SIGNUP VIEW
            <>
                <h2 className="text-3xl font-black text-center text-gray-900 dark:text-white mb-6">
                    {mode === 'login' ? t('login') : t('signup')}
                </h2>
                
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none flex items-center justify-center gap-3 transition-colors mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {t('signInWithGoogle')}
                </button>

                <div className="flex items-center mb-6">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                    <span className="mx-4 text-gray-400 text-sm font-medium">{t('or')}</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                </div>

                <form onSubmit={handleAuthAction}>
                    {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm text-center" dir="rtl">{error}</div>}
                    
                    <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                        {t('email')}
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl text-slate-900 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        required
                    />
                    </div>
                    <div className="mb-2">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                        {t('password')}
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl text-slate-900 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        required
                    />
                    </div>

                    {mode === 'login' && (
                        <div className="flex justify-end mb-6">
                            <button
                                type="button"
                                onClick={() => setMode('reset')}
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                            >
                                {t('forgotPassword')}
                            </button>
                        </div>
                    )}

                    {mode === 'signup' && (
                    <div className="mb-6 mt-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirm-password">
                        {t('confirmPassword')}
                        </label>
                        <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl text-slate-900 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        required
                        />
                    </div>
                    )}

                    <button
                    type="submit"
                    className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-lg shadow-primary-600/20 mt-2"
                    >
                    {mode === 'login' ? t('login') : t('signup')}
                    </button>
                </form>
                
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
                    <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-primary-600 dark:text-primary-400 hover:underline font-bold">
                    {mode === 'login' ? t('signup') : t('login')}
                    </button>
                </p>
            </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
