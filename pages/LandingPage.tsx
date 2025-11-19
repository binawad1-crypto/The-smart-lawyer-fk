
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Gavel, FileText, BrainCircuit, Scale, CheckCircle2, Star, Loader2, ArrowRight, ArrowLeft, ShieldCheck, Workflow, Building2, Users, BookOpen, Archive } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Plan, Translations } from '../types';

interface LandingPageProps {
  onSignUpClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUpClick }) => {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const plansCollection = collection(db, 'subscription_plans');
            const q = query(plansCollection, where('status', '==', 'active'), orderBy('tokens'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setPlans(snapshot.docs.map(doc => doc.data() as Plan));
            }
        } catch (err) {
            console.error("Error fetching subscription plans for landing page:", err);
        } finally {
            setLoadingPlans(false);
        }
    };
    fetchPlans();
  }, []);

  const features = [
    {
      icon: FileText,
      title: t('feature1Title'),
      description: t('feature1Desc'),
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: BrainCircuit,
      title: t('feature2Title'),
      description: t('feature2Desc'),
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Scale,
      title: t('feature3Title'),
      description: t('feature3Desc'),
      color: 'from-teal-400 to-teal-600'
    },
    {
      icon: ShieldCheck,
      title: t('feature4Title'),
      description: t('feature4Desc'),
      color: 'from-red-400 to-red-600'
    },
    {
      icon: Workflow,
      title: t('feature5Title'),
      description: t('feature5Desc'),
      color: 'from-orange-400 to-orange-600'
    },
    {
      icon: Building2,
      title: t('feature6Title'),
      description: t('feature6Desc'),
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      icon: Users,
      title: t('feature7Title'),
      description: t('feature7Desc'),
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      icon: BookOpen,
      title: t('feature8Title'),
      description: t('feature8Desc'),
      color: 'from-cyan-400 to-cyan-600'
    },
    {
      icon: Archive,
      title: t('feature9Title'),
      description: t('feature9Desc'),
      color: 'from-slate-400 to-slate-600'
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 opacity-80"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mx-auto mb-8 inline-flex items-center justify-center p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-blue-900/10 ring-1 ring-slate-900/5 dark:ring-white/10">
            <Gavel size={48} className="text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="flex flex-col items-center justify-center mb-6 leading-tight">
            <span className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-4">
                {t('heroTitleMain')}
            </span>
            <span className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-500 to-teal-400 animate-gradient-x">
                {t('heroTitleHighlight')}
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
                onClick={onSignUpClick}
                className="px-8 py-4 bg-primary-600 text-white font-bold rounded-full shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-2"
            >
                {t('startFreeTrial')}
                {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
         <div className="absolute inset-0 bg-white dark:bg-slate-800/50 transform -skew-y-3 z-0 origin-top-left"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t('featuresTitle')}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-500 to-purple-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 border border-slate-100 dark:border-slate-700 hover:border-primary-500/30 transform hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      { !loadingPlans && plans.length > 0 && (
        <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t('pricingTitle')}</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('pricingSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              {plans.map((plan: Plan) => (
                <div key={plan.id} className={`relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl transition-all duration-300 ${plan.isPopular ? 'border-2 border-primary-500 shadow-2xl scale-105 z-10' : 'border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl'}`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 uppercase tracking-wide">
                        <Star size={14} fill="white"/>
                        {t('mostPopular')}
                      </span>
                    </div>
                  )}
                  <div className="p-8 flex-grow">
                    <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">{plan.title[language]}</h3>
                    <div className="flex justify-center items-baseline mb-2">
                         <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price[language]}</span>
                    </div>
                    <p className="text-center text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/30 py-1 px-3 rounded-full text-sm inline-block mx-auto w-full mb-8">
                        {plan.tokens.toLocaleString()} {t('tokens')}
                    </p>
                    
                    <ul className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="ml-3 text-slate-600 dark:text-slate-300 text-sm font-medium">{feature[language]}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-8 pt-0">
                    <button
                      onClick={onSignUpClick}
                      className={`w-full py-4 text-base font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg ${plan.isPopular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white'}`}
                    >
                      {t('choosePlan')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent to-black/30 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            {t('finalCtaTitle')}
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-blue-100 mb-10 font-light">
            {t('finalCtaSubtitle')}
          </p>
          <button
            onClick={onSignUpClick}
            className="px-10 py-5 bg-white text-primary-900 font-bold rounded-full shadow-2xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 text-xl"
          >
            {t('signUpForFree')}
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
