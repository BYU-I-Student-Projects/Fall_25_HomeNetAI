import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocations, getDevices } from "@/lib/storage";
import { apiGetHistoricalData, apiGetTrends, apiGetForecast, type HistoricalDataPoint, type TrendResponse, type ForecastResponse } from "@/services/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Droplets, Zap, ThermometerSun, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const { toast } = useToast();
  const [locations] = useState(getLocations());
  const [devices] = useState(getDevices());
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Set initial location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!selectedLocation) return;

      setLoadingData(true);
      try {
        const days = timeRange === "7d" ? 7 : 30;
        const [histData, tempTrend, forecastData] = await Promise.all([
          apiGetHistoricalData(selectedLocation, days),
          apiGetTrends(selectedLocation, "temperature", days),
          apiGetForecast(selectedLocation, 168) // 7 days forecast
        ]);

        setHistoricalData(histData);
        setTrends(tempTrend);
        setForecast(forecastData);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
        toast({
          title: "Error loading analytics",
          description: "Failed to fetch analytics data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadAnalyticsData();
  }, [selectedLocation, timeRange, toast]);

  // Format historical data for chart
  const temperatureData = historicalData.map(point => ({map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    temperature: point.temperature
  }));

  // Format forecast data for chart
  const forecastData = forecast?.forecast.slice(0, 7).map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
    temperature: point.temperature
  })) || [];

  // Device energy usage
  const energyData = useMemo(() => {
    const devicesByType = devices.reduce((acc, device) => {
      acc[device.type] = (acc[device.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(devicesByType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1) + 's',
      active: devices.filter(d => d.type === type && d.status === "on").length,
      total: count,
    }));
  }, [devices]);

  const avgTemp = locations.length > 0
    ? Math.round(locations.reduce((sum, l) => sum + l.weather.temperature, 0) / locations.length)
    : 0;

  const avgHumidity = locations.length > 0
    ? Math.round(locations.reduce((sum, l) => sum + l.weather.humidity, 0) / locations.length)
    : 0;

  const activeDevices = devices.filter(d => d.status === "on").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-weather-primary to-ai-primary bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Insights and trends from your locations and devices
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <ThermometerSun className="h-4 w-4 text-weather-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTemp}°F</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-weather-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHumidity}%</div>
            <p className="text-xs text-muted-foreground">Relative humidity</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Zap className="h-4 w-4 text-smart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-ai-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">Optimized usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Selector */}
      {locations.length > 0 && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Location:</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.city.name}, {loc.city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trends && (
                <div className="ml-auto text-sm text-muted-foreground">
                  Trend: <span className={trends.slope > 0 ? "text-red-500" : "text-blue-500"}>
                    {trends.slope > 0 ? "↑" : "↓"} {Math.abs(trends.slope).toFixed(2)}°F/day
                  </span>
                  {" "}(R² = {trends.r_squared.toFixed(3)})
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d")}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Temperature Trends</h2>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={timeRange} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Temperature History</CardTitle>
              <CardDescription>
                Track temperature changes across your locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-weather-primary" />
                </div>
              ) : temperatureData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="hsl(var(--weather-primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--weather-primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No historical data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Temperature Forecast</CardTitle>
            <CardDescription>
              ML-powered 7-day temperature forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-weather-primary" />
              </div>
            ) : forecastData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="temperature" fill="hsl(var(--weather-primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No forecast data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Device Activity</CardTitle>
            <CardDescription>
              Active vs total devices by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="active" fill="hsl(var(--smart-primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
