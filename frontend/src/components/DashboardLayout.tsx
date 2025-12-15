import Sidebar from "./Sidebar";
import { FloatingChatbot } from "./FloatingChatbot";
import { ChatProvider, useChat } from "../contexts/ChatContext";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayoutContent = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { chatOpen, setChatOpen } = useChat();

  return (
    <div className="min-h-screen flex relative z-10 bg-background">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarCollapsed ? '96px' : '240px', // Adjusted for floating sidebar with margins
          marginRight: chatOpen ? '420px' : '0px' // Shrink when chat is open
        }}
      >
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Chatbot - Available on all pages */}
      <FloatingChatbot isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <ChatProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ChatProvider>
  );
};

export default DashboardLayout;
