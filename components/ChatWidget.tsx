
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useChat } from '../hooks/useChat';
import { GoogleGenAI, Chat } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [userLocation, setUserLocation] = useState('');
  const { t, dir, language } = useLanguage();
  const { chatContext, setChatContext } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch location on mount with fallback
  useEffect(() => {
    const fetchLocation = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                setUserLocation(data.country_name);
            } else {
                throw new Error('Primary API failed');
            }
        } catch (error) {
            try {
                const fallback = await fetch('https://ipwho.is/');
                if (fallback.ok) {
                    const data = await fallback.json();
                    if (data.success) setUserLocation(data.country);
                }
            } catch (e) {
                // Fail silently or log warn
                console.warn("Could not fetch user location for chat context.");
            }
        }
    };
    fetchLocation();
  }, []);

  // Initialize Chat when opened or when context changes
  useEffect(() => {
    if (!isOpen) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    let locationContext = '';
    if (userLocation) {
        locationContext = ` The user is currently located in ${userLocation}. Provide answers relevant to ${userLocation}'s laws and regulations where applicable.`;
    }

    let documentContext = '';
    if (chatContext) {
        documentContext = `
        
        IMPORTANT CONTEXT:
        The user is currently viewing a generated legal document or result. 
        Here is the content of that document:
        """
        ${chatContext}
        """
        
        The user may ask follow-up questions about this specific document, ask for modifications, or ask for explanations. 
        Always refer to this content if the user's question seems related to it.
        `;
    }

    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a friendly and helpful legal assistant named "The Smart Assistant". Your purpose is to provide general information and support on legal topics.${locationContext}${documentContext} You MUST end every single response with the following disclaimer, translated to the user's language (${language}): "Disclaimer: This is an AI assistant. Please consult with a qualified professional for legal advice."`,
      },
    });
    
    setChat(newChat);
    
    // If there's a new context, we might want to add a system message or just rely on the system instruction.
    // Let's add a visual indicator if context is loaded but no messages yet.
    if (chatContext && messages.length === 0) {
       // Optional: Add a "system" message to UI to show user that context is loaded
    }

  }, [isOpen, chatContext, language, userLocation]); // Re-init chat when context changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: userMessage.text });
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
      setMessages([]);
      setChatContext(null); // Clear the document context
      // Re-initialization will happen via useEffect because setChatContext triggers it
  };

  if (!isOpen) {
      return null;
  }

  return (
    <>
        {/* Overlay */}
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300"
            onClick={onClose}
        />
        
        {/* Chat Widget - Centered */}
        <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100vw-2rem)] sm:w-[90vw] max-w-md h-[75vh] max-h-[600px] bg-light-card-bg dark:bg-dark-card-bg rounded-2xl shadow-2xl flex flex-col transition-all duration-300 border border-primary-100 dark:border-dark-border"
            style={{ 
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card-bg rounded-t-2xl">
                <div className="flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t('aiAssistant')}</h3>
                    {chatContext && (
                        <span className="text-[10px] text-primary-600 dark:text-primary-400 flex items-center gap-1">
                            <MessageSquarePlus size={10} />
                            {language === 'ar' ? 'مرتبط بالنتيجة الحالية' : 'Linked to current result'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
                    >
                        <MessageSquarePlus size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={t('cancel')}
                    >
                    <X size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg">
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-60">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟' : 'Hello! How can I help you today?'}
                        </p>
                        {chatContext && (
                            <p className="text-xs text-primary-600 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded">
                                {language === 'ar' ? 'يمكنك سؤالي عن المستند الذي تم إنشاؤه.' : 'You can ask me about the generated document.'}
                            </p>
                        )}
                    </div>
                )}
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
                    }`}
                    >
                    <pre className="text-sm whitespace-pre-wrap font-sans">{msg.text}</pre>
                    </div>
                </div>
                ))}
                {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700">
                        <Loader2 className="animate-spin text-primary-500" size={20}/>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card-bg rounded-b-2xl">
                <div className="relative flex items-center gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('typeMessage')}
                    className="flex-grow py-2.5 pl-4 pr-4 border rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-0 transition-all"
                    aria-label={t('typeMessage')}
                />
                <button
                    type="submit"
                    className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300 transition-colors shadow-md ${dir === 'rtl' ? '-rotate-180' : ''}`}
                    disabled={isLoading || !inputValue.trim()}
                    aria-label={t('send')}
                >
                    <Send size={18} />
                </button>
                </div>
            </form>
        </div>
    </>
  );
};

export default ChatWidget;
