
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Shield, Zap, BrainCircuit, ChevronDown, Plus, Minus, HelpCircle, MapPin, Star, FileText, Scale, BookOpen, Gavel, Building2, Search } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { Plan } from '../types';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

interface LandingPageProps {
  onSignUpClick: () => void;
  onGoToDashboard?: () => void;
}

interface AccordionItemProps {
    item: { q: any; a: any };
    isOpen: boolean;
    onClick: () => void;
    language: any;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isOpen, onClick, language }) => {
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between py-4 text-start focus:outline-none group"
            >
                <span className={`font-bold text-sm sm:text-base transition-colors ${isOpen ? 'text-primary-600' : 'text-slate-800 dark:text-gray-200 group-hover:text-primary-600'}`}>
                    {item.q[language]}
                </span>
                <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.a[language]}
                </p>
            </div>
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onSignUpClick, onGoToDashboard }) => {
  const { t, language, dir } = useLanguage();
  const { currentUser } = useAuth();
  const { settings } = useSiteSettings();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const plansCollection = collection(db, 'subscription_plans');
            const q = query(plansCollection, where('status', '==', 'active'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
                plansData.sort((a, b) => a.tokens - b.tokens);
                setPlans(plansData);
            }
        } catch (error) {
            console.error("Error fetching plans", error);
        } finally {
            setLoadingPlans(false);
        }
    };
    fetchPlans();
  }, []);

  const handlePrimaryAction = () => {
      if (currentUser) {
          if (onGoToDashboard) onGoToDashboard();
      } else {
          onSignUpClick();
      }
  };

  const features = [
      { icon: FileText, titleKey: 'feature1Title', descKey: 'feature1Desc' },
      { icon: Search, titleKey: 'feature2Title', descKey: 'feature2Desc' },
      { icon: BrainCircuit, titleKey: 'feature8Title', descKey: 'feature8Desc' },
      { icon: Scale, titleKey: 'feature5Title', descKey: 'feature5Desc' },
      { icon: BookOpen, titleKey: 'feature4Title', descKey: 'feature4Desc' },
      { icon: Shield, titleKey: 'feature7Title', descKey: 'feature7Desc' },
  ];

  const faqs = [
    {
        q: { en: "What is the Smart Assistant?", ar: "ما هو المساعد الذكي؟" },
        a: { en: "The Smart Assistant is an AI-powered platform designed to assist lawyers and legal consultants in drafting contracts, analyzing cases, and conducting legal research efficiently.", ar: "المساعد الذكي هو منصة مدعومة بالذكاء الاصطناعي صممت لمساعدة المحامين والمستشارين القانونيين في صياغة العقود وتحليل القضايا وإجراء البحوث القانونية بكفاءة." }
    },
    {
        q: { en: "Is the output legally binding?", ar: "هل المخرجات ملزمة قانونياً؟" },
        a: { en: "No, the outputs are preliminary drafts and consultations. They must be reviewed and approved by a qualified lawyer before use. The tool aids professionals but does not replace them.", ar: "لا، المخرجات هي مسودات واستشارات أولية. يجب مراجعتها واعتمادها من قبل محامي مؤهل قبل الاستخدام. الأداة تساعد المهنيين ولا تستبدلهم." }
    },
    {
        q: { en: "How accurate is the AI?", ar: "ما مدى دقة الذكاء الاصطناعي؟" },
        a: { en: "The model is trained on vast legal datasets, but like all AI, it can make errors. Human review is always necessary to ensure complete accuracy.", ar: "تم تدريب النموذج على مجموعات بيانات قانونية ضخمة، ولكن مثل كل الذكاء الاصطناعي، قد يخطئ. المراجعة البشرية ضرورية دائماً لضمان الدقة التامة." }
    },
    {
        q: { en: "Is my data secure?", ar: "هل بياناتي آمنة؟" },
        a: { en: "Yes, we use advanced encryption to protect your data. We adhere to strict privacy policies to ensure client confidentiality.", ar: "نعم، نستخدم تقنيات تشفير متقدمة لحماية بياناتك. نحن نلتزم بسياسات خصوصية صارمة لضمان سرية العملاء." }
    },
    {
        q: { en: "What documents can I analyze?", ar: "ما هي المستندات التي يمكنني تحليلها؟" },
        a: { en: "You can analyze contracts, court judgments, regulations, and defense memos. The system supports PDF, Word, and text files.", ar: "يمكنك تحليل العقود، الأحكام القضائية، اللوائح، ومذكرات الدفاع. النظام يدعم ملفات PDF و Word والنصوص." }
    },
    {
        q: { en: "Does it support local laws?", ar: "هل يدعم الأنظمة المحلية؟" },
        a: { en: "Yes, the assistant is optimized to understand and apply regulations relevant to the region, including Saudi and UAE laws.", ar: "نعم، تم تحسين المساعد ليفهم ويطبق اللوائح ذات الصلة بالمنطقة، بما في ذلك الأنظمة السعودية والإماراتية." }
    },
    {
        q: { en: "Can I try it for free?", ar: "هل يمكنني تجربته مجاناً؟" },
        a: { en: "Yes, we offer a free trial upon registration that gives you a limited token balance to explore the features.", ar: "نعم، نقدم تجربة مجانية عند التسجيل تمنحك رصيداً محدوداً من الرموز لاستكشاف الميزات." }
    },
    {
        q: { en: "How does the token system work?", ar: "كيف يعمل نظام الرموز؟" },
        a: { en: "Each task (e.g., drafting, analysis) consumes tokens based on complexity and length. Your balance decreases as you use the services.", ar: "تستهلك كل مهمة (مثل الصياغة والتحليل) رموزاً بناءً على التعقيد والطول. ينقص رصيدك كلما استخدمت الخدمات." }
    },
    {
        q: { en: "Can I upgrade my plan later?", ar: "هل يمكنني ترقية خطتي لاحقاً؟" },
        a: { en: "Absolutely. You can upgrade your subscription at any time from your profile to get more tokens and features.", ar: "بالتأكيد. يمكنك ترقية اشتراكك في أي وقت من ملفك الشخصي للحصول على المزيد من الرموز والميزات." }
    },
    {
        q: { en: "Does it support English?", ar: "هل يدعم اللغة الإنجليزية؟" },
        a: { en: "Yes, the Smart Assistant is fully bilingual (Arabic & English) and can translate legal concepts accurately between them.", ar: "نعم، المساعد الذكي ثنائي اللغة بالكامل (العربية والإنجليزية) ويمكنه ترجمة المفاهيم القانونية بدقة بينهما." }
    },
    {
        q: { en: "What happens if I run out of tokens?", ar: "ماذا يحدث إذا نفدت الرموز؟" },
        a: { en: "You will need to upgrade your plan or wait for your monthly renewal to continue using paid features.", ar: "ستحتاج إلى ترقية خطتك أو انتظار التجديد الشهري لمتابعة استخدام الميزات المدفوعة." }
    },
    {
        q: { en: "Can I cancel anytime?", ar: "هل يمكنني الإلغاء في أي وقت؟" },
        a: { en: "Yes, you can cancel your subscription auto-renewal at any time from your account settings without penalty.", ar: "نعم، يمكنك إلغاء التجديد التلقائي لاشتراكك في أي وقت من إعدادات حسابك دون أي غرامات." }
    },
    {
        q: { en: "Do you offer enterprise solutions?", ar: "هل تقدمون حلولاً للشركات؟" },
        a: { en: "Yes, we have tailored packages for law firms and enterprises. Please contact our support team for details.", ar: "نعم، لدينا باقات مخصصة لمكاتب المحاماة والشركات. يرجى التواصل مع فريق الدعم للحصول على التفاصيل." }
    },
    {
        q: { en: "How fast is the generation?", ar: "ما مدى سرعة الإنشاء؟" },
        a: { en: "Most documents and analyses are generated within seconds to a minute, saving you hours of manual work.", ar: "يتم إنشاء معظم المستندات والتحليلات في غضون ثوانٍ إلى دقيقة، مما يوفر عليك ساعات من العمل اليدوي." }
    },
    {
        q: { en: "Can I upload handwritten files?", ar: "هل يمكنني رفع ملفات بخط اليد؟" },
        a: { en: "The system supports OCR, but accuracy depends on handwriting clarity. Typed documents provide the best results.", ar: "النظام يدعم التعرف الضوئي (OCR)، لكن الدقة تعتمد على وضوح الخط. المستندات المطبوعة تعطي أفضل النتائج." }
    },
    {
        q: { en: "Is technical support available?", ar: "هل يتوفر دعم فني؟" },
        a: { en: "Yes, our support team is available via the ticketing system in the app or email to assist you.", ar: "نعم، فريق الدعم لدينا متاح عبر نظام التذاكر في التطبيق أو البريد الإلكتروني لمساعدتك." }
    }
  ];

  const midIndex = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, midIndex);
  const rightFaqs = faqs.slice(midIndex);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg font-sans">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-5 dark:opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/80 via-white/50 to-white dark:from-dark-bg/90 dark:via-dark-bg/80 dark:to-dark-bg"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold mb-8 animate-fade-in-down">
            <Zap size={16} className="fill-primary-600 text-primary-600" />
            {t('poweredByAI')}
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight animate-fade-in-up">
            {t('heroTitleMain')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              {t('heroTitleHighlight')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={handlePrimaryAction}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {currentUser ? t('goToDashboard') : t('startFreeTrial')}
              {dir === 'rtl' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </section>

      {/* Location Awareness Section (UAE Themed - Activity/Night) */}
      <section className="py-12 bg-white dark:bg-dark-card-bg relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-[20s]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90"></div>
          
          <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-start">
                  <div className="bg-primary-500/20 p-4 rounded-full backdrop-blur-sm border border-primary-500/30 shadow-[0_0_30px_rgba(205,165,100,0.3)] animate-pulse">
                      <MapPin size={32} className="text-primary-400" />
                  </div>
                  <div className="max-w-2xl">
                      <h3 className="text-2xl font-bold text-white mb-2">{t('locationAwarenessMessage')}</h3>
                      <p className="text-primary-200 text-sm font-medium opacity-90">
                          {language === 'ar' ? 'نحن هنا لدعمك في دبي، الرياض، وكل المنطقة.' : 'We are here to support you in Dubai, Riyadh, and the entire region.'}
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-dark-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t('featuresTitle')}</h2>
            <div className="h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-dark-card-bg p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-border group hover:-translate-y-2">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                    <Icon size={28} className="text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t(feature.titleKey as any)}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(feature.descKey as any)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section - Changed bg to white/gray as requested */}
      { !loadingPlans && plans.length > 0 && (
        <section id="pricing" className="py-24 bg-white dark:bg-dark-card-bg border-t border-gray-100 dark:border-dark-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t('pricingTitle')}</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('pricingSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
              {plans.map((plan: Plan) => (
                <div key={plan.id} className={`relative flex flex-col bg-gray-50 dark:bg-dark-bg rounded-3xl transition-all duration-300 ${plan.isPopular ? 'border-2 border-primary-500 shadow-2xl scale-105 z-10' : 'border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl'}`}>
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
                    <p className="text-center text-primary-600 dark:text-primary-300 font-medium bg-white dark:bg-primary-900/20 py-1 px-3 rounded-full text-sm inline-block mx-auto w-full mb-8 shadow-sm border border-gray-100 dark:border-primary-800/30">
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
                      onClick={handlePrimaryAction}
                      className={`w-full py-4 text-base font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg ${plan.isPopular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-white hover:bg-gray-50 dark:bg-dark-card-bg dark:hover:bg-gray-700 text-slate-900 dark:text-white border border-gray-200 dark:border-dark-border'}`}
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

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50 dark:bg-dark-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                      {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      {language === 'ar' 
                          ? 'إجابات على أهم استفساراتك حول المساعد الذكي وخدماته.' 
                          : 'Answers to your most important questions about the Smart Assistant and its services.'}
                  </p>
              </div>

              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                  <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      {leftFaqs.map((item, index) => (
                          <AccordionItem 
                            key={index} 
                            item={item} 
                            isOpen={openFaqIndex === index}
                            onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                            language={language}
                          />
                      ))}
                  </div>
                  <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      {rightFaqs.map((item, index) => (
                          <AccordionItem 
                            key={index + midIndex} 
                            item={item} 
                            isOpen={openFaqIndex === index + midIndex}
                            onClick={() => setOpenFaqIndex(openFaqIndex === index + midIndex ? null : index + midIndex)}
                            language={language}
                          />
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-700 to-primary-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-6">{t('finalCtaTitle')}</h2>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10">
            {t('finalCtaSubtitle')}
          </p>
          <button 
            onClick={handlePrimaryAction}
            className="px-10 py-5 bg-white text-primary-700 text-xl font-bold rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
          >
            {currentUser ? t('goToDashboard') : t('signUpForFree')}
          </button>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
