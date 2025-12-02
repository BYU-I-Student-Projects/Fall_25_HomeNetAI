import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { locationAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react';

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
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<{ [key: string]: TrendData }>({});
  const [loading, setLoading] = useState(false);

  // Conversion functions for US units
  const celsiusToFahrenheit = (celsius: number | null): number | null => {
    if (celsius === null) return null;
    return (celsius * 9/5) + 32;
  };

  const mmToInches = (mm: number | null): number | null => {
    if (mm === null) return null;
    return mm / 25.4;
  };

  const kmhToMph = (kmh: number | null): number | null => {
    if (kmh === null) return null;
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
      const response = await locationAPI.getUserLocations();
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
      temperature: celsiusToFahrenheit(item.temperature),
      humidity: item.humidity,
      precipitation: mmToInches(item.precipitation),
      wind_speed: kmhToMph(item.wind_speed)
    }));
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'increasing') return <TrendingUp className="h-5 w-5" />;
    if (direction === 'decreasing') return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getTrendColorClass = (direction: string) => {
    if (direction === 'increasing') return 'text-emerald-500';
    if (direction === 'decreasing') return 'text-red-500';
    return 'text-gray-500';
  };

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full text-center p-12">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            No Locations Found
          </h2>
          <p className="text-slate-500 mb-8">
            Add a location to start viewing analytics and insights.
          </p>
          <Button
            onClick={() => window.location.href = '/add-location'}
            className="w-full sm:w-auto"
          >
            Add Location
          </Button>
        </Card>
      </div>
    );
  }

  const chartData = formatChartData(historicalData);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Weather Analytics
            </h1>
          </div>
          <p className="text-slate-500 text-lg ml-11">
            Advanced insights and predictions for your locations
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <select
                  value={selectedLocation || ''}
                  onChange={(e) => setSelectedLocation(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={60}>Last 60 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Temperature Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Temperature</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {celsiusToFahrenheit(summary.statistics.temperature.mean)?.toFixed(1)}°F
                      </p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Thermometer className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={getTrendColorClass(trends.temperature?.direction)}>
                      {getTrendIcon(trends.temperature?.direction)}
                    </span>
                    <span className={`text-sm font-medium ${getTrendColorClass(trends.temperature?.direction)}`}>
                      {(trends.temperature?.slope_per_day * 1.8)?.toFixed(2)}°F/day
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                    Min: {celsiusToFahrenheit(summary.statistics.temperature.min)?.toFixed(1)}°F | 
                    Max: {celsiusToFahrenheit(summary.statistics.temperature.max)?.toFixed(1)}°F
                  </div>
                </CardContent>
              </Card>

              {/* Humidity Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Humidity</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {summary.statistics.humidity.mean?.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Droplets className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={getTrendColorClass(trends.humidity?.direction)}>
                      {getTrendIcon(trends.humidity?.direction)}
                    </span>
                    <span className={`text-sm font-medium ${getTrendColorClass(trends.humidity?.direction)}`}>
                      {trends.humidity?.slope_per_day?.toFixed(2)}%/day
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                    Min: {summary.statistics.humidity.min?.toFixed(0)}% | 
                    Max: {summary.statistics.humidity.max?.toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              {/* Precipitation Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Precipitation</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {mmToInches(summary.statistics.precipitation.mean)?.toFixed(1)} in
                      </p>
                    </div>
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <CloudRain className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={getTrendColorClass(trends.precipitation?.direction)}>
                      {getTrendIcon(trends.precipitation?.direction)}
                    </span>
                    <span className={`text-sm font-medium ${getTrendColorClass(trends.precipitation?.direction)}`}>
                      {trends.precipitation?.direction}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                    Total: {mmToInches(summary.statistics.precipitation.max)?.toFixed(1)} in
                  </div>
                </CardContent>
              </Card>

              {/* Wind Speed Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Wind Speed</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {kmhToMph(summary.statistics.wind_speed.mean)?.toFixed(1)} mph
                      </p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Wind className="h-6 w-6 text-slate-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={getTrendColorClass(trends.wind_speed?.direction)}>
                      {getTrendIcon(trends.wind_speed?.direction)}
                    </span>
                    <span className={`text-sm font-medium ${getTrendColorClass(trends.wind_speed?.direction)}`}>
                      {trends.wind_speed?.direction}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                    Max: {kmhToMph(summary.statistics.wind_speed.max)?.toFixed(1)} mph
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
              {/* Temperature Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Temperature Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
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
                </CardContent>
              </Card>

              {/* Humidity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Humidity Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
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
                </CardContent>
              </Card>

              {/* Precipitation Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Precipitation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="precipitation" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
