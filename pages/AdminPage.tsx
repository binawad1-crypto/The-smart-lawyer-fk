
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, PlusSquare, Trash2, Edit, Play, Loader2, Wand2, ChevronDown, Plus, CreditCard, X, Star, Cog, Coins, Gift, Ban, CheckCircle, RefreshCw, Activity, LayoutTemplate, BarChart, LifeBuoy, MessageSquare, Send, Archive, Tag, Search, Filter, MoreVertical, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, getDoc, query, orderBy, doc, setDoc, deleteDoc, updateDoc, writeBatch, increment, where, Timestamp, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Service, ServiceCategory, FormInput, FormInputType, Translations, SubscriptionInfo, Plan, SiteSettings, Language, LandingPageConfig, AdPixels, Ticket, TicketMessage } from '../types';
import { iconNames, ADMIN_EMAIL } from '../constants';
import { Type } from "@google/genai";
import { generateServiceConfigWithAI } from '../services/geminiService';
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
    adPixels: {},
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('addTokens')}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        Adding tokens for: <br/><b>{userEmail}</b>
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


const AdminPage = () => {
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

    // Support System State
    const [supportView, setSupportView] = useState<'list' | 'chat' | 'settings'>('list');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [newTicketType, setNewTicketType] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);


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
                setSiteSettings({
                    ...initialSiteSettings,
                    ...data,
                    siteName: { ...initialSiteSettings.siteName, ...(data.siteName || {}) },
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

    // Fetch Tickets Realtime
    useEffect(() => {
        if (activeTab !== 'support') return;
        
        setLoadingTickets(true);
        const q = query(collection(db, 'support_tickets'), orderBy('lastUpdate', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(ticketsData);
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [activeTab]);

    // Fetch Messages Realtime
    useEffect(() => {
        if (activeTab !== 'support' || !selectedTicket) return;

        const q = query(
            collection(db, 'support_tickets', selectedTicket.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage));
            setMessages(msgs);
            // Scroll
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        // Mark as read by Admin
        if(selectedTicket.unreadAdmin) {
            updateDoc(doc(db, 'support_tickets', selectedTicket.id), { unreadAdmin: false });
        }

        return () => unsubscribe();
    }, [selectedTicket, activeTab]);


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
        } else if (activeTab === 'settings' || activeTab === 'landing' || activeTab === 'marketing' || activeTab === 'support') {
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
    
    // ... (Keep existing AI Generator handlers: handleGenerateService, handleGenerateLandingPage) ...
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
    
    const handleAdPixelChange = (field: keyof AdPixels, value: string) => {
        setSiteSettings(prev => ({
            ...prev,
            adPixels: { ...prev.adPixels, [field]: value }
        }));
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

    const handleAddTicketType = async () => {
        if(!newTicketType.trim()) return;
        const updatedTypes = [...(siteSettings.ticketTypes || []), newTicketType.trim()];
        setSiteSettings({...siteSettings, ticketTypes: updatedTypes});
        setNewTicketType('');
        // Save immediately
        await updateDoc(doc(db, 'site_settings', 'main'), { ticketTypes: updatedTypes });
    };

    const handleRemoveTicketType = async (index: number) => {
        if(!window.confirm("Are you sure?")) return;
        const updatedTypes = (siteSettings.ticketTypes || []).filter((_, i) => i !== index);
        setSiteSettings({...siteSettings, ticketTypes: updatedTypes});
        // Save immediately
        await updateDoc(doc(db, 'site_settings', 'main'), { ticketTypes: updatedTypes });
    };

    const renderUserManagementContent = () => {
        const totalUsers = users.length;
        const totalTokenBalance = users.reduce((acc, user) => acc + (user.tokenBalance || 0), 0);
        const totalTokensUsed = users.reduce((acc, user) => acc + (user.tokensUsed || 0), 0);
        // Crude approximation of active subscribers (stripeId present)
        const activeSubscribers = users.filter(u => u.stripeId).length;

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
                        title="Total Users" 
                        value={totalUsers} 
                        icon={Users} 
                        gradient="from-blue-500 to-indigo-600" 
                    />
                    <StatCard 
                        title="Active Subscribers" 
                        value={activeSubscribers} 
                        icon={CreditCard} 
                        gradient="from-emerald-400 to-teal-600" 
                    />
                    <StatCard 
                        title="Token Balance" 
                        value={totalTokenBalance.toLocaleString()} 
                        icon={Coins} 
                        gradient="from-amber-400 to-orange-500" 
                    />
                     <StatCard 
                        title="Tokens Used" 
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
                                    <th className="px-6 py-4 text-purple-600 dark:text-purple-400">Used</th>
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
                                                    {user.role}
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
    
    // ... (Keep existing render functions: renderServiceManagementContent, renderSubscriptionManagementContent, renderPlanManagementContent, renderLandingPageGenerator, renderMarketingContent, renderSiteSettingsContent) ...
    const renderServiceManagementContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                 <PlusSquare className="text-primary-500" /> {t('manageServices')}
            </h2>
            
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
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Service ID</label>
                        <input type="text" placeholder={t('serviceIdPlaceholder')} value={newService.id} onChange={e => handleServiceInputChange('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 read-only:bg-gray-100 dark:read-only:bg-gray-600" required readOnly={isEditingService} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">{t('titleEnPlaceholder')}</label>
                             <input type="text" value={newService.title.en} onChange={e => handleNestedServiceInputChange('title', 'en', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">{t('titleArPlaceholder')}</label>
                             <input type="text" value={newService.title.ar} onChange={e => handleNestedServiceInputChange('title', 'ar', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('descriptionEnPlaceholder')}</label>
                            <textarea value={newService.description.en} onChange={e => handleNestedServiceInputChange('description', 'en', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" rows={3}/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('descriptionArPlaceholder')}</label>
                            <textarea value={newService.description.ar} onChange={e => handleNestedServiceInputChange('description', 'ar', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" rows={3}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('subCategoryEnPlaceholder')}</label>
                            <input type="text" value={newService.subCategory.en} onChange={e => handleNestedServiceInputChange('subCategory', 'en', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('subCategoryArPlaceholder')}</label>
                            <input type="text" value={newService.subCategory.ar} onChange={e => handleNestedServiceInputChange('subCategory', 'ar', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
                             <select value={newService.category} onChange={e => handleServiceInputChange('category', e.target.value as ServiceCategory)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
                                {Object.values(ServiceCategory).map(categoryValue => (
                                    <option key={categoryValue} value={categoryValue}>{t(categoryValue as keyof Translations)}</option>
                                ))}
                            </select>
                        </div>
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">{t('geminiModel')}</label>
                             <input type="text" value={newService.geminiModel} onChange={e => handleServiceInputChange('geminiModel', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('icon')}</label>
                        <select value={newService.icon} onChange={e => handleServiceInputChange('icon', e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-primary-500">
                            {iconNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4">{t('formInputs')}</h4>
                        {newService.formInputs.map((input, index) => (
                            <div key={index} className="p-4 mb-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3 relative">
                                <button type="button" onClick={() => handleRemoveFormInput(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t('input')} {index + 1}</p>
                                
                                <input type="text" placeholder={t('inputNamePlaceholder')} value={input.name} onChange={e => handleFormInputChange(index, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'))} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm" />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder={t('labelEnPlaceholder')} value={input.label.en} onChange={e => handleFormInputLabelChange(index, 'en', e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm" />
                                    <input type="text" placeholder={t('labelArPlaceholder')} value={input.label.ar} onChange={e => handleFormInputLabelChange(index, 'ar', e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm text-right" />
                                </div>
                                
                                <select value={input.type} onChange={e => handleFormInputChange(index, 'type', e.target.value as FormInputType)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-1 focus:ring-primary-500 text-sm">
                                    <option value="text">Text</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="date">Date</option>
                                    <option value="file">File</option>
                                    <option value="select">Select</option>
                                </select>

                                {input.type === 'select' && (
                                    <div className="pl-4 mt-2 border-l-2 border-primary-200 dark:border-gray-600 space-y-2">
                                        <h5 className="font-medium text-sm text-primary-600">{t('options')}</h5>
                                        {input.options?.map((option, optionIndex) => (
                                            <div key={optionIndex} className="p-2 border dark:border-gray-700 rounded-md space-y-2 bg-white dark:bg-gray-700 relative">
                                                <button type="button" onClick={() => handleRemoveOption(index, optionIndex)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                <input type="text" placeholder={t('optionValuePlaceholder')} value={option.value} onChange={e => handleOptionChange(index, optionIndex, 'value', e.target.value)} className="w-full p-1.5 border rounded-md text-xs dark:bg-gray-800 dark:border-gray-600" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" placeholder={t('labelEnPlaceholder')} value={option.label.en} onChange={e => handleOptionLabelChange(index, optionIndex, 'en', e.target.value)} className="w-full p-1.5 border rounded-md text-xs dark:bg-gray-800 dark:border-gray-600" />
                                                    <input type="text" placeholder={t('labelArPlaceholder')} value={option.label.ar} onChange={e => handleOptionLabelChange(index, optionIndex, 'ar', e.target.value)} className="w-full p-1.5 border rounded-md text-xs dark:bg-gray-800 dark:border-gray-600 text-right" />
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddOption(index)} className="text-xs text-primary-600 hover:underline font-semibold flex items-center gap-1"><Plus size={12}/> {t('addOption')}</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={handleAddFormInput} className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 text-sm font-semibold">
                            <Plus size={16}/> {t('addFormInput')}
                        </button>
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('existingServices')}</h3>
                    {selectedServices.length > 0 && (
                        <button 
                            onClick={handleDeleteSelectedServices}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                        >
                            <Trash2 size={16} />
                            {t('deleteSelected')} ({selectedServices.length})
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {(['all', ...Object.values(ServiceCategory)] as const).map((category) => {
                        const isActive = filterCategory === category;
                        const translationKey = category === 'all' ? 'allCategories' : category;
                        return (
                            <button
                                key={category}
                                onClick={() => setFilterCategory(category)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 border
                                    ${isActive
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                {t(translationKey as keyof Translations)}
                            </button>
                        );
                    })}
                </div>

                 {loadingServices ? <div className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></div> : serviceError ? <p className="text-red-500">{serviceError}</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            ref={selectAllCheckboxRef}
                                            onChange={handleSelectAllToggle}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4">{t('serviceName')}</th>
                                    <th className="px-6 py-4">{t('category')}</th>
                                    <th className="px-6 py-4">{t('subCategory')}</th>
                                    <th className="px-6 py-4 text-center">{t('usage')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4 text-center">
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
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{service.title[language]}</td>
                                        <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-300">{t(service.category as keyof Translations)}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{service.subCategory[language]}</td>
                                        <td className="px-6 py-4 text-center font-mono text-primary-600 font-bold">{service.usageCount || 0}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleRunClick(service)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors" title={t('run')}><Play size={16} /></button>
                                                <button onClick={() => handleEditServiceClick(service)} className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 p-1.5 rounded-lg transition-colors" title={t('edit')}><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors" title={t('delete')}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                        <CreditCard className="text-primary-500" /> {t('subscriptionManagement')}
                    </h2>
                     <button
                        onClick={() => {
                            setSelectedUserForAction(null);
                            setIsGrantModalOpen(true);
                        }}
                        className="bg-green-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus size={18}/> {t('grantSubscription')}
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-4">{t('email')}</th>
                                    <th className="px-6 py-4">{t('currentPlan')}</th>
                                    <th className="px-6 py-4">{t('status')}</th>
                                    <th className="px-6 py-4">{t('tokenBalance')}</th>
                                    <th className="px-6 py-4">{t('endsOn')}</th>
                                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingSubs ? (
                                    <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></td></tr>
                                ) : subError ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-red-500">{subError}</td></tr>
                                ) : usersWithSub.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {user.subscription ? (
                                                 <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user.subscription.isManual ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                    {getPlanName(user.subscription.planId)}
                                                </span>
                                            ) : <span className="text-gray-400 italic text-xs">{t('noSubscription')}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                             {user.subscription ? (
                                                <span className="capitalize px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{user.subscription.status}</span>
                                             ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{user.tokenBalance?.toLocaleString() ?? 0}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                            {user.subscription ? new Date(user.subscription.current_period_end * 1000).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex items-center justify-end gap-2">
                                                {user.subscription?.isManual ? (
                                                    <button onClick={() => handleRevokeSubscription(user.id, user.subscription!.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md text-xs font-bold transition-colors">{t('revoke')}</button>
                                                ) : user.subscription && user.stripeId ? (
                                                    <a href={`https://dashboard.stripe.com/customers/${user.stripeId}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1 rounded-md text-xs font-bold transition-colors">{t('manageInStripe')}</a>
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
        );
    };

    const renderPlanManagementContent = () => (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Star className="text-primary-500" /> {t('planManagement')}
                </h2>
                <button
                    onClick={handleAddPlanClick}
                    className="bg-primary-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 flex items-center gap-2 transition-all"
                >
                    <Plus size={18}/> {t('addNewPlan')}
                </button>
            </div>
            
            {showPlanForm && editingPlan && (
                <div className="animate-fade-in-down">
                    <PlanForm 
                        plan={editingPlan}
                        onSave={handleSavePlan}
                        onCancel={handleCancelPlanEdit}
                        isEditing={!!plans.find(p => p.id === editingPlan.id)}
                    />
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                            <tr>
                                <th className="px-6 py-4">{t('plan')}</th>
                                <th className="px-6 py-4">{t('planPriceEn')}</th>
                                <th className="px-6 py-4">{t('tokens')}</th>
                                <th className="px-6 py-4">{t('status')}</th>
                                <th className="px-6 py-4 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loadingPlans ? (
                                <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></td></tr>
                            ) : planError ? (
                                <tr><td colSpan={5} className="text-center py-10 text-red-500">{planError}</td></tr>
                            ) : plans.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">{t('noPlansFound')}</td></tr>
                            ) : plans.map(plan => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className='flex items-center gap-2'>
                                        {plan.isPopular && <Star size={16} className="text-yellow-400 fill-current" />}
                                        <span className='font-bold text-gray-900 dark:text-white'>{plan.title[language]}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono mt-1 block">{plan.id}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{plan.price[language]}</td>
                                    <td className="px-6 py-4 font-mono text-primary-600 font-bold">{plan.tokens.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex w-fit items-center gap-1 capitalize ${plan.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            {plan.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
                                            {t(plan.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => handleTogglePlanStatus(plan)} className={`p-1.5 rounded-lg transition-colors ${plan.status === 'active' ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`} title={plan.status === 'active' ? t('deactivate') : t('activate')}>
                                                {plan.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                            <button onClick={() => handleEditPlanClick(plan)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors" title={t('edit')}><Edit size={18} /></button>
                                            <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors" title={t('delete')}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>
    );

    const renderLandingPageGenerator = () => (
        <div className="max-w-5xl mx-auto space-y-6">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                <LayoutTemplate className="text-primary-500" /> Landing Page Generator
             </h2>
             
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="inline-block p-6 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600 text-primary-600 dark:text-primary-400 mb-6 shadow-inner">
                    <Wand2 size={64} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Generate a Full Landing Page with AI</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
                    Enter a topic (e.g., "Divorce Services" or "Corporate Law Firm"), and the AI will generate titles, subtitles, and 9 distinct features with appropriate icons and colors.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={landingPagePrompt}
                        onChange={(e) => setLandingPagePrompt(e.target.value)}
                        placeholder="Enter topic (e.g., Real Estate Law Services)"
                        className="flex-grow px-5 py-4 text-lg border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                    />
                    <button
                        onClick={handleGenerateLandingPage}
                        disabled={isGeneratingLanding || !landingPagePrompt.trim()}
                        className="px-8 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 transition-all min-w-[160px]"
                    >
                        {isGeneratingLanding ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                        Generate
                    </button>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Current Status:</span>
                        {siteSettings.landingPageConfig ? (
                            <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100">Custom Page Active</span>
                        ) : (
                            <span className="text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full">Default Page Active</span>
                        )}
                    </div>
                    
                    {siteSettings.landingPageConfig && (
                        <button 
                            onClick={handleClearLandingConfig}
                            className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <RefreshCw size={16} /> Reset to Default
                        </button>
                    )}
                </div>
             </div>
        </div>
    );

    const renderMarketingContent = () => {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                     <BarChart className="text-primary-500"/>
                     {t('marketing')}
                </h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">{t('adPixelsDesc')}</p>
                    
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('googleTagId')}</label>
                                <input 
                                    type="text" 
                                    placeholder="G-XXXXXXXXXX" 
                                    value={siteSettings.adPixels?.googleTagId || ''} 
                                    onChange={e => handleAdPixelChange('googleTagId', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none text-left ltr" 
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('facebookPixelId')}</label>
                                <input 
                                    type="text" 
                                    placeholder="123456789012345" 
                                    value={siteSettings.adPixels?.facebookPixelId || ''} 
                                    onChange={e => handleAdPixelChange('facebookPixelId', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none text-left ltr"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('snapchatPixelId')}</label>
                                <input 
                                    type="text" 
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                                    value={siteSettings.adPixels?.snapchatPixelId || ''} 
                                    onChange={e => handleAdPixelChange('snapchatPixelId', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none text-left ltr"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('tiktokPixelId')}</label>
                                <input 
                                    type="text" 
                                    placeholder="Cxxxxxxxxxxxxx" 
                                    value={siteSettings.adPixels?.tiktokPixelId || ''} 
                                    onChange={e => handleAdPixelChange('tiktokPixelId', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none text-left ltr"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                         <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                             <button type="submit" disabled={savingSettings} className="bg-primary-600 text-white font-bold py-2.5 px-8 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all">
                                {savingSettings && <Loader2 className="animate-spin" size={20} />}
                                {t('saveSettings')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
    
    const renderSiteSettingsContent = () => {
        if (loadingSettings) return <div className="text-center py-10"><Loader2 className="animate-spin inline-block text-primary-500" size={32}/></div>;

        return (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                    <Cog className="text-primary-500" /> {t('siteSettings')}
                 </h2>
                 <form onSubmit={handleSaveSettings} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                    {/* Site Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('siteNameEn')}</label>
                            <input type="text" value={siteSettings.siteName.en} onChange={e => handleNestedSiteSettingsChange('siteName', Language.EN, e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('siteNameAr')}</label>
                            <input type="text" value={siteSettings.siteName.ar} onChange={e => handleNestedSiteSettingsChange('siteName', Language.AR, e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                        </div>
                    </div>

                    {/* Logo & Favicon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('logo')}</label>
                            <div className="flex items-center gap-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="Logo" className="object-contain h-full w-full" /> : <span className="text-xs text-gray-500">None</span>}
                                </div>
                                <div className="flex-grow">
                                    <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors inline-block">
                                        {t('change')}
                                        <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                    {logoFile && <span className="text-xs text-gray-500 block mt-1 truncate max-w-[200px]">{logoFile.name}</span>}
                                </div>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('favicon')}</label>
                            <div className="flex items-center gap-4 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                                 <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                     {siteSettings.faviconUrl ? <img src={siteSettings.faviconUrl} alt="Favicon" className="object-contain h-8 w-8" /> : <span className="text-xs text-gray-500">None</span>}
                                 </div>
                                <div className="flex-grow">
                                    <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors inline-block">
                                        {t('change')}
                                        <input type="file" accept="image/x-icon, image/png, image/svg+xml" className="hidden" onChange={e => setFaviconFile(e.target.files ? e.target.files[0] : null)} />
                                    </label>
                                    {faviconFile && <span className="text-xs text-gray-500 block mt-1 truncate max-w-[200px]">{faviconFile.name}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEO */}
                    <div>
                        <h3 className="text-lg font-bold border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-white">SEO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('metaDescriptionEn')}</label>
                                <textarea value={siteSettings.metaDescription.en} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.EN, e.target.value)} rows={3} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('metaDescriptionAr')}</label>
                                <textarea value={siteSettings.metaDescription.ar} onChange={e => handleNestedSiteSettingsChange('metaDescription', Language.AR, e.target.value)} rows={3} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('seoKeywordsEn')}</label>
                                <input type="text" placeholder="e.g., law, legal, ai" value={siteSettings.seoKeywords.en} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.EN, e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('seoKeywordsAr')}</label>
                                <input type="text" placeholder="مثال: قانون, محاماة, ذكاء اصطناعي" value={siteSettings.seoKeywords.ar} onChange={e => handleNestedSiteSettingsChange('seoKeywords', Language.AR, e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 outline-none focus:ring-2 focus:ring-primary-500 text-right" />
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Mode */}
                    <div>
                         <h3 className="text-lg font-bold border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-white">{t('maintenanceMode')}</h3>
                         <label className="flex items-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 cursor-pointer">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={siteSettings.isMaintenanceMode} onChange={e => handleSiteSettingsChange('isMaintenanceMode', e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                            </div>
                            <span className="ml-3 rtl:mr-3 font-medium text-amber-900 dark:text-amber-200">{t('enableMaintenance')}</span>
                        </label>
                    </div>

                    {/* Save Button */}
                     <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                         <button type="submit" disabled={savingSettings} className="bg-primary-600 text-white font-bold py-2.5 px-8 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all">
                            {savingSettings && <Loader2 className="animate-spin" size={20} />}
                            {t('saveSettings')}
                        </button>
                    </div>
                 </form>
            </div>
        );
    }

    // Render Support Content
    const renderSupportContent = () => (
        <div className="h-[calc(100vh-120px)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex">
            
            {/* Sidebar / List */}
            <div className={`${selectedTicket && supportView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                    <h3 className="font-bold text-gray-800 dark:text-white">{t('support')}</h3>
                    <button onClick={() => setSupportView('settings')} className="text-gray-500 hover:text-primary-600 transition-colors">
                        <Cog size={20} />
                    </button>
                </div>
                
                {supportView === 'settings' ? (
                    <div className="p-4 space-y-4 flex-col flex h-full">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">{t('manageTicketTypes')}</h4>
                            <button onClick={() => setSupportView('list')} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newTicketType} 
                                onChange={e => setNewTicketType(e.target.value)} 
                                placeholder={t('typePlaceholder')}
                                className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                            />
                            <button onClick={handleAddTicketType} className="bg-primary-600 text-white p-2 rounded-lg shadow-sm hover:bg-primary-700"><Plus size={20}/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 mt-2">
                            {(siteSettings.ticketTypes || []).map((type, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-sm font-medium">{type}</span>
                                    <button onClick={() => handleRemoveTicketType(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {loadingTickets ? (
                            <div className="p-10 text-center"><Loader2 className="animate-spin inline-block text-primary-500" /></div>
                        ) : (
                            tickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => { setSelectedTicket(ticket); setSupportView('chat'); }}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-semibold text-sm truncate ${ticket.unreadAdmin ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{ticket.subject}</span>
                                        {ticket.unreadAdmin && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
                                        <span className="font-medium text-primary-600 dark:text-primary-400">{ticket.userEmail}</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : ticket.status === 'answered' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {t(ticket.status)}
                                            </span>
                                            <span>{new Date(ticket.lastUpdate?.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className={`${!selectedTicket || supportView !== 'chat' ? 'hidden md:flex' : 'flex'} flex-col flex-grow bg-gray-50 dark:bg-gray-900 relative`}>
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => {setSelectedTicket(null); setSupportView('list');}} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <ChevronRight size={20} className="rtl:hidden"/>
                                    <ChevronLeft size={20} className="ltr:hidden"/>
                                </button>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span>{selectedTicket.userEmail}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span>{selectedTicket.type}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        if(window.confirm("Close ticket?")) updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: 'closed' });
                                    }}
                                    className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.senderRole === 'admin' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'}`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-2 opacity-70 text-right font-medium`}>
                                            {new Date(msg.createdAt?.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleAdminReply} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <input 
                                type="text" 
                                value={replyMessage} 
                                onChange={e => setReplyMessage(e.target.value)} 
                                placeholder={t('typeReply')}
                                className="flex-grow px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                            <button type="submit" disabled={!replyMessage.trim()} className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:shadow-none">
                                <Send size={20} className="ltr:rotate-0 rtl:rotate-180"/>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center flex-col gap-4 text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                             <MessageSquare size={40} />
                        </div>
                        <p className="font-medium">{t('selectUser')}</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 font-sans">
             <div className="max-w-7xl mx-auto">
                 {/* Admin Header */}
                 <div className="mb-8">
                     <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('adminPanel')}</h1>
                     <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, Admin. Manage your platform efficiently.</p>
                 </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <nav className="sticky top-24 space-y-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                             <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2 mt-1">Main Menu</p>
                            {[
                                { id: 'users', label: t('userManagement'), icon: Users },
                                { id: 'subscriptions', label: t('subscriptionManagement'), icon: CreditCard },
                                { id: 'support', label: t('support'), icon: LifeBuoy },
                                { id: 'plans', label: t('planManagement'), icon: Star },
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)} 
                                    className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-gradient-to-r from-primary-600 to-teal-500 text-white shadow-md shadow-primary-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 rtl:ml-3 rtl:mr-0" strokeWidth={activeTab === item.id ? 2.5 : 2} /> 
                                    {item.label}
                                </button>
                            ))}
                            
                            <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
                            <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2 mt-2">Configuration</p>

                            {[
                                { id: 'services', label: t('manageServices'), icon: PlusSquare },
                                { id: 'landing', label: 'Landing Page', icon: LayoutTemplate },
                                { id: 'settings', label: t('siteSettings'), icon: Cog },
                                { id: 'marketing', label: t('marketing'), icon: BarChart },
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)} 
                                    className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-gradient-to-r from-primary-600 to-teal-500 text-white shadow-md shadow-primary-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 rtl:ml-3 rtl:mr-0" strokeWidth={activeTab === item.id ? 2.5 : 2} /> 
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    
                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="animate-fade-in-up">
                            {activeTab === 'users' && renderUserManagementContent()}
                            {activeTab === 'services' && renderServiceManagementContent()}
                            {activeTab === 'subscriptions' && renderSubscriptionManagementContent()}
                            {activeTab === 'plans' && renderPlanManagementContent()}
                            {activeTab === 'landing' && renderLandingPageGenerator()}
                            {activeTab === 'settings' && renderSiteSettingsContent()}
                            {activeTab === 'marketing' && renderMarketingContent()}
                            {activeTab === 'support' && renderSupportContent()}
                        </div>
                    </main>
                </div>
            </div>

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
