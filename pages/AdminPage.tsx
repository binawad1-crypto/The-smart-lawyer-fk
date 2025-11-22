
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, PlusSquare, Trash2, Edit, Play, Loader2, Wand2, ChevronDown, Plus, CreditCard, X, Star, Cog, Coins, Gift, Ban, CheckCircle, RefreshCw, Activity, LayoutTemplate, BarChart, LifeBuoy, MessageSquare, Send, Archive, Tag, Search, Filter, MoreVertical, ChevronRight, ChevronLeft, Bell, AlertTriangle, Info, ArrowRight, ArrowLeft, LayoutGrid, Database, Upload, Monitor, Sparkles, FileInput, Calendar, Type as TypeIcon, Split, Layers, List, CheckSquare, Save } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, getDoc, query, orderBy, doc, setDoc, deleteDoc, updateDoc, writeBatch, increment, where, Timestamp, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Service, ServiceCategory, FormInput, FormInputType, Translations, SubscriptionInfo, Plan, SiteSettings, Language, LandingPageConfig, AdPixels, Ticket, TicketMessage, SystemNotification, Category } from '../types';
import { iconNames, ADMIN_EMAIL, iconMap } from '../constants';
import { Type } from "@google/genai";
import { generateServiceConfigWithAI, generateCategoryConfigWithAI } from '../services/geminiService';
import { uploadFile } from '../services/storageService';
import ServiceExecutionModal from '../components/ServiceExecutionModal';
import { litigationSeedServices, specializedConsultationsSeedServices, investigationsAndCriminalSeedServices, corporateAndComplianceSeedServices, seedCategories } from '../services/seedData';

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
    category: '',
    subCategory: { en: '', ar: '' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    systemInstruction: { en: '', ar: '' },
    formInputs: [],
    usageCount: 0,
    longDescription: { en: '', ar: '' },
    serviceType: 'Consultation',
    includedTasks: { en: [], ar: [] },
    internalNotes: '',
    keywords: [],
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
    siteSubtitle: { en: 'For Law and Legal Consulting', ar: 'للمحاماه والاستشارات القانونية' },
    metaDescription: { en: '', ar: '' },
    seoKeywords: { en: '', ar: '' },
    logoUrl: '',
    faviconUrl: '',
    isMaintenanceMode: false,
    adPixels: {
        googleTagId: '',
        facebookPixelId: '',
        snapchatPixelId: 'c3a97bbb-5508-4710-82b9-abebc81eb7a7',
        tiktokPixelId: '',
    },
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
            alert(t('validTokenAmount'));
            return;
        }
        if (!durationDays || durationDays <= 0) {
            alert(t('validDuration'));
            return;
        }

        setIsSubmitting(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + durationDays);

            const subId = `manual_${Date.now()}`;
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('grantSubscription')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                     <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('selectUser')}</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            disabled={!!initialUserId}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 dark:disabled:bg-gray-600"
                        >
                            <option value="" disabled>-- {t('selectUser')} --</option>
                            {usersWithoutAdmin.length > 0 ? usersWithoutAdmin.map(u => (
                                <option key={u.id} value={u.id}>{u.email}</option>
                            )) : <option disabled>{t('noUsersFound')}</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('selectPlan')}</label>
                        <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.title[language]}</option>
                            ))}
                             <option value="custom">{t('customPlan')}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('tokenAmount')}</label>
                            <input
                                type="number"
                                value={tokenAmount}
                                onChange={(e) => setTokenAmount(Number(e.target.value))}
                                required
                                readOnly={selectedPlanId !== 'custom'}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none read-only:bg-gray-100 dark:read-only:bg-gray-600"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('durationDays')}</label>
                            <input
                                type="number"
                                value={durationDays}
                                onChange={(e) => setDurationDays(Number(e.target.value))}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center min-w-[120px] shadow-lg shadow-primary-600/20 transition-all">
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
            alert(t('validTokenAmount'));
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-bg rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('addTokens')}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-800/30">
                        {t('addTokens')} لـ: <br/><b>{userEmail}</b>
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('tokenAmount')}</label>
                        <div className="relative">
                            <Coins className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-gray-400" size={18} />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                min="1"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                         <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2 shadow-md shadow-primary-600/20 transition-all">
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
        <form onSubmit={handleFormSubmit} className="bg-white dark:bg-dark-card-bg p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border space-y-5 mb-8">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? t('editPlan') : t('addNewPlan')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planId')}</label>
                    <input type="text" value={formData.id} onChange={e => handleInputChange('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 read-only:bg-gray-100 dark:read-only:bg-gray-600" required readOnly={isEditing} />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('priceId')}</label>
                    <input 
                        type="text" 
                        value={formData.priceId} 
                        onChange={e => handleInputChange('priceId', e.target.value.trim())} 
                        className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" 
                        required 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTitleEn')}</label>
                    <input type="text" value={formData.title.en} onChange={e => handleNestedChange('title', 'en', e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTitleAr')}</label>
                    <input type="text" value={formData.title.ar} onChange={e => handleNestedChange('title', 'ar', e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase">{t('planPriceEn')}</label>
                     <input type="text" value={formData.price.en} onChange={e => handleNestedChange('price', 'en', e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planPriceAr')}</label>
                    <input type="text" value={formData.price.ar} onChange={e => handleNestedChange('price', 'ar', e.target.value)} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTokens')}</label>
                    <input type="number" value={formData.tokens} onChange={e => handleInputChange('tokens', Number(e.target.value))} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('status')}</label>
                    <select value={formData.status} onChange={e => handleInputChange('status', e.target.value as 'active' | 'inactive')} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="active">{t('active')}</option>
                        <option value="inactive">{t('inactive')}</option>
                    </select>
                </div>
            </div>
             <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isPopular} onChange={e => handleInputChange('isPopular', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('isPopular')}</span>
                </label>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <h4 className="font-bold text-gray-800 dark:text-white mb-3">{t('planFeatures')}</h4>
                {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 my-3">
                        <span className="text-sm font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                        <input type="text" placeholder={t('featureEn')} value={feature.en} onChange={e => handleFeatureChange(index, 'en', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm" />
                        <input type="text" placeholder={t('featureAr')} value={feature.ar} onChange={e => handleFeatureChange(index, 'ar', e.target.value)} className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm text-right" />
                        <button type="button" onClick={() => removeFeature(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </div>
                ))}
                <button type="button" onClick={addFeature} className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors">
                    <Plus size={16}/> {t('addFeature')}
                </button>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                 <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center shadow-lg shadow-primary-600/20 transition-all">
                    {isSaving && <Loader2 className="animate-spin mr-2" size={20} />}
                    {t('savePlan')}
                </button>
                <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('cancel')}</button>
            </div>
        </form>
    );
};


const AdminPage = () => {
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState<UserData | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState<string|null>(null);
    const [newService, setNewService] = useState<Service>(initialServiceState);
    const [isEditingService, setIsEditingService] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [usersWithSub, setUsersWithSub] = useState<UserWithSubscription[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [subError, setSubError] = useState<string | null>(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [planError, setPlanError] = useState<string | null>(null);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [loadingTickets, setLoadingTickets] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [newNotification, setNewNotification] = useState<Partial<SystemNotification>>({
        title: { en: '', ar: '' },
        message: { en: '', ar: '' },
        type: 'info',
        isActive: true
    });

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

    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        setCategoryError(null);
        try {
            const catRef = collection(db, 'service_categories');
            const q = query(catRef, orderBy('order'));
            const snapshot = await getDocs(q);
            const cats = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
            setCategories(cats);
        } catch (e) {
            console.error("Failed to fetch categories", e);
            setCategoryError(t('fetchCategoriesError'));
        } finally {
            setLoadingCategories(false);
        }
    }, [t]);

    const fetchUsersWithSubscriptions = useCallback(async () => {
        setLoadingSubs(true);
        setSubError(null);
        try {
            const usersData = await fetchUsers();
            
            if (!usersData || usersData.length === 0) {
                setUsersWithSub([]);
                setLoadingSubs(false);
                return;
            }

            const usersWithSubscriptionsPromises = usersData.map(async (user) => {
                try {
                    const subscriptionsRef = collection(db, 'customers', user.id, 'subscriptions');
                    const q = query(subscriptionsRef, where('status', 'in', ['trialing', 'active']));
                    const subSnapshot = await getDocs(q);

                    if (subSnapshot.empty) {
                        return { ...user, subscription: undefined };
                    } else {
                        const subDoc = subSnapshot.docs[0];
                        const subData = subDoc.data();
                        
                        let planId = 'unknown';
                        if (subData.isManual && subData.planId) {
                            planId = subData.planId;
                        } else {
                            const item = subData.items?.[0];
                            planId = item?.price?.product?.metadata?.planId || 'unknown';
                        }

                        const subscription: SubscriptionInfo = {
                            id: subDoc.id,
                            planId: planId,
                            stripeSubscriptionId: subData.isManual ? undefined : subDoc.id,
                            status: subData.status,
                            current_period_end: subData.current_period_end?.seconds || Date.now() / 1000,
                            priceId: subData.isManual ? 'manual' : (subData.items?.[0]?.price?.id || 'unknown'),
                            isManual: subData.isManual || false,
                        };
                        return { ...user, subscription };
                    }
                } catch (err) {
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
                setSiteSettings({
                    ...initialSiteSettings,
                    ...data,
                    siteName: { ...initialSiteSettings.siteName, ...(data.siteName || {}) },
                    siteSubtitle: { ...initialSiteSettings.siteSubtitle, ...(data.siteSubtitle || {}) },
                    metaDescription: { ...initialSiteSettings.metaDescription, ...(data.metaDescription || {}) },
                    seoKeywords: { ...initialSiteSettings.seoKeywords, ...(data.seoKeywords || {}) },
                    adPixels: { ...initialSiteSettings.adPixels, ...(data.adPixels || {}) },
                    ticketTypes: data.ticketTypes || []
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

    const fetchNotifications = useCallback(async () => {
        setLoadingNotifications(true);
        try {
            const q = query(collection(db, 'system_notifications'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification));
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    const fetchTickets = useCallback(async () => {
        setLoadingTickets(true);
        try {
            const q = query(collection(db, 'support_tickets'), orderBy('lastUpdate', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets", error);
        } finally {
            setLoadingTickets(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'subscriptions') {
            fetchUsersWithSubscriptions();
        } else if (activeTab === 'support') {
            fetchTickets();
        }
    }, [activeTab, fetchUsersWithSubscriptions, fetchTickets]);

    useEffect(() => {
        fetchUsers();
        fetchServices();
        fetchCategories();
        fetchPlans();
        fetchSiteSettings();
        fetchNotifications();
    }, [fetchUsers, fetchServices, fetchCategories, fetchPlans, fetchSiteSettings, fetchNotifications]);

    useEffect(() => {
        if (!selectedTicket) return;
        const q = query(
            collection(db, 'support_tickets', selectedTicket.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage));
            setMessages(msgs);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        
        if(selectedTicket.unreadAdmin) {
             updateDoc(doc(db, 'support_tickets', selectedTicket.id), { unreadAdmin: false });
        }

        return () => unsubscribe();
    }, [selectedTicket]);

    const handleDeleteService = async (serviceId: string) => {
        if (window.confirm(t('deleteConfirm'))) {
            try {
                await deleteDoc(doc(db, 'services', serviceId));
                setServices(services.filter(s => s.id !== serviceId));
                alert(t('serviceDeletedSuccess'));
            } catch (err) {
                console.error("Error deleting service: ", err);
                alert(t('serviceDeletedError'));
            }
        }
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newService.id) {
            alert(t('serviceIdRequired'));
            return;
        }
        try {
            await setDoc(doc(db, 'services', newService.id), newService);
            setShowServiceForm(false);
            setIsEditingService(false);
            setNewService(initialServiceState);
            fetchServices();
            alert('Service saved successfully');
        } catch (error) {
            console.error("Error saving service:", error);
            alert('Error saving service');
        }
    };

    const handleGenerateServiceData = async () => {
        if (!aiTopic.trim()) {
            alert(t('enterServiceName'));
            return;
        }
        setIsGenerating(true);
        try {
            const prompt = `
            You are an expert Legal Service Architect and Translator.
            The user wants to create a new legal service based on this description: "${aiTopic}".

            TASK:
            Generate a COMPLETE, PRODUCTION-READY configuration for this service.
            CRITICAL: All text fields MUST be provided in BOTH English ('en') and Arabic ('ar'). The Arabic must be professional legal terminology.

            1. **Service Identity**:
               - Title: Professional legal title.
               - Short Description: 2 lines summary.
               - Long Description: Detailed explanation of what the service covers.
               - Service Type: e.g., Consultation, Review, Drafting.
               - Category: Select the most fitting ID from: ${categories.map(c => c.id).join(', ')}.

            2. **Requirements (Form Inputs)**:
               - INTELLIGENTLY determine exactly what information or documents a lawyer would need from the client to perform this specific service.
               - Generate a list of 'formInputs'.
               - Use 'file' type for documents (e.g., contracts, evidence, ID).
               - Use 'date' for deadlines or event dates.
               - Use 'text' or 'textarea' for names, descriptions, or specific details.
               - Use 'select' for choices (e.g., Jurisdiction, Contract Type).
               - Labels MUST be bilingual (En/Ar).

            3. **Deliverables**:
               - includedTasks: A list of 3-5 specific bullets of what the client gets (En/Ar).

            4. **AI Configuration**:
               - System Instruction: A detailed prompt for the AI model that will actually execute this service for the end-user. It should tell the AI how to act (e.g., "Act as a commercial lawyer..."), what to analyze in the user's input, and how to format the output. This MUST be bilingual (provide an English prompt version and an Arabic prompt version).

            5. **Metadata**:
               - Keywords: 5-10 SEO keywords.
               - Internal Notes: Brief summary of the generation logic.
               - Icon: Choose a suitable Lucide icon name (e.g., FileText, Gavel, Scale, Handshake, Shield, Building2).

            Output JSON format matching the Service interface exactly.
            `;

            const response = await generateServiceConfigWithAI(prompt, {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } },
                    description: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } },
                    longDescription: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } },
                    category: { type: Type.STRING },
                    serviceType: { type: Type.STRING },
                    includedTasks: { type: Type.OBJECT, properties: { en: { type: Type.ARRAY, items: { type: Type.STRING } }, ar: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    internalNotes: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    formInputs: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                label: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } },
                                type: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { value: {type: Type.STRING}, label: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } } } } }
                            }
                        } 
                    },
                    systemInstruction: { type: Type.OBJECT, properties: { en: {type: Type.STRING}, ar: {type: Type.STRING} } },
                    icon: { type: Type.STRING },
                    geminiModel: { type: Type.STRING }
                }
            });

            if (response.text) {
                let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const firstOpen = cleanText.indexOf('{');
                const lastClose = cleanText.lastIndexOf('}');
                if(firstOpen !== -1 && lastClose !== -1) {
                    cleanText = cleanText.substring(firstOpen, lastClose + 1);
                }

                const generatedData = JSON.parse(cleanText);
                setNewService(prev => ({
                    ...prev,
                    ...generatedData,
                    id: isEditingService ? prev.id : generatedData.id
                }));
                setAiTopic('');
            }
        } catch (e) {
            console.error("AI Gen Error", e);
            alert("Failed to generate data. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const addFormInput = () => {
        setNewService(prev => ({
            ...prev,
            formInputs: [...prev.formInputs, { name: `input_${prev.formInputs.length + 1}`, label: { en: 'New Field', ar: 'حقل جديد' }, type: 'text' }]
        }));
    };

    const removeFormInput = (index: number) => {
        setNewService(prev => ({
            ...prev,
            formInputs: prev.formInputs.filter((_, i) => i !== index)
        }));
    };

    const updateFormInput = (index: number, field: keyof FormInput, value: any) => {
        const updatedInputs = [...newService.formInputs];
        updatedInputs[index] = { ...updatedInputs[index], [field]: value };
        setNewService(prev => ({ ...prev, formInputs: updatedInputs }));
    };

    const updateFormInputLabel = (index: number, lang: 'en' | 'ar', value: string) => {
        const updatedInputs = [...newService.formInputs];
        updatedInputs[index] = { 
            ...updatedInputs[index], 
            label: { ...updatedInputs[index].label, [lang]: value } 
        };
        setNewService(prev => ({ ...prev, formInputs: updatedInputs }));
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        
        try {
            const id = isEditingCategory ? editingCategory.id : editingCategory.title.en.toLowerCase().replace(/\s+/g, '-');
            await setDoc(doc(db, 'service_categories', id), {
                ...editingCategory,
                id: id
            });
            alert(t('categorySavedSuccess'));
            setShowCategoryForm(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            alert(t('categorySavedError'));
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (window.confirm(t('deleteCategoryConfirm'))) {
            try {
                await deleteDoc(doc(db, 'service_categories', categoryId));
                alert(t('categoryDeletedSuccess'));
                fetchCategories();
            } catch (error) {
                console.error("Error deleting category:", error);
                alert(t('categoryDeletedError'));
            }
        }
    };

    const handleSavePlan = async (plan: Plan) => {
        try {
            await setDoc(doc(db, 'subscription_plans', plan.id), plan);
            alert(t('planSavedSuccess'));
            fetchPlans();
            setShowPlanForm(false);
            setEditingPlan(null);
            return true;
        } catch (error) {
            console.error("Error saving plan:", error);
            alert(t('planSavedError'));
            return false;
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            let newLogoUrl = siteSettings.logoUrl;
            let newFaviconUrl = siteSettings.faviconUrl;

            if (logoFile) {
                try {
                    const fileName = `logo-${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    newLogoUrl = await uploadFile(logoFile, `site/${fileName}`);
                } catch (e) {
                    console.error("Logo upload failed", e);
                    setSavingSettings(false);
                    return;
                }
            }
            if (faviconFile) {
                try {
                    const fileName = `favicon-${Date.now()}-${faviconFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    newFaviconUrl = await uploadFile(faviconFile, `site/${fileName}`);
                } catch (e) {
                    console.error("Favicon upload failed", e);
                    setSavingSettings(false);
                    return;
                }
            }

            const updatedSettings = {
                ...siteSettings,
                logoUrl: newLogoUrl,
                faviconUrl: newFaviconUrl
            };

            await setDoc(doc(db, 'site_settings', 'main'), updatedSettings);
            setSiteSettings(updatedSettings);
            setLogoFile(null);
            setFaviconFile(null);
            alert(t('settingsSavedSuccess'));
        } catch (error) {
            console.error("Error saving settings:", error);
            alert(t('settingsSavedError'));
        } finally {
            setSavingSettings(false);
        }
    };

    const handleCreateNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'system_notifications'), {
                ...newNotification,
                createdAt: serverTimestamp(),
                targetAudience: 'all'
            });
            alert(t('notificationCreated'));
            setNewNotification({ title: { en: '', ar: '' }, message: { en: '', ar: '' }, type: 'info', isActive: true });
            fetchNotifications();
        } catch (error) {
            console.error("Error creating notification:", error);
            alert(t('notificationFailed'));
        }
    };

    const toggleNotificationStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'system_notifications', id), { isActive: !currentStatus });
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        if(window.confirm(t('areYouSure'))) {
            await deleteDoc(doc(db, 'system_notifications', id));
            fetchNotifications();
        }
    };

    const handleReplyTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyMessage.trim()) return;

        try {
            await addDoc(collection(db, 'support_tickets', selectedTicket.id, 'messages'), {
                content: replyMessage,
                senderId: currentUser?.uid,
                senderRole: 'admin',
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
                lastUpdate: serverTimestamp(),
                status: 'answered',
                unreadUser: true
            });
            setReplyMessage('');
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    const renderPlanManagement = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{t('planManagement')}</h2>
                <button onClick={() => { setEditingPlan(initialPlanState); setShowPlanForm(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700">
                    <Plus size={18}/> {t('addNewPlan')}
                </button>
            </div>

            {showPlanForm && editingPlan && (
                <PlanForm 
                    plan={editingPlan} 
                    onSave={handleSavePlan} 
                    onCancel={() => { setShowPlanForm(false); setEditingPlan(null); }}
                    isEditing={!!editingPlan.id && plans.some(p => p.id === editingPlan.id)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white dark:bg-dark-card-bg border border-gray-200 dark:border-dark-border rounded-xl p-6 relative shadow-sm hover:shadow-md transition-shadow">
                        {plan.isPopular && <div className="absolute top-4 right-4 text-primary-500"><Star fill="currentColor" size={20}/></div>}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.title[language]}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.id}</p>
                        <div className="text-2xl font-black text-primary-600 dark:text-primary-400 mb-2">{plan.price[language]}</div>
                        <div className="inline-block bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full text-xs font-bold text-primary-700 dark:text-primary-300 mb-4">
                            {plan.tokens.toLocaleString()} Tokens
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <span className={`text-xs px-2 py-1 rounded-full ${plan.status === 'active' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{plan.status}</span>
                            <button onClick={() => { setEditingPlan(plan); setShowPlanForm(true); }} className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
                                <Edit size={16}/> {t('edit')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderServiceManagement = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{t('manageServices')}</h2>
                <button onClick={() => { setNewService(initialServiceState); setShowServiceForm(true); setIsEditingService(false); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700">
                    <Plus size={18}/> {t('add')}
                </button>
            </div>

            {/* Service Editor (Create/Edit) */}
            {showServiceForm && (
                <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden animate-fade-in-up">
                    {/* AI Generator Section */}
                    <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Sparkles size={20} className="text-yellow-300" />
                            Smart Data Generator
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                value={aiTopic} 
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="Describe the service you want to create (e.g., 'Commercial Contract Review')" 
                                className="flex-grow p-3 rounded-xl border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                            />
                            <button 
                                onClick={handleGenerateServiceData} 
                                disabled={isGenerating}
                                className="bg-white text-primary-700 font-bold py-3 px-6 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-70 flex items-center gap-2 whitespace-nowrap shadow-lg"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                Generate Data
                            </button>
                        </div>
                        <p className="text-white/80 text-xs mt-2">
                            The AI will auto-populate the form below based on your description. You can then edit the details.
                        </p>
                    </div>

                    {/* Manual Form Builder */}
                    <div className="p-6 space-y-8">
                        
                        {/* Section 1: Basic Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2">1. Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service ID (Auto-generated if empty)</label>
                                    <input type="text" value={newService.id} onChange={e => setNewService({...newService, id: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" placeholder="e.g. contract-review" disabled={isEditingService} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Icon Name (Lucide React)</label>
                                    <input type="text" value={newService.icon} onChange={e => setNewService({...newService, icon: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" placeholder="FileText" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service Name (EN)</label>
                                    <input type="text" value={newService.title.en} onChange={e => setNewService({...newService, title: {...newService.title, en: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 text-right">اسم الخدمة (AR)</label>
                                    <input type="text" value={newService.title.ar} onChange={e => setNewService({...newService, title: {...newService.title, ar: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white text-right" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                                    <select value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.title[language]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service Type</label>
                                    <input type="text" value={newService.serviceType || ''} onChange={e => setNewService({...newService, serviceType: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" placeholder="Consultation, Drafting, etc." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gemini Model</label>
                                    <select
                                        value={newService.geminiModel}
                                        onChange={e => setNewService({...newService, geminiModel: e.target.value})}
                                        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white"
                                    >
                                        <option value="gemini-2.5-flash">gemini-2.5-flash (Default)</option>
                                        <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                                        <option value="models/gemini-1.5-pro-002">models/gemini-1.5-pro-002</option>
                                        <option value="models/gemini-1.5-flash-002">models/gemini-1.5-flash-002</option>
                                        <option value="models/gemini-1.5-flash-lite">models/gemini-1.5-flash-lite</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Short Description (EN)</label>
                                    <textarea value={newService.description.en} onChange={e => setNewService({...newService, description: {...newService.description, en: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" rows={2} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 text-right">وصف قصير (AR)</label>
                                    <textarea value={newService.description.ar} onChange={e => setNewService({...newService, description: {...newService.description, ar: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white text-right" rows={2} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Detailed Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2">2. Detailed Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Description (EN)</label>
                                    <textarea value={newService.longDescription?.en || ''} onChange={e => setNewService({...newService, longDescription: {...(newService.longDescription || {ar:''}), en: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 text-right">وصف كامل (AR)</label>
                                    <textarea value={newService.longDescription?.ar || ''} onChange={e => setNewService({...newService, longDescription: {...(newService.longDescription || {en:''}), ar: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white text-right" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Internal Notes</label>
                                    <textarea value={newService.internalNotes || ''} onChange={e => setNewService({...newService, internalNotes: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" rows={2} placeholder="Workflow details, active status..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">SEO Keywords (Comma separated)</label>
                                    <input type="text" value={newService.keywords?.join(', ') || ''} onChange={e => setNewService({...newService, keywords: e.target.value.split(',').map(s => s.trim())})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white" placeholder="law, contract, review..." />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Smart Form Builder (Inputs) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">3. Client Requirements (Form Inputs)</h4>
                                <button type="button" onClick={addFormInput} className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200 font-bold flex items-center gap-1">
                                    <Plus size={14}/> Add Field
                                </button>
                            </div>
                            
                            <div className="space-y-3 bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-xl">
                                {newService.formInputs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No inputs defined. Add one manually or use the AI generator.</p>}
                                {newService.formInputs.map((input, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-start">
                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold">Field Name (ID)</label>
                                                <input type="text" value={input.name} onChange={e => updateFormInput(idx, 'name', e.target.value)} className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-600" placeholder="e.g. contract_file" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold">Label (EN)</label>
                                                <input type="text" value={input.label.en} onChange={e => updateFormInputLabel(idx, 'en', e.target.value)} className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-600" placeholder="Label English" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold text-right block">Label (AR)</label>
                                                <input type="text" value={input.label.ar} onChange={e => updateFormInputLabel(idx, 'ar', e.target.value)} className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-600 text-right" placeholder="تسمية الحقل" />
                                            </div>
                                            <div className="md:col-span-3 flex gap-4">
                                                <div className="w-1/3">
                                                    <label className="text-xs text-gray-500 font-semibold">Input Type</label>
                                                    <select value={input.type} onChange={e => updateFormInput(idx, 'type', e.target.value)} className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-600">
                                                        <option value="text">Text Input</option>
                                                        <option value="textarea">Text Area</option>
                                                        <option value="date">Date Picker</option>
                                                        <option value="file">File Upload</option>
                                                        <option value="select">Dropdown Select</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFormInput(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded self-center md:self-start mt-4 md:mt-0">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 4: System Instructions */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2">4. AI System Instructions (Prompt)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Instruction (EN)</label>
                                    <textarea value={newService.systemInstruction?.en || ''} onChange={e => setNewService({...newService, systemInstruction: {...newService.systemInstruction, en: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white font-mono text-sm" rows={6} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 text-right">Instruction (AR)</label>
                                    <textarea value={newService.systemInstruction?.ar || ''} onChange={e => setNewService({...newService, systemInstruction: {...newService.systemInstruction, ar: e.target.value}})} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-dark-bg dark:border-gray-600 text-gray-900 dark:text-white font-mono text-sm text-right" rows={6} />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setShowServiceForm(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t('cancel')}</button>
                            <button onClick={handleSaveService} className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg flex items-center gap-2">
                                <Save size={18} />
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Service List */}
            {!showServiceForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(service => (
                        <div key={service.id} className="group relative p-5 bg-white dark:bg-dark-card-bg border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
                                    {React.createElement(iconMap[service.icon] || LayoutTemplate, { size: 22 })}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setNewService(service); setShowServiceForm(true); setIsEditingService(true); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteService(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">{service.title[language]}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-3">{service.description[language]}</p>
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{service.category}</span>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Activity size={12} />
                                    {service.usageCount || 0}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-light-bg dark:bg-dark-bg min-h-screen p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('adminPanel')}</h1>
                
                <div className="flex flex-wrap gap-2 bg-white dark:bg-dark-card-bg p-1 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border">
                    {[
                        { id: 'users', label: 'userManagement', icon: Users },
                        { id: 'services', label: 'manageServices', icon: LayoutTemplate },
                        { id: 'categories', label: 'manageCategories', icon: LayoutGrid },
                        { id: 'subscriptions', label: 'subscriptionManagement', icon: CreditCard },
                        { id: 'plans', label: 'planManagement', icon: Tag },
                        { id: 'settings', label: 'siteSettings', icon: Cog },
                        { id: 'marketing', label: 'marketing', icon: BarChart },
                        { id: 'notifications', label: 'notifications', icon: Bell },
                        { id: 'support', label: 'support', icon: LifeBuoy }
                    ].map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <Icon size={18} />
                                {t(tab.label as any)}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white dark:bg-dark-card-bg rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-6 min-h-[600px]">
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold dark:text-white">{t('userManagement')}</h2>
                                <button onClick={fetchUsers} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><RefreshCw size={20}/></button>
                            </div>
                            
                            {loadingUsers ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left rtl:text-right">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                                            <tr>
                                                <th className="p-4">{t('email')}</th>
                                                <th className="p-4">{t('role')}</th>
                                                <th className="p-4">{t('tokenBalance')}</th>
                                                <th className="p-4">{t('status')}</th>
                                                <th className="p-4 text-end">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {users.map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="p-4 font-medium dark:text-white">{user.email}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">{user.tokenBalance?.toLocaleString()}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                            {user.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 flex justify-end gap-2">
                                                        <button onClick={() => { setSelectedUserForAction(user); setIsTokenModalOpen(true); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title={t('addTokens')}><Coins size={18}/></button>
                                                        <button onClick={() => { setSelectedUserForAction(user); setIsGrantModalOpen(true); fetchUsersWithSubscriptions(); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title={t('grantSubscription')}><Gift size={18}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'services' && renderServiceManagement()}

                    {activeTab === 'categories' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold dark:text-white">{t('manageCategories')}</h2>
                                <button onClick={() => { setEditingCategory({ id: '', title: { en: '', ar: '' }, icon: 'FileText', order: categories.length + 1 }); setShowCategoryForm(true); setIsEditingCategory(false); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700">
                                    <Plus size={18}/> {t('addNewCategory')}
                                </button>
                            </div>

                            {showCategoryForm && editingCategory && (
                                <form onSubmit={handleSaveCategory} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Title (EN)" value={editingCategory.title.en} onChange={e => setEditingCategory({...editingCategory, title: {...editingCategory.title, en: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white" required />
                                        <input type="text" placeholder="Title (AR)" value={editingCategory.title.ar} onChange={e => setEditingCategory({...editingCategory, title: {...editingCategory.title, ar: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right" required />
                                        <input type="text" placeholder="Icon Name" value={editingCategory.icon} onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white" required />
                                        <input type="number" placeholder="Order" value={editingCategory.order} onChange={e => setEditingCategory({...editingCategory, order: Number(e.target.value)})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white" required />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">{t('cancel')}</button>
                                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">{t('save')}</button>
                                    </div>
                                </form>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-dark-card-bg border border-gray-200 dark:border-dark-border rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                {React.createElement(iconMap[cat.icon] || LayoutGrid, { size: 20 })}
                                            </div>
                                            <div>
                                                <h4 className="font-bold dark:text-white">{cat.title[language]}</h4>
                                                <p className="text-xs text-gray-500">Order: {cat.order}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); setIsEditingCategory(true); }} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscriptions' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold dark:text-white">{t('subscriptionManagement')}</h2>
                                <button onClick={fetchUsersWithSubscriptions} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><RefreshCw size={20}/></button>
                            </div>
                            
                            {loadingSubs ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left rtl:text-right">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                                            <tr>
                                                <th className="p-4">{t('email')}</th>
                                                <th className="p-4">{t('plan')}</th>
                                                <th className="p-4">{t('status')}</th>
                                                <th className="p-4">{t('endsOn')}</th>
                                                <th className="p-4">{t('type')}</th>
                                                <th className="p-4 text-end">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {usersWithSub.filter(u => u.subscription).length === 0 ? (
                                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('noActiveSubscription')}</td></tr>
                                            ) : usersWithSub.filter(u => u.subscription).map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="p-4 font-medium dark:text-white">{user.email}</td>
                                                    <td className="p-4">{user.subscription?.planId}</td>
                                                    <td className="p-4"><span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">{user.subscription?.status}</span></td>
                                                    <td className="p-4">{new Date(user.subscription!.current_period_end * 1000).toLocaleDateString()}</td>
                                                    <td className="p-4">{user.subscription?.isManual ? 'Manual' : 'Stripe'}</td>
                                                    <td className="p-4 text-end">
                                                        {user.subscription?.isManual ? (
                                                            <button onClick={async () => {
                                                                if(window.confirm(t('revokeConfirm'))) {
                                                                    await deleteDoc(doc(db, 'customers', user.id, 'subscriptions', user.subscription!.id));
                                                                    fetchUsersWithSubscriptions();
                                                                }
                                                            }} className="text-red-600 hover:underline text-xs">{t('revoke')}</button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">{t('manageInStripe')}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'plans' && renderPlanManagement()}

                    {activeTab === 'settings' && (
                        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold dark:text-white">{t('siteSettings')}</h2>
                                <button type="submit" disabled={savingSettings} className="bg-primary-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 shadow-lg disabled:bg-primary-400">
                                    {savingSettings && <Loader2 className="animate-spin" size={18}/>} {t('saveSettings')}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('siteNameEn')}</label>
                                    <input type="text" value={siteSettings.siteName.en} onChange={e => setSiteSettings({...siteSettings, siteName: {...siteSettings.siteName, en: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('siteNameAr')}</label>
                                    <input type="text" value={siteSettings.siteName.ar} onChange={e => setSiteSettings({...siteSettings, siteName: {...siteSettings.siteName, ar: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('siteSubtitleEn')}</label>
                                    <input type="text" value={siteSettings.siteSubtitle.en} onChange={e => setSiteSettings({...siteSettings, siteSubtitle: {...siteSettings.siteSubtitle, en: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('siteSubtitleAr')}</label>
                                    <input type="text" value={siteSettings.siteSubtitle.ar} onChange={e => setSiteSettings({...siteSettings, siteSubtitle: {...siteSettings.siteSubtitle, ar: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                <h3 className="font-bold text-lg dark:text-white">Branding & Images</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('logo')}</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={e => setLogoFile(e.target.files?.[0] || null)} 
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer bg-white dark:bg-gray-700" 
                                                    />
                                                    {logoFile && <p className="text-xs text-primary-600 mt-1 font-semibold">Selected: {logoFile.name}</p>}
                                                </div>
                                                {siteSettings.logoUrl && !logoFile && (
                                                    <div className="border p-1 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                        <img src={siteSettings.logoUrl} alt="Current Logo" className="h-10 w-auto object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('favicon')}</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={e => setFaviconFile(e.target.files?.[0] || null)} 
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer bg-white dark:bg-gray-700" 
                                                    />
                                                    {faviconFile && <p className="text-xs text-primary-600 mt-1 font-semibold">Selected: {faviconFile.name}</p>}
                                                </div>
                                                {siteSettings.faviconUrl && !faviconFile && (
                                                    <div className="border p-1 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                        <img src={siteSettings.faviconUrl} alt="Current Favicon" className="h-8 w-8 object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t dark:border-gray-700">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={siteSettings.isMaintenanceMode} onChange={e => setSiteSettings({...siteSettings, isMaintenanceMode: e.target.checked})} className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('enableMaintenance')}</span>
                                </label>
                            </div>
                        </form>
                    )}

                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold dark:text-white">{t('adPixels')}</h2>
                            <p className="text-gray-500 text-sm">{t('adPixelsDesc')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('googleTagId')}</label>
                                    <input type="text" value={siteSettings.adPixels?.googleTagId || ''} onChange={e => setSiteSettings({...siteSettings, adPixels: {...siteSettings.adPixels, googleTagId: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" placeholder="G-XXXXXXXXXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('facebookPixelId')}</label>
                                    <input type="text" value={siteSettings.adPixels?.facebookPixelId || ''} onChange={e => setSiteSettings({...siteSettings, adPixels: {...siteSettings.adPixels, facebookPixelId: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" placeholder="1234567890" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('snapchatPixelId')}</label>
                                    <input type="text" value={siteSettings.adPixels?.snapchatPixelId || ''} onChange={e => setSiteSettings({...siteSettings, adPixels: {...siteSettings.adPixels, snapchatPixelId: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card-bg">{t('tiktokPixelId')}</label>
                                    <input type="text" value={siteSettings.adPixels?.tiktokPixelId || ''} onChange={e => setSiteSettings({...siteSettings, adPixels: {...siteSettings.adPixels, tiktokPixelId: e.target.value}})} className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white" placeholder="CXXXXXXXXXXXX" />
                                </div>
                            </div>
                            <button onClick={handleSaveSettings} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 shadow-md">{t('saveSettings')}</button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold dark:text-white">{t('createNotification')}</h2>
                            <form onSubmit={handleCreateNotification} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder={t('titleEn')} value={newNotification.title?.en} onChange={e => setNewNotification({...newNotification, title: {...newNotification.title!, en: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white" required />
                                    <input type="text" placeholder={t('titleAr')} value={newNotification.title?.ar} onChange={e => setNewNotification({...newNotification, title: {...newNotification.title!, ar: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right" required />
                                    <textarea placeholder={t('messageEn')} value={newNotification.message?.en} onChange={e => setNewNotification({...newNotification, message: {...newNotification.message!, en: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white" required rows={2} />
                                    <textarea placeholder={t('messageAr')} value={newNotification.message?.ar} onChange={e => setNewNotification({...newNotification, message: {...newNotification.message!, ar: e.target.value}})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-right" required rows={2} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <select value={newNotification.type} onChange={e => setNewNotification({...newNotification, type: e.target.value as any})} className="p-2 border rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-white">
                                        <option value="info">Info</option>
                                        <option value="success">Success</option>
                                        <option value="warning">Warning</option>
                                        <option value="alert">Alert</option>
                                    </select>
                                    <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">{t('createNotification')}</button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <h3 className="font-bold dark:text-white">Active Notifications</h3>
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 rounded-lg border flex justify-between items-center ${notif.isActive ? 'bg-white dark:bg-dark-card-bg' : 'bg-gray-100 dark:bg-gray-900 opacity-60'}`}>
                                        <div>
                                            <h4 className="font-bold dark:text-white">{notif.title[language]}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message[language]}</p>
                                            <span className="text-xs text-gray-400">{new Date(notif.createdAt.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleNotificationStatus(notif.id, notif.isActive)} className={`px-3 py-1 rounded-full text-xs ${notif.isActive ? 'bg-primary-100 text-primary-800' : 'bg-gray-200 text-gray-800'}`}>
                                                {notif.isActive ? t('active') : t('inactive')}
                                            </button>
                                            <button onClick={() => handleDeleteNotification(notif.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                            {/* Ticket List */}
                            <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-3">
                                    {tickets.map(ticket => (
                                        <div 
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedTicket?.id === ticket.id ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/20' : 'bg-white dark:bg-dark-card-bg border-gray-200 dark:border-dark-border'} ${ticket.unreadAdmin ? 'border-l-4 border-l-primary-500' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm dark:text-white truncate">{ticket.subject}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-600'}`}>{ticket.status}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{ticket.userEmail}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right">{ticket.lastUpdate?.toDate().toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {tickets.length === 0 && <p className="text-center text-gray-500 py-10">{t('noTickets')}</p>}
                                </div>
                            </div>

                            {/* Chat View */}
                            <div className="lg:col-span-2 flex flex-col h-full bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                                {selectedTicket ? (
                                    <>
                                        <div className="p-4 bg-white dark:bg-dark-card-bg border-b border-gray-200 dark:border-gray-700 shadow-sm">
                                            <h3 className="font-bold dark:text-white">{selectedTicket.subject}</h3>
                                            <p className="text-xs text-gray-500">{selectedTicket.userEmail} - {selectedTicket.type}</p>
                                        </div>
                                        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                            {messages.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderRole === 'admin' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-dark-card-bg border border-gray-200 dark:border-gray-700 rounded-bl-none'}`}>
                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        <p className="text-[10px] opacity-70 mt-1 text-right">{msg.createdAt?.toDate().toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                        <form onSubmit={handleReplyTicket} className="p-4 bg-white dark:bg-dark-card-bg border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                            <input 
                                                type="text" 
                                                value={replyMessage} 
                                                onChange={e => setReplyMessage(e.target.value)} 
                                                placeholder={t('typeReply')} 
                                                className="flex-grow p-3 border rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" 
                                            />
                                            <button type="submit" disabled={!replyMessage.trim()} className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 disabled:bg-gray-300"><Send size={20}/></button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <MessageSquare size={48} className="mb-4 opacity-50" />
                                        <p>{t('selectTicket')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedUserForAction && (
                <>
                    <AddTokenModal 
                        isOpen={isTokenModalOpen} 
                        onClose={() => setIsTokenModalOpen(false)} 
                        userId={selectedUserForAction.id}
                        userEmail={selectedUserForAction.email}
                        onSuccess={fetchUsers}
                    />
                    <GrantSubscriptionModal
                        isOpen={isGrantModalOpen}
                        onClose={() => setIsGrantModalOpen(false)}
                        users={users}
                        plans={plans}
                        onGrant={fetchUsers}
                        initialUserId={selectedUserForAction.id}
                    />
                </>
            )}
        </div>
    );
};

export default AdminPage;
