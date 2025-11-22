
import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Home, LayoutDashboard, Loader2, Copy } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface PaymentSuccessPageProps {
  onGoToDashboard: () => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onGoToDashboard }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    setSessionId(sid);
  }, []);

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow min-h-[80vh] p-4 bg-light-bg dark:bg-dark-bg">
      <div className="w-full max-w-lg bg-white dark:bg-dark-card-bg rounded-3xl shadow-2xl border border-primary-100 dark:border-dark-border overflow-hidden animate-fade-in-up relative">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>

        <div className="p-8 md:p-12 flex flex-col items-center text-center relative z-10">
          
          {/* Success Icon with Pulse Effect */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle size={48} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
            {language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {language === 'ar' 
              ? 'شكراً لاشتراكك. تم تفعيل خطتك بنجاح وإضافة الرموز إلى رصيدك. يمكنك الآن البدء في استخدام جميع ميزات المساعد الذكي.' 
              : 'Thank you for subscribing. Your plan has been activated and tokens added to your balance. You can now start using all Smart Assistant features.'}
          </p>

          {/* Transaction ID Box */}
          {sessionId && (
            <div className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-8 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {language === 'ar' ? 'رقم العملية' : 'Transaction Reference'}
              </span>
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                  {sessionId.slice(0, 16)}...
                </code>
                <button 
                  onClick={copySessionId}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                  title={language === 'ar' ? 'نسخ' : 'Copy'}
                >
                  {isCopied ? <CheckCircle size={16} className="text-green-500"/> : <Copy size={16}/>}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={onGoToDashboard}
              className="flex-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:from-primary-800 hover:to-primary-700 shadow-lg shadow-primary-900/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              {language === 'ar' ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
              {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
