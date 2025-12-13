import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { locationsAPI } from '../services/api';
import { useSettings } from "@/contexts/SettingsContext";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface HistoricalData {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  wind_speed: number | null;
}

interface Statistics {
  mean: number | null;
  min: number | null;
  max: number | null;
  std: number | null;
}

interface TrendData {
  metric: string;
  trend: string;
  direction: string;
  slope_per_day: number;
  confidence: number;
  current_value: number | null;
  predicted_24h: number | null;
}

interface Summary {
  period: { days: number; data_points: number };
  statistics: {
    temperature: Statistics;
    humidity: Statistics;
    precipitation: Statistics;
    wind_speed: Statistics;
  };
  trends: {
    temperature: { direction: string; change_per_day: number };
    humidity: { direction: string; change_per_day: number };
  };
}

const Analytics: React.FC = () => {
  const { convertTemperature, temperatureUnit, convertWindSpeed, windSpeedSymbol } = useSettings();
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<{ [key: string]: TrendData }>({});
  const [loading, setLoading] = useState(false);

  // Conversion functions for US units (temperature is already Fahrenheit from API)
  // Remove celsiusToFahrenheit - data is already in Fahrenheit

  const mmToInches = (mm: number | null): number | null => {
    if (mm === null) return null;
    return mm / 25.4;
  };

  const kmhToMph = (kmh: number | null): number | null => {
    if (kmh === null) return null;
    return kmh * 0.621371;
  };

  // Convert wind speed from km/h to user's preferred unit
  const convertWind = (kmh: number | null): number | null => {
    if (kmh === null) return null;
    const mph = kmh * 0.621371;
    return convertWindSpeed(mph);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchAnalytics();
    }
  }, [selectedLocation, timeRange]);

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getUserLocations();
      setLocations(response.locations);
      if (response.locations.length > 0) {
        setSelectedLocation(response.locations[0].id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      // Import analytics API functions
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch historical data
      const histResponse = await fetch(
        `http://localhost:8000/analytics/historical/${selectedLocation}?days=${timeRange}`,
        { headers }
      );
      const histData = await histResponse.json();
      setHistoricalData(histData.data || []);

      // Fetch summary statistics
      const summaryResponse = await fetch(
        `http://localhost:8000/analytics/summary/${selectedLocation}?days=${timeRange}`,
        { headers }
      );
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Fetch trends for multiple metrics
      const metrics = ['temperature', 'humidity', 'precipitation', 'wind_speed'];
      const trendsData: { [key: string]: TrendData } = {};
      
      for (const metric of metrics) {
        const trendResponse = await fetch(
          `http://localhost:8000/analytics/trends/${selectedLocation}?metric=${metric}&days=${timeRange}`,
          { headers }
        );
        const trendData = await trendResponse.json();
        trendsData[metric] = trendData;
      }
      setTrends(trendsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: HistoricalData[]) => {
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: item.temperature !== null ? Math.round(convertTemperature(item.temperature)) : null,
      humidity: item.humidity,
      precipitation: mmToInches(item.precipitation),
      wind_speed: convertWind(item.wind_speed)
    }));
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'increasing') return '≡ƒôê';
    if (direction === 'decreasing') return '≡ƒôë';
    return 'Γ₧í∩╕Å';
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'increasing') return '#10b981';
    if (direction === 'decreasing') return '#ef4444';
    return '#6b7280';
  };

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-xl p-12 text-center shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            No Locations Found
          </h2>
          <p className="text-muted-foreground mb-6">
            Add a location to start viewing analytics and insights.
          </p>
          <button
            onClick={() => window.location.href = '/add-location'}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Add Location
          </button>
        </div>
      </div>
    );
  }

  const chartData = formatChartData(historicalData);

  return (
    <div className="min-h-screen bg-background p-6">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            📊 Weather Analytics
          </h1>
          <p className="text-base text-muted-foreground">
            Advanced insights and predictions for your locations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-md flex gap-6 flex-wrap">
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Location
            </label>
            <select
              value={selectedLocation || ''}
              onChange={(e) => setSelectedLocation(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              marginBottom: '8px'
            }}>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ 
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading analytics...</p>
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Statistics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Temperature Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Temperature</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                      {summary.statistics.temperature.mean !== null ? Math.round(convertTemperature(summary.statistics.temperature.mean)) : '--'}{unitSymbol}
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>≡ƒîí∩╕Å</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTrendIcon(trends.temperature?.direction)}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: getTrendColor(trends.temperature?.direction),
                    fontWeight: '500'
                  }}>
                    {temperatureUnit === "celsius" 
                      ? (trends.temperature?.slope_per_day)?.toFixed(2) 
                      : (trends.temperature?.slope_per_day * 1.8)?.toFixed(2)}{unitSymbol}/day
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Min: {summary.statistics.temperature.min !== null ? Math.round(convertTemperature(summary.statistics.temperature.min)) : '--'}{unitSymbol} | 
                  Max: {summary.statistics.temperature.max !== null ? Math.round(convertTemperature(summary.statistics.temperature.max)) : '--'}{unitSymbol}
                </div>
              </div>

              {/* Humidity Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Humidity</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                      {summary.statistics.humidity.mean?.toFixed(0)}%
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>≡ƒÆº</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTrendIcon(trends.humidity?.direction)}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: getTrendColor(trends.humidity?.direction),
                    fontWeight: '500'
                  }}>
                    {trends.humidity?.slope_per_day?.toFixed(2)}%/day
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Min: {summary.statistics.humidity.min?.toFixed(0)}% | 
                  Max: {summary.statistics.humidity.max?.toFixed(0)}%
                </div>
              </div>

              {/* Precipitation Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Precipitation</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                      {mmToInches(summary.statistics.precipitation.mean)?.toFixed(1)} in
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>≡ƒîº∩╕Å</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTrendIcon(trends.precipitation?.direction)}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: getTrendColor(trends.precipitation?.direction),
                    fontWeight: '500'
                  }}>
                    {trends.precipitation?.direction}
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Total: {mmToInches(summary.statistics.precipitation.max)?.toFixed(1)} in
                </div>
              </div>

              {/* Wind Speed Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Wind Speed</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>
                      {convertWind(summary.statistics.wind_speed.mean)?.toFixed(1)} {windSpeedSymbol}
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>≡ƒÆ¿</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTrendIcon(trends.wind_speed?.direction)}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: getTrendColor(trends.wind_speed?.direction),
                    fontWeight: '500'
                  }}>
                    {trends.wind_speed?.direction}
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Max: {convertWind(summary.statistics.wind_speed.max)?.toFixed(1)} {windSpeedSymbol}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px'
            }}>
              {/* Temperature Chart */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
                  Temperature Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#f59e0b" 
                      fillOpacity={1}
                      fill="url(#colorTemp)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Humidity Chart */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
                  Humidity Levels
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Precipitation Chart */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
                  Precipitation
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="precipitation" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
