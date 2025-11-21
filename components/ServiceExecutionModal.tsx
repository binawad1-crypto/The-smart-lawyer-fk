import React, { useState, useCallback, useEffect } from 'react';
import { X, File, Loader2, Printer, Volume2, Copy, Check } from 'lucide-react';
import { Service, Language } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { runGemini } from '../services/geminiService';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ServiceExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
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
    font-size: 1.45rem;
    margin-bottom: 10px;
    color: #222;
    font-weight: 700;
  ">[ضع هنا عنواناً مناسباً للنتيجة، مثل "تحليل المستند" أو "ملخص القضية"]</h2>

  <p style="
    font-size: 1.05rem;
    color: #555;
    margin-bottom: 14px;
    font-weight: 700;
  ">[ضع هنا مقدمة موجزة عن النتائج التي توصلت إليها]</p>

  <div style="font-size: 1rem; color: #333; margin-bottom: 18px; font-weight: 400;">
    <!-- ابدأ بوضع المحتوى الرئيسي هنا. يمكنك استخدام فقرات <p> وقوائم <ul> بحرية -->
    <p>[هنا تضع الفقرة الأولى من التحليل أو الرد...]</p>
    <p>[وهنا الفقرة الثانية إذا لزم الأمر...]</p>
    
    <ul style="padding-right: 20px; margin-top: 15px; margin-bottom: 15px;">
        <li style="margin-bottom: 6px;">• [النقطة الأولى من التحليل]</li>
        <li style="margin-bottom: 6px;">• [النقطة الثانية من التحليل]</li>
        <li style="margin-bottom: 6px;">• [النقطة الثالثة، وهكذا...]</li>
    </ul>
    
    <p>[فقرة ختامية أو توصيات.]</p>
  </div>

  <p style="
    font-size: 0.95rem;
    color: #444;
    margin-top: 10px;
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
    font-size: 1.45rem;
    margin-bottom: 10px;
    color: #222;
    font-weight: 700;
  ">[Insert a suitable title for the result here, e.g., "Document Analysis" or "Case Summary"]</h2>

  <p style="
    font-size: 1.05rem;
    color: #555;
    margin-bottom: 14px;
    font-weight: 700;
  ">[Insert a brief introduction to your findings here]</p>

  <div style="font-size: 1rem; color: #333; margin-bottom: 18px; font-weight: 400;">
    <!-- Start placing the main content here. You can use <p> paragraphs and <ul> lists freely -->
    <p>[Place the first paragraph of your analysis or response here...]</p>
    <p>[And the second paragraph if needed...]</p>
    
    <ul style="padding-left: 20px; margin-top: 15px; margin-bottom: 15px;">
        <li style="margin-bottom: 6px;">• [First point of analysis]</li>
        <li style="margin-bottom: 6px;">• [Second point of analysis]</li>
        <li style="margin-bottom: 6px;">• [Third point, and so on...]</li>
    </ul>
    
    <p>[A concluding paragraph or recommendations.]</p>
  </div>

  <p style="
    font-size: 0.95rem;
    color: #444;
    margin-top: 10px;
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

const ServiceExecutionModal: React.FC<ServiceExecutionModalProps> = ({ isOpen, onClose, service }) => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState<Language>(language);
  const [outputLength, setOutputLength] = useState<'default' | 'short' | 'medium'>('default');
  
  useEffect(() => {
      setOutputLanguage(language);
  }, [language]);

  useEffect(() => {
    // Cleanup speech synthesis on component unmount or modal close
    return () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      setFormData(prev => ({ ...prev, [name]: files ? files[0] : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const constructPrompt = useCallback(() => {
    if (!service) return '';
    let prompt = `Service: ${service.title.en}.\n`;
    for (const key in formData) {
      if (key.includes('file')) continue;
      const inputConfig = service.formInputs.find(i => i.name === key);
      prompt += `${inputConfig?.label.en || key}: ${formData[key]}\n`;
    }
    
    // Inject Location Context from Profile
    const userLocation = currentUser?.location;
    if (userLocation) {
        prompt += `\n\nCONTEXT: The user is located in ${userLocation}. Please answer based on the laws and regulations of ${userLocation} unless specified otherwise.`;
    }

    if (outputLanguage === Language.EN) {
        prompt += `\n\nIMPORTANT: The output must be in English language.`;
    }
    
    return prompt;
  }, [formData, service, outputLanguage, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setIsLoading(true);
    setResult('');
    setRetryMessage('');

    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    }

    const prompt = constructPrompt();
    const fileInput = service.formInputs.find(i => i.type === 'file');
    const file = fileInput ? formData[fileInput.name] as File : undefined;

    const handleRetry = (attempt: number, maxRetries: number) => {
      const message = t('modelIsBusyRetrying')
        .replace('${attempt}', String(attempt))
        .replace('${maxRetries}', String(maxRetries));
      setRetryMessage(message);
    };

    try {
        let geminiConfig = service.geminiConfig || {};
        if (outputLength === 'short') {
            geminiConfig = { ...geminiConfig, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 256 } };
        } else if (outputLength === 'medium') {
            geminiConfig = { ...geminiConfig, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 1024 } };
        }
        
        let finalSystemInstruction = '';
        const serviceSystemInstruction = service.systemInstruction?.[outputLanguage] || service.systemInstruction?.[language] || '';

        if (outputLanguage === Language.AR) {
            finalSystemInstruction = `${serviceSystemInstruction}\n\n---\n\n${professionalOutputInstructionSystem}`.trim();
        } else {
            finalSystemInstruction = `${serviceSystemInstruction}\n\n---\n\n${professionalOutputInstructionSystemEN}`.trim();
        }

        geminiConfig = { ...geminiConfig, systemInstruction: finalSystemInstruction };

        const response = await runGemini(service.geminiModel, prompt, file, handleRetry, geminiConfig);
        const resultText = response.text;
        setResult(resultText);

        // Increment usage count in Firestore if the call was successful
        if (resultText && service?.id) {
            try {
                const serviceRef = doc(db, 'services', service.id);
                await updateDoc(serviceRef, {
                    usageCount: increment(1)
                });
            } catch (error) {
                console.error("Failed to update usage count:", error);
                // This is a non-critical error, so we don't show it to the user.
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setResult(`${t('serviceSavedError')}: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        setRetryMessage('');
    }
  };
  
  const handleClose = () => {
    setFormData({});
    setResult('');
    setIsLoading(false);
    setRetryMessage('');
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    onClose();
  }

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
              <title>${service?.title[language] || 'Print'}</title>
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

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{service.title[language]}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Form Section */}
            <div className="lg:col-span-1 flex flex-col">
                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-grow">
                    <div className="flex-grow space-y-4">
                        {service.formInputs.map(input => (
                            <div key={input.name}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{input.label[language]}</label>
                            {input.type === 'textarea' && <textarea name={input.name} onChange={handleInputChange} rows={4} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />}
                            {input.type === 'text' && <input type="text" name={input.name} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />}
                            {input.type === 'date' && <input type="date" name={input.name} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />}
                            {input.type === 'select' && (
                                <select name={input.name} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="">{`Select ${input.label[language]}`}</option>
                                {input.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label[language]}</option>)}
                                </select>
                            )}
                            {input.type === 'file' && (
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <File className="mx-auto h-12 w-12 text-gray-400"/>
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label htmlFor={input.name} className="relative cursor-pointer bg-white dark:bg-dark-card-bg rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
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
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                        <button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center">
                            {isLoading && <Loader2 className="animate-spin mr-2" size={20} />}
                            {t('executeTask')}
                        </button>
                        
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full sm:w-auto justify-end">
                            {/* Output Length */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('outputLength')}</span>
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
                            {/* Output Language */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{t('outputLanguage')}</span>
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
                    </div>
                </form>
            </div>


            {/* Result Section */}
            <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg flex flex-col">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary-500" size={32}/>
                      <p className="mt-2 text-gray-500 text-center">{retryMessage || t('generatingResponse')}</p>
                  </div>
              ) : result ? (
                 <div className="flex flex-col w-full h-full">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-2 md:gap-4 text-sm text-gray-600 dark:text-gray-300">
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
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={handleClear} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                     <div className="max-w-none text-sm p-4 overflow-y-auto flex-grow">
                        {result.trim().startsWith('<section') ? (
                            <div dangerouslySetInnerHTML={{ __html: result }} />
                        ) : (
                             <pre 
                                className="whitespace-pre-wrap leading-loose text-left rtl:text-right bg-transparent p-0 m-0 transition-all duration-200 text-gray-800 dark:text-gray-200"
                                style={{ fontSize: '16px', fontFamily: 'Calibri, Tajawal, sans-serif' }}
                            >
                                {result}
                            </pre>
                        )}
                    </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                  {t('resultPlaceholder')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceExecutionModal;