import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocations, getDevices } from "@/lib/storage";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Droplets, Zap, ThermometerSun } from "lucide-react";

const Analytics = () => {
  const [locations] = useState(getLocations());
  const [devices] = useState(getDevices());
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  // Generate temperature trend data
  const temperatureData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...locations.reduce((acc, loc) => {
          const baseTemp = loc.weather.temperature;
          const variation = Math.sin(i * 0.5) * 8 + (Math.random() * 4 - 2);
          acc[loc.city.name] = Math.round(baseTemp + variation);
          return acc;
        }, {} as Record<string, number>),
      };
    });
  }, [locations, timeRange]);

  // Generate precipitation data
  const precipitationData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        rainfall: Math.random() * 2.5,
      };
    });
  }, []);

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
                  {locations.map((location, i) => (
                    <Line
                      key={location.id}
                      type="monotone"
                      dataKey={location.city.name}
                      stroke={`hsl(${199 + i * 30}, 89%, 48%)`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Precipitation Forecast</CardTitle>
            <CardDescription>
              Expected rainfall for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={precipitationData}>
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
                <Bar dataKey="rainfall" fill="hsl(var(--weather-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
