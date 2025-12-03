import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authAPI } from "@/services/api";
import { CloudRain } from "lucide-react";

// Development bypass - set to true to skip login
const BYPASS_AUTH = false; // Set to false to enable authentication

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect to dashboard if bypass is enabled
  if (BYPASS_AUTH) {
    // Set a dummy token if none exists
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', 'dev-bypass-token');
    }
    // Redirect to dashboard immediately
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.login(username, password);
      
      // Get user info
      const user = await authAPI.getCurrentUser();
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }

    setLoading(true);
    
    try {
      const result = await apiLogin(email, password);
      setToken(result.access_token);
      const me = await apiMe();
      saveUser({
        id: String(me.id),
        email: me.email,
        name: me.username,
        createdAt: me.created_at,
      });
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Login failed", description: err?.response?.data?.detail ?? "Invalid credentials", variant: "destructive" });
      return;
    }
    
    toast({
      title: "Welcome back!",
      description: `Logged in successfully`,
    });
    
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card animate-fade-in">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center gap-2">
            <div className="p-3 rounded-lg bg-primary/10">
              <CloudRain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-foreground">
              HomeNetAI
            </CardTitle>
            <CardDescription className="mt-2">
              Sign in to access your smart home dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;

