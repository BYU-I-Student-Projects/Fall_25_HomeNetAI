import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Radio, Zap, Send, RefreshCw, Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PicoDevice {
  id: string;
  device_id: string;
  user_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  module_type?: string;
  device?: {
    id: string;
    name: string;
  };
}

interface LastReading {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  status?: string;
  is_open?: number;
  is_on?: number;
  position?: number;
  brightness?: number;
  color?: string;
  timestamp: string;
}

interface CommandParams {
  n?: number;
  on_time?: number;
  off_time?: number;
  temp?: number;
  status?: string;
  [key: string]: any;
}

interface DeviceGroup {
  deviceId: string;
  deviceName: string;
  modules: PicoDevice[];
}

// Use local backend proxy to avoid CORS issues
const PICO_API_BASE = "http://localhost:8000/proxy/pico";

const PicoDevices = () => {
  const [devices, setDevices] = useState<PicoDevice[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<PicoDevice | null>(null);
  const [selectedParentDevice, setSelectedParentDevice] = useState<string | null>(null);
  const [commandDialog, setCommandDialog] = useState(false);
  const [command, setCommand] = useState("OPEN_DOOR");
  const [commandParams, setCommandParams] = useState<CommandParams>({});
  const [sendingCommand, setSendingCommand] = useState(false);
  const [wifiDialog, setWifiDialog] = useState(false);
  const [lastReadings, setLastReadings] = useState<Record<string, LastReading>>({});
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [changingWifi, setChangingWifi] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      // Get current user's user_id from backend
      const userResponse = await fetch("http://localhost:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const user = await userResponse.json();
      const userId = user.id; // UUID from database

      // Fetch devices from Pico API proxy using the user_id
      console.log(`Fetching devices for user: ${userId}`);
      const response = await fetch(
        `${PICO_API_BASE}/users/${userId}/device-modules`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${errorText}`);
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received data:`, data);
      
      // Handle both array and object with data property
      const devicesData = data.data || data;
      const deviceArray = Array.isArray(devicesData) ? devicesData : [];
      setDevices(deviceArray);
      
      // Group devices by parent device
      const groups: Record<string, DeviceGroup> = {};
      deviceArray.forEach((mod: PicoDevice) => {
        const parentId = mod.device_id;
        const parentName = mod.device?.name || `Device ${parentId.slice(0, 8)}`;
        
        if (!groups[parentId]) {
          groups[parentId] = {
            deviceId: parentId,
            deviceName: parentName,
            modules: [],
          };
        }
        groups[parentId].modules.push(mod);
      });
      
      setDeviceGroups(Object.values(groups));
    } catch (error: any) {
      console.error("Fetch devices error:", error);
      
      let errorMessage = error.message || "Failed to fetch Pico devices";
      
      // Check for CORS or network errors
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        errorMessage = "Cannot connect to Pico API. This might be a CORS or network issue.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async () => {
    if (!selectedDevice) return;

    setSendingCommand(true);
    try {
      const response = await fetch(`${PICO_API_BASE}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          device_id: selectedDevice.device_id,
          command: command,
          params: commandParams,
          device_module_id: selectedDevice.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send command");
      }

      toast({
        title: "Success",
        description: `Command "${command}" sent to ${selectedDevice.name}`,
      });

      setCommandDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send command",
        variant: "destructive",
      });
    } finally {
      setSendingCommand(false);
    }
  };

  const sendWifiChange = async () => {
    if (!selectedParentDevice) {
      toast({
        title: "Error",
        description: "No device selected",
        variant: "destructive",
      });
      return;
    }

    if (!wifiSSID || !wifiPassword) {
      toast({
        title: "Error",
        description: "Please enter both SSID and password",
        variant: "destructive",
      });
      return;
    }

    setChangingWifi(true);
    try {
      // Find the first module of the parent device to send the command to
      const parentDevice = deviceGroups.find(g => g.deviceId === selectedParentDevice);
      if (!parentDevice || parentDevice.modules.length === 0) {
        throw new Error("Device not found");
      }

      const moduleId = parentDevice.modules[0].id;

      const response = await fetch(`${PICO_API_BASE}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          device_id: selectedParentDevice,
          command: "CHANGE_WIFI",
          params: {
            ssid: wifiSSID,
            password: wifiPassword,
          },
          device_module_id: moduleId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send WiFi change command");
      }

      toast({
        title: "Success",
        description: `WiFi change command sent. Device will restart.`,
      });

      setWifiDialog(false);
      setWifiSSID("");
      setWifiPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send WiFi change command",
        variant: "destructive",
      });
    } finally {
      setChangingWifi(false);
    }
  };

  const fetchLastReading = async (device: PicoDevice) => {
    try {
      const response = await fetch(
        `${PICO_API_BASE}/device-modules/${device.id}/latest`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Latest reading data:", result);
        
        if (result && result.data) {
          const reading = result.data;
          
          // Parse data from JSON string if it exists
          let sensorData: any = {};
          if (reading.data) {
            try {
              sensorData = typeof reading.data === 'string' 
                ? JSON.parse(reading.data) 
                : reading.data;
            } catch (e) {
              console.error("Failed to parse sensor data:", e);
              toast({
                title: "Parse Error",
                description: "Failed to parse sensor data",
                variant: "destructive",
              });
              return;
            }
          }
          
          // Store reading in state with parsed JSON data (with null checks)
          setLastReadings(prev => ({
            ...prev,
            [device.id]: {
              temperature: sensorData?.temperature ?? null,
              humidity: sensorData?.humidity ?? null,
              pressure: sensorData?.pressure ?? null,
              status: sensorData?.status ?? null,
              is_open: sensorData?.is_open ?? null,
              is_on: sensorData?.is_on ?? null,
              position: sensorData?.position ?? null,
              brightness: sensorData?.brightness ?? null,
              color: sensorData?.color ?? null,
              timestamp: reading.timestamp || new Date().toISOString(),
            }
          }));
          
          // Don't show success toast, just update silently
        } else {
          toast({
            title: "No Data",
            description: "No readings available yet for this module",
          });
        }
      } else {
        throw new Error("Failed to fetch reading");
      }
    } catch (error: any) {
      console.error("Fetch reading error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch last reading",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const getAvailableCommands = (moduleType?: string): { label: string; value: string; params: CommandParams }[] => {
    switch (moduleType?.toUpperCase()) {
      case "DOOR":
      case "MAIN DOOR SENSOR":
        return [
          { label: "Open Door", value: "OPEN_DOOR", params: {} },
          { label: "Close Door", value: "CLOSE_DOOR", params: {} },
        ];
      case "WINDOW":
      case "LIVING ROOM WINDOW":
        return [
          { label: "Open Window", value: "OPEN_WINDOW", params: {} },
          { label: "Close Window", value: "CLOSE_WINDOW", params: {} },
        ];
      case "LIGHT":
      case "BEDROOM LIGHT BULB":
        return [
          { label: "Turn On", value: "LIGHT_ON", params: {} },
          { label: "Turn Off", value: "LIGHT_OFF", params: {} },
        ];
      case "WEATHER_SENSOR":
        return [];
      default:
        return [];
    }
  };

  const openCommandDialog = (device: PicoDevice, parentDeviceId: string) => {
    setSelectedDevice(device);
    setSelectedParentDevice(parentDeviceId);
    
    const availableCommands = getAvailableCommands(device.module_type);
    if (availableCommands.length > 0) {
      const firstCommand = availableCommands[0];
      setCommand(firstCommand.value);
      setCommandParams(firstCommand.params);
    }
    
    setCommandDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pico Devices</h1>
          <p className="text-muted-foreground">
            Manage your Raspberry Pi Pico devices and modules
          </p>
        </div>
        <Button onClick={fetchDevices} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Devices
        </Button>
      </div>

      {deviceGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Pico devices found</p>
            <p className="text-sm text-muted-foreground">
              Connect your first Raspberry Pi Pico device to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {deviceGroups.map((group) => (
            <Card key={group.deviceId} className="overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{group.deviceName}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        Device ID: {group.deviceId.slice(0, 12)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedParentDevice(group.deviceId);
                      setWifiDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    WiFi Settings
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {group.modules.map((module) => (
                    <Card key={module.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {module.module_type || "Unknown"}
                            </CardDescription>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {module.module_type}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Last Reading Section */}
                        {lastReadings[module.id] && lastReadings[module.id].timestamp ? (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Last Reading:</p>
                            <div className="space-y-1 text-sm">
                              {/* Door-specific status display */}
                              {(module.module_type?.toUpperCase() === "DOOR" || module.module_type?.toUpperCase() === "MAIN DOOR SENSOR") && (
                                <>
                                  {lastReadings[module.id]?.status !== undefined && lastReadings[module.id]?.status !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Status:</span>
                                      <span className={`font-semibold capitalize px-2 py-1 rounded text-xs ${
                                        lastReadings[module.id].status?.toLowerCase() === 'open' || lastReadings[module.id].is_open === 1
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {lastReadings[module.id].status}
                                      </span>
                                    </div>
                                  )}
                                  {lastReadings[module.id]?.is_open !== undefined && lastReadings[module.id]?.is_open !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Door:</span>
                                      <span className={`font-semibold px-2 py-1 rounded text-xs ${
                                        lastReadings[module.id]?.is_open === 1 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {lastReadings[module.id]?.is_open === 1 ? 'Open' : 'Closed'}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Window-specific status display */}
                              {(module.module_type?.toUpperCase() === "WINDOW" || module.module_type?.toUpperCase() === "LIVING ROOM WINDOW") && (
                                <>
                                  {lastReadings[module.id]?.status !== undefined && lastReadings[module.id]?.status !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Status:</span>
                                      <span className={`font-semibold capitalize px-2 py-1 rounded text-xs ${
                                        lastReadings[module.id].status?.toLowerCase() === 'open' || lastReadings[module.id].is_open === 1
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {lastReadings[module.id].status}
                                      </span>
                                    </div>
                                  )}
                                  {lastReadings[module.id]?.position !== undefined && lastReadings[module.id]?.position !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Position:</span>
                                      <span className="font-medium">{lastReadings[module.id]?.position}%</span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Light-specific status display */}
                              {(module.module_type?.toUpperCase() === "LIGHT" || module.module_type?.toUpperCase() === "BEDROOM LIGHT BULB") && (
                                <>
                                  {lastReadings[module.id]?.status !== undefined && lastReadings[module.id]?.status !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Status:</span>
                                      <span className={`font-semibold capitalize px-2 py-1 rounded text-xs ${
                                        lastReadings[module.id].status?.toLowerCase() === 'on' || lastReadings[module.id].is_on === 1
                                          ? 'bg-yellow-100 text-yellow-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {lastReadings[module.id].status}
                                      </span>
                                    </div>
                                  )}
                                  {lastReadings[module.id]?.brightness !== undefined && lastReadings[module.id]?.brightness !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Brightness:</span>
                                      <span className="font-medium">{lastReadings[module.id]?.brightness}%</span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Standard sensor readings */}
                              {lastReadings[module.id]?.temperature !== undefined && lastReadings[module.id]?.temperature !== null && lastReadings[module.id]?.temperature !== 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Temperature:</span>
                                  <span className="font-medium">{lastReadings[module.id]?.temperature}°F</span>
                                </div>
                              )}
                              {lastReadings[module.id]?.humidity !== undefined && lastReadings[module.id]?.humidity !== null && lastReadings[module.id]?.humidity !== 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Humidity:</span>
                                  <span className="font-medium">{lastReadings[module.id]?.humidity}%</span>
                                </div>
                              )}
                              {lastReadings[module.id]?.pressure !== undefined && lastReadings[module.id]?.pressure !== null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Pressure:</span>
                                  <span className="font-medium">{lastReadings[module.id]?.pressure} hPa</span>
                                </div>
                              )}
                              
                              {/* Generic status for non-door modules */}
                              {!(module.module_type?.toUpperCase() === "DOOR" || module.module_type?.toUpperCase() === "MAIN DOOR SENSOR") && 
                               !(module.module_type?.toUpperCase() === "WINDOW" || module.module_type?.toUpperCase() === "LIVING ROOM WINDOW") &&
                               !(module.module_type?.toUpperCase() === "LIGHT" || module.module_type?.toUpperCase() === "BEDROOM LIGHT BULB") &&
                               lastReadings[module.id]?.status !== undefined && lastReadings[module.id]?.status !== null && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="font-medium capitalize">{lastReadings[module.id]?.status}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between text-xs pt-1 border-t">
                                <span className="text-muted-foreground">Updated:</span>
                                <span className="text-muted-foreground">
                                  {new Date(lastReadings[module.id]?.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded p-3 text-center">
                            <p className="text-sm text-muted-foreground">No data received</p>
                            <p className="text-xs text-muted-foreground mt-1">Click "Get Reading" to fetch data</p>
                          </div>
                        )}
                        
                        {/* Standard Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {/* Show Send Command button for all modules except weather sensor */}
                          {module.module_type?.toUpperCase() !== "WEATHER_SENSOR" &&
                           !module.name?.toLowerCase().includes("weather") && (
                            <Button
                              onClick={() => openCommandDialog(module, group.deviceId)}
                              className="flex-1"
                              size="sm"
                              variant="default"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Command
                            </Button>
                          )}
                          <Button
                            onClick={() => fetchLastReading(module)}
                            variant="outline"
                            size="sm"
                            title="Get latest reading"
                            className="flex-1"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Get Reading
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={commandDialog} onOpenChange={setCommandDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send Command
            </DialogTitle>
            <DialogDescription>
              {selectedDevice?.name} - {selectedDevice?.module_type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show available commands as buttons */}
            <div className="space-y-3">
              <Label>Available Commands:</Label>
              {getAvailableCommands(selectedDevice?.module_type).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableCommands(selectedDevice?.module_type).map((cmd) => (
                    <Button
                      key={cmd.value}
                      variant={command === cmd.value ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setCommand(cmd.value);
                        setCommandParams(cmd.params);
                      }}
                    >
                      {cmd.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No commands available for this module type
                  </p>
                </div>
              )}
            </div>

            {/* Show selected command */}
            {command && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm font-medium text-blue-900">
                  Selected Command: <span className="font-bold">{command}</span>
                </p>
              </div>
            )}

            {/* Temperature parameter for CHANGE_THERMO */}
            {command === "CHANGE_THERMO" && (
              <div className="space-y-2">
                <Label htmlFor="temp">Temperature (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  value={commandParams.temp || 0}
                  onChange={(e) =>
                    setCommandParams({
                      ...commandParams,
                      temp: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommandDialog(false)}
              disabled={sendingCommand}
            >
              Cancel
            </Button>
            <Button onClick={sendCommand} disabled={sendingCommand}>
              {sendingCommand ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Command
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wifiDialog} onOpenChange={setWifiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change WiFi Settings
            </DialogTitle>
            <DialogDescription>
              Device ID: {selectedParentDevice?.slice(0, 12)}...
              <br />
              Update the WiFi credentials. The device will restart after applying changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">WiFi SSID (Network Name)</Label>
              <Input
                id="ssid"
                value={wifiSSID}
                onChange={(e) => setWifiSSID(e.target.value)}
                placeholder="Enter WiFi network name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">WiFi Password</Label>
              <Input
                id="password"
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Enter WiFi password"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> The device will restart immediately after receiving this command. Make sure the new WiFi credentials are correct.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWifiDialog(false);
                setWifiSSID("");
                setWifiPassword("");
              }}
              disabled={changingWifi}
            >
              Cancel
            </Button>
            <Button onClick={sendWifiChange} disabled={changingWifi || !wifiSSID || !wifiPassword}>
              {changingWifi ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Change WiFi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PicoDevices;
