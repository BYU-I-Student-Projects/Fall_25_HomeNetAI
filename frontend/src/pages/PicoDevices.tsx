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
}

interface LastReading {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  timestamp: string;
}

interface CommandParams {
  n?: number;
  on_time?: number;
  off_time?: number;
  [key: string]: any;
}

// Use local backend proxy to avoid CORS issues
const PICO_API_BASE = "http://localhost:8000/proxy/pico";

const PicoDevices = () => {
  const [devices, setDevices] = useState<PicoDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<PicoDevice | null>(null);
  const [commandDialog, setCommandDialog] = useState(false);
  const [command, setCommand] = useState("BLINK_PICO1");
  const [commandParams, setCommandParams] = useState<CommandParams>({
    n: 3,
    on_time: 0.2,
    off_time: 0.2,
  });
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
      setDevices(Array.isArray(devicesData) ? devicesData : []);
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
    if (!selectedDevice) return;

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
      const response = await fetch(`${PICO_API_BASE}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          device_id: selectedDevice.device_id,
          command: "CHANGE_WIFI",
          params: {
            ssid: wifiSSID,
            password: wifiPassword,
          },
          device_module_id: selectedDevice.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send WiFi change command");
      }

      toast({
        title: "Success",
        description: `WiFi change command sent to ${selectedDevice.name}. Device will restart.`,
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
          
          // Store reading in state
          setLastReadings(prev => ({
            ...prev,
            [device.id]: {
              temperature: reading.temperature,
              humidity: reading.humidity,
              pressure: reading.pressure,
              timestamp: reading.timestamp,
            }
          }));
          
          toast({
            title: "Success",
            description: "Reading updated",
          });
        } else {
          toast({
            title: "No Data",
            description: "No readings available yet",
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

  const openCommandDialog = (device: PicoDevice) => {
    setSelectedDevice(device);
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
            Manage your Raspberry Pi Pico devices
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              // Use first device if available, otherwise set a placeholder
              if (devices.length > 0) {
                setSelectedDevice(devices[0]);
              }
              setWifiDialog(true);
            }} 
            variant="outline"
            disabled={devices.length === 0}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Change WiFi
          </Button>
          <Button onClick={fetchDevices} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {devices.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                  </span>
                </div>
                <CardDescription className="text-xs font-mono">
                  ID: {device.device_id.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Created: {new Date(device.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground">
                    Updated: {new Date(device.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => openCommandDialog(device)}
                    className="flex-1"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Command
                  </Button>
                  <Button
                    onClick={() => fetchLastReading(device)}
                    variant="outline"
                    size="sm"
                    title="Get last reading"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>

                {lastReadings[device.id] && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Last Reading:</p>
                    <div className="space-y-1 text-sm">
                      {lastReadings[device.id].temperature !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temperature:</span>
                          <span className="font-medium">{lastReadings[device.id].temperature}°F</span>
                        </div>
                      )}
                      {lastReadings[device.id].humidity !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Humidity:</span>
                          <span className="font-medium">{lastReadings[device.id].humidity}%</span>
                        </div>
                      )}
                      {lastReadings[device.id].pressure !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pressure:</span>
                          <span className="font-medium">{lastReadings[device.id].pressure} hPa</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="text-muted-foreground">
                          {new Date(lastReadings[device.id].timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={commandDialog} onOpenChange={setCommandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Command to {selectedDevice?.name}</DialogTitle>
            <DialogDescription>
              Configure and send a command to your Pico device
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="command">Command</Label>
              <Input
                id="command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., BLINK_PICO1"
              />
            </div>

            <div className="space-y-2">
              <Label>Parameters</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="n" className="text-xs">
                    Repetitions (n)
                  </Label>
                  <Input
                    id="n"
                    type="number"
                    value={commandParams.n || 0}
                    onChange={(e) =>
                      setCommandParams({
                        ...commandParams,
                        n: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="on_time" className="text-xs">
                    On Time (s)
                  </Label>
                  <Input
                    id="on_time"
                    type="number"
                    step="0.1"
                    value={commandParams.on_time || 0}
                    onChange={(e) =>
                      setCommandParams({
                        ...commandParams,
                        on_time: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="off_time" className="text-xs">
                    Off Time (s)
                  </Label>
                  <Input
                    id="off_time"
                    type="number"
                    step="0.1"
                    value={commandParams.off_time || 0}
                    onChange={(e) =>
                      setCommandParams({
                        ...commandParams,
                        off_time: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
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
            <DialogTitle>Change WiFi Settings for {selectedDevice?.name}</DialogTitle>
            <DialogDescription>
              Update the WiFi credentials for your Pico device. The device will restart after applying the changes.
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
            <Button onClick={sendWifiChange} disabled={changingWifi}>
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
