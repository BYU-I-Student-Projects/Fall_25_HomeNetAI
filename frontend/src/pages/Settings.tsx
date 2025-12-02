import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Trash2, 
  Bell, 
  Thermometer, 
  CloudRain, 
  Wind, 
  AlertTriangle, 
  Mail, 
  Moon, 
  Sun, 
  Monitor, 
  Ruler 
} from "lucide-react";

interface Preferences {
  unit_system: string;
  theme: string;
  alerts_enabled: boolean;
  temperature_alerts: boolean;
  precipitation_alerts: boolean;
  wind_alerts: boolean;
  anomaly_alerts: boolean;
  email_notifications: boolean;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>({
    unit_system: 'imperial',
    theme: 'light',
    alerts_enabled: true,
    temperature_alerts: true,
    precipitation_alerts: true,
    wind_alerts: true,
    anomaly_alerts: true,
    email_notifications: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings. Please try again.' });
      }
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:8000/settings', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8000/settings/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelect = (key: keyof Preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <div className="text-lg font-medium text-gray-900">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:bg-gray-200"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500 mt-1">Manage your preferences and account</p>
            </div>
          </div>
          <Button 
            onClick={updatePreferences} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {/* Units Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Ruler className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Unit Preferences</CardTitle>
                  <CardDescription>Choose your preferred measurement system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => handleSelect('unit_system', 'imperial')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    preferences.unit_system === 'imperial'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Imperial System</span>
                    {preferences.unit_system === 'imperial' && (
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Fahrenheit (°F), Miles per hour (mph), Inches (in)</div>
                </div>

                <div 
                  onClick={() => handleSelect('unit_system', 'metric')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    preferences.unit_system === 'metric'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Metric System</span>
                    {preferences.unit_system === 'metric' && (
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Celsius (°C), Kilometers per hour (km/h), Millimeters (mm)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Monitor className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how HomeNetAI looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'auto', label: 'Auto', icon: Monitor }
                ].map((themeOption) => (
                  <div
                    key={themeOption.id}
                    onClick={() => handleSelect('theme', themeOption.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${
                      preferences.theme === themeOption.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <themeOption.icon className={`h-8 w-8 mx-auto mb-3 ${
                      preferences.theme === themeOption.id ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className={`font-medium ${
                      preferences.theme === themeOption.id ? 'text-purple-900' : 'text-gray-600'
                    }`}>
                      {themeOption.label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Alert Preferences</CardTitle>
                  <CardDescription>Control which notifications you receive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Enable All Alerts</div>
                  <div className="text-sm text-gray-500">Master switch for all notification types</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.alerts_enabled}
                    onChange={() => handleToggle('alerts_enabled')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className={`grid gap-4 pl-4 border-l-2 border-gray-100 ${!preferences.alerts_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {[
                  { key: 'temperature_alerts', label: 'Temperature Changes', desc: 'Freeze warnings, heat advisories, rapid drops', icon: Thermometer, color: 'text-red-500' },
                  { key: 'precipitation_alerts', label: 'Precipitation', desc: 'Rain, snow, and storm warnings', icon: CloudRain, color: 'text-blue-500' },
                  { key: 'wind_alerts', label: 'Wind Alerts', desc: 'High wind warnings and gusts', icon: Wind, color: 'text-gray-500' },
                  { key: 'anomaly_alerts', label: 'Weather Anomalies', desc: 'Unusual patterns detected by AI', icon: AlertTriangle, color: 'text-amber-500' },
                  { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive critical alerts via email', icon: Mail, color: 'text-indigo-500' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <div>
                        <div className="font-medium text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences[item.key as keyof Preferences] as boolean}
                      onChange={() => handleToggle(item.key as keyof Preferences)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="border-red-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Delete Account</div>
                    <div className="text-sm text-gray-500">Permanently remove your account and all data</div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="font-bold text-red-800 mb-2">Are you absolutely sure?</div>
                  <p className="text-sm text-red-600 mb-4">
                    This action cannot be undone. This will permanently delete your account, 
                    saved locations, and preferences.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete My Account'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
