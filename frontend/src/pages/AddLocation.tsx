import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationAPI } from "../services/api";

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
    <div style={{ 
      padding: '24px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        {/* Header Section */}
        <div style={{ 
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <button 
            onClick={() => navigate("/dashboard")} 
            style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              fontSize: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '24px',
              padding: '8px 0',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
          <h1 style={{ 
            margin: 0, 
            color: '#1a1a1a', 
            fontSize: '36px', 
            fontWeight: '600',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
            marginBottom: '8px'
          }}>
            Add New Location
          </h1>
          <p style={{ 
            color: '#6c757d', 
            margin: 0, 
            fontSize: '16px',
            fontWeight: '400'
          }}>
            Search and add locations to track weather data
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'stretch',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <input
              type="text"
              placeholder="Enter city name (e.g., London, Tokyo, New York)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '16px 20px', 
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                flex: 1,
                fontSize: '16px',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'all 0.2s ease',
                fontWeight: '400'
              }}
              disabled={searching}
            />
            <button 
              type="submit" 
              disabled={searching || !searchQuery.trim()}
              style={{
                backgroundColor: (searching || !searchQuery.trim()) ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '16px 28px',
                borderRadius: '8px',
                cursor: (searching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: (searching || !searchQuery.trim()) ? 'none' : '0 2px 8px rgba(0, 123, 255, 0.25)',
                minWidth: '120px'
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            Error: {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Search Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {searchResults.map((result, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  padding: '20px', 
                  backgroundColor: '#fafafa',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '18px' }}>
                        <strong>{result.name}</strong>
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#7f8c8d' }}>
                        <div><strong>Location:</strong> {result.admin1 && `${result.admin1}, `}{result.country}</div>
                        <div><strong>Coordinates:</strong> {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddLocation(result)}
                      disabled={adding === result.latitude}
                      style={{
                        backgroundColor: adding === result.latitude ? '#bdc3c7' : '#27ae60',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: adding === result.latitude ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginLeft: '20px'
                      }}
                    >
                      {adding === result.latitude ? 'Adding...' : 'Add Location'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && !searching && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#7f8c8d',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Ready to search</div>
            <div style={{ fontSize: '14px' }}>Enter a city name above to find and add locations</div>
          </div>
        )}
      </div>
    </div>
  );
}
