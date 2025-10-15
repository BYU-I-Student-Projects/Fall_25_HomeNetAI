import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WeatherCard from "@/components/WeatherCard";
import DeviceCard from "@/components/DeviceCard";
import { getLocations, getDevices, updateDevice, saveDevices, saveLocations, clearPresetLocations, SavedLocation, SmartDevice } from "@/lib/storage";
import { getInitialLocations, getInitialDevices, generateAIInsights } from "@/lib/mockData";
import { apiGetLocations, apiGetWeather } from "@/services/api";
// Removed mock data imports - using real API data only
import { Plus, Sparkles, TrendingUp, Zap } from "lucide-react";

// Weather data processing functions
const processHourlyData = (hourly: any) => {
  if (!hourly || !hourly.time) return [];
  
  return hourly.time.slice(0, 24).map((time: string, index: number) => ({
    time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
    temperature: Math.round(hourly.temperature_2m?.[index] || 0),
    condition: getWeatherCondition(hourly.weathercode?.[index] || 0),
    icon: getWeatherIcon(hourly.weathercode?.[index] || 0),
    precipitation: Math.round(hourly.precipitation_probability?.[index] || 0),
  }));
};

const processDailyData = (daily: any) => {
  if (!daily || !daily.time) return [];
  
  return daily.time.slice(0, 7).map((time: string, index: number) => ({
    date: new Date(time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    high: Math.round(daily.temperature_2m_max?.[index] || 0),
    low: Math.round(daily.temperature_2m_min?.[index] || 0),
    condition: getWeatherCondition(daily.weathercode?.[index] || 0),
    icon: getWeatherIcon(daily.weathercode?.[index] || 0),
    precipitation: Math.round(daily.precipitation_probability_max?.[index] || 0),
    humidity: Math.round(daily.relative_humidity_2m_max?.[index] || 0),
  }));
};

// Weather code mapping functions
const getWeatherCondition = (code: number): string => {
  const conditions: { [key: number]: string } = {
    0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
    55: "Dense Drizzle", 56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    66: "Light Freezing Rain", 67: "Heavy Freezing Rain", 71: "Slight Snow",
    73: "Moderate Snow", 75: "Heavy Snow", 77: "Snow Grains",
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    85: "Slight Snow Showers", 86: "Heavy Snow Showers", 95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail"
  };
  return conditions[code] || "Unknown";
};

const getWeatherIcon = (code: number): string => {
  const icons: { [key: number]: string } = {
    0: "☀️", 1: "☀️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️",
    55: "🌧️", 56: "🌧️", 57: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    66: "🌧️", 67: "🌧️", 71: "❄️",
    73: "❄️", 75: "❄️", 77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "🌧️",
    85: "❄️", 86: "❄️", 95: "⛈️",
    96: "⛈️", 99: "⛈️"
  };
  return icons[code] || "🌤️";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  // Memoize expensive calculations
  const insights = useMemo(() => generateAIInsights(locations, devices), [locations, devices]);
  const activeDevices = useMemo(() => devices.filter(d => d.status === "on").length, [devices]);
  const avgTemp = useMemo(() => 
    locations.length > 0
      ? Math.round(locations.reduce((sum, l) => sum + l.weather.temperature, 0) / locations.length)
      : 0,
    [locations]
  );

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Clear any preset locations
        clearPresetLocations();
        
        // Fetch real locations with real weather data
        try {
          const serverLocations = await apiGetLocations();
          const mapped = (await Promise.all(serverLocations.map(async (loc) => {
            try {
              // Fetch real weather data from API
              const weatherData = await apiGetWeather(loc.id);
              const currentWeather = weatherData.current_weather as any;
              const hourly = weatherData.hourly as any;
              
              // Get apparent temperature from hourly data (first hour)
              const apparentTemp = hourly?.apparent_temperature?.[0] || currentWeather?.temperature;
              
              return {
                id: String(loc.id),
                city: { id: String(loc.id), name: loc.name, country: "", latitude: loc.latitude, longitude: loc.longitude, timezone: "" },
                weather: {
                  temperature: Math.round(currentWeather?.temperature || 0), // Already in Fahrenheit
                  feelsLike: Math.round(apparentTemp || currentWeather?.temperature), // Use hourly apparent temp or fallback to temperature
                  humidity: Math.round(hourly?.relative_humidity_2m?.[0] || 0),
                  windSpeed: Math.round(currentWeather?.windspeed || 0), // Already in mph
                  windDirection: Math.round(currentWeather?.winddirection || 0),
                  pressure: Math.round(hourly?.surface_pressure?.[0] || 0),
                  uvIndex: Math.round(hourly?.uv_index?.[0] || 0),
                  visibility: Math.round((hourly?.visibility?.[0] || 0) * 0.000621371), // Convert m to miles
                  condition: getWeatherCondition(currentWeather?.weathercode),
                  icon: getWeatherIcon(currentWeather?.weathercode),
                  precipitation: Math.round(hourly?.precipitation_probability?.[0] || 0),
                },
                hourly: processHourlyData(hourly),
                daily: processDailyData(weatherData.daily),
                addedAt: new Date().toISOString(),
              };
            } catch (weatherErr) {
              console.error(`Failed to fetch weather for ${loc.name}:`, weatherErr);
              console.error('Weather API Error Details:', {
                locationId: loc.id,
                locationName: loc.name,
                error: weatherErr,
                response: weatherErr?.response?.data,
                status: weatherErr?.response?.status
              });
              // Skip this location if API fails - don't use mock data
              return null;
            }
          }))).filter(loc => loc !== null);
          
          saveLocations(mapped);
          setLocations(mapped);
        } catch (apiErr) {
          console.warn('Failed to fetch locations from API:', apiErr);
          setLocations([]);
        }
        
        // Initialize devices
        const deviceData = getDevices();
        if (deviceData.length === 0) {
      const initial = getInitialDevices();
      saveDevices(initial);
      setDevices(initial);
        } else {
          setDevices(deviceData);
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, []);

  const handleDeviceToggle = useCallback((id: string) => {
    const device = devices.find(d => d.id === id);
    if (device) {
      const newStatus = device.status === "on" ? "off" : "on";
      updateDevice(id, { status: newStatus });
      
      if (device.type === "lock") {
        updateDevice(id, { locked: newStatus === "off" });
      }
      
      setDevices(getDevices());
    }
  }, [devices]);

  const handleDeviceValueChange = useCallback((id: string, value: number) => {
    updateDevice(id, { value });
    setDevices(getDevices());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-weather-primary to-ai-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your home overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Avg {avgTemp}°F</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">of {devices.length} total</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">New recommendations</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Energy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">Optimized consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">AI Insights</CardTitle>
            <CardDescription>
              Personalized recommendations based on your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.slice(0, 2).map((insight, i) => (
              <div
                key={i}
                className="p-3 rounded border bg-muted/20"
              >
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            {insights.length > 2 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/ai-insights')}
                size="sm"
              >
                View all {insights.length} insights
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
           {/* Weather Overview */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold">Weather</h2>
               <Button onClick={() => navigate('/locations')} size="sm">
                 <Plus className="h-4 w-4 mr-2" />
                 Add Location
               </Button>
             </div>

             {locations.length === 0 ? (
               <Card className="border bg-card">
                 <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                   <p className="text-muted-foreground mb-3">No locations added yet</p>
                   <Button onClick={() => navigate('/locations')} size="sm">
                     Add Your First Location
                   </Button>
                 </CardContent>
               </Card>
             ) : (
               <div className="space-y-3">
                 {locations.slice(0, 2).map((location) => (
                   <WeatherCard
                     key={location.id}
                     location={location}
                     onClick={() => navigate(`/locations/${location.id}`)}
                   />
                 ))}
               </div>
             )}
           </div>

         {/* Smart Home Overview */}
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold">Smart Home</h2>
             <Button onClick={() => navigate('/smart-home')} size="sm">
               View All
             </Button>
           </div>

           <div className="space-y-2">
             {devices.slice(0, 3).map((device) => (
               <DeviceCard
                 key={device.id}
                 device={device}
                 onToggle={handleDeviceToggle}
                 onValueChange={handleDeviceValueChange}
               />
             ))}
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;