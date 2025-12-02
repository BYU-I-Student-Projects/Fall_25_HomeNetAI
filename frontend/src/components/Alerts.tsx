import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  CloudRain, 
  CloudDrizzle, 
  Snowflake, 
  Sun, 
  CloudSun, 
  Droplets, 
  Wind, 
  ThermometerSun, 
  ThermometerSnowflake,
  Info,
  Lightbulb,
  CheckCircle2,
  Bell
} from 'lucide-react';

interface Alert {
  type: string;
  severity: 'critical' | 'warning' | 'info' | 'recommendation';
  title: string;
  message: string;
  recommendation: string;
  timestamp: string;
  icon: string;
}

interface AlertsProps {
  locationId: number;
}

const Alerts: React.FC<AlertsProps> = ({ locationId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [locationId]);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `http://localhost:8000/alerts/${locationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setAlerts(response.data.alerts || []);
      }
      setLoading(false);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      
      // Don't show error for authentication issues - just hide alerts
      if (err.response?.status === 401) {
        setAlerts([]);
        setError(null);
      } else {
        setError(err.response?.data?.detail || 'Failed to load alerts');
      }
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-500 text-amber-900';
      case 'info':
        return 'bg-blue-50 border-blue-400 text-blue-900';
      case 'recommendation':
        return 'bg-green-50 border-green-500 text-green-900';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-900';
    }
  };

  const getIconComponent = (icon: string, className: string) => {
    const props = { className };
    
    switch (icon) {
      case 'cloud-rain': return <CloudRain {...props} />;
      case 'cloud-drizzle': return <CloudDrizzle {...props} />;
      case 'thermometer-snow': return <ThermometerSnowflake {...props} />;
      case 'thermometer-sun': return <ThermometerSun {...props} />;
      case 'snowflake': return <Snowflake {...props} />;
      case 'sun': return <Sun {...props} />;
      case 'cloud-sun': return <CloudSun {...props} />;
      case 'droplet': return <Droplets {...props} />;
      case 'alert-triangle': return <AlertTriangle {...props} />;
      case 'wind': return <Wind {...props} />;
      default: return <Info {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center text-gray-500 text-sm animate-pulse">
        Loading alerts...
      </div>
    );
  }

  if (error && error !== 'Authentication required') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-5 text-sm">
        {error}
      </div>
    );
  }
  
  // Don't show anything if authentication is required (user not logged in)
  if (error === 'Authentication required') {
    return null;
  }

  if (alerts.length === 0) {
    return (
      <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <div className="text-lg font-semibold text-green-800 mb-1">
          All Clear
        </div>
        <div className="text-sm text-green-700 opacity-90">
          No weather alerts or warnings at this time
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-gray-700" />
        <span className="text-lg font-bold text-gray-800">Smart Alerts</span>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((alert, index) => {
          const styleClasses = getSeverityStyles(alert.severity);
          
          return (
            <div
              key={index}
              className={`relative border-l-4 rounded-r-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styleClasses.replace('border-', 'border-l-').replace('bg-', 'bg-opacity-50 bg-')}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconComponent(alert.icon, "h-6 w-6")}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold mb-1 leading-tight">
                    {alert.title}
                  </div>
                  
                  <div className="text-sm opacity-90 mb-2 leading-relaxed">
                    {alert.message}
                  </div>
                  
                  {alert.recommendation && (
                    <div className="flex items-start gap-2 text-xs bg-white/60 p-2 rounded-lg font-medium">
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{alert.recommendation}</span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-black/5">
                    {alert.severity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;
