import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeviceCard from "@/components/DeviceCard";
import { getDevices, updateDevice } from "@/lib/storage";
import { Home, Thermometer, Lightbulb, Plug, Lock, Blinds, Camera } from "lucide-react";

const SmartHome = () => {
  const [devices, setDevices] = useState(getDevices());
  const [filter, setFilter] = useState<string>("all");

  const handleDeviceToggle = (id: string) => {
    const device = devices.find(d => d.id === id);
    if (device) {
      const newStatus = device.status === "on" ? "off" : "on";
      updateDevice(id, { status: newStatus });
      
      if (device.type === "lock") {
        updateDevice(id, { locked: newStatus === "off" });
      }
      
      setDevices(getDevices());
    }
  };

  const handleDeviceValueChange = (id: string, value: number) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    if (device.type === "blind") {
      updateDevice(id, { position: value });
    } else {
      updateDevice(id, { value });
    }
    setDevices(getDevices());
  };

  const filteredDevices = filter === "all" 
    ? devices 
    : devices.filter(d => d.type === filter);

  const deviceTypes = [
    { value: "all", label: "All Devices", icon: Home },
    { value: "thermostat", label: "Thermostats", icon: Thermometer },
    { value: "light", label: "Lights", icon: Lightbulb },
    { value: "plug", label: "Plugs", icon: Plug },
    { value: "lock", label: "Locks", icon: Lock },
    { value: "blind", label: "Blinds", icon: Blinds },
    { value: "camera", label: "Cameras", icon: Camera },
  ];

  const activeDevices = devices.filter(d => d.status === "on").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-smart-primary to-smart-secondary bg-clip-text text-transparent">
          Smart Home
        </h1>
        <p className="text-muted-foreground mt-2">
          {activeDevices} of {devices.length} devices active
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-smart-primary to-smart-secondary">
                <Thermometer className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thermostats</p>
                <p className="font-bold">{devices.filter(d => d.type === "thermostat").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-smart-primary to-smart-secondary">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lights</p>
                <p className="font-bold">{devices.filter(d => d.type === "light").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-ai-primary to-ai-secondary">
                <Lock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locks</p>
                <p className="font-bold">{devices.filter(d => d.type === "lock").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-weather-primary to-weather-secondary">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cameras</p>
                <p className="font-bold">{devices.filter(d => d.type === "camera").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto gap-2">
          {deviceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger 
                key={type.value} 
                value={type.value}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredDevices.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-muted-foreground">No devices in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onToggle={handleDeviceToggle}
                  onValueChange={handleDeviceValueChange}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartHome;
