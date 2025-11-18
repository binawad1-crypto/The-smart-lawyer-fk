import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useLanguage } from '../hooks/useLanguage';
import { ADMIN_EMAIL } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

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
    default:
      console.error(`Unhandled Firebase Auth Error: ${errorCode}`);
      return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  }
};


const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialView === 'login');
    }
  }, [isOpen, initialView]);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        handleClose();
      } catch (err) {
        setError(getFirebaseAuthErrorMessage((err as AuthError).code));
      }
    } else {
      if (password !== confirmPassword) {
        setError(t('passwordsDontMatch'));
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        // Stripe extension looks for documents in the 'customers' collection.
        const customerDocRef = doc(db, "customers", user.uid);

        const batch = writeBatch(db);

        // Create a user document in Firestore with 'active' status and initial token balance
        batch.set(userDocRef, {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          role: user.email === ADMIN_EMAIL ? 'admin' : 'user',
          status: 'active', // User is active by default
          tokenBalance: 10000, // Grant initial free tokens
        });

        // Create a customer document for the Stripe extension.
        // The extension's backend function will pick this up, create a Stripe Customer,
        // and add the stripeId to this document.
        batch.set(customerDocRef, {
            email: user.email,
        });

        await batch.commit();
        
        // Close the modal. The AuthProvider will detect the new auth state and log the user in.
        handleClose();
      } catch (err) {
        setError(getFirebaseAuthErrorMessage((err as AuthError).code));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl p-6 w-full max-w-md m-4 relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>

        <>
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
            {isLogin ? t('login') : t('signup')}
          </h2>
          <form onSubmit={handleAuthAction}>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirm-password">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLogin ? t('login') : t('signup')}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary-600 dark:text-primary-400 hover:underline">
              {isLogin ? t('signup') : t('login')}
            </button>
          </p>
        </>
      </div>
    </div>
  );
};

export default AuthModal;