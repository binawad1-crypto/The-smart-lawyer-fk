
import React, { createContext, useState, ReactNode, useCallback } from 'react';

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chatContext: string | null;
  setChatContext: (context: string | null) => void;
  openChatWithContext: (context: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | null>(null);

  const openChatWithContext = useCallback((context: string) => {
    setChatContext(context);
    setIsOpen(true);
  }, []);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, chatContext, setChatContext, openChatWithContext }}>
      {children}
    </ChatContext.Provider>
  );
};
