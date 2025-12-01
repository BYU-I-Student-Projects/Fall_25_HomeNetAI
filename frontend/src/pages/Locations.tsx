import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import WeatherCard from "@/components/WeatherCard";
import { getLocations as getLocalLocations, addLocation as addLocalLocation, deleteLocation as deleteLocalLocation, saveLocations as saveLocalLocations } from "@/lib/storage";
// Removed mock data imports - using real API data only
import { apiAddLocation, apiDeleteLocation, apiGetLocations, apiSearchLocations, apiGetWeather, SearchLocationResult } from "@/services/api";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

const Locations = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState(getLocalLocations());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Sync locations with server on mount
    const sync = async () => {
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
        
        saveLocalLocations(mapped);
        setLocations(mapped);
      } catch (err: any) {
        console.error("Failed to sync locations:", err);
        if (err.response?.status === 401) {
          toast({ title: "Authentication required", description: "Please log in again", variant: "destructive" });
          navigate('/login');
        }
      }
    };
    sync();
  }, [navigate]);

  useEffect(() => {
    // Search locations via backend API
    const searchLocations = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const results = await apiSearchLocations(searchQuery);
        setSearchResults(results);
      } catch (err) {
        toast({ title: "Search failed", description: "Could not search locations", variant: "destructive" });
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddLocation = useCallback(async (result: SearchLocationResult) => {
    setLoading(true);
    try {
      // Check for duplicates before adding
      const existingLocation = locations.find(loc => 
        Math.abs(loc.city.latitude - result.latitude) < 0.01 && 
        Math.abs(loc.city.longitude - result.longitude) < 0.01
      );
      
      if (existingLocation) {
        toast({ 
          title: "Location already exists", 
          description: `${result.name} is already in your locations`, 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }
      
      const created = await apiAddLocation({ 
        name: result.display_name || result.name, 
        latitude: result.latitude, 
        longitude: result.longitude 
      });
      
      // Refresh server locations
      const serverLocations = await apiGetLocations();
      
      // Fetch real weather data for all locations
      const mapped = await Promise.all(serverLocations.map(async (loc) => {
        try {
          const weatherData = await apiGetWeather(loc.id);
          const currentWeather = weatherData.current_weather as any;
          const hourly = weatherData.hourly as any;
          
          const apparentTemp = hourly?.apparent_temperature?.[0] || currentWeather?.temperature;
          
          return {
            id: String(loc.id),
            city: { id: String(loc.id), name: loc.name, country: "", latitude: loc.latitude, longitude: loc.longitude, timezone: "" },
            weather: {
              temperature: Math.round(currentWeather?.temperature || 0),
              feelsLike: Math.round(apparentTemp || currentWeather?.temperature),
              humidity: Math.round(hourly?.relative_humidity_2m?.[0] || 0),
              windSpeed: Math.round(currentWeather?.windspeed || 0),
              windDirection: Math.round(currentWeather?.winddirection || 0),
              pressure: Math.round(hourly?.surface_pressure?.[0] || 0),
              uvIndex: Math.round(hourly?.uv_index?.[0] || 0),
              visibility: Math.round((hourly?.visibility?.[0] || 0) * 0.000621371),
              condition: getWeatherCondition(currentWeather?.weathercode),
              icon: getWeatherIcon(currentWeather?.weathercode),
              precipitation: Math.round(hourly?.precipitation_probability?.[0] || 0),
            },
            hourly: processHourlyData(hourly),
            daily: processDailyData(weatherData.daily),
            addedAt: new Date().toISOString(),
          };
        } catch (err) {
          console.error(`Failed to fetch weather for ${loc.name}:`, err);
          return null;
        }
      }));
      
      const validMapped = mapped.filter(loc => loc !== null);
      
      saveLocalLocations(validMapped);
      setLocations(validMapped);
      setDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      
      toast({ title: "Location added", description: `${result.name} has been added to your locations` });
    } catch (err: any) {
      toast({ title: "Add failed", description: err?.response?.data?.detail ?? "Could not add location", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [locations]);

  const handleDeleteLocation = useCallback(async (id: string, cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await apiDeleteLocation(Number(id));
      deleteLocalLocation(id);
      setLocations(getLocalLocations());
      toast({ title: "Location removed", description: `${cityName} has been removed from your locations` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.response?.data?.detail ?? "Could not delete location", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-weather-primary to-weather-secondary bg-clip-text text-transparent">
            My Locations
          </h1>
          <p className="text-muted-foreground mt-2">
            Track weather across {locations.length} location{locations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-weather-primary to-weather-secondary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
              <DialogDescription>
                Search cities worldwide via geocoding API
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cities (e.g., New York, London)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {!searchQuery || searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : searching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                    <p>Searching locations...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No locations found for "{searchQuery}"</p>
                  </div>
                ) : (
                  searchResults.map((result, index) => {
                    const isDuplicate = locations.some(loc => 
                      Math.abs(loc.city.latitude - result.latitude) < 0.01 && 
                      Math.abs(loc.city.longitude - result.longitude) < 0.01
                    );
                    
                    return (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-colors ${
                          isDuplicate 
                            ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => !isDuplicate && handleAddLocation(result)}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.admin1 && `${result.admin1}, `}{result.country}
                            </p>
                          </div>
                          {isDuplicate ? (
                            <Button size="sm" variant="ghost" disabled>
                              Added
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost">
                              Add
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

           {/* Locations Grid */}
           {locations.length === 0 ? (
             <Card className="border bg-card">
               <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                 <div className="text-4xl mb-3">📍</div>
                 <h3 className="text-lg font-bold mb-2">No locations yet</h3>
                 <p className="text-muted-foreground mb-4">
                   Add your first location to start tracking weather
                 </p>
                 <Button
                   onClick={() => setDialogOpen(true)}
                   size="sm"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Add Location
                 </Button>
               </CardContent>
             </Card>
           ) : (
             <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
               {locations.map((location) => (
                 <div key={location.id} className="relative">
                   <WeatherCard
                     location={location}
                     onClick={() => navigate(`/locations/${location.id}`)}
                   />
                   <Button
                     variant="destructive"
                     size="icon"
                     className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity h-6 w-6"
                     onClick={(e) => handleDeleteLocation(location.id, location.city.name, e)}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 </div>
               ))}
             </div>
           )}
    </div>
  );
};

export default Locations;
