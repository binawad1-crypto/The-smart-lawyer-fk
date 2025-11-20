
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, Wand2, Send, Copy, Check, Printer, Volume2, X, ArrowLeft, ArrowRight, File, ZoomIn, ZoomOut, MapPin, Sparkles, FileText, LayoutGrid, Search, Star, Maximize2, Minimize2, Settings2, Sliders, ChevronRight as ChevronRightIcon, Gavel, Shield, Building2, Users, Scale, Briefcase } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { Service, ServiceCategory, Translations, Language } from '../types';
import { collection, getDocs, query, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { runGemini } from '../services/geminiService';
import { iconMap } from '../constants';

interface DashboardPageProps {
    onNavigate: (view: 'dashboard' | 'admin' | 'profile' | 'subscriptions') => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [errorServices, setErrorServices] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [retryMessage, setRetryMessage] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    
    // Voice Settings
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [speechRate, setSpeechRate] = useState(1);
    const [speechPitch, setSpeechPitch] = useState(1);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Search and Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [outputLanguage, setOutputLanguage] = useState<Language>(language);
    const [favorites, setFavorites] = useState<string[]>([]);
    
    // Layout State
    const [isFullWidth, setIsFullWidth] = useState(true);

    useEffect(() => {
        setOutputLanguage(language);
    }, [language]);

    // Load favorites from local storage
    useEffect(() => {
        const storedFavs = localStorage.getItem('favoriteServices');
        if (storedFavs) {
            try {
                setFavorites(JSON.parse(storedFavs));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Load Voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        // Reset selected voice when language changes if it doesn't match
        if (selectedVoice && !selectedVoice.lang.startsWith(outputLanguage === Language.AR ? 'ar' : 'en')) {
            setSelectedVoice(null);
        }
    }, [outputLanguage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowVoiceSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            setErrorServices(null);
            try {
                const servicesCollectionRef = collection(db, 'services');
                const servicesSnapshot = await getDocs(servicesCollectionRef);
                const servicesList = servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
                
                servicesList.sort((a, b) => {
                    // Sort by Title EN to keep it consistent within categories
                    return (a.title.en || '').localeCompare(b.title.en || '');
                });

                setServices(servicesList);
            } catch (err) {
                console.error("Error fetching services: ", err);
                setErrorServices(t('failedToLoadServices'));
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [t, language]);

    useEffect(() => {
        // Cleanup speech synthesis on component unmount
        return () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    const filteredServices = useMemo(() => {
        let filtered = services;

        // 1. Filter by Category
        if (selectedCategory === 'favorites') {
            filtered = filtered.filter(s => favorites.includes(s.id));
        } else if (selectedCategory !== 'all') {
            filtered = filtered.filter(s => s.category === selectedCategory);
        }

        // 2. Filter by Search Query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                (s.title.en && s.title.en.toLowerCase().includes(query)) || 
                (s.title.ar && s.title.ar.toLowerCase().includes(query)) ||
                (s.description.en && s.description.en.toLowerCase().includes(query)) ||
                (s.description.ar && s.description.ar.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [services, selectedCategory, searchQuery, favorites]);

    const categories = [
        { id: 'all', label: t('allCategories'), icon: LayoutGrid, color: 'text-gray-500' },
        { id: 'favorites', label: t('favorites'), icon: Star, color: 'text-yellow-500' },
        { id: ServiceCategory.LitigationAndPleadings, label: t('litigationAndPleadings'), icon: Gavel, color: 'text-blue-500' },
        { id: ServiceCategory.SpecializedConsultations, label: t('specializedConsultations'), icon: Briefcase, color: 'text-purple-500' },
        { id: ServiceCategory.InvestigationsAndCriminal, label: t('investigationsAndCriminal'), icon: Shield, color: 'text-red-500' },
        { id: ServiceCategory.CorporateAndCompliance, label: t('corporateAndCompliance'), icon: Building2, color: 'text-emerald-500' },
        { id: ServiceCategory.CreativeServices, label: t('creativeServices'), icon: Wand2, color: 'text-pink-500' }
    ];

    const toggleFavorite = (e: React.MouseEvent, serviceId: string) => {
        e.stopPropagation(); // Prevent opening the service when clicking star
        const newFavs = favorites.includes(serviceId)
            ? favorites.filter(id => id !== serviceId)
            : [...favorites, serviceId];
        
        setFavorites(newFavs);
        localStorage.setItem('favoriteServices', JSON.stringify(newFavs));
    };

    const handleExecutePrompt = async () => {
        if (!prompt.trim()) return;

        if (currentUser && !currentUser.isAdmin && (currentUser.tokenBalance || 0) <= 0) {
            setResult(t('outOfTokens'));
            return;
        }

        setIsGenerating(true);
        setResult('');
        setRetryMessage('');
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        const handleRetry = (attempt: number, maxRetries: number) => {
            const message = t('modelIsBusyRetrying').replace('${attempt}', String(attempt)).replace('${maxRetries}', String(maxRetries));
            setRetryMessage(message);
        };

        try {
            const languageInstruction = `\n\nIMPORTANT: Provide the response strictly in ${outputLanguage === 'ar' ? 'Arabic' : 'English'} language.`;
            const userLocation = currentUser?.location;
            const locationContext = userLocation ? `\n\nCONTEXT: The user is located in ${userLocation}. Please answer based on the laws and regulations of ${userLocation} unless specified otherwise.` : '';
            
            const finalPrompt = prompt + locationContext + languageInstruction;
            
            const response = await runGemini('gemini-2.5-flash', finalPrompt, undefined, handleRetry);
            setResult(response.text);

            if (currentUser && !currentUser.isAdmin) {
                const tokensConsumed = response.usageMetadata?.totalTokens || 0;
                if (tokensConsumed > 0) {
                    const userRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userRef, {
                        tokenBalance: increment(-tokensConsumed),
                        tokensUsed: increment(tokensConsumed)
                    });
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setResult(`${t('serviceSavedError')}: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
            setRetryMessage('');
        }
    };

    const handleServiceClick = (service: Service) => {
        setSelectedService(service);
        setFormData({});
        setResult('');
    };

    const handleBackToServices = () => {
        setSelectedService(null);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'file') {
            const files = (e.target as HTMLInputElement).files;
            setFormData(prev => ({ ...prev, [name]: files ? files[0] : null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleServiceFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService) return;

        if (currentUser && !currentUser.isAdmin && (currentUser.tokenBalance || 0) <= 0) {
            setResult(t('outOfTokens'));
            return;
        }
    
        setIsGenerating(true);
        setResult('');
        setRetryMessage('');
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    
        const constructPromptForService = () => {
            if (!selectedService) return '';
            let prompt = `Service: ${selectedService.title.en}.\n`;
            for (const key in formData) {
                if (key.includes('file')) continue;
                const inputConfig = selectedService.formInputs.find(i => i.name === key);
                prompt += `${inputConfig?.label.en || key}: ${formData[key]}\n`;
            }
            const userLocation = currentUser?.location;
            if (userLocation) {
                prompt += `\nCONTEXT: The user is located in ${userLocation}. Apply the laws and regulations of ${userLocation}.`;
            }
            prompt += `\n\nIMPORTANT: The output must be in ${outputLanguage === Language.AR ? 'Arabic' : 'English'} language.`;
            return prompt;
        };
    
        const promptText = constructPromptForService();
        const fileInput = selectedService.formInputs.find(i => i.type === 'file');
        const file = fileInput ? formData[fileInput.name] as File : undefined;
    
        const handleRetry = (attempt: number, maxRetries: number) => {
            const message = t('modelIsBusyRetrying').replace('${attempt}', String(attempt)).replace('${maxRetries}', String(maxRetries));
            setRetryMessage(message);
        };
    
        try {
            const response = await runGemini(selectedService.geminiModel, promptText, file, handleRetry, selectedService.geminiConfig);
            setResult(response.text);

            const isSuccess = !!response.text;
    
            if (isSuccess && selectedService?.id) {
                try {
                    const serviceRef = doc(db, 'services', selectedService.id);
                    await updateDoc(serviceRef, {
                        usageCount: increment(1)
                    });
                } catch (err) {
                    console.error("Failed to update service usage count:", err);
                }

                if (currentUser && !currentUser.isAdmin) {
                    const tokensConsumed = response.usageMetadata?.totalTokens || 0;
                     if (tokensConsumed > 0) {
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                            tokenBalance: increment(-tokensConsumed),
                            tokensUsed: increment(tokensConsumed)
                        });
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setResult(`${t('serviceSavedError')}: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
            setRetryMessage('');
        }
    };

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Print Result</title>
                  <style>
                    body { font-family: 'Noto Naskh Arabic', 'Cairo', sans-serif; direction: ${language === 'ar' ? 'rtl' : 'ltr'}; padding: 20px; }
                    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
                  </style>
                </head>
                <body><pre>${result}</pre></body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const handleListen = () => {
        if (!result) return;
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(result);
            utterance.lang = outputLanguage === Language.AR ? 'ar-SA' : 'en-US';
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            utterance.rate = speechRate;
            utterance.pitch = speechPitch;
            utterance.onend = () => setIsSpeaking(false);
            speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    const handleClear = () => {
        setResult('');
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleIncreaseFont = () => setFontSize(prev => Math.min(prev + 2, 32));
    const handleDecreaseFont = () => setFontSize(prev => Math.max(prev - 2, 12));

    const renderOutputLanguageSelector = (showLabel = true) => (
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
                {showLabel && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{t('outputLanguage')}</span>}
                <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setOutputLanguage(Language.AR)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${outputLanguage === Language.AR ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        {t('arabic')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOutputLanguage(Language.EN)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${outputLanguage === Language.EN ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        {t('english')}
                    </button>
                </div>
            </div>
        </div>
    );

    // -------------------- FRAME 1: IDENTITY & NAVIGATION (SIDEBAR) --------------------
    const renderSidebar = () => (
        // Force dark theme styling for this sidebar even in light mode
        <div className="flex flex-col h-full rounded-2xl bg-slate-900 shadow-lg border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-teal-600 to-teal-800 text-white shrink-0">
                 <h2 className="text-2xl font-black tracking-tight mb-1 leading-tight">
                    {t('appName')}
                </h2>
                <p className="text-xs text-teal-100 font-medium opacity-90">
                    {t('appSubtitle')}
                </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-800">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 rtl:right-3 rtl:left-auto" size={16} />
                    <input
                        type="text"
                        placeholder={t('searchServicePlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        // Use dark mode styles for input
                        className="w-full py-2 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-xl bg-slate-800 text-slate-200 border-none focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-all placeholder-slate-500"
                    />
                </div>
            </div>

            {/* Categories Navigation */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1">
                <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الأقسام' : 'Categories'}
                </p>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedService(null); // Reset service when category changes
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                            selectedCategory === cat.id
                                ? 'bg-teal-900/30 text-teal-400 shadow-sm' // Dark mode active style
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' // Dark mode inactive style
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-slate-800' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                             <cat.icon size={16} className={selectedCategory === cat.id ? 'text-teal-400' : cat.color} />
                        </div>
                        <span className="flex-grow text-left rtl:text-right">{cat.label}</span>
                        {selectedCategory === cat.id && <ChevronRightIcon size={14} className="rtl:rotate-180 text-teal-500" />}
                    </button>
                ))}
            </div>
        </div>
    );

    // -------------------- FRAME 2: SERVICES & INPUT (MIDDLE) --------------------
    const renderMainContent = () => (
        <div className="flex flex-col h-full rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden relative">
             {/* Header for Main Content */}
             <div className="h-16 flex items-center px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 shrink-0 justify-between">
                {selectedService ? (
                    <div className="flex items-center gap-3 w-full">
                         <button onClick={handleBackToServices} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
                            {language === 'ar' ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                        </button>
                        <div>
                             <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{selectedService.title[language]}</h3>
                        </div>
                    </div>
                ) : (
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                        {categories.find(c => c.id === selectedCategory)?.label}
                    </h3>
                )}
             </div>

             <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                 {selectedService ? (
                     /* Active Service Form */
                     <form onSubmit={handleServiceFormSubmit} className="space-y-5 animate-fade-in-up">
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-300">
                             {selectedService.description[language]}
                         </div>
                         
                         <div className="space-y-4">
                             {selectedService.formInputs.map(input => (
                                 <div key={input.name}>
                                     <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{input.label[language]}</label>
                                     {input.type === 'textarea' && <textarea name={input.name} onChange={handleInputChange} rows={4} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm" />}
                                     {input.type === 'text' && <input type="text" name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm" />}
                                     {input.type === 'date' && <input type="date" name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm" />}
                                     {input.type === 'select' && (
                                         <select name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm">
                                             <option value="">{`Select ${input.label[language]}`}</option>
                                             {input.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[language]}</option>)}
                                         </select>
                                     )}
                                     {input.type === 'file' && (
                                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer relative">
                                             <input id={input.name} name={input.name} type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleInputChange} />
                                             <div className="space-y-1 text-center">
                                                 <File className="mx-auto h-10 w-10 text-gray-400 group-hover:text-teal-500 transition-colors"/>
                                                 <div className="flex text-xs text-gray-600 dark:text-gray-400 justify-center">
                                                     <span className="font-bold text-teal-600 dark:text-teal-400">{t('uploadFile')}</span>
                                                 </div>
                                                 <p className="text-[10px] text-gray-500 dark:text-gray-500">{formData[input.name] ? (formData[input.name] as File).name : t('noFileSelected')}</p>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ))}
                         </div>
                         
                         <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900 pt-4 pb-2">
                            <div className="flex items-center gap-3">
                                <button type="submit" disabled={isGenerating} className="flex-grow bg-teal-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20 transform active:scale-95">
                                    {isGenerating && <Loader2 className="animate-spin" size={20} />}
                                    {t('executeTask')}
                                </button>
                                {renderOutputLanguageSelector(false)}
                            </div>
                         </div>
                     </form>
                 ) : (
                     /* Services Grid */
                     <>
                        {loadingServices ? (
                            <div className="text-center p-12"><Loader2 className="animate-spin inline-block text-teal-500" size={32} /></div>
                        ) : filteredServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-full mb-4">
                                    <Search size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">{t('noServicesFound')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                                {filteredServices.map(service => {
                                    const Icon = iconMap[service.icon] || FileText;
                                    const isFav = favorites.includes(service.id);
                                    // Distinct color frame logic
                                    const categoryColor = categories.find(c => c.id === service.category)?.color || 'text-gray-500';
                                    const borderColor = categoryColor.replace('text-', 'border-'); // crude mapping, ideally separate
                                    
                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => handleServiceClick(service)}
                                            className={`group flex flex-col text-right rtl:text-right ltr:text-left p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border-l-4 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${
                                                // Dynamic left border color based on category
                                                service.category === ServiceCategory.LitigationAndPleadings ? 'border-l-blue-500' :
                                                service.category === ServiceCategory.SpecializedConsultations ? 'border-l-purple-500' :
                                                service.category === ServiceCategory.InvestigationsAndCriminal ? 'border-l-red-500' :
                                                service.category === ServiceCategory.CorporateAndCompliance ? 'border-l-emerald-500' :
                                                'border-l-pink-500'
                                            } border-t border-r border-b border-gray-100 dark:border-gray-700`}
                                        >
                                            <div className="flex items-start justify-between w-full mb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 bg-gray-50 dark:bg-slate-700 ${categoryColor}`}>
                                                    <Icon size={20} strokeWidth={2} />
                                                </div>
                                                <div 
                                                    role="button"
                                                    onClick={(e) => toggleFavorite(e, service.id)}
                                                    className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                >
                                                    <Star size={14} fill={isFav ? "currentColor" : "none"} />
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug w-full">
                                                {service.title[language] || service.title['en']}
                                            </h3>
                                            
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 w-full opacity-80">
                                                {service.description[language] || service.description['en']}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                     </>
                 )}
             </div>
        </div>
    );

    // -------------------- FRAME 3: OUTPUT & CHAT (LEFT) --------------------
    const renderOutputPanel = () => (
        <div className="flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
             <div className="h-16 flex items-center px-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0 justify-between">
                <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500"/>
                    {t('results')}
                </h3>
                <div className="flex items-center gap-1">
                    {/* Tools */}
                    <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1 mr-2">
                         <button onClick={handleIncreaseFont} className="hover:bg-white dark:hover:bg-slate-600 rounded p-1 transition-colors text-gray-600 dark:text-gray-300"><ZoomIn size={14} /></button>
                         <button onClick={handleDecreaseFont} className="hover:bg-white dark:hover:bg-slate-600 rounded p-1 transition-colors text-gray-600 dark:text-gray-300"><ZoomOut size={14} /></button>
                    </div>
                    <button onClick={handleListen} className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 ${isSpeaking ? 'text-green-500' : 'text-gray-400'}`}><Volume2 size={16} /></button>
                    <button onClick={copyToClipboard} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">{isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}</button>
                    <button onClick={handlePrint} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"><Printer size={16} /></button>
                    <button onClick={handleClear} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
             </div>

             {/* Output Content */}
             <div className="flex-grow overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 relative p-4">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
                            <Loader2 className="animate-spin text-teal-600 relative z-10" size={40} />
                        </div>
                        <p className="text-gray-500 text-center font-medium mt-4 animate-pulse">{retryMessage || t('generatingResponse')}</p>
                    </div>
                ) : result ? (
                    <div className="prose dark:prose-invert max-w-none">
                        <pre 
                            className="whitespace-pre-wrap font-naskh leading-loose text-left rtl:text-right bg-transparent p-0 m-0 text-gray-800 dark:text-gray-200"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {result}
                        </pre>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={36} className="text-gray-400"/>
                        </div>
                        <p className="text-gray-400 font-medium text-sm max-w-[200px]">{t('resultPlaceholder')}</p>
                    </div>
                )}
             </div>

             {/* Prompt Input */}
             <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('typeYourRequest')}
                        className="w-full h-24 p-3 ltr:pl-3 rtl:pr-3 resize-none border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-gray-400 text-right text-sm shadow-sm"
                    />
                    <button
                        onClick={handleExecutePrompt}
                        disabled={isGenerating || !prompt.trim()}
                        className="absolute bottom-3 ltr:right-3 rtl:left-3 w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ltr:-scale-x-100" />}
                    </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                     <span className="text-[10px] text-gray-400 font-medium">{t('poweredByAI')}</span>
                     <button
                        onClick={() => setIsFullWidth(!isFullWidth)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                    >
                        {isFullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
             </div>
        </div>
    );

    return (
        <div className={`${isFullWidth ? 'w-full px-4' : 'container mx-auto px-4 sm:px-6 lg:px-8'} flex-grow flex flex-col py-6 transition-all duration-300`}>
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1920px] mx-auto ${
                isFullWidth 
                ? 'lg:h-[calc(100vh-100px)] h-auto min-h-[calc(100vh-100px)]' 
                : 'lg:h-[calc(100vh-140px)] h-auto min-h-[calc(100vh-140px)]'
            }`}>

                {/* Frame 1: Sidebar (Identity & Nav) - 20% approx (3/12) */}
                <div className="lg:col-span-3 min-h-[500px] lg:h-full">
                    {renderSidebar()}
                </div>

                {/* Frame 2: Main Content (Services/Form) - 40% approx (5/12) */}
                <div className="lg:col-span-5 min-h-[600px] lg:h-full">
                    {renderMainContent()}
                </div>

                {/* Frame 3: Output - 33% approx (4/12) */}
                <div className="lg:col-span-4 min-h-[500px] lg:h-full">
                    {renderOutputPanel()}
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
