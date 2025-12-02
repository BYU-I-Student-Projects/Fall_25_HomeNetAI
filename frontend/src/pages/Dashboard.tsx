import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { locationAPI, weatherAPI } from "../services/api";
import Alerts from "../components/Alerts";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Loader2, Plus, Trash2, BarChart3, Bot, Settings, ChevronDown, ChevronUp, Wind, Compass } from "lucide-react";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  time: string;
  apparent_temperature?: number;
}

interface WeatherData {
  location: string;
  current_weather: CurrentWeather;
  daily_forecast: any;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<{[key: number]: WeatherData}>({});
  const [expandedForecasts, setExpandedForecasts] = useState<{[key: number]: boolean}>({});

  // Conversion functions for US units
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9/5) + 32;
  };

  const mmToInches = (mm: number): number => {
    return mm / 25.4;
  };

  const kmhToMph = (kmh: number): number => {
    return kmh * 0.621371;
  };

  const loadLocations = async () => {
    try {
      const response = await locationAPI.getUserLocations();
      setLocations(response.locations);
    } catch (error) {
      console.error("Failed to load locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherData = async (locationId: number) => {
    try {
      const weather = await weatherAPI.getWeather(locationId);
      setWeatherData(prev => ({ ...prev, [locationId]: weather }));
    } catch (error) {
      console.error("Failed to load weather data:", error);
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    try {
      await locationAPI.deleteLocation(locationId);
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      setWeatherData(prev => {
        const newData = { ...prev };
        delete newData[locationId];
        return newData;
      });
    } catch (error) {
      console.error("Failed to delete location:", error);
    }
  };

  const toggleForecast = (locationId: number) => {
    setExpandedForecasts(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    locations.forEach(location => {
      loadWeatherData(location.id);
    });
  }, [locations]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mx-auto max-w-[1400px] rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="m-0 text-gray-900 text-4xl font-semibold tracking-tight leading-tight">
              Weather Dashboard
            </h1>
            <p className="mt-2 text-gray-500 text-base font-normal">
              Monitor weather conditions across your locations
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/analytics">
              <Button variant="default" className="bg-emerald-500 hover:bg-emerald-600 shadow-sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link to="/ai-insights">
              <Button variant="default" className="bg-purple-600 hover:bg-purple-700 shadow-sm">
                <Bot className="mr-2 h-4 w-4" />
                AI Insights
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary" className="bg-gray-500 text-white hover:bg-gray-600 shadow-sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link to="/add-location">
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-20 px-10 text-gray-500">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-500" />
            <div className="text-xl font-medium text-gray-900 mb-2">
              Loading weather data
            </div>
            <div className="text-base text-gray-500">
              Fetching the latest conditions...
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-20 px-10 text-gray-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl text-blue-500">
              📍
            </div>
            <div className="text-2xl mb-3 font-semibold text-gray-900">
              No locations added yet
            </div>
            <div className="text-lg mb-10 text-gray-500 max-w-md mx-auto">
              Start by adding your first location to begin tracking weather conditions
            </div>
            <Link to="/add-location">
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50 h-auto py-4 px-8 text-base">
                Add your first location
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => {
              const weather = weatherData[location.id];
              return (
                <Card key={location.id} className="overflow-hidden transition-all duration-300 hover:shadow-md border-gray-200">
                  <CardContent className="p-7">
                    {/* Smart Alerts */}
                    <Alerts locationId={location.id} />

                    {/* Location Header */}
                    <div className="flex justify-between items-start mb-6 pb-5 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="m-0 text-gray-900 text-2xl font-semibold leading-tight mb-1">
                          {location.name}
                        </h3>
                        <div className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        className="shadow-sm"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                    
                    {weather ? (
                      <div>
                        {weather.current_weather && weather.current_weather.temperature !== undefined && (
                          <div className="bg-blue-600 text-white p-7 rounded-2xl mb-6 shadow-lg relative overflow-hidden">
                            {/* Current Weather Header */}
                            <div className="flex justify-between items-start mb-5">
                              <div>
                                <div className="text-6xl font-light leading-none mb-2">
                                  {Math.round(celsiusToFahrenheit(weather.current_weather.temperature))}°
                                </div>
                                <div className="text-lg opacity-90 mt-2">
                                  Feels like {Math.round(celsiusToFahrenheit(weather.current_weather.apparent_temperature || weather.current_weather.temperature))}°
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-base opacity-90 font-medium mb-1">
                                  Current Weather
                                </div>
                                <div className="text-sm opacity-70 font-normal">
                                  {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {/* Weather Details */}
                            <div className="grid grid-cols-2 gap-5 bg-white/15 p-5 rounded-xl backdrop-blur-md border border-white/20">
                              <div className="flex items-center gap-3">
                                <Wind className="h-6 w-6 opacity-80" />
                                <div>
                                  <div className="text-sm opacity-90 mb-0.5">
                                    Speed
                                  </div>
                                  <div className="text-lg font-semibold">
                                    {weather.current_weather.windspeed !== undefined 
                                      ? `${kmhToMph(weather.current_weather.windspeed).toFixed(1)} mph`
                                      : 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Compass className="h-6 w-6 opacity-80" />
                                <div>
                                  <div className="text-sm opacity-90 mb-0.5">
                                    Direction
                                  </div>
                                  <div className="text-lg font-semibold">
                                    {weather.current_weather.winddirection !== undefined 
                                      ? `${weather.current_weather.winddirection}°`
                                      : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {weather.daily_forecast && weather.daily_forecast.time && (
                          <div>
                            <button 
                              onClick={() => toggleForecast(location.id)}
                              className="flex items-center justify-between w-full p-5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer text-lg font-semibold text-gray-900 mb-0 transition-all duration-300 hover:bg-gray-100 shadow-sm"
                              style={{ marginBottom: expandedForecasts[location.id] ? '20px' : '0' }}
                            >
                              <span>7-Day Forecast</span>
                              {expandedForecasts[location.id] ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                            
                            {expandedForecasts[location.id] && (
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-5 overflow-x-auto pb-3">
                                {weather.daily_forecast.time.slice(0, 7).map((date: string, index: number) => (
                                  <div key={date} className="bg-white p-6 rounded-2xl border border-gray-200 text-center min-w-[150px] shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="text-base text-gray-500 mb-4 font-bold uppercase tracking-wider">
                                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 mb-2 leading-none">
                                      {Math.round(celsiusToFahrenheit(weather.daily_forecast.temperature_2m_max[index]))}°F
                                    </div>
                                    <div className="text-lg text-gray-500 mb-4 font-medium">
                                      {Math.round(celsiusToFahrenheit(weather.daily_forecast.temperature_2m_min[index]))}°F
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mt-3">
                                      {weather.daily_forecast.precipitation_sum && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-blue-500">RAIN</span>
                                          <span className="font-semibold">{mmToInches(weather.daily_forecast.precipitation_sum[index] || 0).toFixed(2)} in</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-6 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 mt-5">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-5 text-blue-500" />
                        <div className="text-lg font-semibold text-gray-900 mb-2">
                          Loading weather data
                        </div>
                        <div className="text-sm text-gray-500">
                          Fetching current conditions...
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
