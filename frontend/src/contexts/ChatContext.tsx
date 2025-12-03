import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenChat = () => setChatOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  return (
    <ChatContext.Provider value={{ chatOpen, setChatOpen }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

