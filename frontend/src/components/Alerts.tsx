import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
        return {
          bg: '#fee',
          border: '#dc3545',
          icon: '#dc3545',
          text: '#721c24'
        };
      case 'warning':
        return {
          bg: '#fff3cd',
          border: '#ffc107',
          icon: '#ff9800',
          text: '#856404'
        };
      case 'info':
        return {
          bg: '#d1ecf1',
          border: '#17a2b8',
          icon: '#17a2b8',
          text: '#0c5460'
        };
      case 'recommendation':
        return {
          bg: '#d4edda',
          border: '#28a745',
          icon: '#28a745',
          text: '#155724'
        };
      default:
        return {
          bg: '#f8f9fa',
          border: '#6c757d',
          icon: '#6c757d',
          text: '#383d41'
        };
    }
  };

  const getIconComponent = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      'cloud-rain': '🌧️',
      'cloud-drizzle': '🌦️',
      'thermometer-snow': '🥶',
      'thermometer-sun': '🌡️',
      'snowflake': '❄️',
      'sun': '☀️',
      'cloud-sun': '🌤️',
      'droplet': '💧',
      'alert-triangle': '⚠️',
      'wind': '💨',
      'default': '📢'
    };
    
    return iconMap[icon] || iconMap['default'];
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#6c757d'
      }}>
        Loading alerts...
      </div>
    );
  }

  if (error && error !== 'Authentication required') {
    return (
      <div style={{ 
        padding: '15px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        color: '#721c24',
        marginBottom: '20px'
      }}>
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
      <div style={{ 
        padding: '20px',
        backgroundColor: '#d4edda',
        border: '2px solid #28a745',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#155724',
          marginBottom: '5px'
        }}>
          All Clear
        </div>
        <div style={{ 
          fontSize: '14px',
          color: '#155724',
          opacity: '0.8'
        }}>
          No weather alerts or warnings at this time
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '25px' }}>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: '700',
        color: '#333',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>🔔</span>
        <span>Smart Alerts</span>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#6c757d',
          backgroundColor: '#e9ecef',
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {alerts.length}
        </span>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px' 
      }}>
        {alerts.map((alert, index) => {
          const styles = getSeverityStyles(alert.severity);
          
          return (
            <div
              key={index}
              style={{
                backgroundColor: styles.bg,
                border: `2px solid ${styles.border}`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '28px',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {getIconComponent(alert.icon)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    color: styles.text,
                    marginBottom: '6px'
                  }}>
                    {alert.title}
                  </div>
                  
                  <div style={{ 
                    fontSize: '14px',
                    color: styles.text,
                    marginBottom: '8px',
                    lineHeight: '1.5'
                  }}>
                    {alert.message}
                  </div>
                  
                  {alert.recommendation && (
                    <div style={{ 
                      fontSize: '13px',
                      color: styles.text,
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>💡</span>
                      <span>{alert.recommendation}</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  fontSize: '11px',
                  color: styles.text,
                  opacity: '0.7',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap'
                }}>
                  {alert.severity}
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
