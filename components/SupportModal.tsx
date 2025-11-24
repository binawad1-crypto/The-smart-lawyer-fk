
import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Send, Loader2, ArrowRight, ArrowLeft, LifeBuoy } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ticket, TicketMessage } from '../types';

interface SupportPanelProps {
    className?: string;
}

const SupportPanel: React.FC<SupportPanelProps> = ({ className = '' }) => {
  const { t, language, dir } = useLanguage();
  const { currentUser } = useAuth();
  const { settings } = useSiteSettings();
  
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // New Ticket Form
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default ticket types if none in settings
  const defaultTypes = [
    t('technicalSupportType'),
    t('additionalService'),
    t('specialSubscription')
  ];
  
  const ticketTypes = settings?.ticketTypes && settings.ticketTypes.length > 0 
    ? settings.ticketTypes 
    : defaultTypes;

  // Listener for Tickets Data
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    const safetyTimer = setTimeout(() => setLoading(false), 5000);

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(safetyTimer);
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      
      // Client-side sort
      ticketsData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
      });

      setTickets(ticketsData);
      setLoading(false);

      // Auto-switch to new ticket if list is empty and we are in list view
      if (ticketsData.length === 0 && view === 'list') {
          setView('new');
      }
    }, (error) => {
        clearTimeout(safetyTimer);
        setLoading(false);
        if (tickets.length === 0) setView('new');
    });

    return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
    }
  }, [currentUser]);

  // Fetch Messages for Selected Ticket
  useEffect(() => {
    if (!selectedTicket) return;

    const q = query(
      collection(db, 'support_tickets', selectedTicket.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    if(selectedTicket.unreadUser) {
        updateDoc(doc(db, 'support_tickets', selectedTicket.id), { unreadUser: false }).catch(console.error);
    }

    return () => unsubscribe();
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !subject || !type || !initialMessage) return;

    setIsSubmitting(true);
    try {
      const ticketRef = await addDoc(collection(db, 'support_tickets'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        subject,
        type,
        status: 'open',
        createdAt: serverTimestamp(),
        lastUpdate: serverTimestamp(),
        unreadAdmin: true,
        unreadUser: false
      });

      await addDoc(collection(db, 'support_tickets', ticketRef.id, 'messages'), {
        content: initialMessage,
        senderId: currentUser.uid,
        senderRole: 'user',
        createdAt: serverTimestamp()
      });

      setSubject('');
      setType('');
      setInitialMessage('');
      setView('list');
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Error creating ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTicket || !newMessage.trim()) return;

    const msgContent = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'support_tickets', selectedTicket.id, 'messages'), {
        content: msgContent,
        senderId: currentUser.uid,
        senderRole: 'user',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        lastUpdate: serverTimestamp(),
        unreadAdmin: true,
        status: 'open'
      });
    } catch (error) {
      setNewMessage(msgContent); 
      console.error("Error sending message:", error);
    }
  };

  if (!currentUser) return null;

  return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden w-full ${className}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                <LifeBuoy size={20} />
             </div>
             <div>
                 <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                    {view === 'list' ? t('support') : view === 'new' ? t('openTicket') : selectedTicket?.subject}
                 </h2>
             </div>
          </div>
          <div className="flex items-center gap-2">
             {view !== 'list' && (
                 <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                     <ArrowRight size={20} className="rtl:hidden" />
                     <ArrowLeft size={20} className="ltr:hidden" />
                 </button>
             )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800/50 relative">
          
          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="flex flex-col h-full p-4">
               <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pb-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Loader2 className="animate-spin text-primary-500" size={32} />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                      <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-full mb-4">
                          <MessageSquare size={40} className="text-gray-400 dark:text-gray-500"/>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">{t('noTickets')}</p>
                      <p className="text-xs text-gray-500 mt-1">Start a conversation with our team.</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => { setSelectedTicket(ticket); setView('chat'); }}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${ticket.unreadUser ? 'bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-900 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                    >
                      {ticket.unreadUser && <div className="absolute top-0 right-0 rtl:left-0 w-2 h-full bg-primary-500"></div>}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-sm truncate pr-2 rtl:pl-2 ${ticket.unreadUser ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{ticket.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap border ${ticket.status === 'open' ? 'bg-primary-50 text-primary-700 border-primary-200' : ticket.status === 'answered' ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {t(ticket.status)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{ticket.type}</span>
                        <span>{ticket.lastUpdate?.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setView('new')} 
                className="mt-2 w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={20} /> {t('openTicket')}
              </button>
            </div>
          )}

          {/* NEW TICKET VIEW */}
          {view === 'new' && (
            <form onSubmit={handleCreateTicket} className="flex flex-col h-full p-4">
               <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t('ticketSubject')}</label>
                    <input 
                    type="text" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    required 
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
                    placeholder="Briefly describe the issue"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t('ticketType')}</label>
                    <div className="grid grid-cols-1 gap-2">
                        {ticketTypes.map((tType, idx) => (
                            <label key={idx} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${type === tType ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <input 
                                    type="radio" 
                                    name="ticketType" 
                                    value={tType} 
                                    checked={type === tType} 
                                    onChange={(e) => setType(e.target.value)} 
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                <span className={`ml-3 rtl:mr-3 text-sm font-medium ${type === tType ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>{tType}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">{t('message')}</label>
                    <textarea 
                    value={initialMessage} 
                    onChange={(e) => setInitialMessage(e.target.value)} 
                    required 
                    rows={4}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                    />
                </div>
               </div>
               <div className="pt-4 mt-auto">
                 <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : t('submitTicket')}
                 </button>
               </div>
            </form>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && selectedTicket && (
            <div className="flex flex-col h-full">
               <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50 dark:bg-gray-900/50">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.senderRole === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className={`text-xs mt-1 opacity-70 text-right`}>
                          {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                        </div>
                     </div>
                   </div>
                 ))}
                 <div ref={messagesEndRef} />
               </div>

               <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                 <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder={t('typeMessage')}
                    className="flex-grow px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-md flex-shrink-0">
                    <Send size={18} className="ltr:rotate-0 rtl:rotate-180"/>
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>
  );
};

export default SupportPanel;
