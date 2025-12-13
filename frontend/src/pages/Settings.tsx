import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Moon, Sun, Thermometer, Wind } from "lucide-react";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { temperatureUnit, setTemperatureUnit, windSpeedUnit, setWindSpeedUnit } = useSettings();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageHeader title="Settings" />
      
      <div className="flex-1 overflow-auto flex flex-col pt-20 pb-6 px-6">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how HomeNetAI looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground">Dark Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className={`h-4 w-4 ${isDark ? 'text-muted-foreground' : 'text-orange-500'}`} />
                  <Switch 
                    checked={isDark} 
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className={`h-4 w-4 ${isDark ? 'text-orange-500' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Units
              </CardTitle>
              <CardDescription>
                Choose your preferred measurement units
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Temperature Unit */}
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground">Temperature Unit</label>
                  <p className="text-sm text-muted-foreground">
                    Display temperatures in Fahrenheit or Celsius
                  </p>
                </div>
                <RadioGroup 
                  value={temperatureUnit} 
                  onValueChange={(value) => setTemperatureUnit(value as "fahrenheit" | "celsius")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fahrenheit" id="fahrenheit" />
                    <Label htmlFor="fahrenheit" className="cursor-pointer">Fahrenheit (°F)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="celsius" id="celsius" />
                    <Label htmlFor="celsius" className="cursor-pointer">Celsius (°C)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Wind Speed Unit */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    Wind Speed Unit
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Display wind speed in mph or km/h
                  </p>
                </div>
                <RadioGroup 
                  value={windSpeedUnit} 
                  onValueChange={(value) => setWindSpeedUnit(value as "mph" | "kmh")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mph" id="mph" />
                    <Label htmlFor="mph" className="cursor-pointer">Miles per hour (mph)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="kmh" id="kmh" />
                    <Label htmlFor="kmh" className="cursor-pointer">Kilometers per hour (km/h)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
