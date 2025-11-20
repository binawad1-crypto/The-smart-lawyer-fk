
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { GoogleGenAI, Chat } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [userLocation, setUserLocation] = useState('');
  const { t, dir, language } = useLanguage();
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

  // Initialize Chat with location context
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    let locationContext = '';
    if (userLocation) {
        locationContext = ` The user is currently located in ${userLocation}. Provide answers relevant to ${userLocation}'s laws and regulations where applicable.`;
    }

    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a friendly and helpful legal assistant named "The Smart Assistant". Your purpose is to provide general information and support on legal topics.${locationContext} You MUST end every single response with the following disclaimer, translated to the user's language (${language}): "Disclaimer: This is an AI assistant. Please consult with a qualified professional for legal advice."`,
      },
    });
    setChat(newChat);
  }, [language, userLocation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

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

  return (
    <>
      {isOpen && (
        <div
          className={`fixed bottom-24 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-[999] w-[calc(100vw-2rem)] max-w-sm h-[60vh] bg-light-card-bg dark:bg-dark-card-bg rounded-lg shadow-2xl flex flex-col transition-transform duration-300 transform-gpu ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          aria-modal="true"
          role="dialog"
        >
          <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t('aiAssistant')}</h3>
            <button
              onClick={toggleChat}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('cancel')}
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  <pre className="text-sm whitespace-pre-wrap font-sans">{msg.text}</pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                     <Loader2 className="animate-spin text-primary-500" size={20}/>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('typeMessage')}
                className="w-full py-2 pl-4 pr-12 border rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t('typeMessage')}
              />
              <button
                type="submit"
                className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-1' : 'right-1'} flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300`}
                disabled={isLoading || !inputValue.trim()}
                aria-label={t('send')}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`fixed bottom-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-[1000] w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform duration-200 hover:scale-110`}
        aria-label={t('chatWithAI')}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </>
  );
};

export default ChatWidget;