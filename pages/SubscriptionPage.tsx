
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { db } from '../services/firebase';
import { onSnapshot, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { STRIPE_PUBLISHABLE_KEY } from '../constants';
import { Plan } from '../types';
import { Loader2, CheckCircle2, Star } from 'lucide-react';

declare const Stripe: any; // Use Stripe from the global scope

const SubscriptionPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { t, language } = useLanguage();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [errorPlans, setErrorPlans] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoadingPlans(true);
            setErrorPlans(null);
            try {
                const plansCollection = collection(db, 'subscription_plans');
                const q = query(plansCollection, where('status', '==', 'active'));
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    setPlans([]);
                } else {
                    const plansData = snapshot.docs.map(doc => doc.data() as Plan);
                    plansData.sort((a, b) => a.tokens - b.tokens);
                    setPlans(plansData);
                }
            } catch (err) {
                console.error("Error fetching subscription plans:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessage.includes('firestore/failed-precondition') || errorMessage.includes('requires an index')) {
                    setErrorPlans(t('fetchUsersIndexError'));
                } else {
                    setErrorPlans(t('fetchPlansError'));
                }
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchPlans();
    }, [t]);

    const handleCheckout = async (priceId: string) => {
        if (!currentUser) return;
        setLoadingPriceId(priceId);

        // STRICT CHECK: Ensure the key is a Publishable Key (pk_)
        if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
            alert(t('stripeKeysNotConfigured') + '\n\nCurrent Key: ' + STRIPE_PUBLISHABLE_KEY.substring(0, 10) + '...\nMust start with "pk_live_" or "pk_test_"');
            setLoadingPriceId(null);
            return;
        }

        try {
            // IMPORTANT: We are writing to Firestore instead of calling a Cloud Function directly.
            // The Stripe Extension listens to document creation in this collection and triggers the background process.
            const collectionRef = collection(db, 'customers', currentUser.uid, 'checkout_sessions');
            
            const docRef = await addDoc(collectionRef, {
                price: priceId,
                success_url: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: window.location.href,
            });

            // Timeout safety: If extension doesn't respond in 15 seconds, abort.
            const timeoutId = setTimeout(() => {
                console.warn("Stripe checkout session creation timed out.");
                setLoadingPriceId(null);
                alert(t('paymentError') + " (Timeout: Server took too long)");
            }, 15000);

            // Listen for the session ID to be written back to the document by the extension
            const unsubscribe = onSnapshot(docRef, (snap) => {
                const { error, sessionId } = snap.data() as { error?: { message: string }; sessionId?: string } || {};
                
                if (error) {
                    clearTimeout(timeoutId);
                    unsubscribe();
                    console.error("Stripe checkout error:", error.message);
                    alert(error.message);
                    setLoadingPriceId(null);
                }
                
                if (sessionId) {
                    clearTimeout(timeoutId);
                    unsubscribe();
                    const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
                    stripe.redirectToCheckout({ sessionId });
                }
            });

        } catch (error) {
            console.error("Error creating checkout session document:", error);
            alert(t('paymentError'));
            setLoadingPriceId(null);
        }
    };
    
    return (
        <div className="bg-light-bg dark:bg-dark-bg py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{t('chooseYourPlan')}</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('planDescription')}</p>
                </div>

                {loadingPlans ? (
                    <div className="text-center p-12"><Loader2 className="animate-spin inline-block text-primary-500" size={40} /></div>
                ) : errorPlans ? (
                    <p className="text-center text-red-500 p-12">{errorPlans}</p>
                ) : plans.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 p-12">{t('noPlansFound')}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan: Plan) => {
                            const isProcessing = loadingPriceId === plan.priceId;
                            const isOtherProcessing = loadingPriceId !== null && !isProcessing;

                            return (
                                <div key={plan.id} className={`relative border rounded-lg shadow-lg flex flex-col transition-opacity duration-200 ${plan.isPopular ? 'border-primary-500' : 'dark:border-gray-700'} ${isOtherProcessing ? 'opacity-50 grayscale-[50%]' : 'opacity-100'}`}>
                                    {plan.isPopular && (
                                        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                                            <span className="bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase flex items-center gap-1">
                                                <Star size={12} fill="white"/>
                                                {t('mostPopular')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="bg-light-card-bg dark:bg-dark-card-bg p-8 rounded-t-lg flex-grow">
                                        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">{plan.title[language]}</h2>
                                        <p className="mt-4 text-4xl font-extrabold text-center text-gray-900 dark:text-white">{plan.price[language]}</p>
                                        <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{plan.tokens.toLocaleString()} {t('tokens')}</p>
                                        <ul className="mt-8 space-y-4">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <CheckCircle2 className="h-6 w-6 text-primary-500" />
                                                    </div>
                                                    <p className="ml-3 text-base text-gray-500 dark:text-gray-400">{feature[language]}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-light-card-bg dark:bg-dark-card-bg p-8 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => handleCheckout(plan.priceId)}
                                            disabled={loadingPriceId !== null}
                                            className={`w-full block text-center rounded-md py-3 px-6 font-medium text-white shadow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${plan.isPopular ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin inline-block" /> : t('choosePlan')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionPage;
