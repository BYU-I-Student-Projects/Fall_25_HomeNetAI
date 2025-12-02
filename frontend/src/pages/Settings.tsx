import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getDarkMode, saveDarkMode, exportData, importData, resetData } from "@/lib/storage";
import { apiClearUserData, apiGetSettings, apiUpdateSettings, type UserSettings } from "@/services/api";
import { Download, Upload, RotateCcw, Moon, Loader2, Settings as SettingsIcon, Bell } from "lucide-react";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(getDarkMode());
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSettingUpdate = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    setSavingSettings(true);
    try {
      const updatedSettings = { ...settings, ...updates };
      await apiUpdateSettings(updatedSettings);
      setSettings(updatedSettings);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await apiGetSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error loading settings",
          description: "Could not load your preferences from the server.",
          variant: "destructive"
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleDarkModeToggle = async (checked: boolean) => {
    setDarkMode(checked);
    saveDarkMode(checked);
    await handleSettingUpdate({ theme: checked ? "dark" : "light" });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `homenet-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your data has been downloaded successfully",
    });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          importData(data);
          toast({
            title: "Data imported",
            description: "Your data has been restored successfully. Please refresh the page.",
          });
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          toast({
            title: "Import failed",
            description: "The file format is invalid",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      try {
        // Clear database data
        await apiClearUserData();
        
        // Clear local storage data
        resetData();
        
        toast({
          title: "Data reset successfully",
          description: "All locations, devices, and rules have been cleared from both database and local storage. Refreshing page...",
        });
        
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        console.error("Failed to clear user data:", error);
        toast({
          title: "Reset failed",
          description: error?.response?.data?.detail || "Failed to clear data from database. Local data has been cleared.",
          variant: "destructive",
        });
        
        // Still clear local storage even if database fails
        resetData();
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences and data
        </p>
      </div>

      {/* AI/ML Preferences */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            AI & ML Preferences
          </CardTitle>
          <CardDescription>
            Configure your AI assistant and analytics preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : settings ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit-system">Unit System</Label>
                <Select
                  value={settings.unit_system}
                  onValueChange={(value) => handleSettingUpdate({ unit_system: value })}
                  disabled={savingSettings}
                >
                  <SelectTrigger id="unit-system">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                    <SelectItem value="metric">Metric (°C, km/h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alerts">All Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable all weather alerts
                  </p>
                </div>
                <Switch
                  id="alerts"
                  checked={settings.alerts_enabled}
                  onCheckedChange={(checked) => handleSettingUpdate({ alerts_enabled: checked })}
                  disabled={savingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => handleSettingUpdate({ email_notifications: checked })}
                  disabled={savingSettings}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Failed to load settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive alerts and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : settings ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="temp-alerts">Temperature Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about extreme temperatures
                  </p>
                </div>
                <Switch
                  id="temp-alerts"
                  checked={settings.temperature_alerts}
                  onCheckedChange={(checked) => handleSettingUpdate({ temperature_alerts: checked })}
                  disabled={savingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="precip-alerts">Precipitation Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about rain and snow
                  </p>
                </div>
                <Switch
                  id="precip-alerts"
                  checked={settings.precipitation_alerts}
                  onCheckedChange={(checked) => handleSettingUpdate({ precipitation_alerts: checked })}
                  disabled={savingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="wind-alerts">Wind Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about high winds
                  </p>
                </div>
                <Switch
                  id="wind-alerts"
                  checked={settings.wind_alerts}
                  onCheckedChange={(checked) => handleSettingUpdate({ wind_alerts: checked })}
                  disabled={savingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anomaly-alerts">Anomaly Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about unusual weather patterns
                  </p>
                </div>
                <Switch
                  id="anomaly-alerts"
                  checked={settings.anomaly_alerts}
                  onCheckedChange={(checked) => handleSettingUpdate({ anomaly_alerts: checked })}
                  disabled={savingSettings}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how HomeNetAI looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, or reset your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Data</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Download all your locations, devices, and preferences as a JSON file
            </p>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Import Data</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Restore your data from a previously exported file
            </p>
            <Button onClick={handleImport} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Reset Data</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Clear all locations, devices, and automation rules
            </p>
            <Button onClick={handleReset} variant="destructive" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>About HomeNetAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Version 1.0.0</p>
          <p>A modern smart home and weather dashboard</p>
          <p className="pt-2 text-xs">
            This is a frontend-only demo application. All data is stored locally in your browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
