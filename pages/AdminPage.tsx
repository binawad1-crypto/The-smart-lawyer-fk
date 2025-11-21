
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, PlusSquare, Trash2, Edit, Play, Loader2, Wand2, ChevronDown, Plus, CreditCard, X, Star, Cog, Coins, Gift, Ban, CheckCircle, RefreshCw, Activity, LayoutTemplate, BarChart, LifeBuoy, MessageSquare, Send, Archive, Tag, Search, Filter, MoreVertical, ChevronRight, ChevronLeft, Bell, AlertTriangle, Info, ArrowRight, ArrowLeft, LayoutGrid, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
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
    siteSubtitle: { en: 'For Law Practice', ar: 'للمحاماه' },
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('addTokens')}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
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
        <form onSubmit={handleFormSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-5 mb-8">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? t('editPlan') : t('addNewPlan')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planId')}</label>
                    <input type="text" value={formData.id} onChange={e => handleInputChange('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 read-only:bg-gray-100 dark:read-only:bg-gray-600" required readOnly={isEditing} />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('priceId')}</label>
                    <input 
                        type="text" 
                        value={formData.priceId} 
                        onChange={e => handleInputChange('priceId', e.target.value.trim())} 
                        className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" 
                        required 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTitleEn')}</label>
                    <input type="text" value={formData.title.en} onChange={e => handleNestedChange('title', 'en', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTitleAr')}</label>
                    <input type="text" value={formData.title.ar} onChange={e => handleNestedChange('title', 'ar', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 uppercase">{t('planPriceEn')}</label>
                     <input type="text" value={formData.price.en} onChange={e => handleNestedChange('price', 'en', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planPriceAr')}</label>
                    <input type="text" value={formData.price.ar} onChange={e => handleNestedChange('price', 'ar', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('planTokens')}</label>
                    <input type="number" value={formData.tokens} onChange={e => handleInputChange('tokens', Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('status')}</label>
                    <select value={formData.status} onChange={e => handleInputChange('status', e.target.value as 'active' | 'inactive')} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
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
                        <input type="text" placeholder={t('featureEn')} value={feature.en} onChange={e => handleFeatureChange(index, 'en', e.target.value)} className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm" />
                        <input type="text" placeholder={t('featureAr')} value={feature.ar} onChange={e => handleFeatureChange(index, 'ar', e.target.value)} className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm text-right" />
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


export default function AdminPage() {
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
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

    // Category management state
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [aiCategoryName, setAiCategoryName] = useState('');
    const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
    
    // Filtering state for services
    const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');

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

    // Support System State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [loadingTickets, setLoadingTickets] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Notification System State
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
            if (!usersData) throw new Error("Could not fetch base user data.");

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
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification)));
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
            fetchPlans();
        } else if (activeTab === 'services') {
            fetchServices();
            fetchCategories();
        } else if (activeTab === 'categories') {
            fetchCategories();
        } else if (activeTab === 'subscriptions') {
            fetchUsersWithSubscriptions();
            fetchPlans();
        } else if (activeTab === 'plans') {
            fetchPlans();
        } else if (activeTab === 'settings' || activeTab === 'marketing' || activeTab === 'support') {
            fetchSiteSettings();
        } else if (activeTab === 'notifications') {
            fetchNotifications();
        }
    }, [activeTab, fetchUsers, fetchServices, fetchUsersWithSubscriptions, fetchPlans, fetchSiteSettings, fetchNotifications, fetchCategories]);

    // Listener for Support Tickets
    useEffect(() => {
        if (activeTab !== 'support') return;
        
        setLoadingTickets(true);
        const ticketsQuery = query(collection(db, 'support_tickets'), orderBy('lastUpdate', 'desc'));
        
        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(ticketsData);
            setLoadingTickets(false);
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [activeTab]);

    // Listener for Messages in a selected ticket
    useEffect(() => {
        if (!selectedTicket) {
            setMessages([]);
            return;
        }

        const messagesQuery = query(
            collection(db, 'support_tickets', selectedTicket.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage));
            setMessages(fetchedMessages);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        // Mark ticket as read by admin if it was unread
        if (selectedTicket.unreadAdmin) {
            const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
            updateDoc(ticketRef, { unreadAdmin: false }).catch(console.error);
        }

        return () => unsubscribe();
    }, [selectedTicket]);

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
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.title[language]])), [categories, language]);

    const handleGenerateService = async () => {
        if (!aiServiceName) {
            alert(t('enterServiceName'));
            return;
        }
        setIsGenerating(true);
        setShowServiceForm(false);
        setIsEditingService(false);
        try {
            const categoryIds = categories.map(c => c.id);
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
                    category: { type: Type.STRING, enum: categoryIds.length > 0 ? categoryIds : Object.values(ServiceCategory) },
                    icon: { type: Type.STRING, description: `Must be one of the following values: ${iconNames.join(', ')}` },
                    systemInstruction_en: { type: Type.STRING, description: "A detailed system instruction for the AI model in English. It should define the AI's role and task, e.g., 'You are a legal expert specializing in drafting commercial contracts...'" },
                    systemInstruction_ar: { type: Type.STRING, description: "The Arabic translation of the system instruction." },
                    formInputs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: 'A unique name in snake_case.' },
                                label_en: { type: Type.STRING },
                                label_ar: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['text', 'textarea', 'date', 'file', 'select'] }
                            },
                            required: ['name', 'label_en', 'label_ar', 'type']
                        }
                    }
                },
                required: ['id', 'title_en', 'title_ar', 'description_en', 'description_ar', 'subCategory_en', 'subCategory_ar', 'category', 'icon', 'systemInstruction_en', 'systemInstruction_ar', 'formInputs']
            };
            const prompt = `You are a meticulous AI assistant specializing in creating structured JSON configurations for a legal tech platform. Your task is to generate a complete service configuration based on the provided service name.

**Service Name:** "${aiServiceName}"

**CRITICAL INSTRUCTIONS:**
1.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the JSON object itself.
2.  **Language Separation:** This is the most important rule. You MUST provide accurate Arabic translations for all fields ending in \`_ar\`. Fields ending in \`_en\` must contain English text. DO NOT use English text in an \`_ar\` field under any circumstances.
3.  **System Instruction:** Create a detailed, professional system instruction for the AI. This instruction defines the AI's persona and primary goal for this specific task. It must be specific and helpful.

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
  "category": "specialized-consultations",
  "icon": "Home",
  "systemInstruction_en": "You are a legal expert specializing in Saudi real estate law. Your task is to meticulously review the uploaded lease agreement, identify clauses that are disadvantageous to the tenant, and suggest specific amendments.",
  "systemInstruction_ar": "أنت خبير قانوني متخصص في قانون العقارات السعودي. مهمتك هي مراجعة عقد الإيجار المرفق بدقة، وتحديد البنود التي تضر بمصالح المستأجر، واقتراح تعديلات محددة.",
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
- **category:** Must be one of: ${categoryIds.length > 0 ? categoryIds.join(', ') : Object.values(ServiceCategory).join(', ')}.
- **icon:** Choose the most appropriate icon name. The value must be a valid icon name provided in the schema definition.

**FINAL REMINDER:** The separation of English (\`_en\`) and Arabic (\`_ar\`) and the quality of the system instruction are mandatory.`;
            
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
                category: (generatedData.category as string) || (categories[0]?.id || ''),
                subCategory: { en: generatedData.subCategory_en || '', ar: generatedData.subCategory_ar || '' },
                icon: generatedData.icon || 'FileText',
                geminiModel: 'gemini-2.5-flash',
                systemInstruction: { en: generatedData.systemInstruction_en || '', ar: generatedData.systemInstruction_ar || '' },
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
            let msg = t('generateServiceError');
            if (error instanceof Error && error.message.includes('QUOTA_EXHAUSTED')) {
                msg = t('quotaExhaustedMessage');
            }
            alert(msg);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleAddNewServiceClick = () => {
        setNewService({
            ...initialServiceState,
            category: categories.length > 0 ? categories[0].id : ''
        });
        setIsEditingService(false);
        setShowServiceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenerateLandingPage = async () => {
        if (!landingPagePrompt) {
            alert(t('enterTopic'));
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
                                icon: { type: Type.STRING, description: `Must be one of the following values: ${iconNames.join(', ')}` },
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
               - Icon: Choose the most relevant icon name. The value must be a valid icon name provided in the schema definition.
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

            const updatedSettings: SiteSettings = {
                ...siteSettings,
                landingPageConfig: newConfig
            };
            
            await setDoc(doc(db, "site_settings", "main"), updatedSettings);
            setSiteSettings(updatedSettings);
            alert(t('landingGeneratedSuccess'));
            setLandingPagePrompt('');

        } catch (error) {
            console.error("Error generating landing page:", error);
            let msg = t('landingGenerateFailed');
            if (error instanceof Error && error.message.includes('QUOTA_EXHAUSTED')) {
                msg = t('quotaExhaustedMessage');
            }
            alert(msg);
        } finally {
            setIsGeneratingLanding(false);
        }
    };

    const handleClearLandingConfig = async () => {
        if(window.confirm(t('resetLandingConfirm'))){
             const updatedSettings: SiteSettings = {
                ...siteSettings,
                landingPageConfig: undefined
            };
            await setDoc(doc(db, "site_settings", "main"), updatedSettings);
            setSiteSettings(updatedSettings);
            alert(t('landingResetSuccess'));
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
    
    const handleNestedServiceInputChange = (field: 'title' | 'description' | 'subCategory' | 'systemInstruction', lang: 'en' | 'ar', value: string) => {
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
            setSelectedServices(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
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

    const handleRevokeSubscription = async (userId: string, subId: string) => {
        if (window.confirm(t('revokeConfirm'))) {
            try {
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
        if (window.confirm(t('deleteConfirm'))) { // Using generic delete confirm, might want a specific one
            try {
                await deleteDoc(doc(db, "subscription_plans", planId));
                alert(t('serviceDeletedSuccess')); // Re-using translation
                fetchPlans();
            } catch (error) {
                console.error("Error deleting plan:", error);
                alert(t('serviceDeletedError')); // Re-using translation
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
    
    const handleAdPixelChange = (field: keyof AdPixels, value: string) => {
        setSiteSettings(prev => ({
            ...prev,
            adPixels: { ...prev.adPixels, [field]: value }
        }));
    };

    const handleNestedSiteSettingsChange = (field: 'siteName' | 'siteSubtitle' | 'metaDescription' | 'seoKeywords', lang: Language, value: string) => {
        setSiteSettings(prev => ({
            ...prev,
            [field]: { ...(prev[field] as Record<Language, string>), [lang]: value }
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
            setSiteSettings(updatedSettings);
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

    // Support System Handlers
    const handleAdminReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!currentUser || !selectedTicket || !replyMessage.trim()) return;

        try {
            await addDoc(collection(db, 'support_tickets', selectedTicket.id, 'messages'), {
                content: replyMessage,
                senderId: currentUser.uid,
                senderRole: 'admin',
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
                status: 'answered',
                lastUpdate: serverTimestamp(),
                unreadUser: true,
                unreadAdmin: false
            });
            
            setReplyMessage('');
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    // Notification System Handlers
    const handleCreateNotification = async () => {
        if (!newNotification.title?.en || !newNotification.message?.en) {
            alert('Title and Message are required.'); // Fallback text
            return;
        }

        try {
            await addDoc(collection(db, 'system_notifications'), {
                ...newNotification,
                createdAt: serverTimestamp(),
                targetAudience: 'all',
                isActive: true
            });
            setNewNotification({ title: { en: '', ar: '' }, message: { en: '', ar: '' }, type: 'info', isActive: true });
            alert(t('notificationCreated'));
            fetchNotifications();
        } catch (error) {
            console.error('Error creating notification:', error);
            alert(t('notificationFailed'));
        }
    };

    const handleDeleteNotification = async (id: string) => {
        if (!window.confirm(t('areYouSure'))) return;
        try {
            await deleteDoc(doc(db, 'system_notifications', id));
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleToggleNotificationStatus = async (notif: SystemNotification) => {
        try {
            await updateDoc(doc(db, 'system_notifications', notif.id), {
                isActive: !notif.isActive
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    // Category Management Handlers
    const handleGenerateCategory = async () => {
        if (!aiCategoryName) {
            alert(language === 'ar' ? 'الرجاء إدخال اسم القسم لإنشائه.' : 'Please enter a category name to generate.');
            return;
        }
        setIsGeneratingCategory(true);
        setShowCategoryForm(false);
        setEditingCategory(null);
        try {
            const schema = {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: 'A unique, URL-friendly ID in kebab-case based on the English title.' },
                    title_en: { type: Type.STRING },
                    title_ar: { type: Type.STRING },
                    icon: { type: Type.STRING, description: `Must be one of the following values: ${iconNames.join(', ')}` },
                    order: { type: Type.INTEGER, description: 'A number for sorting, suggest a high number like 99.' }
                },
                required: ['id', 'title_en', 'title_ar', 'icon', 'order']
            };

            const prompt = `Generate a JSON configuration for a new legal service category named "${aiCategoryName}".
            
            **Instructions:**
            1.  **Output JSON only:** Your response must be a single, valid JSON object. No extra text or markdown.
            2.  **Bilingual:** Provide accurate Arabic translations for fields ending in \`_ar\`. English for fields ending in \`_en\`.
            3.  **Icon:** Choose the most suitable icon name. The value must be a valid icon name provided in the schema definition.
            4.  **Order:** Set the order to 99.
            5.  **ID:** Create a URL-friendly kebab-case ID from the English title.
            
            **Example JSON Structure:**
            {
              "id": "family-law",
              "title_en": "Family Law",
              "title_ar": "قانون الأسرة",
              "icon": "Users",
              "order": 99
            }
            
            Now, generate the configuration for "${aiCategoryName}".`;

            const response = await generateCategoryConfigWithAI(prompt, schema);
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }
            const data = JSON.parse(jsonString);

            const newCategory: Category = {
                id: data.id,
                title: { en: data.title_en, ar: data.title_ar },
                icon: data.icon,
                order: data.order
            };

            setEditingCategory(newCategory);
            setIsEditingCategory(false);
            setShowCategoryForm(true);
            setAiCategoryName('');

        } catch (error) {
            console.error("Error generating category with AI:", error);
            let msg = language === 'ar' ? 'فشل إنشاء القسم بالذكاء الاصطناعي.' : 'Failed to generate category with AI.';
            if (error instanceof Error && error.message.includes('QUOTA_EXHAUSTED')) {
                msg = t('quotaExhaustedMessage');
            }
            alert(msg);
        } finally {
            setIsGeneratingCategory(false);
        }
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.id.trim()) {
            alert('Category ID is required.');
            return;
        }
        
        try {
            // Using setDoc will create or overwrite.
            await setDoc(doc(db, "service_categories", editingCategory.id), editingCategory, { merge: true });
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
                await deleteDoc(doc(db, "service_categories", categoryId));
                alert(t('categoryDeletedSuccess'));
                fetchCategories();
            } catch (error) {
                console.error("Error deleting category:", error);
                alert(t('categoryDeletedError'));
            }
        }
    };

    const handleAddNewCategory = () => {
        const newOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 1;
        setEditingCategory({
            id: '',
            title: { en: '', ar: '' },
            icon: 'FileText',
            order: newOrder
        });
        setIsEditingCategory(false);
        setShowCategoryForm(true);
    };

    const handleEditCategoryClick = (category: Category) => {
        setEditingCategory(category);
        setIsEditingCategory(true);
        setShowCategoryForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderUserManagementContent = () => {
        const totalUsers = users.length;
        const totalTokenBalance = users.reduce((acc, user) => acc + (user.tokenBalance || 0), 0);
        const totalTokensUsed = users.reduce((acc, user) => acc + (user.tokensUsed || 0), 0);
        const activeSubscribers = usersWithSub.filter(u => u.subscription?.status === 'active' || u.subscription?.status === 'trialing').length;

        const StatCard = ({ title, value, icon: Icon, gradient }: any) => (
             <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-transform hover:-translate-y-1 duration-300`}>
                <div className={`absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`}></div>
                <div className="relative flex items-center space-x-4 rtl:space-x-reverse">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-1">{value}</p>
                    </div>
                </div>
             </div>
        );

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Users className="text-primary-500" /> {t('userManagement')}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                     <StatCard 
                        title={t('totalUsers')} 
                        value={totalUsers} 
                        icon={Users} 
                        gradient="from-blue-500 to-indigo-600" 
                    />
                    <StatCard 
                        title={t('activeSubscribers')} 
                        value={activeSubscribers} 
                        icon={CreditCard} 
                        gradient="from-emerald-400 to-teal-600" 
                    />
                    <StatCard 
                        title={t('tokenBalance')} 
                        value={totalTokenBalance.toLocaleString()} 
                        icon={Coins} 
                        gradient="from-amber-400 to-orange-500" 
                    />
                     <StatCard 
                        title={t('tokensUsed')} 
                        value={totalTokensUsed.toLocaleString()} 
                        icon={Activity} 
                        gradient="from-rose-400 to-pink-600" 
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-4">{t('email')}</th>
                                    <th className="px-6 py-4">{t('role')}</th>
                                    <th className="px-6 py-4">{t('status')}</th>
                                    <th className="px-6 py-4">{t('tokenBalance')}</th>
                                    <th className="px-6 py-4 text-purple-600 dark:text-purple-400">{t('used')}</th>
                                    <th className="px-6 py-4">{t('dateJoined')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingUsers ? (
                                    <tr><td colSpan={7} className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></td></tr>
                                ) : userError ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-red-500">{userError}</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">{t('noUsersFound')}</td></tr>
                                ) : users.map((user) => {
                                    const isSelf = user.email === ADMIN_EMAIL;
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                    {user.role === 'admin' ? t('adminRole') : t('userRole')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex w-fit items-center gap-1 ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                                    {user.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
                                                    {user.status ? t(user.status) : t('active')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{user.tokenBalance?.toLocaleString() ?? 0}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">{user.tokensUsed?.toLocaleString() ?? 0}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!isSelf && (
                                                        <>
                                                            <button onClick={() => handleOpenGrantModalForUser(user)} className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 p-1.5 rounded-lg transition-colors" title={t('grantSubscription')}>
                                                                <Gift size={18} />
                                                            </button>
                                                            <button onClick={() => handleOpenTokenModal(user)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 p-1.5 rounded-lg transition-colors" title={t('addTokens')}>
                                                                <Coins size={18} />
                                                            </button>
                                                            {user.status === 'disabled' ? (
                                                                <button onClick={() => handleUpdateUserStatus(user.id, 'active')} className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1.5 rounded-lg transition-colors" title={t('enable')}>
                                                                    <CheckCircle size={18}/>
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => handleUpdateUserStatus(user.id, 'disabled')} className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 p-1.5 rounded-lg transition-colors" title={t('disable')}>
                                                                    <Ban size={18} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors" title={t('delete')}>
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
        );
    };

    const renderServiceManagementContent = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                    <PlusSquare className="text-primary-500" /> {t('manageServices')}
                </h2>
                <button onClick={handleAddNewServiceClick} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                    <Plus size={18} /> {t('add')}
                </button>
            </div>
            
            {/* AI Generator Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 shadow-lg text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                    <Wand2 size={150} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <Wand2 className="text-yellow-300" /> {t('generateWithAI')}
                    </h3>
                    <p className="text-indigo-100 mb-6 max-w-xl leading-relaxed text-sm opacity-90">{t('aiGeneratorDescription')}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                        <input 
                            type="text" 
                            placeholder={t('serviceNamePlaceholder')} 
                            value={aiServiceName}
                            onChange={e => setAiServiceName(e.target.value)}
                            className="flex-grow px-4 py-3 rounded-xl border-0 bg-white/20 backdrop-blur-md text-white placeholder-indigo-200 focus:ring-2 focus:ring-white/50 outline-none"
                        />
                        <button 
                            type="button" 
                            onClick={handleGenerateService} 
                            disabled={isGenerating}
                            className="bg-white text-indigo-700 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                            {t('generate')}
                        </button>
                    </div>
                </div>
            </div>

            { showServiceForm && (
                <form onSubmit={handleSaveService} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-5 animate-fade-in-down">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isEditingService ? t('editService') : t('serviceDetails')}</h3>
                        <button type="button" onClick={handleCancelEditService} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('serviceIdPlaceholder')}</label>
                            <input type="text" value={newService.id} onChange={e => handleServiceInputChange('id', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" disabled={isEditingService}/>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('geminiModel')}</label>
                             <select value={newService.geminiModel} onChange={e => handleServiceInputChange('geminiModel', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Smarter & Fast - Recommended)</option>
                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Cost Effective & Fastest)</option>
                                <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Highest Intelligence - Complex Tasks)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('titleEnPlaceholder')}</label>
                             <input type="text" value={newService.title.en} onChange={e => handleNestedServiceInputChange('title', 'en', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('titleArPlaceholder')}</label>
                             <input type="text" value={newService.title.ar} onChange={e => handleNestedServiceInputChange('title', 'ar', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right"/>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('descriptionEnPlaceholder')}</label>
                             <textarea value={newService.description.en} onChange={e => handleNestedServiceInputChange('description', 'en', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={2}/>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('descriptionArPlaceholder')}</label>
                             <textarea value={newService.description.ar} onChange={e => handleNestedServiceInputChange('description', 'ar', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" rows={2}/>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
                            <select value={newService.category} onChange={e => handleServiceInputChange('category', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="" disabled>Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title[language]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('subCategoryEnPlaceholder')}</label>
                             <input type="text" value={newService.subCategory.en} onChange={e => handleNestedServiceInputChange('subCategory', 'en', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('subCategoryArPlaceholder')}</label>
                             <input type="text" value={newService.subCategory.ar} onChange={e => handleNestedServiceInputChange('subCategory', 'ar', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right"/>
                        </div>
                    </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('icon')}</label>
                         <select value={newService.icon} onChange={e => handleServiceInputChange('icon', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                             {iconNames.map(iconName => (
                                 <option key={iconName} value={iconName}>{iconName}</option>
                             ))}
                         </select>
                     </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-bold mb-2 text-gray-800 dark:text-white">System Instruction</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Instruction (English)</label>
                                 <textarea value={newService.systemInstruction?.en} onChange={e => handleNestedServiceInputChange('systemInstruction', 'en', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={4}/>
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Instruction (Arabic)</label>
                                 <textarea value={newService.systemInstruction?.ar} onChange={e => handleNestedServiceInputChange('systemInstruction', 'ar', e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" rows={4}/>
                             </div>
                        </div>
                    </div>

                     <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                         <h4 className="font-bold mb-2 text-gray-800 dark:text-white">{t('formInputs')}</h4>
                         {newService.formInputs.map((input, index) => (
                             <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mb-3 border border-gray-200 dark:border-gray-600">
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                                     <input type="text" placeholder={t('inputNamePlaceholder')} value={input.name} onChange={e => handleFormInputChange(index, 'name', e.target.value)} className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-500"/>
                                     <input type="text" placeholder={t('labelEnPlaceholder')} value={input.label.en} onChange={e => handleFormInputLabelChange(index, 'en', e.target.value)} className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-500"/>
                                     <input type="text" placeholder={t('labelArPlaceholder')} value={input.label.ar} onChange={e => handleFormInputLabelChange(index, 'ar', e.target.value)} className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-500 text-right"/>
                                     <select value={input.type} onChange={e => handleFormInputChange(index, 'type', e.target.value)} className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-500">
                                         <option value="text">Text</option>
                                         <option value="textarea">Textarea</option>
                                         <option value="date">Date</option>
                                         <option value="file">File</option>
                                         <option value="select">Select</option>
                                     </select>
                                 </div>
                                 
                                 {input.type === 'select' && (
                                     <div className="ml-4 mt-2 border-l-2 border-gray-300 pl-4">
                                         <p className="text-xs font-bold mb-1">{t('options')}</p>
                                         {input.options?.map((option, optIndex) => (
                                             <div key={optIndex} className="flex gap-2 mb-1">
                                                 <input type="text" placeholder="Value" value={option.value} onChange={e => handleOptionChange(index, optIndex, 'value', e.target.value)} className="p-1 border rounded text-xs w-20 dark:bg-gray-700 dark:border-gray-500"/>
                                                 <input type="text" placeholder={t('featureEn')} value={option.label.en} onChange={e => handleOptionLabelChange(index, optIndex, 'en', e.target.value)} className="p-1 border rounded text-xs flex-1 dark:bg-gray-700 dark:border-gray-500"/>
                                                 <input type="text" placeholder={t('featureAr')} value={option.label.ar} onChange={e => handleOptionLabelChange(index, optIndex, 'ar', e.target.value)} className="p-1 border rounded text-xs flex-1 dark:bg-gray-700 dark:border-gray-500 text-right"/>
                                                 <button type="button" onClick={() => handleRemoveOption(index, optIndex)} className="text-red-500 text-xs"><X size={14}/></button>
                                             </div>
                                         ))}
                                         <button type="button" onClick={() => handleAddOption(index)} className="text-xs text-primary-600 font-bold mt-1">+ {t('addOption')}</button>
                                     </div>
                                 )}
                                 
                                 <button type="button" onClick={() => handleRemoveFormInput(index)} className="text-red-500 text-xs mt-2 flex items-center gap-1 hover:underline"><Trash2 size={12}/> {t('delete')}</button>
                             </div>
                         ))}
                         <button type="button" onClick={handleAddFormInput} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">+ {t('addFormInput')}</button>
                     </div>
                    
                     <div className="flex items-center gap-4 pt-4">
                         <button type="submit" className="flex-grow bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all">{t('saveService')}</button>
                         {(isEditingService || showServiceForm) && (
                            <button type="button" onClick={handleCancelEditService} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('cancel')}</button>
                         )}
                    </div>
                </form>
            )}

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('existingServices')}</h3>
                    <button onClick={handleDeleteSelectedServices} disabled={selectedServices.length === 0} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1">
                        <Trash2 size={16}/> {t('deleteSelected')} ({selectedServices.length})
                    </button>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                     <button onClick={() => setFilterCategory('all')} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filterCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{t('allCategories')}</button>
                     {categories.map(cat => (
                         <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filterCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{cat.title[language]}</button>
                     ))}
                </div>

                {/* Services Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        ref={selectAllCheckboxRef}
                                        onChange={handleSelectAllToggle}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th className="px-4 py-3">{t('serviceName')}</th>
                                <th className="px-4 py-3">{t('category')}</th>
                                <th className="px-4 py-3">{t('subCategory')}</th>
                                <th className="px-4 py-3 text-center">{t('usage')}</th>
                                <th className="px-4 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loadingServices ? (
                                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></td></tr>
                            ) : filteredServices.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">{t('noServicesFound')}</td></tr>
                            ) : (
                                filteredServices.map(service => (
                                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedServices.includes(service.id)}
                                                onChange={() => {
                                                    if (selectedServices.includes(service.id)) {
                                                        setSelectedServices(prev => prev.filter(id => id !== service.id));
                                                    } else {
                                                        setSelectedServices(prev => [...prev, service.id]);
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{service.title[language]}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{categoryMap.get(service.category) || service.category}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{service.subCategory[language]}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{service.usageCount || 0}</td>
                                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => handleRunClick(service)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors" title={t('run')}><Play size={16}/></button>
                                            <button onClick={() => handleEditServiceClick(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title={t('edit')}><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteService(service.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title={t('delete')}><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isExecutionModalOpen && (
                <ServiceExecutionModal
                    isOpen={isExecutionModalOpen}
                    onClose={() => setIsExecutionModalOpen(false)}
                    service={selectedService}
                />
            )}
        </div>
    );

    const renderCategoryManagementContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                <Tag className="text-primary-500" /> {t('manageCategories')}
            </h2>
            
            {/* AI Category Generator */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden mb-6">
                <div className="absolute right-0 top-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                    <Tag size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-grow">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <Wand2 className="text-yellow-300" size={20} /> Create with AI
                        </h3>
                        <p className="text-teal-100 text-sm opacity-90">Enter a category name and let AI configure it.</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <input 
                            type="text" 
                            placeholder="Category Name (e.g., Family Law)" 
                            value={aiCategoryName}
                            onChange={e => setAiCategoryName(e.target.value)}
                            className="flex-grow md:w-64 px-4 py-2 rounded-lg border-0 bg-white/20 backdrop-blur-md text-white placeholder-teal-200 focus:ring-2 focus:ring-white/50 outline-none"
                        />
                        <button 
                            onClick={handleGenerateCategory}
                            disabled={isGeneratingCategory}
                            className="bg-white text-teal-700 font-bold py-2 px-4 rounded-lg hover:bg-teal-50 disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
                        >
                            {isGeneratingCategory ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={handleAddNewCategory} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                <Plus size={18} /> {t('add')}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="p-4 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                                {iconMap[cat.icon] ? React.createElement(iconMap[cat.icon], { size: 20 }) : <Tag size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">{cat.title[language]}</h3>
                                <p className="text-xs text-gray-500">ID: {cat.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditCategoryClick(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {showCategoryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">{t('editCategory')}</h3>
                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <input type="text" placeholder="ID" value={editingCategory?.id || ''} onChange={e => setEditingCategory(prev => prev ? ({...prev, id: e.target.value}) : null)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" disabled={isEditingCategory} />
                            <input type="text" placeholder="Title (EN)" value={editingCategory?.title.en || ''} onChange={e => setEditingCategory(prev => prev ? ({...prev, title: {...prev.title, en: e.target.value}}) : null)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="text" placeholder="Title (AR)" value={editingCategory?.title.ar || ''} onChange={e => setEditingCategory(prev => prev ? ({...prev, title: {...prev.title, ar: e.target.value}}) : null)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" />
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('icon')}</label>
                                <select 
                                    value={editingCategory?.icon || 'FileText'} 
                                    onChange={e => setEditingCategory(prev => prev ? ({...prev, icon: e.target.value}) : null)} 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                >
                                    {iconNames.map(iconName => (
                                        <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                </select>
                            </div>

                            <input type="number" placeholder="Order" value={editingCategory?.order || 0} onChange={e => setEditingCategory(prev => prev ? ({...prev, order: Number(e.target.value)}) : null)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white">{t('cancel')}</button>
                                <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderSubscriptionManagementContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                <CreditCard className="text-primary-500" /> {t('subscriptionManagement')}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-4 dark:text-gray-300">{t('email')}</th>
                            <th className="px-6 py-4 dark:text-gray-300">{t('plan')}</th>
                            <th className="px-6 py-4 dark:text-gray-300">{t('status')}</th>
                            <th className="px-6 py-4 dark:text-gray-300">{t('endsOn')}</th>
                            <th className="px-6 py-4 dark:text-gray-300">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {usersWithSub.filter(u => u.subscription).map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 dark:text-white">{user.email}</td>
                                <td className="px-6 py-4 dark:text-gray-300">{user.subscription?.planId}</td>
                                <td className="px-6 py-4 dark:text-gray-300">{user.subscription?.status}</td>
                                <td className="px-6 py-4 dark:text-gray-300">{user.subscription?.current_period_end ? new Date(user.subscription.current_period_end * 1000).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-6 py-4">
                                    {user.subscription?.isManual && (
                                        <button onClick={() => handleRevokeSubscription(user.id, user.subscription!.id)} className="text-red-500 hover:underline">{t('revoke')}</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPlanManagementContent = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Star className="text-primary-500"/> {t('planManagement')}</h2>
                <button onClick={handleAddPlanClick} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"><Plus size={18}/> {t('add')}</button>
            </div>
            {showPlanForm && editingPlan && (
                <PlanForm 
                    plan={editingPlan} 
                    onSave={handleSavePlan} 
                    onCancel={handleCancelPlanEdit}
                    isEditing={!!editingPlan.id} 
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="border rounded-xl p-6 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => handleEditPlanClick(plan)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded"><Edit size={16}/></button>
                            <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"><Trash2 size={16}/></button>
                        </div>
                        <h3 className="text-xl font-bold dark:text-white">{plan.title[language]}</h3>
                        <p className="text-2xl font-black text-primary-600 mt-2">{plan.price[language]}</p>
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Coins size={14}/> {plan.tokens.toLocaleString()} Tokens</p>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t(plan.status)}</span>
                                <button onClick={() => handleTogglePlanStatus(plan)} className="text-xs underline text-gray-500">{plan.status === 'active' ? t('deactivate') : t('activate')}</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMarketingContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <BarChart className="text-primary-500" /> {t('marketing')}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{t('adPixels')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('adPixelsDesc')}</p>
                
                <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('googleTagId')}</label>
                        <input 
                            type="text" 
                            value={siteSettings.adPixels?.googleTagId || ''} 
                            onChange={e => handleAdPixelChange('googleTagId', e.target.value)} 
                            placeholder="G-XXXXXXXXXX"
                            className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('facebookPixelId')}</label>
                        <input 
                            type="text" 
                            value={siteSettings.adPixels?.facebookPixelId || ''} 
                            onChange={e => handleAdPixelChange('facebookPixelId', e.target.value)} 
                            placeholder="123456789012345"
                            className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('snapchatPixelId')}</label>
                        <input 
                            type="text" 
                            value={siteSettings.adPixels?.snapchatPixelId || ''} 
                            onChange={e => handleAdPixelChange('snapchatPixelId', e.target.value)} 
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('tiktokPixelId')}</label>
                        <input 
                            type="text" 
                            value={siteSettings.adPixels?.tiktokPixelId || ''} 
                            onChange={e => handleAdPixelChange('tiktokPixelId', e.target.value)} 
                            placeholder="Cxxxxxxxxxxxxxxxx"
                            className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none" 
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4">
                        <button type="submit" disabled={savingSettings} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2">
                            {savingSettings && <Loader2 className="animate-spin" size={18}/>}
                            {t('saveSettings')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderNotificationsContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Bell className="text-primary-500" /> {t('notifications')}
            </h2>
            
            {/* Create Notification */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('createNotification')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder={t('titleEn')} value={newNotification.title?.en || ''} onChange={e => setNewNotification(prev => ({...prev, title: {...prev.title!, en: e.target.value}}))} className="p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" />
                    <input type="text" placeholder={t('titleAr')} value={newNotification.title?.ar || ''} onChange={e => setNewNotification(prev => ({...prev, title: {...prev.title!, ar: e.target.value}}))} className="p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-right" />
                    <textarea placeholder={t('messageEn')} value={newNotification.message?.en || ''} onChange={e => setNewNotification(prev => ({...prev, message: {...prev.message!, en: e.target.value}}))} className="p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" rows={2}/>
                    <textarea placeholder={t('messageAr')} value={newNotification.message?.ar || ''} onChange={e => setNewNotification(prev => ({...prev, message: {...prev.message!, ar: e.target.value}}))} className="p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-right" rows={2}/>
                </div>
                <div className="flex items-center gap-4">
                    <select value={newNotification.type} onChange={e => setNewNotification(prev => ({...prev, type: e.target.value as any}))} className="p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="info">{t('info')}</option>
                        <option value="success">{t('success')}</option>
                        <option value="warning">{t('warning')}</option>
                        <option value="alert">{t('alert')}</option>
                    </select>
                    <button onClick={handleCreateNotification} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center gap-2">
                        <Send size={18}/> {t('createNotification')}
                    </button>
                </div>
            </div>

            {/* List Notifications */}
            <div className="grid grid-cols-1 gap-4">
                {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 rounded-xl border flex justify-between items-center ${notif.isActive ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-75'}`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${notif.type === 'info' ? 'bg-blue-100 text-blue-600' : notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {notif.type === 'info' && <Info size={20}/>}
                                {notif.type === 'success' && <CheckCircle size={20}/>}
                                {(notif.type === 'warning' || notif.type === 'alert') && <AlertTriangle size={20}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{notif.title[language]}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message[language]}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.createdAt?.toDate().toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleToggleNotificationStatus(notif)} className={`p-2 rounded-lg transition-colors ${notif.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                {notif.isActive ? <Eye size={20}/> : <EyeOff size={20}/>}
                            </button>
                            <button onClick={() => handleDeleteNotification(notif.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 size={20}/>
                            </button>
                        </div>
                    </div>
                ))}
                {notifications.length === 0 && <p className="text-center text-gray-500">{t('noNotificationsFound')}</p>}
            </div>
        </div>
    );

    const renderSupportContent = () => (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6 flex-shrink-0">
                <LifeBuoy className="text-primary-500" /> {t('support')}
            </h2>
            <div className="flex-grow flex overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Ticket List */}
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300">
                        {t('selectTicket')}
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {tickets.map(ticket => (
                            <div 
                                key={ticket.id} 
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm truncate ${ticket.unreadAdmin ? 'text-primary-600' : 'text-gray-800 dark:text-white'}`}>{ticket.subject}</h4>
                                    {ticket.unreadAdmin && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                </div>
                                <p className="text-xs text-gray-500 truncate mb-1">{ticket.userEmail}</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ticket.status === 'open' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                        {t(ticket.status)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{ticket.lastUpdate?.toDate().toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {tickets.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">{t('noTickets')}</div>}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900/50">
                    {selectedTicket ? (
                        <>
                            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                                    <p className="text-xs text-gray-500">{selectedTicket.userEmail} - {selectedTicket.type}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{selectedTicket.status}</span>
                                </div>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderRole === 'admin' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'}`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.senderRole === 'admin' ? 'text-primary-200' : 'text-gray-400'}`}>
                                                {msg.createdAt?.toDate().toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleAdminReply} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={replyMessage} 
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder={t('typeReply')}
                                        className="flex-grow p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                    <button type="submit" disabled={!replyMessage.trim()} className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                                        <Send size={20} className="rtl:rotate-180"/>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageSquare size={48} className="mb-2 opacity-50"/>
                            <p>{t('selectTicket')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSiteSettingsContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Cog className="text-primary-500"/> {t('siteSettings')}</h2>
            
            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                
                {/* Basic Information */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Site Identity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('siteNameEn')}</label>
                            <input type="text" value={siteSettings.siteName.en} onChange={e => handleNestedSiteSettingsChange('siteName', Language.EN, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('siteNameAr')}</label>
                            <input type="text" value={siteSettings.siteName.ar} onChange={e => handleNestedSiteSettingsChange('siteName', Language.AR, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('siteSubtitleEn')}</label>
                            <input type="text" value={siteSettings.siteSubtitle?.en || ''} onChange={e => handleNestedSiteSettingsChange('siteSubtitle', Language.EN, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('siteSubtitleAr')}</label>
                            <input type="text" value={siteSettings.siteSubtitle?.ar || ''} onChange={e => handleNestedSiteSettingsChange('siteSubtitle', Language.AR, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" />
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">SEO & Meta Data</h4>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('metaDescriptionEn')}</label>
                            <textarea value={siteSettings.metaDescription?.en || ''} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.EN, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" rows={2} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('metaDescriptionAr')}</label>
                            <textarea value={siteSettings.metaDescription?.ar || ''} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.AR, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" rows={2} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('seoKeywordsEn')}</label>
                                <input type="text" value={siteSettings.seoKeywords?.en || ''} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.EN, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('seoKeywordsAr')}</label>
                                <input type="text" value={siteSettings.seoKeywords?.ar || ''} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.AR, e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-right" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding (Logo & Favicon) */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Branding</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">{t('logo')}</label>
                            <div className="flex items-center gap-4">
                                {siteSettings.logoUrl && <img src={siteSettings.logoUrl} alt="Logo" className="h-10 w-auto object-contain bg-gray-100 p-1 rounded border" />}
                                <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                                    <Upload size={16} /> Upload New Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                {logoFile && <span className="text-xs text-green-600">{logoFile.name}</span>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-gray-300">{t('favicon')}</label>
                            <div className="flex items-center gap-4">
                                {siteSettings.faviconUrl && <img src={siteSettings.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain bg-gray-100 p-1 rounded border" />}
                                <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                                    <Upload size={16} /> Upload New Favicon
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setFaviconFile(e.target.files ? e.target.files[0] : null)} />
                                </label>
                                {faviconFile && <span className="text-xs text-green-600">{faviconFile.name}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Landing Page Configuration */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Landing Page Generator</h4>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">{t('generateWithAIConfig')}</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder={t('enterTopic')} 
                                value={landingPagePrompt}
                                onChange={e => setLandingPagePrompt(e.target.value)}
                                className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button type="button" onClick={handleGenerateLandingPage} disabled={isGeneratingLanding} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                                {isGeneratingLanding ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                {t('generate')}
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${siteSettings.landingPageConfig ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {siteSettings.landingPageConfig ? t('customPageActive') : t('defaultPageActive')}
                            </span>
                            {siteSettings.landingPageConfig && (
                                <button type="button" onClick={handleClearLandingConfig} className="text-xs text-red-500 underline hover:text-red-700">
                                    {t('resetToDefault')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">System</h4>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <input type="checkbox" checked={siteSettings.isMaintenanceMode} onChange={e => handleSiteSettingsChange('isMaintenanceMode', e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 h-5 w-5" />
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white block">{t('enableMaintenance')}</span>
                            <span className="text-xs text-gray-500">Only admins will be able to access the site.</span>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button type="submit" disabled={savingSettings} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary-600/20">
                        {savingSettings && <Loader2 className="animate-spin" size={20} />}
                        {t('saveSettings')}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('adminPanel')}</h1>
                </div>
                <nav className="p-4 space-y-2">
                    {[
                        { id: 'users', label: t('userManagement'), icon: Users },
                        { id: 'services', label: t('manageServices'), icon: LayoutGrid },
                        { id: 'categories', label: t('manageCategories'), icon: Tag },
                        { id: 'subscriptions', label: t('subscriptionManagement'), icon: CreditCard },
                        { id: 'plans', label: t('planManagement'), icon: Star },
                        { id: 'settings', label: t('siteSettings'), icon: Cog },
                        { id: 'marketing', label: t('marketing'), icon: BarChart },
                        { id: 'notifications', label: t('notifications'), icon: Bell },
                        { id: 'support', label: t('support'), icon: LifeBuoy },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === item.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6 md:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'users' && renderUserManagementContent()}
                    {activeTab === 'services' && renderServiceManagementContent()}
                    {activeTab === 'categories' && renderCategoryManagementContent()}
                    {activeTab === 'subscriptions' && renderSubscriptionManagementContent()}
                    {activeTab === 'plans' && renderPlanManagementContent()}
                    {activeTab === 'settings' && renderSiteSettingsContent()}
                    {activeTab === 'marketing' && renderMarketingContent()}
                    {activeTab === 'notifications' && renderNotificationsContent()}
                    {activeTab === 'support' && renderSupportContent()}
                </div>
            </div>

            {/* Modals */}
            <GrantSubscriptionModal 
                isOpen={isGrantModalOpen}
                onClose={() => setIsGrantModalOpen(false)}
                users={users}
                plans={plans}
                onGrant={fetchUsersWithSubscriptions}
                initialUserId={selectedUserForAction?.id}
            />
            {selectedUserForAction && (
                <AddTokenModal
                    isOpen={isTokenModalOpen}
                    onClose={() => setIsTokenModalOpen(false)}
                    userId={selectedUserForAction.id}
                    userEmail={selectedUserForAction.email}
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
};
