import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferences and data
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>About HomeNetAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Version 1.0.0</p>
          <p>A modern smart home and weather dashboard</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

