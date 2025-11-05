import { Card, CardContent } from "@/components/ui/card";

const AIInsights = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
          AI Insights
        </h1>
        <p className="text-muted-foreground mt-2">
          Intelligent recommendations and chat assistant
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground">AI insights features coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;

