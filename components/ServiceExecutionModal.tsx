
import React, { useState, useCallback, useEffect } from 'react';
import { X, File, Loader2, Download, Printer, Volume2, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Service, Language } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { runGemini } from '../services/geminiService';
import { exportTextToPdf } from '../services/pdfService';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ServiceExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const ServiceExecutionModal: React.FC<ServiceExecutionModalProps> = ({ isOpen, onClose, service }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState<Language>(language);
  const [fontSize, setFontSize] = useState(16);

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
    prompt += `\n\nIMPORTANT: The output must be in ${outputLanguage === Language.AR ? 'Arabic' : 'English'} language.`;
    return prompt;
  }, [formData, service, outputLanguage]);

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
        const response = await runGemini(service.geminiModel, prompt, file, handleRetry, service.geminiConfig);
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
              <title>${service?.title[language] || 'Print'}</title>
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

  const handleDownload = async () => {
    if (!result) return;
    const title = service?.title[language] || t('results');
    await exportTextToPdf(title, result, `result-${Date.now()}`, language);
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
                    
                    <div className="flex flex-row items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                        <button type="submit" disabled={isLoading} className="flex-grow bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center justify-center">
                            {isLoading && <Loader2 className="animate-spin mr-2" size={20} />}
                            {t('executeTask')}
                        </button>
                        
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
                             <button onClick={handleIncreaseFont} className="hover:text-primary-500 transition-colors p-1" title="Zoom In">
                                 <ZoomIn size={18} />
                             </button>
                             <button onClick={handleDecreaseFont} className="hover:text-primary-500 transition-colors p-1" title="Zoom Out">
                                 <ZoomOut size={18} />
                             </button>
                             <button onClick={handleDownload} className="hover:text-primary-500 transition-colors p-1" title="Download PDF">
                                 <Download size={18} />
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
                            className="whitespace-pre-wrap font-naskh leading-loose text-left rtl:text-right bg-transparent p-0 m-0 transition-all duration-200"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {result}
                        </pre>
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
