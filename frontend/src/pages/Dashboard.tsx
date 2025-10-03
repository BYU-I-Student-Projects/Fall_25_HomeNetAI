import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { locationAPI, weatherAPI } from "../services/api";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface WeatherData {
  location: string;
  current_weather: any;
  daily_forecast: any;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<{[key: number]: WeatherData}>({});
  const [expandedForecasts, setExpandedForecasts] = useState<{[key: number]: boolean}>({});

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
    <div style={{ 
      padding: '24px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e9ecef'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              color: '#1a1a1a', 
              fontSize: '36px', 
              fontWeight: '600',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              Weather Dashboard
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#6c757d', 
              fontSize: '16px',
              fontWeight: '400'
            }}>
              Monitor weather conditions across your locations
            </p>
          </div>
          <Link to="/add-location" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0, 123, 255, 0.25)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>+</span>
              <span>Add Location</span>
            </button>
          </Link>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            color: '#6c757d'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }}></div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '500',
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              Loading weather data
            </div>
            <div style={{ fontSize: '16px', color: '#6c757d' }}>
              Fetching the latest conditions...
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            color: '#6c757d'
          }}>
            <div style={{ 
              width: '96px', 
              height: '96px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
              fontSize: '40px',
              color: '#007bff'
            }}>📍</div>
            <div style={{ 
              fontSize: '24px', 
              marginBottom: '12px', 
              fontWeight: '600', 
              color: '#1a1a1a' 
            }}>
              No locations added yet
            </div>
            <div style={{ 
              fontSize: '18px', 
              marginBottom: '40px',
              color: '#6c757d',
              maxWidth: '400px',
              margin: '0 auto 40px'
            }}>
              Start by adding your first location to begin tracking weather conditions
            </div>
            <Link to="/add-location" style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
              padding: '16px 32px',
              border: '2px solid #007bff',
              borderRadius: '8px',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              backgroundColor: 'transparent'
            }}>
              Add your first location
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '24px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
          }}>
            {locations.map((location) => {
              const weather = weatherData[location.id];
              return (
                <div key={location.id} style={{ 
                  border: '1px solid #e9ecef', 
                  borderRadius: '16px',
                  padding: '28px', 
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  {/* Location Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '24px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #f1f3f4'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#1a1a1a', 
                        fontSize: '24px', 
                        fontWeight: '600',
                        lineHeight: '1.3',
                        marginBottom: '4px'
                      }}>
                        {location.name}
                      </h3>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6c757d',
                        fontFamily: 'monospace',
                        backgroundColor: '#f8f9fa',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteLocation(location.id)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 2px 6px rgba(220, 53, 69, 0.25)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>×</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  
                  {weather ? (
                    <div>
                      {weather.current_weather && (
                        <div style={{ 
                          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                          color: 'white',
                          padding: '28px',
                          borderRadius: '16px',
                          marginBottom: '24px',
                          boxShadow: '0 6px 20px rgba(0, 123, 255, 0.25)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Current Weather Header */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start', 
                            marginBottom: '20px'
                          }}>
                            <div>
                              <div style={{ 
                                fontSize: '56px', 
                                fontWeight: '300', 
                                lineHeight: '1',
                                marginBottom: '8px'
                              }}>
                                {Math.round(weather.current_weather.temperature)}°
                              </div>
                              <div style={{ 
                                fontSize: '18px', 
                                opacity: '0.9',
                                fontWeight: '400'
                              }}>
                                Feels like {Math.round(weather.current_weather.apparent_temperature || weather.current_weather.temperature)}°
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                opacity: '0.9',
                                fontWeight: '500',
                                marginBottom: '4px'
                              }}>
                                Current Weather
                              </div>
                              <div style={{ 
                                fontSize: '14px', 
                                opacity: '0.7',
                                fontWeight: '400'
                              }}>
                                {new Date().toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          </div>
                          
                          {/* Weather Details */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px'
                            }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: '700',
                                letterSpacing: '0.5px'
                              }}>
                                WIND
                              </div>
                              <div>
                                <div style={{ 
                                  fontSize: '14px', 
                                  opacity: '0.9',
                                  marginBottom: '2px'
                                }}>
                                  Speed
                                </div>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '600'
                                }}>
                                  {weather.current_weather.windspeed} km/h
                                </div>
                              </div>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px'
                            }}>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: '700',
                                letterSpacing: '0.5px'
                              }}>
                                DIR
                              </div>
                              <div>
                                <div style={{ 
                                  fontSize: '14px', 
                                  opacity: '0.9',
                                  marginBottom: '2px'
                                }}>
                                  Direction
                                </div>
                                <div style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '600'
                                }}>
                                  {weather.current_weather.winddirection}°
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
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '18px 24px',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #e9ecef',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#1a1a1a',
                              marginBottom: expandedForecasts[location.id] ? '20px' : '0',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                          >
                            <span>7-Day Forecast</span>
                            <span style={{ 
                              transform: expandedForecasts[location.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}>
                              ▼
                            </span>
                          </button>
                          
                          {expandedForecasts[location.id] && (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                              gap: '20px',
                              overflowX: 'auto',
                              paddingBottom: '12px'
                            }}>
                              {weather.daily_forecast.time.slice(0, 7).map((date: string, index: number) => (
                                <div key={date} style={{
                                  backgroundColor: '#ffffff',
                                  padding: '24px 20px',
                                  borderRadius: '16px',
                                  border: '1px solid #e9ecef',
                                  textAlign: 'center',
                                  minWidth: '150px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                  transition: 'all 0.3s ease',
                                  position: 'relative'
                                }}>
                                  <div style={{ 
                                    fontSize: '16px', 
                                    color: '#6c757d', 
                                    marginBottom: '16px', 
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                  }}>
                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                  <div style={{ 
                                    fontSize: '28px', 
                                    fontWeight: '700', 
                                    color: '#1a1a1a', 
                                    marginBottom: '8px',
                                    lineHeight: '1'
                                  }}>
                                    {Math.round(weather.daily_forecast.temperature_2m_max[index])}°
                                  </div>
                                  <div style={{ 
                                    fontSize: '18px', 
                                    color: '#6c757d', 
                                    marginBottom: '16px',
                                    fontWeight: '500'
                                  }}>
                                    {Math.round(weather.daily_forecast.temperature_2m_min[index])}°
                                  </div>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    fontSize: '13px',
                                    color: '#6c757d',
                                    backgroundColor: '#f8f9fa',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    marginTop: '12px'
                                  }}>
                                    {weather.daily_forecast.precipitation_sum && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#007bff' }}>RAIN</span>
                                        <span style={{ fontWeight: '600' }}>{weather.daily_forecast.precipitation_sum[index]?.toFixed(1) || 0}mm</span>
                                      </div>
                                    )}
                                    {weather.daily_forecast.uv_index_max && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ffc107' }}>UV</span>
                                        <span style={{ fontWeight: '600' }}>{weather.daily_forecast.uv_index_max[index]?.toFixed(1) || 0}</span>
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
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '48px 24px', 
                      color: '#6c757d',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '16px',
                      border: '1px solid #e9ecef',
                      marginTop: '20px'
                    }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                      }}></div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px'
                      }}>
                        Loading weather data
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        Fetching current conditions...
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
