import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Droplets, Wind, Eye, Gauge, Thermometer, CloudRain } from "lucide-react";
import { locationAPI, weatherAPI } from "@/services/api";
import { formatWeatherData, getWeatherCondition } from "@/lib/weatherHelpers";

const LocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await locationAPI.getUserLocations();
        const locations = data.locations || [];
        const loc = locations.find((l: any) => l.id === parseInt(id || '0'));
        
        if (!loc) {
          navigate('/locations');
          return;
        }
        setLocation(loc);
        
        const weatherData = await weatherAPI.getWeather(parseInt(id || '0'));
        setWeather(weatherData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        navigate('/locations');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  if (loading || !location) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>Loading...</div>
      </div>
    );
  }

  const currentWeather = weather?.current_weather || {};
  const dailyForecast = weather?.daily_forecast || {};
  
  const formattedWeather = formatWeatherData(weather);
  
  // Get daily forecast data
  const dailyData = dailyForecast.daily || {};
  const dailyTemps = dailyData.temperature_2m_max || [];
  const dailyMins = dailyData.temperature_2m_min || [];
  const dailyDates = dailyData.time || [];
  const dailyCodes = dailyData.weathercode || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/locations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">{location.name}</h1>
          <p className="text-muted-foreground mt-1">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
      </div>

      {weather && (
        <>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-6xl font-bold">{formattedWeather.temperature}°</span>
                    <span className="text-2xl text-muted-foreground mb-2">F</span>
                  </div>
                  <p className="text-xl font-medium mb-1">{formattedWeather.condition}</p>
                  <p className="text-muted-foreground">Feels like {formattedWeather.feelsLike}°F</p>
                </div>
                <span className="text-8xl">{formattedWeather.icon}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-weather-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <p className="font-medium">{formattedWeather.humidity}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-weather-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Wind Speed</p>
                    <p className="font-medium">{formattedWeather.windSpeed} mph</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-weather-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Visibility</p>
                    <p className="font-medium">{formattedWeather.visibility} mi</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-weather-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pressure</p>
                    <p className="font-medium">{formattedWeather.pressure} mb</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {dailyDates.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailyDates.slice(0, 7).map((date: string, i: number) => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <p className="font-medium min-w-[120px]">{dayName}, {monthDay}</p>
                        <span className="text-3xl">{getWeatherCondition(dailyCodes[i] || 0).icon}</span>
                        <p className="text-sm text-muted-foreground flex-1">{getWeatherCondition(dailyCodes[i] || 0).condition}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{Math.round(dailyTemps[i] || 0)}°</p>
                          <p className="text-sm text-muted-foreground">{Math.round(dailyMins[i] || 0)}°</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LocationDetail;

