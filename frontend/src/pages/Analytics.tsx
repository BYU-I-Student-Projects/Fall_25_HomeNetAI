import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { locationsAPI } from '../services/api';

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

interface ForecastData {
  location_id: number;
  forecast_hours: number;
  generated_at: string;
  forecasts: {
    [key: string]: {
      current: number | null;
      predicted: number | null;
      trend: string;
      confidence: number;
    };
  };
}

interface AnomalyData {
  timestamp: string;
  metric: string;
  value: number;
  expected_range: number[];
  severity: 'high' | 'medium' | 'low';
}

const Analytics: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<{ [key: string]: TrendData }>({});
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [loading, setLoading] = useState(false);

  // Conversion functions for US units (temperature is already Fahrenheit from API)
  // Remove celsiusToFahrenheit - data is already in Fahrenheit

  const mmToInches = (mm: number | null | undefined): number | null => {
    if (mm === null || mm === undefined || isNaN(mm)) return null;
    return mm / 25.4;
  };

  const kmhToMph = (kmh: number | null | undefined): number | null => {
    if (kmh === null || kmh === undefined || isNaN(kmh)) return null;
    return kmh * 0.621371;
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

      // Fetch forecast
      try {
        const forecastResponse = await fetch(
          `http://localhost:8000/analytics/forecast/${selectedLocation}?hours=24`,
          { headers }
        );
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          setForecast(forecastData);
        }
      } catch (e) {
        console.log('Forecast not available');
      }

      // Fetch anomalies
      try {
        const anomaliesResponse = await fetch(
          `http://localhost:8000/analytics/anomalies/${selectedLocation}?days=${timeRange}`,
          { headers }
        );
        if (anomaliesResponse.ok) {
          const anomaliesData = await anomaliesResponse.json();
          setAnomalies(anomaliesData.anomalies || []);
        }
      } catch (e) {
        console.log('Anomalies not available');
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: HistoricalData[]) => {
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: item.temperature,  // Already in Fahrenheit from API
      humidity: item.humidity,
      precipitation: mmToInches(item.precipitation),
      wind_speed: kmhToMph(item.wind_speed)
    }));
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'increasing') return '↑';
    if (direction === 'decreasing') return '↓';
    return '→';
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'increasing') return '#10b981';
    if (direction === 'decreasing') return '#ef4444';
    return '#6b7280';
  };

  if (locations.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            No Locations Found
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Add a location to start viewing analytics and insights.
          </p>
          <button
            onClick={() => window.location.href = '/add-location'}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Add Location
          </button>
        </div>
      </div>
    );
  }

  const chartData = formatChartData(historicalData);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            📊 Weather Analytics
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Advanced insights and predictions for your locations
          </p>
        </div>

        {/* Controls */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              marginBottom: '8px'
            }}>
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
                      {summary.statistics?.temperature?.mean?.toFixed(1) ?? '--'}°F
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>🌡️</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{getTrendIcon(trends.temperature?.direction)}</span>
                  <span style={{
                    fontSize: '14px',
                    color: getTrendColor(trends.temperature?.direction),
                    fontWeight: '500'
                  }}>
                    {trends.temperature?.slope_per_day != null ? ((trends.temperature.slope_per_day * 1.8).toFixed(2)) : '0.00'}°F/day
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Min: {summary.statistics?.temperature?.min?.toFixed(1) ?? '--'}°F |
                  Max: {summary.statistics?.temperature?.max?.toFixed(1) ?? '--'}°F
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
                      {summary.statistics?.humidity?.mean?.toFixed(0) ?? '--'}%
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>💧</span>
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
                  Min: {summary.statistics?.humidity?.min?.toFixed(0) ?? '--'}% |
                  Max: {summary.statistics?.humidity?.max?.toFixed(0) ?? '--'}%
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
                      {mmToInches(summary.statistics?.precipitation?.mean)?.toFixed(1) ?? '--'} in
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>🌧️</span>
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
                  Total: {mmToInches(summary.statistics?.precipitation?.max)?.toFixed(1) ?? '--'} in
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
                      {kmhToMph(summary.statistics?.wind_speed?.mean)?.toFixed(1) ?? '--'} mph
                    </p>
                  </div>
                  <span style={{ fontSize: '32px' }}>💨</span>
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
                  Max: {kmhToMph(summary.statistics?.wind_speed?.max)?.toFixed(1) ?? '--'} mph
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
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
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

              {/* Predictive Forecasting Section */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginTop: '24px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  gridColumn: 'span 2'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔮 24-Hour Predictive Forecast
                  </h3>
                  {forecast && Object.keys(forecast.forecasts).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {Object.entries(forecast.forecasts).map(([metric, data]) => (
                        <div key={metric} style={{
                          padding: '16px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'capitalize' }}>{metric.replace('_', ' ')}</p>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                              {data.predicted?.toFixed(1) ?? '--'}
                            </span>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>
                              {metric === 'temperature' ? '°F' : metric === 'humidity' ? '%' : metric === 'precipitation' ? 'in' : 'mph'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{data.trend === 'increasing' ? '↑' : data.trend === 'decreasing' ? '↓' : '→'}</span>
                            <span style={{ fontSize: '12px', color: data.trend === 'increasing' ? '#10b981' : data.trend === 'decreasing' ? '#ef4444' : '#6b7280' }}>
                              {data.trend}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                              Confidence: {(data.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                      Forecast requires historical weather data to generate predictions
                    </p>
                  )}
                </div>
              </div>

              {/* Anomaly Detection Section */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginTop: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Anomaly Detection
                </h3>
                {anomalies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {anomalies.slice(0, 5).map((anomaly, index) => (
                      <div key={index} style={{
                        padding: '12px 16px',
                        backgroundColor: anomaly.severity === 'high' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${anomaly.severity === 'high' ? '#fecaca' : '#fde68a'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{anomaly.severity === 'high' ? '🔴' : '🟡'}</span>
                          <div>
                            <p style={{ fontWeight: '500', color: '#1e293b', textTransform: 'capitalize' }}>
                              Unusual {anomaly.metric.replace('_', ' ')}
                            </p>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>
                              Recorded: {anomaly.value?.toFixed(1)}°F • Expected: {anomaly.expected_range?.[0]?.toFixed(1)} - {anomaly.expected_range?.[1]?.toFixed(1)}°F
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(anomaly.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: anomaly.severity === 'high' ? '#fee2e2' : '#fef3c7',
                            color: anomaly.severity === 'high' ? '#dc2626' : '#d97706'
                          }}>
                            {anomaly.severity} severity
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>✓</span>
                    <p>No anomalies detected in the last {timeRange} days</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>All weather readings are within expected ranges</p>
                  </div>
                )}
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
