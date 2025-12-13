import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Sparkles,
  Radio,
} from "lucide-react";
import { authAPI } from "@/services/api";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  email: string;
}

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load user info from API
    const loadUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
        });
      } catch (error) {
        console.error('Failed to load user:', error);
        // Don't crash if user load fails - keep working
        setUser({
          id: 0,
          username: 'User',
          email: '',
        });
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: "HOME",
      items: [
        { path: "/", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/locations", icon: MapPin, label: "Locations & Smart Home" },
        { path: "/pico-devices", icon: Radio, label: "Pico Devices" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { path: "/analytics", icon: BarChart3, label: "Analytics" },
        { path: "/ai-insights", icon: Sparkles, label: "AI Insights" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { path: "/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar - Floating design */}
      <aside
        className={cn(
          "fixed top-20 bottom-6 left-6 z-50 bg-card flex flex-col",
          "rounded-2xl shadow-lg border border-border",
          "transition-[width] duration-200 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-52",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* User Avatar Section - Top of sidebar */}
        <div className="relative flex flex-col items-center pt-6 pb-4 px-4">
          <div className="h-12 w-12 rounded-full bg-smart-primary/10 flex items-center justify-center text-smart-primary font-bold mb-3 flex-shrink-0">
            {user?.username.charAt(0).toUpperCase() || 'U'}
          </div>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-secondary absolute top-4 right-4"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-secondary"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {navSections.flatMap((section) => 
              section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                      "justify-center md:justify-start",
                      isActive
                        ? "bg-smart-primary/10 text-smart-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      "overflow-hidden whitespace-nowrap text-sm font-medium",
                      sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })
            )}
          </nav>

        {/* Logout Button - Bottom of sidebar */}
        <div className="p-4 pt-2 mt-auto">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-800",
              "border border-transparent transition-all",
              "justify-center md:justify-start"
            )}
            title={sidebarCollapsed ? "Log out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className={cn(
              "overflow-hidden whitespace-nowrap ml-2 font-medium",
              sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Log out
            </span>
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu toggle button - only visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
    </>
  );
};

export default Sidebar;

