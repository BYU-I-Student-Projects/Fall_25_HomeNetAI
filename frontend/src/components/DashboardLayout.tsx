import Sidebar from "./Sidebar";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex relative z-10 bg-gray-100 overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <div 
        className="flex-1 flex flex-col h-screen transition-[margin-left] duration-200 ease-in-out overflow-hidden"
        style={{
          marginLeft: sidebarCollapsed ? '96px' : '240px' // Adjusted for floating sidebar with margins
        }}
      >
        {/* Main content area */}
        <main className="flex-1 overflow-hidden h-full">
          <div className="h-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
