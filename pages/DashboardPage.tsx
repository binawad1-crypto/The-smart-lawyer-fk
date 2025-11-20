
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, Wand2, Send, Copy, Check, Printer, Volume2, X, ArrowLeft, ArrowRight, File, ZoomIn, ZoomOut, MapPin, Sparkles, FileText, LayoutGrid, Search, Star, Maximize2, Minimize2, Settings2, Sliders } from 'lucide-react';
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
    const [currentView, setCurrentView] = useState<'services' | 'form'>('services');
    
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
        { id: 'all', label: t('allCategories'), icon: LayoutGrid },
        { id: 'favorites', label: t('favorites'), icon: Star }, // Added Favorites Category
        { id: ServiceCategory.LitigationAndPleadings, label: t('litigationAndPleadings') },
        { id: ServiceCategory.SpecializedConsultations, label: t('specializedConsultations') },
        { id: ServiceCategory.InvestigationsAndCriminal, label: t('investigationsAndCriminal') },
        { id: ServiceCategory.CorporateAndCompliance, label: t('corporateAndCompliance') },
        { id: ServiceCategory.CreativeServices, label: t('creativeServices') }
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
            // Inject Location Context from Profile
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
        setCurrentView('form');
        // When clicking a service, we might want to clear the previous result or keep it.
        // For now, let's clear to focus on the new task.
        setResult('');
    };

    const handleBackToServices = () => {
        setSelectedService(null);
        setCurrentView('services');
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
            // Inject Location Context from Profile
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
            
            // Set Language based on Output Language logic
            utterance.lang = outputLanguage === Language.AR ? 'ar-SA' : 'en-US';
            
            // Apply selected voice if any
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // Apply speed and pitch
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

    // -------------------- LEFT PANEL CONTENT (Services) --------------------
    const renderServiceSelectionView = () => (
        <div className="flex flex-col h-full rounded-xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900">
            {/* Top Header (Teal Gradient Background with Light Effect) */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-800 to-slate-900 p-6 flex-shrink-0 relative overflow-hidden">
                {/* Subtle Light Effect */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        {/* Title Area */}
                        <div className="text-right rtl:text-right ltr:text-left">
                            <span className="text-xs text-teal-200 font-bold flex items-center gap-2 mb-1 justify-end rtl:justify-start ltr:justify-start">
                                <Wand2 size={14} /> {t('poweredByAI')}
                            </span>
                            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">{t('legalAssistant')}</h2>
                            <p className="text-xs text-teal-100/80 mt-1">{t('appSubtitle')}</p>
                        </div>

                        {/* Search Area - Glassmorphic */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-100 rtl:right-3 rtl:left-auto" size={16} />
                            <input
                                type="text"
                                placeholder={t('searchServicePlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-teal-100/70 focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Category Tabs (Inside Header) - Glassmorphic Pills */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 backdrop-blur-sm ${
                                    selectedCategory === cat.id
                                        ? 'bg-white text-teal-900 shadow-md'
                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                }`}
                            >
                                {cat.id === 'favorites' && <Star size={12} fill={selectedCategory === 'favorites' ? 'currentColor' : 'none'} />}
                                {cat.id === 'all' && <LayoutGrid size={12}/>}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Services Grid (Light Background) */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 bg-gray-50 dark:bg-slate-900/50">
                {loadingServices ? (
                    <div className="text-center p-8"><Loader2 className="animate-spin inline-block text-primary-500" size={32} /></div>
                ) : errorServices ? (
                    <p className="text-center text-red-500 p-8">{errorServices}</p>
                ) : filteredServices.length === 0 ? (
                    <p className="text-center text-gray-500 p-8">{t('noServicesFound')}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredServices.map(service => {
                            const Icon = iconMap[service.icon] || FileText;
                            const isFav = favorites.includes(service.id);
                            return (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceClick(service)}
                                    className="group flex flex-col text-right rtl:text-right ltr:text-left p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <div className="flex items-start justify-between w-full mb-3 relative z-10">
                                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <Icon size={20} strokeWidth={2} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                role="button"
                                                onClick={(e) => toggleFavorite(e, service.id)}
                                                className={`p-1 rounded-full transition-colors ${isFav ? 'text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            >
                                                <Star size={16} fill={isFav ? "currentColor" : "none"} />
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug relative z-10 w-full">
                                        {service.title[language] || service.title['en']}
                                    </h3>
                                    
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 relative z-10 w-full opacity-80">
                                        {service.description[language] || service.description['en']}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // -------------------- RIGHT PANEL CONTENT (Output & Chat) --------------------
    
    const renderPromptInput = () => (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 relative">
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('typeYourRequest')}
                    className="w-full h-20 max-h-32 p-3 ltr:pl-12 rtl:pr-12 resize-none border-0 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-gray-400 text-right text-sm"
                />
                <button
                    onClick={handleExecutePrompt}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute bottom-3 ltr:left-3 rtl:right-3 w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all shadow-md"
                    aria-label="Send"
                >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ltr:-scale-x-100" />}
                </button>
            </div>
            <div className="flex justify-between items-center mt-2">
                {renderOutputLanguageSelector(false)}
                <button
                    onClick={() => setIsFullWidth(!isFullWidth)}
                    className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    title={isFullWidth ? t('standardWidth') : t('fullWidth')}
                >
                    {isFullWidth ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>
        </div>
    );

    const renderServiceFormView = () => (
        selectedService && (
            <div className="flex flex-col h-full bg-white dark:bg-slate-800/50 rounded-xl p-6">
                <div className="flex items-center mb-4 flex-shrink-0">
                    <button onClick={handleBackToServices} className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <div className="mx-3 text-right rtl:text-left">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedService.title[language] || selectedService.title['en']}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedService.description[language] || selectedService.description['en']}</p>
                    </div>
                </div>
                 <div className="border-t border-gray-200 dark:border-slate-700 mb-4"></div>
                <form onSubmit={handleServiceFormSubmit} className="space-y-4 flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        {selectedService.formInputs.map(input => (
                            <div key={input.name}>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 uppercase">{input.label[language]}</label>
                                {input.type === 'textarea' && <textarea name={input.name} onChange={handleInputChange} rows={4} className="w-full p-3 text-sm border-0 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'text' && <input type="text" name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border-0 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'date' && <input type="date" name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border-0 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'select' && (
                                    <select name={input.name} onChange={handleInputChange} className="w-full p-3 text-sm border-0 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                                        <option value="">{`Select ${input.label[language]}`}</option>
                                        {input.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[language]}</option>)}
                                    </select>
                                )}
                                {input.type === 'file' && (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                                        <div className="space-y-1 text-center">
                                            <File className="mx-auto h-10 w-10 text-gray-400"/>
                                            <div className="flex text-xs text-gray-600 dark:text-gray-400 justify-center">
                                                <label htmlFor={input.name} className="relative cursor-pointer rounded-md font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500">
                                                    <span>{t('uploadFile')}</span>
                                                    <input id={input.name} name={input.name} type="file" className="sr-only" onChange={handleInputChange} />
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-500">{formData[input.name] ? (formData[input.name] as File).name : t('noFileSelected')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                        <button type="submit" disabled={isGenerating} className="w-full sm:flex-grow bg-primary-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-600/20 transform active:scale-95">
                            {isGenerating && <Loader2 className="animate-spin" size={20} />}
                            {t('executeTask')}
                        </button>
                         {renderOutputLanguageSelector(false)}
                    </div>
                </form>
            </div>
        )
    );

    const renderOutputPanelContent = () => {
        return (
            <div className="flex flex-col h-full overflow-hidden rounded-xl bg-primary-50/50 dark:bg-slate-900 border border-primary-100 dark:border-slate-700">
                 {/* Result Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar relative">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4">
                                <Loader2 className="animate-spin text-primary-500" size={32} />
                            </div>
                            <p className="text-gray-500 text-center font-medium animate-pulse">{retryMessage || t('generatingResponse')}</p>
                        </div>
                    ) : result ? (
                        <div className="flex flex-col min-h-full">
                            <div className="sticky top-0 z-10 flex justify-between items-center p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
                                <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                    <Sparkles size={16} className="text-yellow-500"/>
                                    {t('results')}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mr-2">
                                         <button onClick={handleIncreaseFont} className="hover:bg-white dark:hover:bg-slate-600 rounded p-1 transition-colors" title="Zoom In"><ZoomIn size={16} /></button>
                                         <button onClick={handleDecreaseFont} className="hover:bg-white dark:hover:bg-slate-600 rounded p-1 transition-colors" title="Zoom Out"><ZoomOut size={16} /></button>
                                    </div>
                                     
                                     {/* Voice Popover trigger */}
                                     <div className="relative" ref={settingsRef}>
                                         <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
                                             <Settings2 size={16}/>
                                         </button>
                                          {showVoiceSettings && (
                                            <div className="absolute top-full mt-2 right-0 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-20">
                                                {/* Voice Settings Content same as before, just positioned differently */}
                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('selectVoice')}</label>
                                                    <select 
                                                        value={selectedVoice?.name || ''} 
                                                        onChange={(e) => {
                                                            const voice = voices.find(v => v.name === e.target.value);
                                                            setSelectedVoice(voice || null);
                                                        }}
                                                        className="w-full p-1 text-xs border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        <option value="">Default</option>
                                                        {voices.filter(v => v.lang.startsWith(outputLanguage === Language.AR ? 'ar' : 'en')).map(v => (
                                                            <option key={v.name} value={v.name}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                     <span className="text-xs text-gray-500 block mb-1">{t('speed')}: {speechRate}x</span>
                                                     <input type="range" min="0.5" max="2" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"/>
                                                </div>
                                            </div>
                                        )}
                                     </div>

                                    <button onClick={handleListen} className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 ${isSpeaking ? 'text-green-500' : 'text-gray-500'}`}><Volume2 size={16} /></button>
                                    <button onClick={copyToClipboard} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">{isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}</button>
                                    <button onClick={handlePrint} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"><Printer size={16} /></button>
                                    <button onClick={handleClear} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="p-6 prose dark:prose-invert max-w-none">
                                <pre 
                                    className="whitespace-pre-wrap font-naskh leading-loose text-left rtl:text-right bg-transparent p-0 m-0 text-gray-800 dark:text-gray-200"
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    {result}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-gray-400"/>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('resultPlaceholder')}</p>
                        </div>
                    )}
                </div>
                
                {/* Prompt Input at the Bottom of Output Panel */}
                {renderPromptInput()}
            </div>
        );
    }

    return (
        <div className={`${isFullWidth ? 'w-full px-2' : 'container mx-auto px-4 sm:px-6 lg:px-8'} flex-grow flex items-start justify-center py-4 lg:py-8 transition-all duration-300`}>
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1920px] ${
                isFullWidth 
                ? 'lg:h-[calc(100vh-80px)] h-auto min-h-[calc(100vh-80px)]' 
                : 'lg:h-[calc(100vh-100px)] h-auto min-h-[calc(100vh-100px)]'
            }`}>

                {/* Left Panel (Input / Services) - Takes more space now (8/12) */}
                <div className="lg:col-span-8 xl:col-span-8 min-h-[600px] lg:h-full overflow-hidden shadow-xl rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-col">
                    {currentView === 'services' ? renderServiceSelectionView() : renderServiceFormView()}
                </div>

                {/* Right Panel (Output) - Takes less space (4/12) */}
                <div className="lg:col-span-4 xl:col-span-4 min-h-[500px] lg:h-full overflow-hidden shadow-xl rounded-xl flex flex-col">
                    {renderOutputPanelContent()}
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;