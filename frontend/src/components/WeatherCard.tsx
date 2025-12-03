import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedLocation } from "@/lib/storage";
import { Droplets, Wind, Eye, Gauge, MapPin } from "lucide-react";

interface WeatherCardProps {
  location: SavedLocation;
  onClick?: () => void;
}

const WeatherCard = memo(({ location, onClick }: WeatherCardProps) => {
  const { city, weather } = location;

  return (
    <Card 
      className="cursor-pointer border bg-card"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {city.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{city.country}</p>
          </div>
          <span className="text-4xl">{weather.icon}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold">{weather.temperature}°</span>
          <span className="text-muted-foreground mb-2">F</span>
        </div>
        
        <div>
          <p className="font-medium">{weather.condition}</p>
          <p className="text-sm text-muted-foreground">Feels like {weather.feelsLike}°</p>
        </div>
        
             <div className="grid grid-cols-2 gap-2 pt-2 border-t">
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Humidity</p>
                 <p className="font-medium text-sm">{weather.humidity}%</p>
               </div>
               
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Wind</p>
                 <p className="font-medium text-sm">{weather.windSpeed} mph</p>
               </div>
               
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Visibility</p>
                 <p className="font-medium text-sm">{weather.visibility} mi</p>
               </div>
               
               <div className="text-center">
                 <p className="text-xs text-muted-foreground">Pressure</p>
                 <p className="font-medium text-sm">{weather.pressure} mb</p>
               </div>
             </div>
        
        {weather.precipitation > 50 && (
          <Badge variant="outline" className="w-full justify-center">
            {weather.precipitation}% chance of rain
          </Badge>
        )}
      </CardContent>
    </Card>
  );
});

WeatherCard.displayName = 'WeatherCard';

export default WeatherCard;
