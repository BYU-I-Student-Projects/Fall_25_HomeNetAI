import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationAPI } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Search, MapPin, ArrowLeft, Loader2, Plus, AlertCircle } from "lucide-react";

interface SearchResult {
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

export default function AddLocation() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await locationAPI.search(searchQuery);
      setSearchResults(response.results);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to search locations");
    } finally {
      setSearching(false);
    }
  };

  const handleAddLocation = async (result: SearchResult) => {
    setAdding(result.latitude); // Use latitude as unique identifier
    setError(null);

    try {
      await locationAPI.addLocation({
        name: result.display_name,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      
      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add location");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")} 
          className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Add New Location</CardTitle>
            <CardDescription>
              Search for a city or region to add to your weather dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter city name (e.g., New York, London, Tokyo)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={searching || !searchQuery.trim()}
                  className="min-w-[120px]"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {searchResults.length > 0 && (
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Search Results
                </h3>
              )}
              
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <MapPin className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{result.name}</h4>
                      <p className="text-sm text-slate-500">
                        {[result.admin1, result.country].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleAddLocation(result)}
                    disabled={adding === result.latitude}
                    variant="outline"
                    className="ml-4 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  >
                    {adding === result.latitude ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}

              {searchResults.length === 0 && searchQuery && !searching && !error && (
                <div className="text-center py-12 text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No locations found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
