
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, MessageSquare, Send, Loader2, Tag, ArrowRight, ArrowLeft, LifeBuoy, ChevronDown } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ticket, TicketMessage } from '../types';

const SupportModal: React.FC = () => {
  const { t, language, dir } = useLanguage();
  const { currentUser } = useAuth();
  const { settings } = useSiteSettings();
  
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [hasUnread, setHasUnread] = useState(false);

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

  // 1. Listener for Badge (Always active when logged in)
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => doc.data() as Ticket);
      const unread = ticketsData.some(t => t.unreadUser === true);
      setHasUnread(unread);
    }, (error) => console.error("Error checking unread tickets:", error));

    return () => unsubscribe();
  }, [currentUser]);


  // 2. Listener for Tickets Data (Only when Open)
  useEffect(() => {
    if (!currentUser || !isOpen) return;
    
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
  }, [currentUser, isOpen]);

  // 3. Fetch Messages for Selected Ticket
  useEffect(() => {
    if (!selectedTicket || !isOpen) return;

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
  }, [selectedTicket, isOpen]);

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

  const toggleOpen = () => {
      setIsOpen(!isOpen);
  }

  if (!currentUser) return null;

  // Positioning: Opposite to the ChatWidget (which is typically bottom-right in LTR, bottom-left in RTL)
  // So Support Widget will be bottom-left in LTR, bottom-right in RTL
  const positionClasses = dir === 'rtl' ? 'right-6' : 'left-6';
  const originClass = dir === 'rtl' ? 'origin-bottom-right' : 'origin-bottom-left';

  return (
    <div className="z-[60]">
      {/* The Window Panel */}
      <div 
        className={`fixed bottom-24 ${positionClasses} w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'} ${originClass} z-[60]`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <LifeBuoy size={20} className="animate-pulse-slow" />
            <span className="font-bold text-lg">
                 {view === 'list' ? t('support') : view === 'new' ? t('openTicket') : selectedTicket?.subject}
            </span>
          </div>
          <div className="flex items-center gap-2">
             {view !== 'list' && (
                 <button onClick={() => setView('list')} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                     <ArrowRight size={18} className="rtl:hidden" />
                     <ArrowLeft size={18} className="ltr:hidden" />
                 </button>
             )}
             <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <ChevronDown size={20} />
            </button>
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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap border ${ticket.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' : ticket.status === 'answered' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
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
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
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
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
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
                        <div className={`text-[10px] mt-1 opacity-70 text-right`}>
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
                    className="flex-grow px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-md flex-shrink-0">
                    <Send size={18} className="ltr:rotate-0 rtl:rotate-180"/>
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 ${positionClasses} z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:scale-110 transition-all duration-300 flex items-center justify-center group`}
        aria-label="Support"
      >
        {hasUnread && !isOpen && (
            <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-red-500 transform translate-x-1 -translate-y-1 animate-bounce"></span>
        )}
        {isOpen ? (
             <ChevronDown size={28} className="transition-transform duration-300 group-hover:translate-y-1" />
        ) : (
             <LifeBuoy size={28} className="transition-transform duration-300 group-hover:rotate-12" />
        )}
      </button>
    </div>
  );
};

export default SupportModal;
