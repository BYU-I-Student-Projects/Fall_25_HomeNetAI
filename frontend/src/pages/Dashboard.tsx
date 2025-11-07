import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WeatherCard from "@/components/WeatherCard";
import DeviceCard from "@/components/DeviceCard";
import { SmartDevice } from "@/lib/storage";
import { deviceAPI, Device } from "@/services/api";
import { getInitialDevices, generateAIInsights } from "@/lib/mockData";
import { locationAPI, weatherAPI } from "@/services/api";
import { formatWeatherData } from "@/lib/weatherHelpers";
import { Plus, Sparkles, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

// Helper function to convert API Device to SmartDevice
const convertDeviceToSmartDevice = (device: Device): SmartDevice => {
  return {
    id: device.id.toString(),
    name: device.name,
    type: device.type,
    status: device.status,
    room: device.room || "",
    value: device.value,
    color: device.color,
    locked: device.locked,
    position: device.position,
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch devices from API
  const fetchDevices = async () => {
    try {
      const apiDevices = await deviceAPI.getDevices();
      const smartDevices = apiDevices.map(convertDeviceToSmartDevice);
      setDevices(smartDevices);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
    }
  };

  useEffect(() => {
    // Fetch locations from API
    const fetchLocations = async () => {
      try {
        const data = await locationAPI.getUserLocations();
        const apiLocations = data.locations || [];
        
        // Fetch weather for each location
        const locationsWithWeather = await Promise.all(
          apiLocations.map(async (loc: any) => {
            try {
              const weatherData = await weatherAPI.getWeather(loc.id);
              const formattedWeather = formatWeatherData(weatherData);
              
              return {
                id: loc.id.toString(),
                city: {
                  id: loc.id.toString(),
                  name: loc.name,
                  country: "",
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  timezone: "UTC"
                },
                weather: formattedWeather,
                hourly: [],
                daily: [],
                addedAt: loc.created_at
              };
            } catch (error) {
              console.error(`Failed to fetch weather for location ${loc.id}:`, error);
              return null;
            }
          })
        );
        
        setLocations(locationsWithWeather.filter(loc => loc !== null));
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
    fetchDevices();
  }, []);

  useEffect(() => {
    setInsights(generateAIInsights(locations, devices));
  }, [locations, devices]);

  const handleDeviceToggle = async (id: string) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    try {
      const newStatus = device.status === "on" ? "off" : "on";
      const updates: any = { status: newStatus };
      
      if (device.type === "lock") {
        updates.locked = newStatus === "off";
      }
      
      await deviceAPI.updateDevice(parseInt(id), updates);
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === id 
          ? { ...d, status: newStatus, ...(device.type === "lock" ? { locked: updates.locked } : {}) }
          : d
      ));
    } catch (err: any) {
      console.error("Failed to update device:", err);
      toast.error(`Failed to update ${device.name}`);
    }
  };

  const handleDeviceValueChange = async (id: string, value: number) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    try {
      const updates: any = {};
      
      if (device.type === "blind") {
        updates.position = value;
      } else {
        updates.value = value;
      }
      
      await deviceAPI.updateDevice(parseInt(id), updates);
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === id 
          ? { ...d, ...updates }
          : d
      ));
    } catch (err: any) {
      console.error("Failed to update device:", err);
      toast.error(`Failed to update ${device.name}`);
    }
  };

  const activeDevices = devices.filter(d => d.status === "on").length;
  const avgTemp = locations.length > 0
    ? Math.round(locations.reduce((sum, l) => sum + (l.weather?.temperature || 0), 0) / locations.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-weather-primary to-ai-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your home overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <TrendingUp className="h-4 w-4 text-weather-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Avg {avgTemp}°F</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Zap className="h-4 w-4 text-smart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">of {devices.length} total</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-ai-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">New recommendations</p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-ai text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Energy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs opacity-90">Optimized consumption</p>
          </CardContent>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card className="glass-card border-ai-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5 border border-ai-primary/10"
              >
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            {insights.length > 3 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/ai-insights')}
              >
                View all {insights.length} insights
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Weather</h2>
            <Button onClick={() => navigate('/locations')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>

          {locations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-muted-foreground mb-4">No locations added yet</p>
                <Button onClick={() => navigate('/locations')}>
                  Add Your First Location
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Smart Home</h2>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/smart-home')} size="sm" variant="outline">
                View All
              </Button>
              <Button onClick={() => navigate('/smart-home')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </div>

          {devices.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-muted-foreground mb-4">No devices added yet</p>
                <Button onClick={() => navigate('/smart-home')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {devices.slice(0, 4).map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onToggle={handleDeviceToggle}
                  onValueChange={handleDeviceValueChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
