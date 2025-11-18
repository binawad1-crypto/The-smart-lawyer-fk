import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Gavel, FileText, BrainCircuit, Scale, CheckCircle2, Star, Loader2 } from 'lucide-react';
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
    },
    {
      icon: BrainCircuit,
      title: t('feature2Title'),
      description: t('feature2Desc'),
    },
    {
      icon: Scale,
      title: t('feature3Title'),
      description: t('feature3Desc'),
    },
  ];

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto mb-8 inline-block p-5 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-300">
            <Gavel size={56} />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
            {t('heroSubtitle')}
          </p>
          <button
            onClick={onSignUpClick}
            className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg shadow-lg hover:bg-primary-700 transform hover:scale-105 transition-all duration-300 text-lg"
          >
            {t('startFreeTrial')}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('featuresTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 bg-light-bg dark:bg-dark-bg rounded-xl shadow-md transition-shadow hover:shadow-xl">
                <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full mb-4">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      { !loadingPlans && plans.length > 0 && (
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{t('pricingTitle')}</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('pricingSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan: Plan) => (
                <div key={plan.id} className={`relative border rounded-lg shadow-lg flex flex-col bg-light-card-bg dark:bg-dark-card-bg ${plan.isPopular ? 'border-primary-500' : 'dark:border-gray-700'}`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <span className="bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase flex items-center gap-1">
                        <Star size={12} fill="white"/>
                        {t('mostPopular')}
                      </span>
                    </div>
                  )}
                  <div className="p-8 flex-grow">
                    <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white">{plan.title[language]}</h3>
                    <p className="mt-4 text-4xl font-extrabold text-center text-gray-900 dark:text-white">{plan.price[language]}</p>
                    <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{plan.tokens.toLocaleString()} {t('tokens')}</p>
                    <ul className="mt-8 space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          </div>
                          <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{feature[language]}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-card-bg/50 p-8 rounded-b-lg">
                    <button
                      onClick={onSignUpClick}
                      className={`w-full px-6 py-3 text-base font-semibold text-white rounded-md transition-colors ${plan.isPopular ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-700 hover:bg-gray-800'}`}
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
      <section className="py-20 bg-white dark:bg-slate-900/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('finalCtaTitle')}
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t('finalCtaSubtitle')}
          </p>
          <button
            onClick={onSignUpClick}
            className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg shadow-lg hover:bg-primary-700 transform hover:scale-105 transition-all duration-300 text-lg"
          >
            {t('signUpForFree')}
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;