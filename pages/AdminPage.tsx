
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, PlusSquare, Trash2, Edit, Play, Loader2, Wand2, ChevronDown, Plus, CreditCard, X, Star, Cog, Coins, Gift, Ban, CheckCircle, RefreshCw, Activity, LayoutTemplate } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { collection, getDocs, getDoc, query, orderBy, doc, setDoc, deleteDoc, updateDoc, writeBatch, increment, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Service, ServiceCategory, FormInput, FormInputType, Translations, SubscriptionInfo, Plan, SiteSettings, Language, LandingPageConfig } from '../types';
import { iconNames, ADMIN_EMAIL } from '../constants';
import { Type } from "@google/genai";
import { generateServiceConfigWithAI } from '../services/geminiService';
import { uploadFile } from '../services/storageService';
import ServiceExecutionModal from '../components/ServiceExecutionModal';
import { litigationSeedServices, specializedConsultationsSeedServices, investigationsAndCriminalSeedServices, corporateAndComplianceSeedServices, creativeSeedServices } from '../services/seedData';


interface UserData {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
    tokenBalance?: number;
    tokensUsed?: number;
    stripeId?: string;
    createdAt?: {
        seconds: number;
        nanoseconds: number;
    };
}

interface UserWithSubscription extends UserData {
    subscription?: SubscriptionInfo;
}

const initialServiceState: Service = {
    id: '',
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: '', ar: '' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [],
    usageCount: 0,
};

const initialPlanState: Plan = {
    id: '',
    priceId: '',
    title: { en: '', ar: '' },
    price: { en: '', ar: '' },
    tokens: 1000000,
    isPopular: false,
    features: [{ en: '', ar: '' }],
    status: 'active',
};

const initialSiteSettings: SiteSettings = {
    siteName: { en: 'The Smart Assistant', ar: 'المساعد الذكي' },
    metaDescription: { en: '', ar: '' },
    seoKeywords: { en: '', ar: '' },
    logoUrl: '',
    faviconUrl: '',
    isMaintenanceMode: false,
};


const GrantSubscriptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: UserData[];
    plans: Plan[];
    onGrant: () => void;
    initialUserId?: string;
}> = ({ isOpen, onClose, users, plans, onGrant, initialUserId }) => {
    const { t, language } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState(initialUserId || '');
    const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || 'custom');
    const [tokenAmount, setTokenAmount] = useState(plans[0]?.tokens || 100000);
    const [durationDays, setDurationDays] = useState(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialUserId) setSelectedUserId(initialUserId);
    }, [initialUserId]);

    useEffect(() => {
        const plan = plans.find(p => p.id === selectedPlanId);
        if (plan) {
            setTokenAmount(plan.tokens);
        }
    }, [selectedPlanId, plans]);
    
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!selectedUserId) {
            alert(t('selectUser'));
            return;
        }
        if (!tokenAmount || tokenAmount < 0) {
            alert("Please enter a valid token amount");
            return;
        }
        if (!durationDays || durationDays <= 0) {
            alert("Please enter a valid duration");
            return;
        }

        setIsSubmitting(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);

            const subId = `manual_${Date.now()}`;
            // Write to 'customers' collection for consistency
            const subRef = doc(db, 'customers', selectedUserId, 'subscriptions', subId);
            const userRef = doc(db, 'users', selectedUserId);

            const batch = writeBatch(db);

            batch.set(subRef, {
                isManual: true,
                status: 'active',
                planId: selectedPlanId,
                current_period_end: Timestamp.fromDate(expiryDate),
                items: [{ price: { product: { metadata: { planId: selectedPlanId } } } }]
            });

            // FIX: Use batch.set with merge instead of batch.update to prevent errors if doc doesn't exist or permissions are strict on update.
            batch.set(userRef, {
                tokenBalance: increment(tokenAmount)
            }, { merge: true });

            await batch.commit();
            
            alert(t('grantSuccess'));
            
            if (onGrant) {
                await onGrant();
            }
            onClose();
        } catch (error) {
            console.error("Error granting subscription:", error);
            alert(`${t('grantError')}: ${(error as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const usersWithoutAdmin = users.filter(u => u.email !== ADMIN_EMAIL);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{t('grantSubscription')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">{t('selectUser')}</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            disabled={!!initialUserId}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                        >
                            <option value="" disabled>-- {t('selectUser')} --</option>
                            {usersWithoutAdmin.length > 0 ? usersWithoutAdmin.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                            )) : <option disabled>{t('noUsersFound')}</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('selectPlan')}</label>
                        <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.title[language]}</option>
                            ))}
                             <option value="custom">{t('customPlan')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('tokenAmount')}</label>
                        <input
                            type="number"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(Number(e.target.value))}
                            required
                            readOnly={selectedPlanId !== 'custom'}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 read-only:bg-gray-200 dark:read-only:bg-gray-800"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t('durationDays')}</label>
                        <input
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(Number(e.target.value))}
                            required
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center min-w-[100px]">
                            {isSubmitting && <Loader2 className="animate-spin mr-2" size={20} />}
                            {t('grant')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddTokenModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail: string;
    onSuccess: () => void;
}> = ({ isOpen, onClose, userId, userEmail, onSuccess }) => {
    const { t } = useLanguage();
    const [amount, setAmount] = useState<number>(1000);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "users", userId), {
                tokenBalance: increment(amount)
            });
            alert(t('tokensAddedSuccess'));
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error adding tokens:", error);
            alert(t('userUpdatedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold">{t('addTokens')}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Adding tokens for: <b>{userEmail}</b>
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('tokenAmount')}</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            min="1"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">{t('cancel')}</button>
                         <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-primary-600 text-white flex items-center gap-2">
                             {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                             {t('add')}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PlanForm: React.FC<{
    plan: Plan;
    onSave: (plan: Plan) => Promise<boolean>;
    onCancel: () => void;
    isEditing: boolean;
}> = ({ plan, onSave, onCancel, isEditing }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Plan>(plan);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(plan);
    }, [plan]);

    const handleInputChange = (field: keyof Plan, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (field: 'title' | 'price', lang: 'en' | 'ar', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: { ...prev[field], [lang]: value }
        }));
    };

    const handleFeatureChange = (index: number, lang: 'en' | 'ar', value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = { ...newFeatures[index], [lang]: value };
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...prev.features, { en: '', ar: '' }] }));
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await onSave(formData);
        if (!success) {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleFormSubmit} className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700 space-y-4 mb-8">
            <h3 className="text-xl font-semibold border-b dark:border-gray-600 pb-2">{isEditing ? t('editPlan') : t('addNewPlan')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder={t('planId')} value={formData.id} onChange={e => handleInputChange('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 read-only:bg-gray-200 dark:read-only:bg-gray-800" required readOnly={isEditing} />
                
                {/* Direct Price ID Input - No dropdown logic */}
                <div>
                    <input 
                        type="text" 
                        placeholder={t('priceId')} 
                        value={formData.priceId} 
                        onChange={e => handleInputChange('priceId', e.target.value.trim())} 
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                        required 
                    />
                    <p className="text-xs text-gray-500 mt-1">Must match a Price ID in Stripe Dashboard (e.g., price_123...)</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder={t('planTitleEn')} value={formData.title.en} onChange={e => handleNestedChange('title', 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder={t('planTitleAr')} value={formData.title.ar} onChange={e => handleNestedChange('title', 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder={t('planPriceEn')} value={formData.price.en} onChange={e => handleNestedChange('price', 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" placeholder={t('planPriceAr')} value={formData.price.ar} onChange={e => handleNestedChange('price', 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder={t('planTokens')} value={formData.tokens} onChange={e => handleInputChange('tokens', Number(e.target.value))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                 <select value={formData.status} onChange={e => handleInputChange('status', e.target.value as 'active' | 'inactive')} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="active">{t('active')}</option>
                    <option value="inactive">{t('inactive')}</option>
                </select>
            </div>
             <div className="pt-2">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.isPopular} onChange={e => handleInputChange('isPopular', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span>{t('isPopular')}</span>
                </label>
            </div>

            <div className="border-t dark:border-gray-600 pt-4">
                <h4 className="font-semibold">{t('planFeatures')}</h4>
                {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 my-2">
                        <input type="text" placeholder={t('featureEn')} value={feature.en} onChange={e => handleFeatureChange(index, 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" placeholder={t('featureAr')} value={feature.ar} onChange={e => handleFeatureChange(index, 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <button type="button" onClick={() => removeFeature(index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                    </div>
                ))}
                <button type="button" onClick={addFeature} className="mt-2 text-sm text-primary-600 hover:underline">{t('addFeature')}</button>
            </div>

            <div className="flex items-center gap-4 pt-4">
                 <button type="submit" disabled={isSaving} className="flex-grow bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center">
                    {isSaving && <Loader2 className="animate-spin mr-2" size={20} />}
                    {t('savePlan')}
                </button>
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
            </div>
        </form>
    );
};


const AdminPage = () => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('users');
    // User management state
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState<UserData | null>(null);
    
    // Service management state
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState<string|null>(null);
    const [newService, setNewService] = useState<Service>(initialServiceState);
    const [isEditingService, setIsEditingService] = useState(false);
    const [aiServiceName, setAiServiceName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    // Service execution modal state
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
    // Seeding state
    const [isSeeding, setIsSeeding] = useState(false);
    // Filtering state
    const [filterCategory, setFilterCategory] = useState<ServiceCategory | 'all'>('all');
    // Selection state
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    // Subscription management state
    const [usersWithSub, setUsersWithSub] = useState<UserWithSubscription[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [subError, setSubError] = useState<string | null>(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    // Plan management state
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [planError, setPlanError] = useState<string | null>(null);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Site Settings State
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    
    // Landing Page Generator State
    const [landingPagePrompt, setLandingPagePrompt] = useState('');
    const [isGeneratingLanding, setIsGeneratingLanding] = useState(false);

    const seedButtonColorClasses: { [key: string]: string } = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        green: 'bg-green-600 hover:bg-green-700',
        red: 'bg-red-600 hover:bg-red-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        teal: 'bg-teal-600 hover:bg-teal-700',
    };

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setUserError(null);
        try {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            setUsers(usersData);
            return usersData;
        } catch (err) {
            console.error("Error fetching users: ", err);
            if (err instanceof Error && (err.message.includes('firestore/failed-precondition') || err.message.includes('requires an index'))) {
                setUserError(t('fetchUsersIndexError'));
            } else {
                setUserError(t('fetchUsersError'));
            }
        } finally {
            setLoadingUsers(false);
        }
        return [];
    }, [t]);

    const fetchPlans = useCallback(async () => {
        setLoadingPlans(true);
        setPlanError(null);
        try {
            const q = query(collection(db, 'subscription_plans'), orderBy('tokens'));
            const snapshot = await getDocs(q);
            const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
            setPlans(plansData);
        } catch (err) {
            console.error("Error fetching plans: ", err);
            setPlanError(t('fetchPlansError'));
        } finally {
            setLoadingPlans(false);
        }
    }, [t]);


    const fetchUsersWithSubscriptions = useCallback(async () => {
        setLoadingSubs(true);
        setSubError(null);
        try {
            const usersData = await fetchUsers();
            if (!usersData) throw new Error("Could not fetch base user data.");

            const usersWithSubscriptionsPromises = usersData.map(async (user) => {
                try {
                    // CHANGED: Fetch from 'customers' collection
                    const subscriptionsRef = collection(db, 'customers', user.id, 'subscriptions');
                    const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));
                    const subSnapshot = await getDocs(q);

                    if (subSnapshot.empty) {
                        return { ...user, subscription: undefined };
                    } else {
                        const subDoc = subSnapshot.docs[0];
                        const subData = subDoc.data();
                        
                        const planId = subData.isManual
                            ? subData.planId
                            : subData.items[0]?.price.product.metadata.planId || 'unknown';

                        const subscription: SubscriptionInfo = {
                            id: subDoc.id,
                            planId: planId,
                            stripeSubscriptionId: subData.isManual ? undefined : subDoc.id,
                            status: subData.status,
                            current_period_end: subData.current_period_end.seconds,
                            priceId: subData.isManual ? 'manual' : subData.items[0]?.price.id,
                            isManual: subData.isManual || false,
                        };
                        return { ...user, subscription };
                    }
                } catch (err) {
                    // Log warning but allow other users to load
                    console.warn(`Failed to fetch subscription for user ${user.id}`, err);
                    return { ...user, subscription: undefined };
                }
            });
            const resolvedUsers = await Promise.all(usersWithSubscriptionsPromises);
            setUsersWithSub(resolvedUsers);

        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            setSubError(t('fetchSubsError'));
        } finally {
            setLoadingSubs(false);
        }
    }, [t, fetchUsers]);

    const fetchServices = useCallback(async () => {
        setLoadingServices(true);
        setServiceError(null);
        try {
            const servicesCollection = collection(db, 'services');
            const q = query(servicesCollection, orderBy('title.en'));
            const servicesSnapshot = await getDocs(q);
            setServices(servicesSnapshot.docs.map(doc => doc.data() as Service));
        } catch (err) {
            setServiceError(t('fetchServicesError'));
            console.error(err);
        } finally {
            setLoadingServices(false);
        }
    }, [t]);

    const fetchSiteSettings = useCallback(async () => {
        setLoadingSettings(true);
        try {
            const settingsDocRef = doc(db, 'site_settings', 'main');
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as SiteSettings;
                // Merge with initial settings to ensure all fields exist (defensive)
                setSiteSettings({
                    ...initialSiteSettings,
                    ...data,
                    siteName: { ...initialSiteSettings.siteName, ...(data.siteName || {}) },
                    metaDescription: { ...initialSiteSettings.metaDescription, ...(data.metaDescription || {}) },
                    seoKeywords: { ...initialSiteSettings.seoKeywords, ...(data.seoKeywords || {}) },
                });
            } else {
                setSiteSettings(initialSiteSettings);
            }
        } catch (error) {
            console.error("Error fetching site settings:", error);
        } finally {
            setLoadingSettings(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
            fetchPlans(); // Ensure plans are available for granting subscription
        } else if (activeTab === 'services') {
            fetchServices();
        } else if (activeTab === 'subscriptions') {
            fetchUsersWithSubscriptions();
            fetchPlans();
        } else if (activeTab === 'plans') {
            fetchPlans();
        } else if (activeTab === 'settings' || activeTab === 'landing') {
            fetchSiteSettings();
        }
    }, [activeTab, fetchUsers, fetchServices, fetchUsersWithSubscriptions, fetchPlans, fetchSiteSettings]);

    const filteredServices = useMemo(() => {
        if (filterCategory === 'all') {
            return services;
        }
        return services.filter(service => service.category === filterCategory);
    }, [services, filterCategory]);
    
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const numSelectedInFilter = filteredServices.filter(s => selectedServices.includes(s.id)).length;
            const allInFilterSelected = numSelectedInFilter === filteredServices.length && filteredServices.length > 0;
            const someInFilterSelected = numSelectedInFilter > 0 && numSelectedInFilter < filteredServices.length;
    
            selectAllCheckboxRef.current.checked = allInFilterSelected;
            selectAllCheckboxRef.current.indeterminate = someInFilterSelected;
        }
    }, [selectedServices, filteredServices]);
    
    const handleGenerateService = async () => {
        if (!aiServiceName) {
            alert(t('enterServiceName'));
            return;
        }
        setIsGenerating(true);
        setShowServiceForm(false);
        setIsEditingService(false);
        try {
            const schema = {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: 'A unique, URL-friendly ID in kebab-case.' },
                    title_en: { type: Type.STRING },
                    title_ar: { type: Type.STRING },
                    description_en: { type: Type.STRING },
                    description_ar: { type: Type.STRING },
                    subCategory_en: { type: Type.STRING },
                    subCategory_ar: { type: Type.STRING },
                    category: { type: Type.STRING, enum: Object.values(ServiceCategory) },
                    icon: { type: Type.STRING, enum: iconNames },
                    formInputs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'A unique name in snake_case.' },
                                label_en: { type: Type.STRING },
                                label_ar: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['text', 'textarea', 'date', 'file'] }
                            },
                            required: ['name', 'label_en', 'label_ar', 'type']
                        }
                    }
                },
                required: ['id', 'title_en', 'title_ar', 'description_en', 'description_ar', 'subCategory_en', 'subCategory_ar', 'category', 'icon', 'formInputs']
            };

            const prompt = `You are a meticulous AI assistant specializing in creating structured JSON configurations for a legal tech platform. Your task is to generate a complete service configuration based on the provided service name.

**Service Name:** "${aiServiceName}"

**CRITICAL INSTRUCTIONS:**
1.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the JSON object itself.
2.  **Language Separation:** This is the most important rule. You MUST provide accurate Arabic translations for all fields ending in \`_ar\`. Fields ending in \`_en\` must contain English text. DO NOT use English text in an \`_ar\` field under any circumstances.

**EXAMPLE of a PERFECT OUTPUT:**
If the service name was "Review a real estate lease", the output should be this exact JSON format:
{
  "id": "real-estate-lease-review",
  "title_en": "Real Estate Lease Review",
  "title_ar": "مراجعة عقد إيجار عقاري",
  "description_en": "Analyze a residential or commercial lease agreement to identify potential risks and unfair clauses.",
  "description_ar": "تحليل عقد إيجار سكني أو تجاري لتحديد المخاطر المحتملة والبنود غير العادلة.",
  "subCategory_en": "Real Estate Law",
  "subCategory_ar": "قانون العقارات",
  "category": "specializedConsultations",
  "icon": "Home",
  "formInputs": [
    {
      "name": "lease_agreement_file",
      "label_en": "Upload Lease Agreement",
      "label_ar": "رفع عقد الإيجار",
      "type": "file"
    },
    {
      "name": "specific_questions",
      "label_en": "Specific Questions (Optional)",
      "label_ar": "أسئلة محددة (اختياري)",
      "type": "textarea"
    }
  ]
}

Now, based on the service name **"${aiServiceName}"**, generate a new JSON object following the same structure and adhering strictly to all rules.

**DETAILS TO GENERATE:**
- **id:** A unique, URL-friendly ID in kebab-case.
- **title_en / title_ar:** The service title in English and Arabic.
- **description_en / description_ar:** A concise description in English and Arabic.
- **subCategory_en / subCategory_ar:** A logical sub-category in English and Arabic (e.g., "Corporate Law" / "قانون الشركات").
- **category:** Must be one of: ${Object.values(ServiceCategory).join(', ')}.
- **icon:** Choose the most appropriate icon from this list: [${iconNames.join(', ')}].
- **formInputs:** An array of 2-4 input fields. Each must have:
  - **name:** snake_case identifier.
  - **label_en / label_ar:** User-friendly labels in English and Arabic.
  - **type:** Must be one of: 'text', 'textarea', 'date', 'file'.

**FINAL REMINDER:** The separation of English (\`_en\`) and Arabic (\`_ar\`) is mandatory. Your response will be parsed automatically, and any error in language placement will cause a failure.`;
            
            const response = await generateServiceConfigWithAI(prompt, schema);

            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }
            const generatedData = JSON.parse(jsonString);

            const serviceData: Service = {
                id: generatedData.id || '',
                title: { en: generatedData.title_en || '', ar: generatedData.title_ar || '' },
                description: { en: generatedData.description_en || '', ar: generatedData.description_ar || '' },
                category: (generatedData.category as ServiceCategory) || ServiceCategory.LitigationAndPleadings,
                subCategory: { en: generatedData.subCategory_en || '', ar: generatedData.subCategory_ar || '' },
                icon: generatedData.icon || 'FileText',
                geminiModel: 'gemini-2.5-flash',
                usageCount: 0,
                formInputs: (generatedData.formInputs || []).map((input: any) => {
                    const formInput: FormInput = {
                        name: input.name || '',
                        label: { en: input.label_en || '', ar: input.label_ar || '' },
                        type: (input.type as FormInputType) || 'text',
                    };
                    return formInput;
                }),
            };
            
            setNewService(serviceData);
            setShowServiceForm(true);

        } catch (error) {
            console.error("Error generating service with AI:", error);
            alert(t('generateServiceError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateLandingPage = async () => {
        if (!landingPagePrompt) {
            alert("Please enter a topic to generate the landing page.");
            return;
        }
        setIsGeneratingLanding(true);
        try {
            const schema = {
                type: Type.OBJECT,
                properties: {
                    heroTitleMain_en: { type: Type.STRING },
                    heroTitleMain_ar: { type: Type.STRING },
                    heroTitleHighlight_en: { type: Type.STRING },
                    heroTitleHighlight_ar: { type: Type.STRING },
                    heroSubtitle_en: { type: Type.STRING },
                    heroSubtitle_ar: { type: Type.STRING },
                    featuresTitle_en: { type: Type.STRING },
                    featuresTitle_ar: { type: Type.STRING },
                    features: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                icon: { type: Type.STRING, enum: iconNames },
                                title_en: { type: Type.STRING },
                                title_ar: { type: Type.STRING },
                                description_en: { type: Type.STRING },
                                description_ar: { type: Type.STRING },
                                color: { type: Type.STRING, description: "Tailwind CSS gradient classes e.g. 'from-blue-400 to-blue-600'" }
                            },
                            required: ['icon', 'title_en', 'title_ar', 'description_en', 'description_ar', 'color']
                        }
                    }
                },
                required: ['heroTitleMain_en', 'heroTitleMain_ar', 'heroTitleHighlight_en', 'heroTitleHighlight_ar', 'heroSubtitle_en', 'heroSubtitle_ar', 'featuresTitle_en', 'featuresTitle_ar', 'features']
            };

            const prompt = `Generate a high-converting Landing Page configuration for a legal service website based on this topic: "${landingPagePrompt}".

            Requirements:
            1. **Bilingual:** Provide professional English and Arabic translations for all text fields.
            2. **Hero Section:** 
               - Main Title: Catchy and authoritative.
               - Highlight Title: A short, powerful phrase (e.g., "Powered by AI").
               - Subtitle: A compelling 2-sentence value proposition.
            3. **Features:** Generate exactly 9 distinct features related to the topic.
               - Icon: Choose the most relevant icon name from: ${iconNames.join(', ')}.
               - Color: Provide valid Tailwind CSS gradient classes (e.g., 'from-purple-400 to-pink-600', 'from-blue-500 to-cyan-400', 'from-emerald-400 to-teal-600'). Make them varied and bright.
            4. **Output:** Pure JSON only. No markdown.
            `;

            const response = await generateServiceConfigWithAI(prompt, schema);
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }
            const data = JSON.parse(jsonString);

            const newConfig: LandingPageConfig = {
                heroTitleMain: { en: data.heroTitleMain_en, ar: data.heroTitleMain_ar },
                heroTitleHighlight: { en: data.heroTitleHighlight_en, ar: data.heroTitleHighlight_ar },
                heroSubtitle: { en: data.heroSubtitle_en, ar: data.heroSubtitle_ar },
                featuresTitle: { en: data.featuresTitle_en, ar: data.featuresTitle_ar },
                features: data.features.map((f: any) => ({
                    icon: f.icon,
                    title: { en: f.title_en, ar: f.title_ar },
                    description: { en: f.description_en, ar: f.description_ar },
                    color: f.color
                }))
            };

            // Update local state and save to Firestore
            const updatedSettings: SiteSettings = {
                ...siteSettings,
                landingPageConfig: newConfig
            };
            
            await setDoc(doc(db, "site_settings", "main"), updatedSettings);
            setSiteSettings(updatedSettings);
            alert("Landing Page Generated and Saved Successfully!");
            setLandingPagePrompt('');

        } catch (error) {
            console.error("Error generating landing page:", error);
            alert("Failed to generate landing page. Please try again.");
        } finally {
            setIsGeneratingLanding(false);
        }
    };

    const handleClearLandingConfig = async () => {
        if(window.confirm("Are you sure? This will reset the landing page to the default hardcoded content.")){
             const updatedSettings: SiteSettings = {
                ...siteSettings,
                landingPageConfig: undefined
            };
            await setDoc(doc(db, "site_settings", "main"), updatedSettings);
            setSiteSettings(updatedSettings);
            alert("Landing page reset to default.");
        }
    }
    
    const handleUpdateUserStatus = async (userId: string, status: 'active' | 'disabled') => {
        const confirmationMessage = status === 'active' ? t('enableUserConfirm') : t('disableUserConfirm');
        if (window.confirm(confirmationMessage)) {
            try {
                await updateDoc(doc(db, "users", userId), { status });
                alert(t('userUpdatedSuccess'));
                fetchUsers();
            } catch (error) {
                console.error("Error updating user status:", error);
                alert(t('userUpdatedError'));
            }
        }
    };

    const handleOpenTokenModal = (user: UserData) => {
        setSelectedUserForAction(user);
        setIsTokenModalOpen(true);
    };

    const handleOpenGrantModalForUser = (user: UserData) => {
        setSelectedUserForAction(user);
        setIsGrantModalOpen(true);
    }

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm(t('deleteUserConfirm'))) {
            try {
                await deleteDoc(doc(db, "users", userId));
                alert(t('userDeletedSuccess'));
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                alert(t('userDeletedError'));
            }
        }
    };

    const handleServiceInputChange = (field: keyof Service, value: any) => {
        setNewService(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNestedServiceInputChange = (field: 'title' | 'description' | 'subCategory', lang: 'en' | 'ar', value: string) => {
        setNewService(prev => ({
            ...prev,
            [field]: { ...prev[field], [lang]: value }
        }));
    };

    const handleAddFormInput = () => {
        const newFormInput: FormInput = { name: '', label: { en: '', ar: '' }, type: 'text', options: [] };
        handleServiceInputChange('formInputs', [...newService.formInputs, newFormInput]);
    };

    const handleRemoveFormInput = (index: number) => {
        handleServiceInputChange('formInputs', newService.formInputs.filter((_, i) => i !== index));
    };

    const handleFormInputChange = (index: number, field: keyof FormInput, value: any) => {
        const updatedInputs = [...newService.formInputs];
        (updatedInputs[index] as any)[field] = value;
        handleServiceInputChange('formInputs', updatedInputs);
    };
    
    const handleFormInputLabelChange = (index: number, lang: 'en' | 'ar', value: string) => {
        const updatedInputs = [...newService.formInputs];
        updatedInputs[index].label[lang] = value;
        handleServiceInputChange('formInputs', updatedInputs);
    }
    
    const handleAddOption = (inputIndex: number) => {
        const updatedInputs = [...newService.formInputs];
        if(!updatedInputs[inputIndex].options) updatedInputs[inputIndex].options = [];
        updatedInputs[inputIndex].options?.push({ value: '', label: { en: '', ar: '' } });
        handleServiceInputChange('formInputs', updatedInputs);
    };
    
    const handleRemoveOption = (inputIndex: number, optionIndex: number) => {
        const updatedInputs = [...newService.formInputs];
        updatedInputs[inputIndex].options = updatedInputs[inputIndex].options?.filter((_, i) => i !== optionIndex);
        handleServiceInputChange('formInputs', updatedInputs);
    };

    const handleOptionChange = (inputIndex: number, optionIndex: number, field: 'value' | 'label', value: any) => {
        const updatedInputs = [...newService.formInputs];
        const options = updatedInputs[inputIndex].options;
        if (options) {
            if(field === 'label'){
                 (options[optionIndex] as any)[field] = value
            } else {
                (options[optionIndex] as any)[field] = value;
            }
            handleServiceInputChange('formInputs', updatedInputs);
        }
    };
    
    const handleOptionLabelChange = (inputIndex: number, optionIndex: number, lang: 'en' | 'ar', value: string) => {
         const updatedInputs = [...newService.formInputs];
         const option = updatedInputs[inputIndex].options?.[optionIndex];
         if(option){
             option.label[lang] = value;
             handleServiceInputChange('formInputs', updatedInputs);
         }
    }

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newService.id) {
            alert(t('serviceIdRequired'));
            return;
        }
        try {
            await setDoc(doc(db, "services", newService.id), newService);
            alert(t('serviceSavedSuccess'));
            setNewService(initialServiceState);
            setShowServiceForm(false);
            setIsEditingService(false);
            setAiServiceName('');
            fetchServices();
        } catch (error) {
            console.error("Error saving service: ", error);
            alert(t('serviceSavedError'));
        }
    };

    const handleCancelEditService = () => {
        setNewService(initialServiceState);
        setShowServiceForm(false);
        setIsEditingService(false);
        setAiServiceName('');
    };
    
    const handleDeleteService = async (serviceId: string) => {
        if(window.confirm(t('deleteConfirm'))){
            try {
                await deleteDoc(doc(db, "services", serviceId));
                alert(t('serviceDeletedSuccess'));
                fetchServices();
            } catch (error) {
                console.error("Error deleting service: ", error);
                alert(t('serviceDeletedError'));
            }
        }
    }

    const handleDeleteSelectedServices = async () => {
        const count = selectedServices.length;
        if (count === 0) return;
    
        const confirmMessage = t('deleteSelectedConfirm').replace('{count}', String(count));
        
        if (window.confirm(confirmMessage)) {
            try {
                const batch = writeBatch(db);
                selectedServices.forEach(id => {
                    const serviceRef = doc(db, "services", id);
                    batch.delete(serviceRef);
                });
                await batch.commit();
                alert(t('serviceDeletedSuccess'));
                setSelectedServices([]);
                fetchServices();
            } catch (error) {
                console.error("Error deleting selected services:", error);
                alert(t('serviceDeletedError'));
            }
        }
    };

    const handleSelectAllToggle = () => {
        const filteredIds = filteredServices.map(s => s.id);
        const allInFilterSelected = filteredServices.length > 0 && filteredServices.every(s => selectedServices.includes(s.id));

        if (allInFilterSelected) {
            // Deselect all visible
            setSelectedServices(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // Select all visible
            setSelectedServices(prev => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const handleEditServiceClick = (service: Service) => {
        setNewService(service);
        setIsEditingService(true);
        setShowServiceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRunClick = (service: Service) => {
        setSelectedService(service);
        setIsExecutionModalOpen(true);
    };

    const [seedingState, setSeedingState] = useState({
        litigation: false,
        consultations: false,
        investigations: false,
        corporate: false,
        creative: false,
    });
    
    const createSeedHandler = (
        key: keyof typeof seedingState,
        services: Service[],
        confirmKey: keyof Translations,
        successKey: keyof Translations,
    ) => () => {
        if (window.confirm(t(confirmKey))) {
            setSeedingState(prev => ({ ...prev, [key]: true }));
            const batch = writeBatch(db);
            services.forEach(service => {
                const docRef = doc(db, 'services', service.id);
                batch.set(docRef, service);
            });
            batch.commit()
                .then(() => {
                    alert(t(successKey));
                    fetchServices();
                })
                .catch(error => {
                    // FIX: Explicitly convert `key` to a string to avoid potential runtime errors with implicit symbol conversion.
                    console.error(`Error seeding ${String(key)}:`, error);
                    alert(`Error seeding ${String(key)}.`);
                })
                .finally(() => setSeedingState(prev => ({ ...prev, [key]: false })));
        }
    };
    
    const handleSeedLitigationServices = createSeedHandler('litigation', litigationSeedServices, 'seedLitigationConfirm', 'seedLitigationSuccess');
    const handleSeedConsultationServices = createSeedHandler('consultations', specializedConsultationsSeedServices, 'seedConsultationsConfirm', 'seedConsultationsSuccess');
    const handleSeedInvestigationServices = createSeedHandler('investigations', investigationsAndCriminalSeedServices, 'seedInvestigationsConfirm', 'seedInvestigationsSuccess');
    const handleSeedCorporateServices = createSeedHandler('corporate', corporateAndComplianceSeedServices, 'seedCorporateConfirm', 'seedCorporateSuccess');
    const handleSeedCreativeServices = createSeedHandler('creative', creativeSeedServices, 'seedCreativeConfirm', 'seedCreativeSuccess');
    
    const isAnySeeding = Object.values(seedingState).some(s => s);

    const handleRevokeSubscription = async (userId: string, subId: string) => {
        if (window.confirm(t('revokeConfirm'))) {
            try {
                // CHANGED: Write to 'customers' collection for consistency with Stripe
                const subRef = doc(db, 'customers', userId, 'subscriptions', subId);
                await deleteDoc(subRef);
                alert(t('revokeSuccess'));
                fetchUsersWithSubscriptions();
            } catch (error) {
                console.error("Error revoking subscription:", error);
                alert(t('revokeError'));
            }
        }
    }
    
    // Plan Management Handlers
    const handleAddPlanClick = () => {
        setEditingPlan({ ...initialPlanState, features: [{ en: '', ar: '' }] });
        setShowPlanForm(true);
    };

    const handleEditPlanClick = (plan: Plan) => {
        setEditingPlan(plan);
        setShowPlanForm(true);
    };

    const handleCancelPlanEdit = () => {
        setEditingPlan(null);
        setShowPlanForm(false);
    };
    
    const handleSavePlan = async (planToSave: Plan) => {
        if (!planToSave.id || !planToSave.priceId) {
            alert("Plan ID and Stripe Price ID are required.");
            return false;
        }
        try {
            await setDoc(doc(db, "subscription_plans", planToSave.id), planToSave);
            alert(t('planSavedSuccess'));
            fetchPlans();
            handleCancelPlanEdit();
            return true;
        } catch (error) {
            console.error("Error saving plan:", error);
            alert(t('planSavedError'));
            return false;
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (window.confirm(t('deletePlanConfirm'))) {
            try {
                await deleteDoc(doc(db, "subscription_plans", planId));
                alert(t('planDeletedSuccess'));
                fetchPlans();
            } catch (error) {
                console.error("Error deleting plan:", error);
                alert(t('planDeletedError'));
            }
        }
    };
    
    const handleTogglePlanStatus = async (plan: Plan) => {
        const newStatus = plan.status === 'active' ? 'inactive' : 'active';
        try {
            await updateDoc(doc(db, "subscription_plans", plan.id), { status: newStatus });
            alert(t('planStatusUpdated'));
            fetchPlans();
        } catch (error) {
             console.error("Error updating plan status:", error);
             alert(t('planStatusUpdateError'));
        }
    };

    // Site Settings Handlers
    const handleSiteSettingsChange = (field: keyof SiteSettings, value: any) => {
        setSiteSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedSiteSettingsChange = (field: 'siteName' | 'metaDescription' | 'seoKeywords', lang: Language, value: string) => {
        setSiteSettings(prev => ({
            ...prev,
            [field]: { ...prev[field], [lang]: value }
        }));
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            let logoUrl = siteSettings.logoUrl;
            if (logoFile) {
                logoUrl = await uploadFile(logoFile, `site/logo-${Date.now()}`);
            }

            let faviconUrl = siteSettings.faviconUrl;
            if (faviconFile) {
                faviconUrl = await uploadFile(faviconFile, `site/favicon-${Date.now()}`);
            }

            const updatedSettings: SiteSettings = {
                ...siteSettings,
                logoUrl,
                faviconUrl,
            };

            await setDoc(doc(db, "site_settings", "main"), updatedSettings);
            setSiteSettings(updatedSettings); // Update local state with new URLs
            setLogoFile(null);
            setFaviconFile(null);
            alert(t('settingsSavedSuccess'));
        } catch (error) {
            console.error("Error saving site settings:", error);
            alert(t('settingsSavedError'));
        } finally {
            setSavingSettings(false);
        }
    };

    const renderUserManagementContent = () => {
        const totalUsers = users.length;
        const totalTokenBalance = users.reduce((acc, user) => acc + (user.tokenBalance || 0), 0);
        const totalTokensUsed = users.reduce((acc, user) => acc + (user.tokensUsed || 0), 0);
        // Crude approximation of active subscribers (stripeId present)
        const activeSubscribers = users.filter(u => u.stripeId).length;

        const StatCard = ({ title, value, icon: Icon, color }: any) => (
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-4 rtl:space-x-reverse border border-gray-200 dark:border-gray-700">
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
             </div>
        );

        return (
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{t('userManagement')}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                     <StatCard 
                        title="Total Users" 
                        value={totalUsers} 
                        icon={Users} 
                        color="bg-blue-500" 
                    />
                    <StatCard 
                        title="Active Subscribers" 
                        value={activeSubscribers} 
                        icon={CreditCard} 
                        color="bg-green-500" 
                    />
                    <StatCard 
                        title="Total Token Balance" 
                        value={totalTokenBalance.toLocaleString()} 
                        icon={Coins} 
                        color="bg-yellow-500" 
                    />
                     <StatCard 
                        title="Total Tokens Used" 
                        value={totalTokensUsed.toLocaleString()} 
                        icon={Activity} 
                        color="bg-purple-500" 
                    />
                </div>

                <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700">
                     <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y dark:divide-gray-700">
                                <thead><tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">{t('email')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('role')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('status')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('tokenBalance')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-purple-600 dark:text-purple-400">Tokens Used</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('dateJoined')}</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right">{t('actions')}</th>
                                </tr></thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {loadingUsers ? (
                                        <tr><td colSpan={7} className="text-center py-8">{t('loading')}</td></tr>
                                    ) : userError ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-red-500">{userError}</td></tr>
                                    ) : users.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8">{t('noUsersFound')}</td></tr>
                                    ) : users.map((user) => {
                                        const isSelf = user.email === ADMIN_EMAIL;
                                        return (
                                            <tr key={user.id} className="dark:even:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">{user.email}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{user.role}</span></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                                    {user.status ? t(user.status) : t('active')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-mono">{user.tokenBalance?.toLocaleString() ?? 0}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-mono font-bold text-purple-600 dark:text-purple-400">{user.tokensUsed?.toLocaleString() ?? 0}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                    <div className="flex items-center justify-end gap-x-3">
                                                        {!isSelf && (
                                                            <>
                                                                <button onClick={() => handleOpenGrantModalForUser(user)} className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors" title={t('grantSubscription')}>
                                                                    <Gift size={18} />
                                                                </button>
                                                                <button onClick={() => handleOpenTokenModal(user)} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title={t('addTokens')}>
                                                                    <Coins size={18} />
                                                                </button>
                                                                {user.status === 'disabled' ? (
                                                                    <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title={t('enable')}>
                                                                        <CheckCircle size={18}/>
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => handleUpdateUserStatus(user.id, 'disabled')} className="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors" title={t('disable')}>
                                                                        <Ban size={18} />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title={t('delete')}>
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderServiceManagementContent = () => (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{t('manageServices')}</h2>

            <details className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow border dark:border-gray-700 mb-8 overflow-hidden group">
                <summary className="p-6 cursor-pointer list-none flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold">{t('databaseSeeding')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('databaseSeedingDescription')}</p>
                    </div>
                    <ChevronDown className="transform transition-transform duration-300 group-open:rotate-180 flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-600">
                        {[
                            { handler: handleSeedLitigationServices, loading: seedingState.litigation, progressKey: 'seedingLitigationInProgress', buttonKey: 'seedLitigationButton', color: 'blue' },
                            { handler: handleSeedConsultationServices, loading: seedingState.consultations, progressKey: 'seedingConsultationsInProgress', buttonKey: 'seedConsultationsButton', color: 'green' },
                            { handler: handleSeedInvestigationServices, loading: seedingState.investigations, progressKey: 'seedingInvestigationsInProgress', buttonKey: 'seedInvestigationsButton', color: 'red' },
                            { handler: handleSeedCorporateServices, loading: seedingState.corporate, progressKey: 'seedingCorporateInProgress', buttonKey: 'seedCorporateButton', color: 'purple' },
                            { handler: handleSeedCreativeServices, loading: seedingState.creative, progressKey: 'seedingCreativeInProgress', buttonKey: 'seedCreativeButton', color: 'teal' },
                        ].map(({ handler, loading, progressKey, buttonKey, color }) => (
                             <button 
                                key={buttonKey}
                                onClick={handler} 
                                disabled={isAnySeeding}
                                className={`${seedButtonColorClasses[color]} text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400 flex items-center justify-center`}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {loading ? t(String(progressKey) as keyof Translations) : t(String(buttonKey) as keyof Translations)}
                            </button>
                        ))}
                    </div>
                </div>
            </details>
            
            <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700 space-y-3 mb-8">
                <h3 className="text-xl font-semibold flex items-center gap-2">{t('generateWithAI')} <Wand2 className="text-primary-500" /></h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('aiGeneratorDescription')}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        placeholder={t('serviceNamePlaceholder')} 
                        value={aiServiceName}
                        onChange={e => setAiServiceName(e.target.value)}
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button 
                        type="button" 
                        onClick={handleGenerateService} 
                        disabled={isGenerating}
                        className="bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center"
                    >
                        {isGenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isGenerating ? t('generating') : t('generate')}
                    </button>
                </div>
            </div>

            { showServiceForm && (
                <form onSubmit={handleSaveService} className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700 space-y-4 mb-8">
                    <h3 className="text-xl font-semibold border-b dark:border-gray-600 pb-2">{isEditingService ? t('editService') : t('serviceDetails')}</h3>
                    
                    <input type="text" placeholder={t('serviceIdPlaceholder')} value={newService.id} onChange={e => handleServiceInputChange('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 read-only:bg-gray-200 dark:read-only:bg-gray-800" required readOnly={isEditingService} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder={t('titleEnPlaceholder')} value={newService.title.en} onChange={e => handleNestedServiceInputChange('title', 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" placeholder={t('titleArPlaceholder')} value={newService.title.ar} onChange={e => handleNestedServiceInputChange('title', 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea placeholder={t('descriptionEnPlaceholder')} value={newService.description.en} onChange={e => handleNestedServiceInputChange('description', 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows={3}/>
                        <textarea placeholder={t('descriptionArPlaceholder')} value={newService.description.ar} onChange={e => handleNestedServiceInputChange('description', 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows={3}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder={t('subCategoryEnPlaceholder')} value={newService.subCategory.en} onChange={e => handleNestedServiceInputChange('subCategory', 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" placeholder={t('subCategoryArPlaceholder')} value={newService.subCategory.ar} onChange={e => handleNestedServiceInputChange('subCategory', 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={newService.category} onChange={e => handleServiceInputChange('category', e.target.value as ServiceCategory)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            {Object.values(ServiceCategory).map(categoryValue => (
                                <option key={categoryValue} value={categoryValue}>{t(categoryValue as keyof Translations)}</option>
                            ))}
                        </select>
                        <input type="text" placeholder={t('geminiModel')} value={newService.geminiModel} onChange={e => handleServiceInputChange('geminiModel', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <select value={newService.icon} onChange={e => handleServiceInputChange('icon', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        {iconNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>

                    <div className="border-t dark:border-gray-600 pt-4">
                        <h4 className="font-semibold">{t('formInputs')}</h4>
                        {newService.formInputs.map((input, index) => (
                            <div key={index} className="p-3 my-2 border dark:border-gray-600 rounded-md space-y-2 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{t('input')} {index + 1}</p>
                                    <button type="button" onClick={() => handleRemoveFormInput(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                </div>
                                <input type="text" placeholder={t('inputNamePlaceholder')} value={input.name} onChange={e => handleFormInputChange(index, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder={t('labelEnPlaceholder')} value={input.label.en} onChange={e => handleFormInputLabelChange(index, 'en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    <input type="text" placeholder={t('labelArPlaceholder')} value={input.label.ar} onChange={e => handleFormInputLabelChange(index, 'ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <select value={input.type} onChange={e => handleFormInputChange(index, 'type', e.target.value as FormInputType)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="text">Text</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="date">Date</option>
                                    <option value="file">File</option>
                                    <option value="select">Select</option>
                                </select>
                                {input.type === 'select' && (
                                    <div className="pl-4 mt-2 border-l-2 dark:border-gray-600 space-y-2">
                                        <h5 className="font-medium text-sm">{t('options')}</h5>
                                        {input.options?.map((option, optionIndex) => (
                                            <div key={optionIndex} className="p-2 border dark:border-gray-700 rounded-md space-y-1 bg-white dark:bg-gray-700">
                                                <div className="flex justify-end">
                                                    <button type="button" onClick={() => handleRemoveOption(index, optionIndex)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                                                </div>
                                                <input type="text" placeholder={t('optionValuePlaceholder')} value={option.value} onChange={e => handleOptionChange(index, optionIndex, 'value', e.target.value)} className="w-full p-1 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" placeholder={t('labelEnPlaceholder')} value={option.label.en} onChange={e => handleOptionLabelChange(index, optionIndex, 'en', e.target.value)} className="w-full p-1 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600" />
                                                    <input type="text" placeholder={t('labelArPlaceholder')} value={option.label.ar} onChange={e => handleOptionLabelChange(index, optionIndex, 'ar', e.target.value)} className="w-full p-1 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600" />
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddOption(index)} className="text-xs text-primary-600 hover:underline">{t('addOption')}</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={handleAddFormInput} className="mt-2 text-sm text-primary-600 hover:underline">{t('addFormInput')}</button>
                    </div>

                    <div className="flex items-center gap-4">
                         <button type="submit" className="flex-grow bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700">{t('saveService')}</button>
                         {(isEditingService || showServiceForm) && (
                            <button type="button" onClick={handleCancelEditService} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                         )}
                    </div>
                </form>
            )}


             <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b dark:border-gray-600 pb-2 mb-4">
                    <h3 className="text-xl font-semibold">{t('existingServices')}</h3>
                    {selectedServices.length > 0 && (
                        <button 
                            onClick={handleDeleteSelectedServices}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200 mt-2 sm:mt-0"
                        >
                            <Trash2 size={16} />
                            {t('deleteSelected')} ({selectedServices.length})
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {(['all', ...Object.values(ServiceCategory)] as const).map((category) => {
                        const isActive = filterCategory === category;
                        const translationKey = category === 'all' ? 'allCategories' : category;
                        return (
                            <button
                                key={category}
                                onClick={() => setFilterCategory(category)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200
                                    ${isActive
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`
                                }
                            >
                                {t(translationKey as keyof Translations)}
                            </button>
                        );
                    })}
                </div>

                 {loadingServices ? <p>{t('loading')}</p> : serviceError ? <p className="text-red-500">{serviceError}</p> : (
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th scope="col" className="px-4 py-3.5 sm:pl-0 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                ref={selectAllCheckboxRef}
                                                onChange={handleSelectAllToggle}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-100 dark:bg-gray-800"
                                                aria-label={t('selectAll')}
                                            />
                                        </th>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">{t('serviceName')}</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('category')}</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('subCategory')}</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('usage')}</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {filteredServices.map(service => (
                                        <tr key={service.id} className="dark:even:bg-gray-800/50">
                                            <td className="px-4 py-4 sm:pl-0 text-center">
                                                <input
                                                    type="checkbox"
                                                    value={service.id}
                                                    checked={selectedServices.includes(service.id)}
                                                    onChange={(e) => {
                                                        setSelectedServices(
                                                            e.target.checked
                                                                ? [...selectedServices, service.id]
                                                                : selectedServices.filter(id => id !== service.id)
                                                        );
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-100 dark:bg-gray-800"
                                                    aria-labelledby={`service-name-${service.id}`}
                                                />
                                            </td>
                                            <td id={`service-name-${service.id}`} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">{service.title[language]}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm capitalize">{t(service.category as keyof Translations)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">{service.subCategory[language]}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-center">{service.usageCount || 0}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                <div className="flex items-center justify-end gap-x-4">
                                                    <button onClick={() => handleRunClick(service)} className="text-blue-500 hover:text-blue-700" title={t('run')}><Play size={16} /></button>
                                                    <button onClick={() => handleEditServiceClick(service)} className="text-yellow-500 hover:text-yellow-700" title={t('edit')}><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700" title={t('delete')}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
             </div>
        </div>
    );

    const renderSubscriptionManagementContent = () => {
        const getPlanName = (planId: string) => {
            const plan = plans.find(p => p.id === planId);
            return plan ? plan.title[language] : planId;
        };

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{t('subscriptionManagement')}</h2>
                     <button
                        onClick={() => {
                            setSelectedUserForAction(null);
                            setIsGrantModalOpen(true);
                        }}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus size={18}/> {t('grantSubscription')}
                    </button>
                </div>
                <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700">
                     <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y dark:divide-gray-700">
                                <thead><tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">{t('email')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('currentPlan')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('status')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('tokenBalance')}</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('endsOn')}</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right">{t('actions')}</th>
                                </tr></thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {loadingSubs ? (
                                        <tr><td colSpan={6} className="text-center py-8">{t('loading')}</td></tr>
                                    ) : subError ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-red-500">{subError}</td></tr>
                                    ) : usersWithSub.map(user => (
                                        <tr key={user.id} className="dark:even:bg-gray-800">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-0">{user.email}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                {user.subscription ? (
                                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscription.isManual ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                                                        {getPlanName(user.subscription.planId)}
                                                    </span>
                                                ) : <span className="text-gray-500">{t('noSubscription')}</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                 {user.subscription ? (
                                                    <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{user.subscription.status}</span>
                                                 ) : 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-mono">{user.tokenBalance?.toLocaleString() ?? 0}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                {user.subscription ? new Date(user.subscription.current_period_end * 1000).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                 <div className="flex items-center justify-end gap-x-2">
                                                    {user.subscription?.isManual ? (
                                                        <button onClick={() => handleRevokeSubscription(user.id, user.subscription!.id)} className="text-red-500 hover:text-red-700">{t('revoke')}</button>
                                                    ) : user.subscription && user.stripeId ? (
                                                        <a href={`https://dashboard.stripe.com/customers/${user.stripeId}`} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{t('manageInStripe')}</a>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlanManagementContent = () => (
        <div>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{t('planManagement')}</h2>
                <button
                    onClick={handleAddPlanClick}
                    className="bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 flex items-center gap-2"
                >
                    <Plus size={18}/> {t('addNewPlan')}
                </button>
            </div>
            
            {showPlanForm && editingPlan && (
                <PlanForm 
                    plan={editingPlan}
                    onSave={handleSavePlan}
                    onCancel={handleCancelPlanEdit}
                    isEditing={!!plans.find(p => p.id === editingPlan.id)}
                />
            )}

            <div className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                         <table className="min-w-full divide-y dark:divide-gray-700">
                            <thead><tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">{t('plan')}</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('planPriceEn')}</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('tokens')}</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">{t('status')}</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right">{t('actions')}</th>
                            </tr></thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {loadingPlans ? (
                                    <tr><td colSpan={5} className="text-center py-8">{t('loading')}</td></tr>
                                ) : planError ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-red-500">{planError}</td></tr>
                                ) : plans.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8">{t('noPlansFound')}</td></tr>
                                ) : plans.map(plan => (
                                    <tr key={plan.id} className="dark:even:bg-gray-800">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-0">
                                            <div className='flex items-center gap-2'>
                                            {plan.isPopular && <Star size={14} className="text-yellow-400" fill="currentColor"/>}
                                            <span className='text-gray-900 dark:text-white'>{plan.title[language]}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{plan.id}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">{plan.price[language]}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-mono">{plan.tokens.toLocaleString()}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${plan.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>
                                                {t(plan.status)}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <div className="flex items-center justify-end gap-x-4">
                                                 <button onClick={() => handleTogglePlanStatus(plan)} className={plan.status === 'active' ? "text-yellow-500 hover:text-yellow-700" : "text-green-500 hover:text-green-700"} title={plan.status === 'active' ? t('deactivate') : t('activate')}>
                                                    {plan.status === 'active' ? t('deactivate') : t('activate')}
                                                </button>
                                                <button onClick={() => handleEditPlanClick(plan)} className="text-blue-500 hover:text-blue-700" title={t('edit')}><Edit size={16} /></button>
                                                <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:text-red-700" title={t('delete')}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLandingPageGenerator = () => (
        <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Landing Page Generator</h2>
             
             <div className="bg-light-card-bg dark:bg-dark-card-bg p-8 rounded-xl shadow-lg border dark:border-gray-700">
                <div className="mb-8 text-center">
                    <div className="inline-block p-4 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                        <Wand2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Generate a Full Landing Page with AI</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Enter a topic (e.g., "Divorce Services" or "Corporate Law Firm"), and the AI will generate titles, subtitles, and 9 distinct features with appropriate icons and colors.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        value={landingPagePrompt}
                        onChange={(e) => setLandingPagePrompt(e.target.value)}
                        placeholder="Enter topic (e.g., Real Estate Law Services)"
                        className="flex-grow p-4 text-lg border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                        onClick={handleGenerateLandingPage}
                        disabled={isGeneratingLanding || !landingPagePrompt.trim()}
                        className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center gap-2 min-w-[200px]"
                    >
                        {isGeneratingLanding ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                        Generate Page
                    </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Current Status: {siteSettings.landingPageConfig ? <span className="text-green-600 font-bold">Custom Page Active</span> : <span className="text-gray-500 font-bold">Default Page Active</span>}</p>
                        
                        {siteSettings.landingPageConfig && (
                            <button 
                                onClick={handleClearLandingConfig}
                                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                                <RefreshCw size={14} /> Reset to Default
                            </button>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
    
    const renderSiteSettingsContent = () => {
        if (loadingSettings) return <div className="text-center py-8"><Loader2 className="animate-spin inline-block" /></div>;

        return (
            <div>
                 <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{t('siteSettings')}</h2>
                 <form onSubmit={handleSaveSettings} className="bg-light-card-bg dark:bg-dark-card-bg p-6 rounded-lg shadow border dark:border-gray-700 space-y-6">
                    {/* Site Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('siteNameEn')}</label>
                            <input type="text" value={siteSettings.siteName.en} onChange={e => handleNestedSiteSettingsChange('siteName', Language.EN, e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('siteNameAr')}</label>
                            <input type="text" value={siteSettings.siteName.ar} onChange={e => handleNestedSiteSettingsChange('siteName', Language.AR, e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>

                    {/* Logo & Favicon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('logo')}</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                                    {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="Current Logo" className="object-contain h-full w-full" /> : <span className="text-xs text-gray-500">{t('current')}</span>}
                                </div>
                                <label className="cursor-pointer text-sm text-primary-600 hover:underline">
                                    {t('change')}
                                    <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                {logoFile && <span className="text-xs text-gray-500">{logoFile.name}</span>}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-2">{t('favicon')}</label>
                            <div className="flex items-center gap-4">
                                 <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                                     {siteSettings.faviconUrl ? <img src={siteSettings.faviconUrl} alt="Current Favicon" className="object-contain h-full w-full" /> : <span className="text-xs text-gray-500">{t('current')}</span>}
                                 </div>
                                <label className="cursor-pointer text-sm text-primary-600 hover:underline">
                                    {t('change')}
                                    <input type="file" accept="image/x-icon, image/png, image/svg+xml" className="hidden" onChange={e => setFaviconFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                {faviconFile && <span className="text-xs text-gray-500">{faviconFile.name}</span>}
                            </div>
                        </div>
                    </div>

                    {/* SEO */}
                    <div>
                        <h3 className="text-lg font-medium border-t dark:border-gray-700 pt-4 mt-4">SEO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="block text-sm font-medium mb-1">{t('metaDescriptionEn')}</label>
                                <textarea value={siteSettings.metaDescription.en} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.EN, e.target.value)} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('metaDescriptionAr')}</label>
                                <textarea value={siteSettings.metaDescription.ar} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.AR, e.target.value)} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('seoKeywordsEn')}</label>
                                <input type="text" placeholder="e.g., law, legal, ai" value={siteSettings.seoKeywords.en} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.EN, e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('seoKeywordsAr')}</label>
                                <input type="text" placeholder="مثال: قانون, محاماة, ذكاء اصطناعي" value={siteSettings.seoKeywords.ar} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.AR, e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Mode */}
                    <div>
                         <h3 className="text-lg font-medium border-t dark:border-gray-700 pt-4 mt-4">{t('maintenanceMode')}</h3>
                         <label className="mt-2 flex items-center p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={siteSettings.isMaintenanceMode} onChange={e => handleSiteSettingsChange('isMaintenanceMode', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                            </div>
                            <span className="ml-3 rtl:mr-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">{t('enableMaintenance')}</span>
                        </label>
                    </div>

                    {/* Save Button */}
                     <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                         <button type="submit" disabled={savingSettings} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center">
                            {savingSettings && <Loader2 className="animate-spin mr-2" size={20} />}
                            {t('saveSettings')}
                        </button>
                    </div>
                 </form>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 md:flex-shrink-0 md:mr-8 mb-8 md:mb-0">
                <div className="md:sticky top-24">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t('adminPanel')}</h1>
                    <nav className="space-y-2">
                        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'users' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <Users className="mr-3 h-5 w-5" /> {t('userManagement')}
                        </button>
                         <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'subscriptions' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <CreditCard className="mr-3 h-5 w-5" /> {t('subscriptionManagement')}
                        </button>
                        <button onClick={() => setActiveTab('plans')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'plans' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <Star className="mr-3 h-5 w-5" /> {t('planManagement')}
                        </button>
                        <button onClick={() => setActiveTab('services')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'services' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <PlusSquare className="mr-3 h-5 w-5" /> {t('manageServices')}
                        </button>
                        <button onClick={() => setActiveTab('landing')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'landing' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <LayoutTemplate className="mr-3 h-5 w-5" /> Landing Page
                        </button>
                         <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'settings' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <Cog className="mr-3 h-5 w-5" /> {t('siteSettings')}
                        </button>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 min-w-0">
                {activeTab === 'users' && renderUserManagementContent()}
                {activeTab === 'services' && renderServiceManagementContent()}
                {activeTab === 'subscriptions' && renderSubscriptionManagementContent()}
                {activeTab === 'plans' && renderPlanManagementContent()}
                {activeTab === 'landing' && renderLandingPageGenerator()}
                {activeTab === 'settings' && renderSiteSettingsContent()}
            </main>
            {isExecutionModalOpen && (
                <ServiceExecutionModal 
                    isOpen={isExecutionModalOpen} 
                    onClose={() => {
                        setIsExecutionModalOpen(false);
                        if (activeTab === 'services') fetchServices();
                    }} 
                    service={selectedService} 
                />
            )}
            {isGrantModalOpen && (
                 <GrantSubscriptionModal
                    isOpen={isGrantModalOpen}
                    onClose={() => {
                        setIsGrantModalOpen(false);
                        setSelectedUserForAction(null);
                    }}
                    users={users.filter(u => u.email !== ADMIN_EMAIL)}
                    plans={plans.filter(p => p.status === 'active')}
                    onGrant={fetchUsersWithSubscriptions}
                    initialUserId={selectedUserForAction?.id}
                />
            )}
            {isTokenModalOpen && selectedUserForAction && (
                <AddTokenModal
                    isOpen={isTokenModalOpen}
                    onClose={() => {
                        setIsTokenModalOpen(false);
                        setSelectedUserForAction(null);
                    }}
                    userId={selectedUserForAction.id}
                    userEmail={selectedUserForAction.email}
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
};

export default AdminPage;
