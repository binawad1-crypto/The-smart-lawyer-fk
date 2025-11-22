
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAuth } from '../hooks/useAuth';
import { Gavel, FileText, BrainCircuit, Scale, CheckCircle2, Star, Loader2, ArrowRight, ArrowLeft, ShieldCheck, Workflow, Building2, Users, BookOpen, Archive, LayoutDashboard, MapPin, Search, Briefcase, Handshake, MessageSquare, ScanLine } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Plan, LandingPageConfig } from '../types';
import { iconMap } from '../constants';

interface LandingPageProps {
  onSignUpClick: () => void;
  onGoToDashboard?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUpClick, onGoToDashboard }) => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const { currentUser } = useAuth();
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

  // Determine content source: Dynamic Settings or Default Constants
  const content: LandingPageConfig = useMemo(() => {
    if (settings?.landingPageConfig) {
        return settings.landingPageConfig;
    }
    // Fallback to hardcoded constants if no dynamic config exists
    return {
        heroTitleMain: { en: t('heroTitleMain'), ar: t('heroTitleMain') }, 
        heroTitleHighlight: { en: t('heroTitleHighlight'), ar: t('heroTitleHighlight') },
        heroSubtitle: { en: t('heroSubtitle'), ar: t('heroSubtitle') },
        featuresTitle: { en: t('featuresTitle'), ar: t('featuresTitle') },
        features: [] // populated below
    };
  }, [settings, t]);
  
  const heroTitleMain = settings?.landingPageConfig ? settings.landingPageConfig.heroTitleMain[language] : t('heroTitleMain');
  const heroTitleHighlight = settings?.landingPageConfig ? settings.landingPageConfig.heroTitleHighlight[language] : t('heroTitleHighlight');
  const heroSubtitle = settings?.landingPageConfig ? settings.landingPageConfig.heroSubtitle[language] : t('heroSubtitle');
  const featuresTitle = settings?.landingPageConfig ? settings.landingPageConfig.featuresTitle[language] : t('featuresTitle');
  
  // All features now use the Gold theme
  const featureList = settings?.landingPageConfig ? settings.landingPageConfig.features : [
    { icon: 'FileText', title: { [language]: t('feature1Title') }, description: { [language]: t('feature1Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'Search', title: { [language]: t('feature2Title') }, description: { [language]: t('feature2Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'Briefcase', title: { [language]: t('feature3Title') }, description: { [language]: t('feature3Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'Handshake', title: { [language]: t('feature4Title') }, description: { [language]: t('feature4Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'Gavel', title: { [language]: t('feature5Title') }, description: { [language]: t('feature5Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'MessageSquare', title: { [language]: t('feature6Title') }, description: { [language]: t('feature6Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'ShieldCheck', title: { [language]: t('feature7Title') }, description: { [language]: t('feature7Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'BrainCircuit', title: { [language]: t('feature8Title') }, description: { [language]: t('feature8Desc') }, color: 'from-primary-400 to-primary-600' },
    { icon: 'ScanLine', title: { [language]: t('feature9Title') }, description: { [language]: t('feature9Desc') }, color: 'from-primary-400 to-primary-600' },
  ];

  const handlePrimaryAction = () => {
      if (currentUser && onGoToDashboard) {
          onGoToDashboard();
      } else {
          onSignUpClick();
      }
  }


  return (
    <div className="bg-primary-50 dark:bg-dark-bg text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-24 overflow-hidden">
        {/* Background Gradients & Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-primary-50 dark:bg-dark-bg">
            <div
                className="absolute inset-0 opacity-30 dark:opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(188, 149, 92, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(188, 149, 92, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                }}
            ></div>
            <div className="absolute -top-48 -right-48 w-[40rem] h-[40rem] bg-primary-300/20 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20rem] -left-48 w-[40rem] h-[40rem] bg-primary-400/20 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
        </div>


        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mx-auto mb-8 inline-flex items-center justify-center p-5 bg-white dark:bg-dark-card-bg rounded-3xl shadow-xl shadow-primary-900/10 ring-1 ring-primary-900/5 dark:ring-primary-500/20">
            <Scale size={48} className="text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="flex flex-col items-center justify-center mb-6 leading-tight">
            <span className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 animate-gradient-x mb-2 md:mb-4">
                {heroTitleMain}
            </span>
            <span className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {heroTitleHighlight}
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            {heroSubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
                onClick={handlePrimaryAction}
                className="px-8 py-4 bg-gradient-to-r from-primary-700 to-primary-600 text-white font-bold rounded-full shadow-lg shadow-primary-600/30 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-2 border border-primary-500"
            >
                {currentUser ? t('goToDashboard') : t('startFreeTrial')}
                {currentUser ? <LayoutDashboard size={20} /> : (language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />)}
            </button>
          </div>
        </div>
      </section>

      {/* Location Awareness Section - Premium Style */}
      <div className="relative z-20 px-4 sm:px-6 -mt-8 mb-12">
        <div className="container mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-bg via-primary-900 to-dark-bg shadow-2xl shadow-primary-900/30 border border-primary-500/30">
                
                {/* Background Pattern/Glow */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/10 to-transparent opacity-70"></div>
                <div className="absolute -left-20 top-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 p-8 md:p-10 text-center md:text-start rtl:md:text-right">
                    {/* Animated Icon Container */}
                    <div className="flex-shrink-0 relative group">
                        <div className="absolute inset-0 bg-primary-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                        <div className="relative p-5 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full text-white shadow-lg border border-white/10">
                            <MapPin size={36} strokeWidth={2} />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="max-w-3xl">
                         <p className="text-lg md:text-xl font-bold text-white leading-loose tracking-wide drop-shadow-md">
                            {t('locationAwarenessMessage')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
         <div className="absolute inset-0 bg-white dark:bg-dark-bg/50 transform -skew-y-3 z-0 origin-top-left border-t border-primary-100 dark:border-dark-border"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{featuresTitle}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {featureList.map((feature: any, index: number) => {
              // Resolve Icon
              const IconComponent = iconMap[feature.icon] || FileText;
              // Resolve Text
              const title = feature.title[language] || feature.title;
              const description = feature.description[language] || feature.description;

              return (
              <div key={index} className="group bg-white dark:bg-dark-card-bg rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 border border-primary-100 dark:border-dark-border hover:border-primary-500/50 transform hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      { !loadingPlans && plans.length > 0 && (
        <section id="pricing" className="py-24 bg-primary-50 dark:bg-dark-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t('pricingTitle')}</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('pricingSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              {plans.map((plan: Plan) => (
                <div key={plan.id} className={`relative flex flex-col bg-white dark:bg-dark-card-bg rounded-3xl transition-all duration-300 ${plan.isPopular ? 'border-2 border-primary-500 shadow-2xl scale-105 z-10' : 'border border-primary-100 dark:border-dark-border shadow-lg hover:shadow-xl'}`}>
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
                         <span className="text-4xl font-black text-primary-700 dark:text-primary-400">{plan.price[language]}</span>
                    </div>
                    <p className="text-center text-primary-600 dark:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/20 py-1 px-3 rounded-full text-sm inline-block mx-auto w-full mb-8">
                        {plan.tokens.toLocaleString()} {t('tokens')}
                    </p>
                    
                    <ul className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <p className="ml-3 text-slate-600 dark:text-slate-300 text-sm font-medium">{feature[language]}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-8 pt-0">
                    <button
                      onClick={handlePrimaryAction}
                      className={`w-full py-4 text-base font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg ${plan.isPopular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-50 hover:bg-primary-100 dark:bg-dark-bg dark:hover:bg-gray-800 text-slate-900 dark:text-white border border-primary-200 dark:border-dark-border'}`}
                    >
                      {currentUser ? t('goToDashboard') : t('choosePlan')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden bg-dark-bg border-t border-primary-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary-900/20 to-black/80 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            {t('finalCtaTitle')}
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-primary-100 mb-10 font-light">
            {t('finalCtaSubtitle')}
          </p>
          <button
            onClick={handlePrimaryAction}
            className="px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-full shadow-2xl hover:shadow-primary-500/20 transform hover:scale-105 transition-all duration-300 text-xl flex items-center gap-2 mx-auto border border-primary-400/50"
          >
            {currentUser ? t('goToDashboard') : t('signUpForFree')}
             {currentUser ? <LayoutDashboard size={20} /> : null}
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
