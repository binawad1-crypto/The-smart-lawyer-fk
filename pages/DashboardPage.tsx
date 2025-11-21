

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, Wand2, Send, Copy, Check, Printer, Volume2, X, ArrowLeft, ArrowRight, File, MapPin, Sparkles, FileText, LayoutGrid, Search, Star, Settings2, Sliders, ChevronRight as ChevronRightIcon, Gavel, Shield, Building2, Users, Scale, Briefcase, AudioLines, Search as SearchIcon, Archive, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { Service, Translations, Language, Category } from '../types';
import { collection, getDocs, query, doc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { runGemini } from '../services/geminiService';
import { iconMap } from '../constants';

interface DashboardPageProps {
    onNavigate: (view: 'dashboard' | 'admin' | 'profile' | 'subscriptions') => void;
}

const professionalOutputInstructionSystem = `أنت مساعد قانوني خبير. مهمتك هي تحليل طلب المستخدم وتقديم إجابة احترافية ودقيقة.
يجب عليك **دائمًا** تنسيق إجابتك النهائية باستخدام قالب HTML التالي فقط. لا تكتب أي نص أو تعليقات خارج وسوم HTML.

أولاً، قم بتنفيذ المهمة المطلوبة في طلب المستخدم.
ثانياً، ضع نتائج تحليلك وإجابتك داخل القالب التالي:

<section style="
  font-family: 'Calibri', 'Noto Naskh Arabic', sans-serif;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  padding: 22px;
  border-radius: 14px;
  line-height: 1.8;
  direction: rtl;
  text-align: right;
">
  <h2 style="
    font-size: 1.6rem; 
    margin-bottom: 12px;
    color: #222;
    font-weight: 700;
  ">[ضع هنا عنواناً مناسباً للنتيجة، مثل "تحليل المستند" أو "ملخص القضية"]</h2>

  <p style="
    font-size: 1.2rem; 
    color: #555;
    margin-bottom: 16px;
    font-weight: 700;
  ">[ضع هنا مقدمة موجزة عن النتائج التي توصلت إليها]</p>

  <div style="font-size: 1.125rem; color: #333; margin-bottom: 20px; font-weight: 400;">
    <!-- ابدأ بوضع المحتوى الرئيسي هنا. يمكنك استخدام فقرات <p> وقوائم <ul> بحرية -->
    <p>[هنا تضع الفقرة الأولى من التحليل أو الرد...]</p>
    <p>[وهنا الفقرة الثانية إذا لزم الأمر...]</p>
    
    <ul style="padding-right: 20px; margin-top: 15px; margin-bottom: 15px;">
        <li style="margin-bottom: 8px;">• [النقطة الأولى من التحليل]</li>
        <li style="margin-bottom: 8px;">• [النقطة الثانية من التحليل]</li>
        <li style="margin-bottom: 8px;">• [النقطة الثالثة، وهكذا...]</li>
    </ul>
    
    <p>[فقرة ختامية أو توصيات.]</p>
  </div>

  <p style="
    font-size: 1rem; 
    color: #444;
    margin-top: 12px;
    font-weight: 400;
  ">💡 ملاحظة: تم إنشاء هذا المستند بواسطة المساعد الذكي ويجب مراجعته من قبل متخصص.</p>
</section>

التعليمات الهامة:
- مهمتك الأساسية هي الإجابة على طلب المستخدم. القالب هو فقط لتنسيق تلك الإجابة.
- لا تصف الخدمة، بل قم بتنفيذها.
- استبدل كل المحتوى الموجود بين القوسين \`[...]\` بالنتائج الفعلية لتحليلك.
- التزم تماماً بتقديم المخرج بصيغة HTML فقط.
`;

const professionalOutputInstructionSystemEN = `You are an expert legal assistant. Your task is to analyze the user's request and provide a professional, accurate answer.
You **must always** format your final answer using only the following HTML template. Do not write any text or comments outside the HTML tags.

First, perform the task requested by the user.
Second, place your analysis and answer inside the following template:

<section style="
  font-family: 'Calibri', 'Arial', sans-serif;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  padding: 22px;
  border-radius: 14px;
  line-height: 1.8;
  direction: ltr;
  text-align: left;
">
  <h2 style="
    font-size: 1.6rem; 
    margin-bottom: 12px;
    color: #222;
    font-weight: 700;
  ">[Insert a suitable title for the result here, e.g., "Document Analysis" or "Case Summary"]</h2>

  <p style="
    font-size: 1.2rem; 
    color: #555;
    margin-bottom: 16px;
    font-weight: 700;
  ">[Insert a brief introduction to your findings here]</p>

  <div style="font-size: 1.125rem; color: #333; margin-bottom: 20px; font-weight: 400;">
    <!-- Start placing the main content here. You can use <p> paragraphs and <ul> lists freely -->
    <p>[Place the first paragraph of your analysis or response here...]</p>
    <p>[And the second paragraph if needed...]</p>
    
    <ul style="padding-left: 20px; margin-top: 15px; margin-bottom: 15px;">
        <li style="margin-bottom: 8px;">• [First point of analysis]</li>
        <li style="margin-bottom: 8px;">• [Second point of analysis]</li>
        <li style="margin-bottom: 8px;">• [Third point, and so on...]</li>
    </ul>
    
    <p>[A concluding paragraph or recommendations.]</p>
  </div>

  <p style="
    font-size: 1rem; 
    color: #444;
    margin-top: 12px;
    font-weight: 400;
  ">💡 Note: This document was generated by the Smart Assistant and should be reviewed by a qualified professional.</p>
</section>

IMPORTANT INSTRUCTIONS:
- Your primary task is to answer the user's request. The template is only for formatting that answer.
- Do not describe the service; execute it.
- Replace all content within the brackets \`[...]\` with the actual results of your analysis.
- Strictly adhere to providing the output in HTML format only.
`;


const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const { t, language, dir } = useLanguage();
    const { currentUser } = useAuth();
    const { settings } = useSiteSettings();
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorServices, setErrorServices] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [retryMessage, setRetryMessage] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [outputScale, setOutputScale] = useState(1);
    
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
    const [outputLength, setOutputLength] = useState<'default' | 'short' | 'medium'>('default');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const SERVICES_PER_PAGE = 12;

    const [isExpanded, setIsExpanded] = useState(false);
    const [isOutputExpanded, setIsOutputExpanded] = useState(false);

    const handleToggleServices = () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        if (nextState) {
            setIsOutputExpanded(false);
        }
    };

    const handleToggleOutput = () => {
        const nextState = !isOutputExpanded;
        setIsOutputExpanded(nextState);
        if (nextState) {
            setIsExpanded(false);
        }
    };


    useEffect(() => {
        setOutputLanguage(language);
    }, [language]);
    
    // Reset page number when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [selectedCategory, searchQuery]);

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
                setErrorServices(t('fetchServicesError'));
            } finally {
                setLoadingServices(false);
            }
        };
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const catRef = collection(db, 'service_categories');
                const q = query(catRef, orderBy('order'));
                const snapshot = await getDocs(q);
                const cats = snapshot.docs.map(doc => doc.data() as Category);
                setCategories(cats);
            } catch (e) {
                console.error("Failed to fetch categories", e);
            } finally {
                setLoadingCategories(false);
            }
        }
        fetchServices();
        fetchCategories();
    }, [t, language]);

    useEffect(() => {
        // Cleanup speech synthesis on component unmount
        return () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    // Helper function to determine card color theme based on category
    const getServiceColorTheme = (categoryId: string) => {
        switch (categoryId) {
            case 'litigation-and-pleadings':
                return { 
                    border: 'bg-blue-500', 
                    iconBg: 'bg-blue-50', 
                    iconColor: 'text-blue-600',
                    darkIconBg: 'dark:bg-blue-900/20',
                    darkIconColor: 'dark:text-blue-400'
                };
            case 'specialized-consultations':
                return { 
                    border: 'bg-purple-500', 
                    iconBg: 'bg-purple-50', 
                    iconColor: 'text-purple-600',
                    darkIconBg: 'dark:bg-purple-900/20',
                    darkIconColor: 'dark:text-purple-400'
                };
            case 'investigations-and-criminal':
                return { 
                    border: 'bg-red-500', 
                    iconBg: 'bg-red-50', 
                    iconColor: 'text-red-600',
                    darkIconBg: 'dark:bg-red-900/20',
                    darkIconColor: 'dark:text-red-400'
                };
            case 'corporate-and-compliance':
                return { 
                    border: 'bg-emerald-500', 
                    iconBg: 'bg-emerald-50', 
                    iconColor: 'text-emerald-600',
                    darkIconBg: 'dark:bg-emerald-900/20',
                    darkIconColor: 'dark:text-emerald-400'
                };
             case 'creative-services':
                return { 
                    border: 'bg-pink-500', 
                    iconBg: 'bg-pink-50', 
                    iconColor: 'text-pink-600',
                    darkIconBg: 'dark:bg-pink-900/20',
                    darkIconColor: 'dark:text-pink-400'
                };
            default:
                return { 
                    border: 'bg-gray-500', 
                    iconBg: 'bg-gray-50', 
                    iconColor: 'text-gray-600',
                    darkIconBg: 'dark:bg-gray-800',
                    darkIconColor: 'dark:text-gray-400'
                };
        }
    };

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

    const sidebarCategories = useMemo(() => {
        const dynamicCategories = categories.map(cat => {
            const IconComponent = iconMap[cat.icon] || Gavel;
            return {
                id: cat.id,
                label: cat.title[language],
                icon: IconComponent,
                // The color here is for the inactive state in the sidebar
                color: getServiceColorTheme(cat.id).darkIconColor.replace('dark:', '') // A bit of a hack to get a representative color
            };
        });
    
        return [
            { id: 'all', label: t('allCategories'), icon: LayoutGrid, color: 'text-gray-400' },
            { id: 'favorites', label: t('favorites'), icon: Star, color: 'text-yellow-400' },
            ...dynamicCategories
        ];
    }, [categories, language, t]);
    

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
            const userLocation = currentUser?.location;
            const locationContext = userLocation ? `\n\nCONTEXT: The user is located in ${userLocation}. Please answer based on the laws and regulations of ${userLocation} unless specified otherwise.` : '';
            
            let finalPrompt = prompt + locationContext;

            let geminiConfig: any = {};
            if (outputLength === 'short') {
                geminiConfig = { maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 256 } };
            } else if (outputLength === 'medium') {
                geminiConfig = { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 1024 } };
            }

            if (outputLanguage === Language.AR) {
                geminiConfig = { ...geminiConfig, systemInstruction: professionalOutputInstructionSystem };
            } else {
                finalPrompt += `\n\nIMPORTANT: Provide the response strictly in English language.`;
                geminiConfig = { ...geminiConfig, systemInstruction: professionalOutputInstructionSystemEN };
            }
            
            const response = await runGemini('gemini-2.5-flash', finalPrompt, undefined, handleRetry, geminiConfig);
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

            if (outputLanguage === Language.EN) {
                prompt += `\n\nIMPORTANT: The output must be in English language.`;
            }
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
            let geminiConfig = selectedService.geminiConfig || {};
            if (outputLength === 'short') {
                geminiConfig = { ...geminiConfig, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 256 } };
            } else if (outputLength === 'medium') {
                geminiConfig = { ...geminiConfig, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 1024 } };
            }

            if (outputLanguage === Language.AR) {
                geminiConfig = { ...geminiConfig, systemInstruction: professionalOutputInstructionSystem };
            } else {
                geminiConfig = { ...geminiConfig, systemInstruction: professionalOutputInstructionSystemEN };
            }

            const response = await runGemini(selectedService.geminiModel, promptText, file, handleRetry, geminiConfig);
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
            navigator.clipboard.writeText(stripHtml(result));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const contentToPrint = result.trim().startsWith('<section')
                ? result
                : `<pre style="font-family: Calibri, sans-serif;">${result}</pre>`;
            printWindow.document.write(`
              <html>
                <head>
                  <title>Print Result</title>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
                    body { font-family: 'Calibri', 'Noto Naskh Arabic', 'Tajawal', sans-serif; direction: ${language === 'ar' ? 'rtl' : 'ltr'}; padding: 20px; }
                    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
                  </style>
                </head>
                <body>${contentToPrint}</body>
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
            const utterance = new SpeechSynthesisUtterance(stripHtml(result));
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

    const handleZoomIn = () => setOutputScale(s => Math.min(s + 0.1, 2));
    const handleZoomOut = () => setOutputScale(s => Math.max(s - 0.1, 0.5));

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

    const renderOutputLengthSelector = (showLabel = true) => (
         <div className="flex items-center gap-2">
            {showLabel && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{t('outputLength')}</span>}
            <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => setOutputLength('short')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${outputLength === 'short' ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {t('short')}
                </button>
                <button
                    type="button"
                    onClick={() => setOutputLength('medium')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${outputLength === 'medium' ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {t('medium')}
                </button>
                 <button
                    type="button"
                    onClick={() => setOutputLength('default')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${outputLength === 'default' ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {t('default')}
                </button>
            </div>
        </div>
    );
    
    // -------------------- FRAME 1: IDENTITY & NAVIGATION (SIDEBAR) --------------------
    const renderSidebar = () => (
        <div className="flex flex-col h-full rounded-2xl bg-gray-50 dark:bg-slate-900 shadow-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="h-16 flex flex-col justify-center px-6 bg-gradient-to-r from-teal-700 to-teal-600 dark:from-teal-900 dark:to-teal-800 border-b border-teal-600 dark:border-teal-900 shrink-0 shadow-sm">
                 <h2 className="text-xl font-black tracking-tight leading-tight text-white">
                    {settings?.siteName[language] || t('appName')}
                </h2>
                <p className="text-xs text-teal-100 font-medium">
                    {settings?.siteSubtitle?.[language] || t('appSubtitle')}
                </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 rtl:right-3 rtl:left-auto" size={16} />
                    <input
                        type="text"
                        placeholder={t('searchServicePlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-all placeholder-gray-400 dark:placeholder-slate-500"
                    />
                </div>
            </div>

            {/* Categories Navigation */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1">
                {loadingCategories ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : sidebarCategories.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    const IconComponent = cat.icon;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(cat.id);
                                setSelectedService(null); // Reset service when category changes
                            }}
                            className={`font-cairo w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 group ${
                                isActive
                                    ? 'bg-teal-50 text-teal-800 dark:bg-teal-700 dark:text-white shadow-sm' // Active style
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60' // Inactive style
                            }`}
                        >
                            {/* RTL Layout: Chevron, Text, Icon */}
                            {language === 'ar' ? (
                                <>
                                    <div className="w-4">{isActive && <ArrowLeft size={16} />}</div>
                                    <span className="flex-grow text-right">{cat.label}</span>
                                    <div className={`p-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-teal-100 dark:bg-white/10' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                        <IconComponent size={20} className={isActive ? 'text-teal-700 dark:text-white' : `${cat.color} dark:${cat.color}`} />
                                    </div>
                                </>
                            ) : (
                            // LTR Layout: Icon, Text, Chevron
                                <>
                                    <div className={`p-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-teal-100 dark:bg-white/10' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                        <IconComponent size={20} className={isActive ? 'text-teal-700 dark:text-white' : `${cat.color} dark:${cat.color}`} />
                                    </div>
                                    <span className="flex-grow text-left">{cat.label}</span>
                                    <div className="w-4">{isActive && <ChevronRightIcon size={16} />}</div>
                                </>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );

    // -------------------- FRAME 2: SERVICES & INPUT (MIDDLE) --------------------
    const renderMainContent = () => {
        const totalPages = Math.ceil(filteredServices.length / SERVICES_PER_PAGE);
        const paginatedServices = filteredServices.slice(
            currentPage * SERVICES_PER_PAGE,
            (currentPage + 1) * SERVICES_PER_PAGE
        );

        return (
            <div className="flex flex-col h-full rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden relative">
                 {/* Header for Main Content */}
                 <div className="h-16 flex items-center px-6 bg-gradient-to-r from-teal-700 to-teal-600 dark:from-teal-900 dark:to-teal-800 border-b border-teal-600 dark:border-teal-900 text-white shrink-0 justify-between shadow-sm relative z-10">
                    {selectedService ? (
                        <div className="flex items-center gap-3 w-full">
                             <button onClick={handleBackToServices} className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
                                {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                            </button>
                            <div>
                                 <h3 className="font-cairo font-bold text-white text-sm leading-tight">{selectedService.title[language]}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <h3 className="font-cairo font-bold text-white text-lg">
                                {sidebarCategories.find(c => c.id === selectedCategory)?.label}
                            </h3>
                            <button
                                onClick={handleToggleServices}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                                title={isExpanded ? t('collapse') : t('expand')}
                            >
                                {dir === 'rtl' ? (
                                    isExpanded ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />
                                ) : (
                                    isExpanded ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />
                                )}
                            </button>
                        </div>
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
                                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                                    <button type="submit" disabled={isGenerating} className="w-full md:w-auto flex-grow bg-teal-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/20 transform active:scale-95">
                                        {isGenerating && <Loader2 className="animate-spin" size={20} />}
                                        {t('executeTask')}
                                    </button>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {renderOutputLengthSelector(false)}
                                        {renderOutputLanguageSelector(false)}
                                    </div>
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
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-4">
                                        {paginatedServices.map(service => {
                                            const Icon = iconMap[service.icon] || FileText;
                                            const isFav = favorites.includes(service.id);
                                            const colors = getServiceColorTheme(service.category);
                                            
                                            return (
                                                <button
                                                    key={service.id}
                                                    onClick={() => handleServiceClick(service)}
                                                    className="group relative flex flex-col p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 dark:shadow-none border border-gray-200 dark:border-gray-700 transition-all duration-300 h-auto min-h-[160px] overflow-hidden text-right rtl:text-right ltr:text-left ring-1 ring-transparent hover:ring-primary-500/50 dark:hover:ring-primary-400/50"
                                                >
                                                    <div className="flex items-start justify-between w-full mb-4">
                                                        <div className="p-1 text-gray-300 hover:text-yellow-400 transition-colors" 
                                                             onClick={(e) => toggleFavorite(e, service.id)}>
                                                            <Star size={18} fill={isFav ? "#FACC15" : "none"} className={isFav ? "text-yellow-400" : "text-gray-300"} />
                                                        </div>
                                                        
                                                        <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${colors.iconBg} ${colors.iconColor} ${colors.darkIconBg} ${colors.darkIconColor}`}>
                                                            <Icon size={24} strokeWidth={1.5} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col justify-between flex-grow w-full">
                                                        <div>
                                                            <h3 className="font-cairo text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                                                                {service.title[language] || service.title['en']}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium opacity-80">
                                                                {service.description[language] || service.description['en']}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="mt-6 flex justify-center items-center gap-4">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                                disabled={currentPage === 0}
                                                className="p-2 rounded-full bg-gray-400 dark:bg-gray-600 text-white hover:bg-gray-500 dark:hover:bg-gray-700 disabled:bg-gray-300 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                aria-label={language === 'ar' ? 'الصفحة السابقة' : 'Previous Page'}
                                            >
                                                {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                                            </button>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {language === 'ar' ? `صفحة ${currentPage + 1} من ${totalPages}` : `Page ${currentPage + 1} of ${totalPages}`}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={currentPage >= totalPages - 1}
                                                className="p-2 rounded-full bg-gray-400 dark:bg-gray-600 text-white hover:bg-gray-500 dark:hover:bg-gray-700 disabled:bg-gray-300 dark:disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                aria-label={language === 'ar' ? 'الصفحة التالية' : 'Next Page'}
                                            >
                                                {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                         </>
                     )}
                 </div>
            </div>
        )
    };

    // -------------------- FRAME 3: OUTPUT & CHAT (LEFT) --------------------
    const renderOutputPanel = () => (
        <div className="flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
             <div className="h-16 flex items-center px-4 bg-gradient-to-r from-teal-700 to-teal-600 dark:from-teal-900 dark:to-teal-800 border-b border-teal-600 dark:border-teal-900 shrink-0 justify-between shadow-sm relative z-10">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400"/>
                    {t('results')}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggleOutput}
                        className="p-1.5 rounded text-teal-100 hover:bg-white/10 transition-colors"
                        title={isOutputExpanded ? t('collapse') : t('expand')}
                    >
                        {dir === 'rtl' ? (
                            isOutputExpanded ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />
                        ) : (
                            isOutputExpanded ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />
                        )}
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <button onClick={handleListen} title={isSpeaking ? t('stop') : t('listen')} className={`p-1.5 rounded transition-colors ${isSpeaking ? 'text-green-400 bg-white/10' : 'text-teal-100 hover:bg-white/10'}`}><Volume2 size={16} /></button>
                    <button onClick={copyToClipboard} title={t('copy')} className="p-1.5 rounded text-teal-100 hover:bg-white/10 transition-colors">{isCopied ? <Check size={16} className="text-green-400"/> : <Copy size={16} />}</button>
                    <button onClick={handlePrint} title={t('print')} className="p-1.5 rounded text-teal-100 hover:bg-white/10 transition-colors"><Printer size={16} /></button>
                    
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    
                    <button onClick={handleZoomOut} title={language === 'ar' ? 'تصغير' : 'Zoom Out'} className="p-1.5 rounded text-teal-100 hover:bg-white/10 transition-colors"><ZoomOut size={16} /></button>
                    <button onClick={handleZoomIn} title={language === 'ar' ? 'تكبير' : 'Zoom In'} className="p-1.5 rounded text-teal-100 hover:bg-white/10 transition-colors"><ZoomIn size={16} /></button>
                    
                    <div className="w-px h-4 bg-white/20 mx-1"></div>

                    <button onClick={handleClear} title={t('cancel')} className="p-1.5 rounded text-red-300 hover:bg-white/10 hover:text-red-400 transition-colors"><X size={16} /></button>
                </div>
             </div>

             {/* Output Content */}
             <div className="flex-grow overflow-auto custom-scrollbar bg-white dark:bg-slate-900 relative p-4">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
                            <Loader2 className="animate-spin text-teal-600 relative z-10" size={40} />
                        </div>
                        <p className="text-gray-500 text-center font-medium mt-4 animate-pulse">{retryMessage || t('generatingResponse')}</p>
                    </div>
                ) : result ? (
                    <div 
                        className="max-w-none transition-transform duration-200 ease-out"
                        style={{ transform: `scale(${outputScale})`, transformOrigin: dir === 'rtl' ? 'top right' : 'top left' }}
                    >
                        {result.trim().startsWith('<section') ? (
                            <div dangerouslySetInnerHTML={{ __html: result }} />
                        ) : (
                             <pre 
                                className="whitespace-pre-wrap leading-loose text-left rtl:text-right bg-transparent p-0 m-0 text-gray-800 dark:text-gray-200"
                                style={{ fontSize: '18px', fontFamily: 'Calibri, Tajawal, sans-serif' }}
                            >
                                {result}
                            </pre>
                        )}
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

             {/* Prompt Input Area */}
             <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('typeYourRequest')}
                        className="w-full h-24 p-3 ltr:pl-3 rtl:pr-3 resize-none border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder-gray-500 dark:placeholder-slate-500 text-sm shadow-inner"
                        dir={dir}
                    />
                    <button
                        onClick={handleExecutePrompt}
                        disabled={isGenerating || !prompt.trim()}
                        className="absolute bottom-3 ltr:right-3 rtl:left-3 w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-500 disabled:bg-gray-400 dark:disabled:bg-slate-600 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20}/>}
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 mt-2 font-medium tracking-wide">
                    {t('poweredByAI')}
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex-grow bg-slate-100 dark:bg-slate-900/70 py-4 sm:py-6 lg:py-8">
             <div className="w-[90%] mx-auto h-full">
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    <div className="lg:col-span-1 h-full">{renderSidebar()}</div>
                    <div className={`${
                        isOutputExpanded
                            ? 'hidden'
                            : isExpanded
                            ? 'lg:col-span-3'
                            : 'lg:col-span-2'
                    } h-full transition-all duration-300`}>
                        {renderMainContent()}
                    </div>
                    <div className={`${
                        isExpanded
                            ? 'hidden'
                            : isOutputExpanded
                            ? 'lg:col-span-3'
                            : 'lg:col-span-1'
                    } h-full transition-all duration-300`}>
                        {renderOutputPanel()}
                    </div>
                </div>
            </div>
        </div>
    );
};
// FIX: Added default export to make the component available for import in App.tsx.
export default DashboardPage;