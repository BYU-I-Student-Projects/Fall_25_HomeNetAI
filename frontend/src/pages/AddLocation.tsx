import { useState } from "react";
import { Search, MapPin, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { locationsAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

const AddLocation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedLocation, setAddedLocation] = useState<string | null>(null);

  // Search locations
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Only search if query is at least 2 characters
    if (query.trim().length < 2) {
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
  const handleAddLocation = async (result: SearchResult) => {
    setAdding(true);
    try {
      await locationsAPI.add(result.display_name, result.latitude, result.longitude);
      setAddedLocation(result.display_name);
      toast({
        title: "Success!",
        description: `Added ${result.display_name} to your locations`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/locations");
      }, 1500);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Location</h1>
            <p className="text-sm text-slate-500">Search for a city to track weather</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Input */}
          <Card className="shadow-lg border-2 border-slate-200">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="location-search"
                  name="location-search"
                  type="text"
                  placeholder="Search for a city (e.g., Salt Lake City, London, Tokyo)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-xl border-2 border-slate-200 focus:border-[#f97316] focus-visible:ring-[#f97316]/20"
                  autoFocus
                />
              </div>

              {searchQuery && searchQuery.length < 2 && (
                <p className="text-sm text-slate-400 mt-2 ml-1">
                  Type at least 2 characters to search...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
              <span className="ml-3 text-slate-600">Searching locations...</span>
            </div>
          )}

          {/* Success State */}
          {addedLocation && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6 flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Location Added!</p>
                  <p className="text-sm text-green-600">{addedLocation}</p>
                  <p className="text-xs text-green-500 mt-1">Redirecting to locations...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {!searching && !addedLocation && searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-600 px-1">
                Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </p>
              {searchResults.map((result, idx) => (
                <Card
                  key={idx}
                  className="hover:shadow-md hover:border-[#f97316]/50 transition-all cursor-pointer border-2 border-slate-200"
                  onClick={() => !adding && handleAddLocation(result)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-[#f97316]" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{result.name}</p>
                        <p className="text-sm text-slate-500">
                          {result.admin1 && `${result.admin1}, `}{result.country}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={adding}
                      className="border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white"
                    >
                      {adding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!searching && !addedLocation && searchQuery.length >= 2 && searchResults.length === 0 && (
            <Card className="border-2 border-dashed border-slate-300">
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600">No locations found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try searching for a different city name
                </p>
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!searching && !addedLocation && searchQuery.length === 0 && (
            <Card className="border-2 border-dashed border-slate-300">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600">Search for a location</p>
                <p className="text-sm text-slate-400 mt-1">
                  Enter a city name above to find and add locations
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLocation;
