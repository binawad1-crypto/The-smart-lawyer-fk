
import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Wand2, Send, Copy, Check, Printer, Volume2, X, ArrowLeft, ArrowRight, File, ZoomIn, ZoomOut } from 'lucide-react';
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
    
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(ServiceCategory.LitigationAndPleadings);
    const [outputLanguage, setOutputLanguage] = useState<Language>(language);

    useEffect(() => {
        setOutputLanguage(language);
    }, [language]);

    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            setErrorServices(null);
            try {
                const servicesCollectionRef = collection(db, 'services');
                const servicesSnapshot = await getDocs(servicesCollectionRef);
                const servicesList = servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
                
                servicesList.sort((a, b) => {
                    const categoryComparison = a.category.localeCompare(b.category);
                    if (categoryComparison !== 0) return categoryComparison;
                    return a.title.en.localeCompare(b.title.en);
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
    }, [t]);

    useEffect(() => {
        // Cleanup speech synthesis on component unmount
        return () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    const { basicServiceCategories, servicesByCategory, advancedServices } = useMemo(() => {
        const basic: ServiceCategory[] = [
            ServiceCategory.LitigationAndPleadings,
            ServiceCategory.SpecializedConsultations,
            ServiceCategory.InvestigationsAndCriminal,
            ServiceCategory.CorporateAndCompliance
        ];
        const advanced: ServiceCategory[] = [ServiceCategory.CreativeServices];

        const byCategory: Record<ServiceCategory, Service[]> = services.reduce((acc, service) => {
            if (!acc[service.category]) acc[service.category] = [];
            acc[service.category].push(service);
            return acc;
        }, {} as Record<ServiceCategory, Service[]>);

        const advancedList = advanced.flatMap(cat => byCategory[cat] || []);

        return { basicServiceCategories: basic, servicesByCategory: byCategory, advancedServices: advancedList };
    }, [services]);

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
            const finalPrompt = prompt + languageInstruction;
            
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
                // Increment service usage count - wrap in try/catch to prevent UI error on permission fail
                try {
                    const serviceRef = doc(db, 'services', selectedService.id);
                    await updateDoc(serviceRef, {
                        usageCount: increment(1)
                    });
                } catch (err) {
                    console.error("Failed to update service usage count:", err);
                }

                // Decrement user token balance (if not admin)
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

    const renderOutputLanguageSelector = () => (
        <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('outputLanguage')}</span>
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
    );

    const renderServiceSelectionView = () => (
        <>
            <div className="mb-6 flex-shrink-0 flex justify-between items-start">
                 <div className="text-right rtl:text-left">
                    <span className="text-xs text-blue-400 font-semibold flex items-center gap-2 pt-2 justify-end rtl:justify-start">
                        <Wand2 size={14} /> {t('poweredByAI')}
                    </span>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('legalAssistant')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('howCanIHelp')}</p>
                </div>
            </div>

            <div className="relative flex-shrink-0">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('typeYourRequest')}
                    className="w-full h-40 p-4 ltr:pl-16 rtl:pr-16 resize-none border-0 rounded-lg bg-slate-100 dark:bg-dark-bg text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500 text-right"
                />
                <button
                    onClick={handleExecutePrompt}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute top-4 ltr:left-4 rtl:right-4 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                >
                    <Send size={20} className="ltr:-scale-x-100" />
                </button>
            </div>

            <div className="mt-6 custom-scrollbar pr-2 -mr-2">
                {loadingServices ? (
                    <div className="text-center p-4"><Loader2 className="animate-spin inline-block" /></div>
                ) : errorServices ? (
                    <p className="text-center text-red-500 p-4">{errorServices}</p>
                ) : (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('basicServices')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                            {basicServiceCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 text-center ${
                                        selectedCategory === cat
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t(cat as keyof Translations)}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(servicesByCategory[selectedCategory] || []).map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceClick(service)}
                                    className="w-full text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/70 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors"
                                >
                                    {service.title[language]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="pt-4 flex-shrink-0">
                {!loadingServices && !errorServices && advancedServices.length > 0 && (
                     <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('advancedServices')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {advancedServices.map(service => {
                                const Icon = iconMap[service.icon] || Wand2;
                                return (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceClick(service)}
                                    className="w-full p-3 rounded-lg bg-light-bg dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/60 text-sm font-medium text-gray-800 dark:text-gray-200 transition-all flex items-center justify-start rtl:justify-start gap-3 group"
                                >
                                    <Icon className="w-5 h-5 text-primary-500 dark:text-primary-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                                    <span className="truncate text-left rtl:text-right">{service.title[language]}</span>
                                </button>
                            )})}
                        </div>
                    </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex flex-row items-center gap-3">
                    <button
                        onClick={handleExecutePrompt}
                        disabled={isGenerating || !prompt.trim()}
                        className="flex-grow bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {isGenerating && <Loader2 className="animate-spin" size={20} />}
                        {t('execute')}
                    </button>
                    {renderOutputLanguageSelector()}
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
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedService.title[language]}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedService.description[language]}</p>
                    </div>
                </div>
                 <div className="border-t border-gray-200 dark:border-slate-700 mb-4"></div>
                <form onSubmit={handleServiceFormSubmit} className="space-y-4 flex-grow flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        {selectedService.formInputs.map(input => (
                            <div key={input.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{input.label[language]}</label>
                                {input.type === 'textarea' && <textarea name={input.name} onChange={handleInputChange} rows={5} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                                {input.type === 'text' && <input type="text" name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                                {input.type === 'date' && <input type="date" name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-blue-500 focus:outline-none" />}
                                {input.type === 'select' && (
                                    <select name={input.name} onChange={handleInputChange} className="w-full p-2 border-0 rounded-md bg-slate-100 dark:bg-dark-bg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                        <option value="">{`Select ${input.label[language]}`}</option>
                                        {input.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[language]}</option>)}
                                    </select>
                                )}
                                {input.type === 'file' && (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <File className="mx-auto h-12 w-12 text-gray-400"/>
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                <label htmlFor={input.name} className="relative cursor-pointer bg-light-card-bg dark:bg-dark-card-bg rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
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
                    <div className="pt-4 flex-shrink-0 border-t border-gray-200 dark:border-slate-700 flex flex-row items-center gap-3">
                        <button type="submit" disabled={isGenerating} className="flex-grow bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
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
                <div className="inline-block p-4 mb-4 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex items-start justify-center py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-[85vw] max-w-[1600px] bg-light-card-bg dark:bg-dark-card-bg rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">

                {/* Left Panel (Input) */}
                <div className="flex flex-col">
                    {currentView === 'services' ? renderServiceSelectionView() : renderServiceFormView()}
                </div>

                {/* Right Panel (Output) */}
                <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-slate-900/50">
                    {renderOutputPanelContent()}
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
