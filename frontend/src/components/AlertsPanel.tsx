import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGetAlerts, apiMarkAlertAsRead, apiGenerateAlerts, type Alert } from "@/services/api";
import { AlertTriangle, CheckCircle, Info, X, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertsPanelProps {
  locationId?: string;
  compact?: boolean;
}

const AlertsPanel = ({ locationId, compact = false }: AlertsPanelProps) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadAlerts = async () => {
    if (!locationId) return;

    setLoading(true);
    try {
      const data = await apiGetAlerts(Number(locationId));
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAlerts = async () => {
    if (!locationId) return;

    setGenerating(true);
    try {
      await apiGenerateAlerts(Number(locationId));
      await loadAlerts();
      toast({
        title: "Alerts generated",
        description: "New weather alerts have been generated.",
      });
    } catch (error) {
      console.error("Failed to generate alerts:", error);
      toast({
        title: "Error",
        description: "Failed to generate alerts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await apiMarkAlertAsRead(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({
        title: "Alert dismissed",
        description: "The alert has been marked as read.",
      });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [locationId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);

  if (compact) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-weather-primary" />
              <CardTitle className="text-lg">Weather Alerts</CardTitle>
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive">{unreadAlerts.length}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAlerts}
              disabled={generating || !locationId}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-weather-primary" />
            </div>
          ) : unreadAlerts.length > 0 ? (
            <div className="space-y-2">
              {unreadAlerts.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.alert_type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {unreadAlerts.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{unreadAlerts.length - 3} more alerts
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active weather alerts
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-weather-primary" />
              Weather Alerts
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive">{unreadAlerts.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              ML-powered weather warnings and recommendations
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerateAlerts}
            disabled={generating || !locationId}
            variant="outline"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Alerts
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-weather-primary" />
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                  alert.is_read ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.alert_type}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No active weather alerts. All clear!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
