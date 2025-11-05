import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import WeatherCard from "@/components/WeatherCard";
import { locationAPI, weatherAPI } from "@/services/api";
import { formatWeatherData } from "@/lib/weatherHelpers";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Locations = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
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
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const data = await locationAPI.search(searchQuery);
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Failed to search locations:", error);
      toast({
        title: "Error",
        description: "Failed to search locations",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddLocation = async (result: any) => {
    try {
      await locationAPI.addLocation(result.name, result.latitude, result.longitude);
      toast({
        title: "Location added",
        description: `${result.name} has been added to your locations`,
      });
      setDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchLocations();
    } catch (error: any) {
      console.error("Failed to add location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add location",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLocation = async (id: string, locationName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await locationAPI.deleteLocation(parseInt(id));
      toast({
        title: "Location removed",
        description: `${locationName} has been removed from your locations`,
      });
      fetchLocations();
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
                Search for locations worldwide to track weather
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={searching || !searchQuery.trim()}
                className="w-full"
              >
                {searching ? "Searching..." : "Search"}
              </Button>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.length === 0 && searchQuery && !searching ? (
                  <p className="text-center text-muted-foreground py-4">No results found</p>
                ) : (
                  searchResults.map((result, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleAddLocation(result)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.display_name}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          Add
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">Loading locations...</p>
          </CardContent>
        </Card>
      ) : locations.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-xl font-bold mb-2">No locations yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first location to start tracking weather
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-weather-primary to-weather-secondary hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div key={location.id} className="relative group">
              <WeatherCard
                location={location}
                onClick={() => navigate(`/locations/${location.id}`)}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteLocation(location.id, location.city.name, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Locations;
