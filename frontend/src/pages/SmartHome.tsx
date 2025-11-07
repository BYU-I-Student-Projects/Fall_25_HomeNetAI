import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeviceCard from "@/components/DeviceCard";
import { SmartDevice } from "@/lib/storage";
import { deviceAPI, Device, DeviceCreate } from "@/services/api";
import { getInitialDevices } from "@/lib/mockData";
import { Home, Thermometer, Lightbulb, Plug, Lock, Blinds, Camera, Plus } from "lucide-react";
import { toast } from "sonner";

// Helper function to convert API Device to SmartDevice
const convertDeviceToSmartDevice = (device: Device): SmartDevice => {
  return {
    id: device.id.toString(),
    name: device.name,
    type: device.type,
    status: device.status,
    room: device.room || "",
    value: device.value,
    color: device.color,
    locked: device.locked,
    position: device.position,
  };
};

// Helper function to convert SmartDevice to API Device (for updates)
const convertSmartDeviceToDevice = (device: SmartDevice): Device => {
  return {
    id: parseInt(device.id),
    name: device.name,
    type: device.type,
    status: device.status,
    room: device.room,
    value: device.value,
    color: device.color,
    locked: device.locked,
    position: device.position,
    created_at: "",
    updated_at: "",
  };
};

const SmartHome = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState<DeviceCreate>({
    name: "",
    type: "light",
    status: "off",
    room: "",
    value: undefined,
    color: undefined,
    locked: undefined,
    position: undefined,
  });

  // Fetch devices from API
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiDevices = await deviceAPI.getDevices();
      
      if (apiDevices.length === 0) {
        // Initialize with sample data if user has no devices
        const initialDevices = getInitialDevices();
        const createdDevices = await Promise.all(
          initialDevices.map(async (device) => {
            try {
              const created = await deviceAPI.createDevice({
                name: device.name,
                type: device.type,
                status: device.status,
                room: device.room,
                value: device.value,
                color: device.color,
                locked: device.locked,
                position: device.position,
              });
              return convertDeviceToSmartDevice(created);
            } catch (err) {
              console.error(`Failed to create device ${device.name}:`, err);
              return null;
            }
          })
        );
        const validDevices = createdDevices.filter((d): d is SmartDevice => d !== null);
        setDevices(validDevices);
      } else {
        // Convert API devices to SmartDevice format
        const smartDevices = apiDevices.map(convertDeviceToSmartDevice);
        setDevices(smartDevices);
      }
    } catch (err: any) {
      console.error("Failed to fetch devices:", err);
      const errorMessage = err.message || "Failed to load devices";
      setError(errorMessage);
      
      // Show helpful error message
      if (errorMessage.includes("Cannot connect to backend")) {
        toast.error("Backend server not running. Please start the backend at http://localhost:8000");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeviceToggle = async (id: string) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    try {
      const newStatus = device.status === "on" ? "off" : "on";
      const updates: any = { status: newStatus };
      
      // For locks, update locked state based on status
      if (device.type === "lock") {
        updates.locked = newStatus === "off"; // "off" means locked
      }
      
      await deviceAPI.updateDevice(parseInt(id), updates);
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === id 
          ? { ...d, status: newStatus, ...(device.type === "lock" ? { locked: updates.locked } : {}) }
          : d
      ));
      
      toast.success(`${device.name} turned ${newStatus}`);
    } catch (err: any) {
      console.error("Failed to update device:", err);
      toast.error(`Failed to update ${device.name}`);
    }
  };

  const handleDeviceValueChange = async (id: string, value: number) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    try {
      const updates: any = {};
      
      if (device.type === "blind") {
        updates.position = value;
      } else {
        updates.value = value;
      }
      
      await deviceAPI.updateDevice(parseInt(id), updates);
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === id 
          ? { ...d, ...updates }
          : d
      ));
    } catch (err: any) {
      console.error("Failed to update device:", err);
      toast.error(`Failed to update ${device.name}`);
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.name.trim()) {
      toast.error("Device name is required");
      return;
    }

    try {
      // Prepare device data based on type
      const deviceData: DeviceCreate = {
        name: newDevice.name.trim(),
        type: newDevice.type,
        status: newDevice.status || "off",
        room: newDevice.room?.trim() || "",
      };

      // Add type-specific fields
      if (newDevice.type === "thermostat") {
        deviceData.value = newDevice.value || 72;
      } else if (newDevice.type === "light") {
        deviceData.value = newDevice.value || 50;
        deviceData.color = newDevice.color || "#FFFFFF";
      } else if (newDevice.type === "lock") {
        deviceData.locked = newDevice.locked !== undefined ? newDevice.locked : true;
      } else if (newDevice.type === "blind") {
        deviceData.position = newDevice.position || 0;
      }

      const created = await deviceAPI.createDevice(deviceData);
      const smartDevice = convertDeviceToSmartDevice(created);
      
      setDevices([...devices, smartDevice]);
      setIsAddDialogOpen(false);
      
      // Reset form
      setNewDevice({
        name: "",
        type: "light",
        status: "off",
        room: "",
        value: undefined,
        color: undefined,
        locked: undefined,
        position: undefined,
      });
      
      toast.success(`${created.name} added successfully`);
    } catch (err: any) {
      console.error("Failed to create device:", err);
      toast.error("Failed to add device");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    if (!confirm(`Are you sure you want to delete ${device.name}?`)) {
      return;
    }

    try {
      await deviceAPI.deleteDevice(parseInt(id));
      setDevices(devices.filter(d => d.id !== id));
      toast.success(`${device.name} deleted successfully`);
    } catch (err: any) {
      console.error("Failed to delete device:", err);
      toast.error(`Failed to delete ${device.name}`);
    }
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-smart-primary to-smart-secondary bg-clip-text text-transparent">
            Smart Home
          </h1>
          <p className="text-muted-foreground mt-2">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-smart-primary to-smart-secondary bg-clip-text text-transparent">
            Smart Home
          </h1>
          <p className="text-red-500 mt-2">{error}</p>
          <Button onClick={fetchDevices} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-smart-primary to-smart-secondary bg-clip-text text-transparent">
            Smart Home
          </h1>
          <p className="text-muted-foreground mt-2">
            {activeDevices} of {devices.length} devices active
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Add a new smart home device to your system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Living Room Light"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Device Type *</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newDevice.type}
                  onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value as any })}
                >
                  <option value="thermostat">Thermostat</option>
                  <option value="light">Light</option>
                  <option value="plug">Smart Plug</option>
                  <option value="lock">Smart Lock</option>
                  <option value="blind">Blinds</option>
                  <option value="camera">Camera</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  placeholder="e.g., Living Room"
                  value={newDevice.room || ""}
                  onChange={(e) => setNewDevice({ ...newDevice, room: e.target.value })}
                />
              </div>

              {newDevice.type === "thermostat" && (
                <div className="grid gap-2">
                  <Label htmlFor="value">Initial Temperature (°F)</Label>
                  <Input
                    id="value"
                    type="number"
                    min="60"
                    max="85"
                    value={newDevice.value || 72}
                    onChange={(e) => setNewDevice({ ...newDevice, value: parseFloat(e.target.value) || 72 })}
                  />
                </div>
              )}

              {newDevice.type === "light" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="value">Initial Brightness (%)</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      max="100"
                      value={newDevice.value || 50}
                      onChange={(e) => setNewDevice({ ...newDevice, value: parseFloat(e.target.value) || 50 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={newDevice.color || "#FFFFFF"}
                        onChange={(e) => setNewDevice({ ...newDevice, color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        placeholder="#FFFFFF"
                        value={newDevice.color || "#FFFFFF"}
                        onChange={(e) => setNewDevice({ ...newDevice, color: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {newDevice.type === "lock" && (
                <div className="grid gap-2">
                  <Label htmlFor="locked">Initial State</Label>
                  <select
                    id="locked"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newDevice.locked ? "true" : "false"}
                    onChange={(e) => setNewDevice({ ...newDevice, locked: e.target.value === "true" })}
                  >
                    <option value="true">Locked</option>
                    <option value="false">Unlocked</option>
                  </select>
                </div>
              )}

              {newDevice.type === "blind" && (
                <div className="grid gap-2">
                  <Label htmlFor="position">Initial Position (%)</Label>
                  <Input
                    id="position"
                    type="number"
                    min="0"
                    max="100"
                    value={newDevice.position || 0}
                    onChange={(e) => setNewDevice({ ...newDevice, position: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newDevice.status}
                  onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value as "on" | "off" })}
                >
                  <option value="off">Off</option>
                  <option value="on">On</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice}>
                Add Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(var(--smart-primary)), hsl(var(--smart-secondary)))" }}
              >
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
              <div 
                className="p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(var(--smart-primary)), hsl(var(--smart-secondary)))" }}
              >
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
              <div 
                className="p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(var(--ai-primary)), hsl(var(--ai-secondary)))" }}
              >
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
              <div 
                className="p-2 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(var(--weather-primary)), hsl(var(--weather-secondary)))" }}
              >
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
                  onDelete={handleDeleteDevice}
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
