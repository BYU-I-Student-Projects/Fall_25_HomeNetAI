import { Card, CardContent } from "@/components/ui/card";

const Analytics = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-weather-primary to-ai-primary bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Insights and trends from your locations and devices
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground">Analytics features coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;

