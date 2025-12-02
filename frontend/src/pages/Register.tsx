import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { saveUser, setToken } from "@/lib/storage";
import { apiRegister, apiMe } from "@/services/api";
import { CloudRain, Check } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const calculatePasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.length >= 12) strength += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 25;
    if (/\d/.test(pass)) strength += 15;
    if (/[^a-zA-Z\d]/.test(pass)) strength += 10;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiRegister(name, email, password);
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
      toast({ title: "Registration failed", description: err?.response?.data?.detail ?? "Try different credentials", variant: "destructive" });
      return;
    }
    
    toast({
      title: "Account created!",
      description: `Welcome to HomeNetAI, ${name}!`,
    });
    
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-weather-primary/10 via-background to-ai-primary/10 p-4">
      <Card className="w-full max-w-md border bg-card shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-weather-primary to-weather-secondary shadow-lg">
              <CloudRain className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-weather-primary to-ai-primary bg-clip-text text-transparent">
              Join HomeNetAI
            </CardTitle>
            <CardDescription className="mt-2">
              Create your account to get started
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength} className="flex-1" />
                    <span className="text-xs text-muted-foreground">{passwordStrength}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength < 40 && "Weak password"}
                    {passwordStrength >= 40 && passwordStrength < 70 && "Fair password"}
                    {passwordStrength >= 70 && passwordStrength < 90 && "Good password"}
                    {passwordStrength >= 90 && "Strong password"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-weather-primary to-weather-secondary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
