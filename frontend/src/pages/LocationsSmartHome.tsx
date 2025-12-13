import { useState, useEffect } from "react";
import { Home, Cloud, Sun, CloudSun, CloudRain, Plus, Thermometer, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { locationsAPI, weatherAPI, devicesAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/contexts/SettingsContext";

// Helper function to convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

// Weather code to icon mapping
const getWeatherIcon = (weatherCode: number): "sun" | "cloud" | "partly" | "rain" => {
  if (weatherCode === 0) return "sun";
  if (weatherCode <= 3) return "partly";
  if (weatherCode <= 49) return "cloud";
  if (weatherCode <= 59) return "rain";
  if (weatherCode <= 69) return "rain";
  if (weatherCode <= 79) return "rain";
  if (weatherCode <= 84) return "rain";
  if (weatherCode <= 86) return "rain";
  if (weatherCode <= 99) return "rain";
  return "cloud";
};

const iconMap: Record<"sun" | "cloud" | "partly" | "rain", React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloud: Cloud,
  partly: CloudSun,
  rain: CloudRain,
};

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface WeatherData {
  location: string;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  daily_forecast: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  hourly_forecast?: {
    time: string[];
    temperature_2m: number[];
  };
}

interface LocationWithWeather extends Location {
  weather?: WeatherData;
  loading?: boolean;
  isMainLocation?: boolean;
}

interface Device {
  id: number;
  name: string;
  type: string;
  status: string;
  room: string | null;
  value: number | null;
  color: string | null;
  locked: boolean | null;
  position: number | null;
  created_at: string;
  updated_at: string;
}

// Mini Temperature Chart Component for Location Cards
const MiniTemperatureChart = ({ temperatures }: { temperatures: number[] }) => {
  if (!temperatures || temperatures.length === 0) return null;
  
  const width = 140;
  const height = 50;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const tempRange = maxTemp - minTemp || 1;
  
  // Take last 12 hours for the mini chart
  const dataPoints = temperatures.slice(-12);
  
  const points = dataPoints.map((temp, index) => {
    const x = padding.left + (index / (dataPoints.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((temp - minTemp) / tempRange) * graphHeight;
    return { x, y };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  const fillPath = `${pathData} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  
  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id="miniTempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#miniTempGradient)" />
      <path
        d={pathData}
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Enhanced Location Card Component
const LocationCard = ({ location }: { location: LocationWithWeather }) => {
  const { formatTemperature, convertTemperature, temperatureUnit } = useSettings();
  const weather = location.weather;
  const loading = location.loading;

  if (loading) {
    return (
      <Card className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-slate-300 !bg-white p-4 shadow-md min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-slate-300 !bg-white p-4 shadow-md min-h-[200px]">
        <p className="text-sm text-slate-500">No weather data</p>
      </Card>
    );
  }
  const icon = getWeatherIcon(weather.current_weather.weathercode);
  const Icon = iconMap[icon];
  const temp = Math.round(convertTemperature(weather.current_weather.temperature));
  const high = weather.daily_forecast.temperature_2m_max[0] 
    ? Math.round(convertTemperature(weather.daily_forecast.temperature_2m_max[0])) 
    : temp;
  const low = weather.daily_forecast.temperature_2m_min[0] 
    ? Math.round(convertTemperature(weather.daily_forecast.temperature_2m_min[0])) 
    : temp;
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  // Get hourly temperatures for chart (last 12 hours) - convert based on settings
  const hourlyTemps = weather.hourly_forecast?.temperature_2m 
    ? weather.hourly_forecast.temperature_2m.slice(-12).map(t => convertTemperature(t))
    : [];

  return (
    <Card className="flex h-full flex-col rounded-2xl border-2 border-slate-300 !bg-white p-4 shadow-md transition-all hover:shadow-lg hover:border-[#f97316] min-h-[200px]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Location</p>
            {location.isMainLocation && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f97316] text-white font-semibold">
                🏠 MAIN HOME
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{location.name}</h3>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-[#f97316]/10 to-[#f97316]/5 p-2">
          <Icon className="h-6 w-6 text-[#f97316]" />
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-3">
        {/* Left: Temperature Info */}
        <div className="flex-1">
          <p className="text-3xl font-bold text-slate-900 mb-1">{temp}{unitSymbol}</p>
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-slate-400" />
              {high}{unitSymbol}
            </span>
            <span className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-slate-400" />
              {low}{unitSymbol}
            </span>
          </div>
          {!location.isMainLocation && (
            <p className="text-xs text-slate-400 mt-1">Weather Only</p>
          )}
        </div>

        {/* Right: Temperature Chart */}
        {hourlyTemps.length > 0 && (
          <div className="flex-shrink-0">
            <MiniTemperatureChart temperatures={hourlyTemps} />
            <p className="text-[10px] text-slate-500 mt-1 text-right">12h</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Enhanced Device Card Component with Controls
const DeviceCard = ({ device, onUpdate }: { device: Device; onUpdate?: (id: number, updates: Partial<Device>) => void }) => {
  const { convertTemperature, temperatureUnit } = useSettings();
  const [isOn, setIsOn] = useState(device.status === 'on');
  // Device value is already in Fahrenheit - convert for display
  const initialValueF = device.value ? Math.round(device.value) : 70;
  const [valueF, setValueF] = useState(initialValueF);
  const displayValue = Math.round(convertTemperature(valueF));
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
  const sliderMin = temperatureUnit === "celsius" ? 10 : 50;
  const sliderMax = temperatureUnit === "celsius" ? 32 : 90;

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'thermostat':
        return <Thermometer className="h-6 w-6" />;
      case 'light':
        return '💡';
      case 'plug':
        return '🔌';
      case 'lock':
        return '🔒';
      case 'blind':
        return '🪟';
      case 'camera':
        return '📷';
      default:
        return '⚙️';
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsOn(checked);
    if (onUpdate) {
      try {
        await devicesAPI.update(device.id, { status: checked ? 'on' : 'off' });
        toast({
          title: "Success",
          description: `${device.name} turned ${checked ? 'on' : 'off'}`,
        });
      } catch (error: any) {
        setIsOn(!checked); // Revert on error
        toast({
          title: "Error",
          description: error.message || "Failed to update device",
          variant: "destructive",
        });
      }
    }
  };

  const handleValueChange = async (newValue: number[]) => {
    const valF = newValue[0];
    setValueF(valF);
    if (onUpdate && device.type === 'thermostat') {
      try {
        // Convert Fahrenheit back to Celsius for API (stored in Celsius)
        const valC = (valF - 32) * 5/9;
        await devicesAPI.update(device.id, { value: valC });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update device",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="flex flex-col rounded-2xl border-2 border-slate-300 !bg-white p-5 shadow-md hover:shadow-lg hover:border-[#f97316] transition-all h-[180px]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            {device.room || 'Device'}
          </p>
          <h3 className="text-base font-bold text-slate-900">{device.name}</h3>
        </div>
        <div className="text-2xl flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-[#f97316]/10 to-[#f97316]/5">
          {typeof getDeviceIcon() === 'string' ? (
            <span>{getDeviceIcon()}</span>
          ) : (
            getDeviceIcon()
          )}
        </div>
      </div>
      
      <div className="mt-auto space-y-3">
        {device.type === 'thermostat' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Temperature</span>
              <span className="text-xl font-bold text-[#f97316]">{displayValue}{unitSymbol}</span>
            </div>
            <Slider
              value={[valueF]}
              onValueChange={handleValueChange}
              min={50}
              max={86}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{sliderMin}{unitSymbol}</span>
              <span>{sliderMax}{unitSymbol}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 capitalize">Status</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${isOn ? 'text-[#f97316]' : 'text-slate-400'}`}>
                {isOn ? 'On' : 'Off'}
              </span>
              <Switch
                checked={isOn}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-[#f97316]"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const LocationsSmartHome = () => {
  const [locations, setLocations] = useState<LocationWithWeather[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ name: string; country: string; admin1: string; latitude: number; longitude: number; display_name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  // Fetch locations and devices
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch locations
      const locationsResponse = await locationsAPI.getAll();
      const locs = locationsResponse.locations.map(loc => ({ ...loc, loading: true }));
      setLocations(locs);

      // Fetch devices
      try {
        const devicesData = await devicesAPI.getAll();
        setDevices(devicesData);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        setDevices([]);
      }

      // Fetch weather for each location
      const weatherPromises = locs.map(async (loc) => {
        try {
          const weather = await weatherAPI.getForLocation(loc.id);
          return { ...loc, weather, loading: false };
        } catch (error) {
          console.error(`Failed to fetch weather for ${loc.name}:`, error);
          return { ...loc, loading: false };
        }
      });

      const locationsWithWeather = await Promise.all(weatherPromises);
      
      // Mark first location as main (or first location with devices)
      const mainLocationId = locationsWithWeather[0]?.id;
      const locationsWithMain = locationsWithWeather.map(loc => ({
        ...loc,
        isMainLocation: loc.id === mainLocationId
      }));
      
      setLocations(locationsWithMain);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search locations
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await locationsAPI.search(query);
      setSearchResults(response.results);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search locations",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Add location
  const handleAddLocation = async (name: string, latitude: number, longitude: number) => {
    setAdding(true);
    try {
      await locationsAPI.add(name, latitude, longitude);
      toast({
        title: "Success",
        description: `Added ${name}`,
      });
      setShowAddLocation(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add location",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };


  // Update device
  const handleDeviceUpdate = async (id: number, updates: Partial<Device>) => {
    try {
      await devicesAPI.update(id, updates);
      setDevices(devices.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (error: any) {
      throw error;
    }
  };

  // Group devices by room
  const devicesByRoom = devices.reduce((acc, device) => {
    const room = device.room || 'Other';
    if (!acc[room]) {
      acc[room] = [];
      // Initialize all rooms as expanded by default
      if (expandedRooms[room] === undefined) {
        setExpandedRooms(prev => ({ ...prev, [room]: true }));
      }
    }
    acc[room].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  const toggleRoom = (room: string) => {
    setExpandedRooms(prev => ({ ...prev, [room]: !prev[room] }));
  };

  const mainLocation = locations.find(loc => loc.isMainLocation);
  const mainLocationDevices = devices; // All devices are for main location

  if (loading && locations.length === 0) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageHeader title="Locations & Smart Home" />

      {/* Main Content - Split View */}
      <div className="flex-1 overflow-auto flex flex-row gap-6 pt-20 px-6 pb-6">
        {/* Left Panel - Locations (40%) */}
        <div className="flex flex-col w-[40%] min-h-0">
          <div className="mb-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-foreground">Weather Locations</h3>
              <p className="text-sm text-muted-foreground mt-1">All your tracked locations</p>
            </div>
            <Button
              onClick={() => setShowAddLocation(true)}
              className="h-11 w-11 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .locations-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="grid grid-cols-1 gap-5 locations-scroll">
              {locations.length === 0 ? (
                <Card className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-300 !bg-white p-8 shadow-md">
                  <Cloud className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-sm font-medium text-slate-600">No locations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add a location to get started</p>
                </Card>
              ) : (
                locations.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Smart Home (60%) */}
        <div className="flex flex-col w-[60%] min-h-0">
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Smart Home</h3>
                {mainLocation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {mainLocation.name} • {mainLocationDevices.length} {mainLocationDevices.length === 1 ? 'device' : 'devices'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .devices-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {mainLocationDevices.length === 0 ? (
              <Card className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-300 !bg-white p-8 shadow-md">
                <Home className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-sm font-medium text-slate-600">No devices yet</p>
                <p className="text-xs text-slate-400 mt-1">Add devices to control your smart home</p>
              </Card>
            ) : (
              <div className="space-y-4 devices-scroll">
                {Object.entries(devicesByRoom).map(([room, roomDevices]) => (
                  <Card key={room} className="border-2 border-slate-300 !bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                    <button
                      onClick={() => toggleRoom(room)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-100/50 transition-colors border-b border-slate-200"
                    >
                      <h4 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                        {room} <span className="text-sm font-normal text-slate-500">({roomDevices.length})</span>
                      </h4>
                      {expandedRooms[room] ? (
                        <ChevronUp className="h-5 w-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      )}
                    </button>
                    {expandedRooms[room] && (
                      <div className="px-5 pb-5">
                        <div className="grid grid-cols-2 gap-4">
                          {roomDevices.map((device) => (
                            <DeviceCard key={device.id} device={device} onUpdate={handleDeviceUpdate} />
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Location Dialog */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>Search for a location to add to your dashboard</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search for a city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#f97316]" />
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddLocation(result.display_name, result.latitude, result.longitude)}
                    disabled={adding}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <p className="font-medium text-slate-900">{result.display_name}</p>
                    <p className="text-sm text-slate-500">{result.country}</p>
                  </button>
                ))}
              </div>
            )}
            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No results found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationsSmartHome;
