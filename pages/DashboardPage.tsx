
import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Wand2, Send, Copy, Check, Printer, Volume2, X, ArrowLeft, ArrowRight, File, ZoomIn, ZoomOut, MapPin, Sparkles, FileText, LayoutGrid, Search, Star, Maximize2, Minimize2 } from 'lucide-react';
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
    const [fontSize, setFontSize] = useState(16);
    
    // Search and Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [outputLanguage, setOutputLanguage] = useState<Language>(language);
    const [favorites, setFavorites] = useState<string[]>([]);
    
    // Layout State
    const [isFullWidth, setIsFullWidth] = useState(false);

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
            utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
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

    const renderServiceSelectionView = () => (
        <>
            <div className="mb-4 flex-shrink-0 flex flex-col gap-2">
                 <div className="flex flex-col-reverse gap-3 sm:gap-0 sm:flex-row sm:justify-between sm:items-start">
                     <div className="text-right rtl:text-left w-full sm:w-auto">
                        <span className="text-xs text-primary-400 font-semibold flex items-center gap-2 pt-2 justify-end rtl:justify-start">
                            <Wand2 size={14} /> {t('poweredByAI')}
                        </span>
                    </div>
                    <div className="text-right w-full sm:w-auto">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('legalAssistant')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('howCanIHelp')}</p>
                    </div>
                </div>
                {/* Language Selector & Layout Toggle above the prompt box */}
                <div className="flex justify-end items-center gap-3">
                     <button
                        onClick={() => setIsFullWidth(!isFullWidth)}
                        className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        title={isFullWidth ? t('standardWidth') : t('fullWidth')}
                    >
                        {isFullWidth ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    {renderOutputLanguageSelector(false)}
                </div>
            </div>

            <div className="relative flex-shrink-0 mb-6">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('typeYourRequest')}
                    className="w-full h-32 p-4 ltr:pl-16 rtl:pr-16 resize-none border-0 rounded-2xl bg-slate-100 dark:bg-dark-bg text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-gray-500 text-right shadow-inner"
                />
                <button
                    onClick={handleExecutePrompt}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute top-4 ltr:left-4 rtl:right-4 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-all shadow-lg z-10 hover:scale-105"
                    aria-label="Send"
                >
                    {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="ltr:-scale-x-100" />}
                </button>
            </div>

            <div className="flex flex-col h-full">
                {/* Search Bar */}
                <div className="mb-4 relative w-full max-w-md mx-auto sm:mx-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:right-3 rtl:left-auto" size={18} />
                    <input
                        type="text"
                        placeholder={t('searchServicePlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all shadow-sm"
                    />
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                                selectedCategory === cat.id
                                    ? 'bg-primary-600 text-white shadow-md scale-105'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat.id === 'favorites' && <Star size={14} fill={selectedCategory === 'favorites' ? 'white' : 'none'} />}
                            {cat.id === 'all' && <LayoutGrid size={14}/>}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Services Grid */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 pb-4">
                    {loadingServices ? (
                        <div className="text-center p-8"><Loader2 className="animate-spin inline-block text-primary-500" size={32} /></div>
                    ) : errorServices ? (
                        <p className="text-center text-red-500 p-8">{errorServices}</p>
                    ) : filteredServices.length === 0 ? (
                        <p className="text-center text-gray-500 p-8">{t('noServicesFound')}</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredServices.map(service => {
                                const Icon = iconMap[service.icon] || FileText;
                                const isFav = favorites.includes(service.id);
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceClick(service)}
                                        className="group flex flex-col text-right rtl:text-right ltr:text-left p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <div className="flex items-start justify-between w-full mb-3 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <Icon size={24} strokeWidth={2} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Star Button */}
                                                <div 
                                                    role="button"
                                                    onClick={(e) => toggleFavorite(e, service.id)}
                                                    className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <Star size={20} fill={isFav ? "currentColor" : "none"} />
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 rtl:-translate-x-2 group-hover:translate-x-0 rtl:group-hover:translate-x-0 text-primary-500">
                                                    {language === 'ar' ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug relative z-10 w-full">
                                            {service.title[language] || service.title['en']}
                                        </h3>
                                        
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 relative z-10 w-full opacity-80">
                                            {service.description[language] || service.description['en']}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const renderServiceFormView = () => (
        selectedService && (
            <div className="flex flex-col h-full">
                <div className="flex items-center mb-4 flex-shrink-0">
                    <button onClick={handleBackToServices} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <div className="mx-3 text-right rtl:text-left">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedService.title[language] || selectedService.title['en']}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedService.description[language] || selectedService.description['en']}</p>
                    </div>
                </div>
                 <div className="border-t border-gray-200 dark:border-slate-700 mb-4"></div>
                <form onSubmit={handleServiceFormSubmit} className="space-y-4 flex-grow flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        {selectedService.formInputs.map(input => (
                            <div key={input.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{input.label[language]}</label>
                                {input.type === 'textarea' && <textarea name={input.name} onChange={handleInputChange} rows={5} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'text' && <input type="text" name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'date' && <input type="date" name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:outline-none" />}
                                {input.type === 'select' && (
                                    <select name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:outline-none">
                                        <option value="">{`Select ${input.label[language]}`}</option>
                                        {input.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[language]}</option>)}
                                    </select>
                                )}
                                {input.type === 'file' && (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="space-y-1 text-center">
                                            <File className="mx-auto h-12 w-12 text-gray-400"/>
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                <label htmlFor={input.name} className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                                                    <span>{t('uploadFile')}</span>
                                                    <input id={input.name} name={input.name} type="file" className="sr-only" onChange={handleInputChange} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">{formData[input.name] ? (formData[input.name] as File).name : t('noFileSelected')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                        <button type="submit" disabled={isGenerating} className="w-full sm:flex-grow bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg transform active:scale-95">
                            {isGenerating && <Loader2 className="animate-spin" size={20} />}
                            {t('executeTask')}
                        </button>
                        {renderOutputLanguageSelector()}
                    </div>
                </form>
            </div>
        )
    );

    const renderOutputPanelContent = () => {
        if (isGenerating) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                    <p className="mt-4 text-gray-500 text-center">{retryMessage || t('generatingResponse')}</p>
                </div>
            );
        }
        if (result) {
            return (
                <div className="flex flex-col w-full h-full">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                         <div className="flex items-center gap-2 md:gap-4 text-sm text-gray-600 dark:text-gray-300">
                             <button onClick={handleIncreaseFont} className="hover:text-primary-500 transition-colors p-1" title="Zoom In">
                                 <ZoomIn size={18} />
                             </button>
                             <button onClick={handleDecreaseFont} className="hover:text-primary-500 transition-colors p-1" title="Zoom Out">
                                 <ZoomOut size={18} />
                             </button>
                             <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                             <button onClick={handleListen} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
                                <Volume2 size={16} />
                                <span className="hidden sm:inline">{isSpeaking ? t('stop') : t('listen')}</span>
                            </button>
                             <button onClick={copyToClipboard} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
                                {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                <span className="hidden sm:inline">{isCopied ? t('copied') : t('copy')}</span>
                            </button>
                            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
                                <Printer size={16} />
                                <span className="hidden sm:inline">{t('print')}</span>
                            </button>
                            <button onClick={handleClear} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white hidden md:block">{t('results')}</h3>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm p-4 overflow-y-auto flex-grow">
                         {/* Apply Noto Naskh font and relax leading for better Arabic readability */}
                         <pre 
                            className="whitespace-pre-wrap font-naskh leading-loose text-left rtl:text-right bg-transparent p-0 m-0 transition-all duration-200 text-gray-800 dark:text-gray-200"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {result}
                        </pre>
                    </div>
                </div>
            );
        }
        
        // Initial state or out of tokens message
        const hasTokens = !currentUser || currentUser.isAdmin || (currentUser.tokenBalance || 0) > 0;

        return (
            <div className='text-center p-4 flex flex-col justify-center items-center h-full'>
                <div className="inline-block p-4 mb-4 rounded-full bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-inner">
                    <Wand2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('smartLegalAssistant')}</h2>
                {hasTokens ? (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('selectServiceToStart')}</p>
                ) : (
                    <div className="mt-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
                        <strong className="font-bold block">{t('outOfTokens')}</strong>
                        <span className="block sm:inline">{t('outOfTokensUser')}</span>
                         <button onClick={() => onNavigate('subscriptions')} className="mt-3 w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700">
                            {t('upgradeNow')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${isFullWidth ? 'w-full px-2' : 'container mx-auto px-4 sm:px-6 lg:px-8'} flex-grow flex items-start justify-center py-8 transition-all duration-300`}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 bg-light-card-bg dark:bg-dark-card-bg shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden transition-all duration-300 ${
                isFullWidth 
                ? 'w-full max-w-none h-[calc(100vh-80px)] rounded-xl' 
                : 'w-[95vw] max-w-[1800px] h-[calc(100vh-120px)] rounded-3xl'
            }`}>

                {/* Left Panel (Input) */}
                <div className="flex flex-col h-full overflow-hidden">
                    {currentView === 'services' ? renderServiceSelectionView() : renderServiceFormView()}
                </div>

                {/* Right Panel (Output) */}
                <div className="flex flex-col rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 h-full overflow-hidden">
                    {renderOutputPanelContent()}
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
