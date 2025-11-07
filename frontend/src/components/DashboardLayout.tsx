import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CloudRain, 
  LayoutDashboard, 
  MapPin, 
  Home, 
  Sparkles, 
  BarChart3,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Search,
  Menu,
  X,
} from "lucide-react";
import { getDarkMode, saveDarkMode } from "@/lib/storage";
import { authAPI } from "@/services/api";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(getDarkMode());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    saveDarkMode(darkMode);
  }, [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/locations", icon: MapPin, label: "Locations" },
    { path: "/smart-home", icon: Home, label: "Smart Home" },
    { path: "/ai-insights", icon: Sparkles, label: "AI Insights" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div 
              className="p-2 rounded-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--weather-primary)), hsl(var(--weather-secondary)))" }}
            >
              <CloudRain className="h-5 w-5 text-white" />
            </div>
            <span 
              className="hidden sm:inline font-bold"
              style={{ 
                background: "linear-gradient(90deg, hsl(var(--weather-primary)), hsl(var(--ai-primary)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent"
              }}
            >
              HomeNetAI
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-weather-primary to-ai-primary flex items-center justify-center text-white font-bold">
                    {user?.username.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium">{user?.username || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-300 pt-16",
            "md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive
                      ? "bg-gradient-to-r from-weather-primary/10 to-ai-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="container p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

