import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocations } from "@/lib/storage";
import { ArrowLeft, Droplets, Wind, Eye, Gauge, Sun } from "lucide-react";
import { apiGetWeather, WeatherResponse } from "@/services/api";

const LocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(getLocations().find(l => l.id === id));
  const [serverWeather, setServerWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    if (!location) {
      navigate('/locations');
    }
  }, [location, navigate]);

  useEffect(() => {
    // Best-effort fetch from backend to enrich UI
    const fetchWeather = async () => {
      try {
        if (!id) return;
        const res = await apiGetWeather(Number(id));
        setServerWeather(res);
      } catch {
        // ignore errors, keep mock/local data
      }
    };
    fetchWeather();
  }, [location, navigate]);

  if (!location) return null;

  const { city, weather } = location;
  
  // Process real API data for forecasts
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
    console.log('processDailyData input:', daily);
    if (!daily || !daily.time) {
      console.log('processDailyData: No daily data or time field');
      return [];
    }
    
    const result = daily.time.slice(0, 7).map((time: string, index: number) => ({
      date: new Date(time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      high: Math.round(daily.temperature_2m_max?.[index] || 0),
      low: Math.round(daily.temperature_2m_min?.[index] || 0),
      condition: getWeatherCondition(daily.weathercode?.[index] || 0),
      icon: getWeatherIcon(daily.weathercode?.[index] || 0),
      precipitation: Math.round(daily.precipitation_probability_max?.[index] || 0),
      humidity: Math.round(daily.relative_humidity_2m_max?.[index] || 0),
    }));
    
    console.log('processDailyData result:', result);
    return result;
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

  // Overlay server current weather if available
  const effectiveWeather = (() => {
    const curr = serverWeather?.current_weather as any | undefined;
    const hourly = serverWeather?.hourly as any | undefined;
    if (!curr) return weather;
    
    // Get apparent temperature from hourly data (first hour)
    const apparentTemp = hourly?.apparent_temperature?.[0] || curr.temperature;
    
    return {
      ...weather,
      temperature: Math.round(curr.temperature ?? weather.temperature), // Already in Fahrenheit
      feelsLike: Math.round(apparentTemp ?? weather.feelsLike), // Use hourly apparent temp or fallback to temperature
      humidity: Math.round(hourly?.relative_humidity_2m?.[0] ?? weather.humidity),
      windSpeed: Math.round(curr.windspeed ?? weather.windSpeed), // Already in mph
      pressure: Math.round(hourly?.surface_pressure?.[0] ?? weather.pressure),
      uvIndex: Math.round(hourly?.uv_index?.[0] ?? weather.uvIndex),
      visibility: Math.round((hourly?.visibility?.[0] ?? weather.visibility) * 0.000621371), // Convert m to miles
    };
  })();

  // Get real forecast data from API
  const hourly = serverWeather?.hourly ? processHourlyData(serverWeather.hourly) : location.hourly || [];
  const daily = serverWeather?.daily ? processDailyData(serverWeather.daily) : location.daily || [];
  
  // Debug logging
  console.log('LocationDetail Debug:', {
    serverWeather: serverWeather,
    serverWeatherHourly: serverWeather?.hourly,
    serverWeatherDaily: serverWeather?.daily,
    hourly: hourly,
    daily: daily,
    hourlyLength: hourly.length,
    dailyLength: daily.length,
    locationHourly: location.hourly,
    locationDaily: location.daily
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/locations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">{city.name}</h1>
          <p className="text-muted-foreground mt-1">{city.country}</p>
        </div>
      </div>

           {/* Current Weather */}
           <Card className="border bg-card">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="flex items-end gap-2 mb-3">
                     <span className="text-5xl font-bold">{effectiveWeather.temperature}°</span>
                     <span className="text-xl text-muted-foreground mb-1">F</span>
                   </div>
                   <p className="text-lg font-medium mb-2">{weather.condition}</p>
                   <p className="text-muted-foreground text-sm">Feels like {effectiveWeather.feelsLike}°F</p>
                 </div>
                 <div className="text-6xl">{weather.icon}</div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t">
                 <div className="text-center p-2 border rounded bg-muted/10">
                   <Droplets className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                   <p className="text-xs text-muted-foreground">Humidity</p>
                   <p className="font-semibold text-sm">{effectiveWeather.humidity}%</p>
                 </div>

                 <div className="text-center p-2 border rounded bg-muted/10">
                   <Wind className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                   <p className="text-xs text-muted-foreground">Wind</p>
                   <p className="font-semibold text-sm">{effectiveWeather.windSpeed} mph</p>
                 </div>

                 <div className="text-center p-2 border rounded bg-muted/10">
                   <Eye className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                   <p className="text-xs text-muted-foreground">Visibility</p>
                   <p className="font-semibold text-sm">{effectiveWeather.visibility} mi</p>
                 </div>

                 <div className="text-center p-2 border rounded bg-muted/10">
                   <Gauge className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                   <p className="text-xs text-muted-foreground">Pressure</p>
                   <p className="font-semibold text-sm">{effectiveWeather.pressure} mb</p>
                 </div>

                 <div className="text-center p-2 border rounded bg-muted/10">
                   <Sun className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                   <p className="text-xs text-muted-foreground">UV Index</p>
                   <p className="font-semibold text-sm">{effectiveWeather.uvIndex}</p>
                 </div>
               </div>
        </CardContent>
      </Card>

           {/* Hourly Forecast */}
           <Card className="border bg-card">
             <CardHeader>
               <CardTitle>24-Hour Forecast</CardTitle>
             </CardHeader>
             <CardContent>
               {hourly.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <p>Loading hourly forecast...</p>
                   <p className="text-sm">If this persists, there may be an issue fetching forecast data.</p>
                 </div>
               ) : (
                 <div className="flex gap-2 overflow-x-auto pb-2">
                   {hourly.slice(0, 12).map((hour, i) => (
                     <div
                       key={i}
                       className="flex-shrink-0 text-center p-2 min-w-[70px] border rounded bg-muted/20"
                     >
                       <p className="text-xs text-muted-foreground mb-1">{hour.time}</p>
                       <div className="text-sm mb-1">{hour.icon}</div>
                       <p className="font-medium text-sm">{hour.temperature}°</p>
                       <p className="text-xs text-blue-600">{hour.precipitation}%</p>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>

           {/* 7-Day Forecast */}
           <Card className="border bg-card">
             <CardHeader>
               <CardTitle>7-Day Forecast</CardTitle>
             </CardHeader>
             <CardContent>
               {daily.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <p>Loading 7-day forecast...</p>
                   <p className="text-sm">If this persists, there may be an issue fetching forecast data.</p>
                 </div>
               ) : (
                 <div className="space-y-1">
                   {daily.slice(0, 5).map((day, i) => (
                     <div
                       key={i}
                       className="flex items-center justify-between p-3 border rounded bg-muted/10"
                     >
                       <div className="flex items-center gap-3 flex-1">
                         <p className="font-medium min-w-[100px] text-sm">{day.date}</p>
                         <div className="text-lg">{day.icon}</div>
                         <p className="text-sm text-muted-foreground flex-1">{day.condition}</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className="text-xs text-blue-600">{day.precipitation}%</span>
                         <div className="flex items-center gap-1">
                           <span className="font-semibold text-sm">{day.high}°</span>
                           <span className="text-muted-foreground text-sm">/</span>
                           <span className="text-muted-foreground text-sm">{day.low}°</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
    </div>
  );
};

export default LocationDetail;
