import { Bell, Menu, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  const { chatOpen } = useChat();

  return (
    <div 
      className="fixed top-0 left-0 h-20 bg-gradient-to-br from-background to-secondary z-50 flex items-center transition-all duration-300 ease-in-out" 
      style={{ 
        position: 'fixed', 
        zIndex: 50,
        right: chatOpen ? '420px' : '0px'
      }}
    >
      {/* HomeNetAI - Top left */}
      <div className="absolute left-6">
        <h1 className="text-xl font-bold text-[#f97316]">HomeNetAI</h1>
      </div>
      
      {/* Centered Page Title */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <h2 className="text-xl font-semibold text-[#f97316]">{title}</h2>
      </div>
      
      {/* Right side - Ask Now Button and Icons */}
      <div className="absolute right-6 flex items-center gap-3">
        <Button
          onClick={() => {
            const event = new CustomEvent('openChat');
            window.dispatchEvent(event);
          }}
          className="h-[50px] px-6 rounded-[30px] bg-[#f97316] text-base font-semibold text-white hover:bg-[#ea580c] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          Ask Now
        </Button>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-card shadow-sm hover:bg-secondary border-0">
          <Bell className="h-6 w-6 text-[#f97316]" />
        </Button>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-card shadow-sm hover:bg-secondary border-0">
          <Menu className="h-6 w-6 text-[#f97316]" />
        </Button>
      </div>
    </div>
  );
};

