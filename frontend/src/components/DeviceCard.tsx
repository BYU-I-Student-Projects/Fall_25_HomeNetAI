import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartDevice } from "@/lib/storage";
import { Thermometer, Lightbulb, Plug, Lock, Blinds, Camera, Trash2 } from "lucide-react";

interface DeviceCardProps {
  device: SmartDevice;
  onToggle: (id: string) => void;
  onValueChange?: (id: string, value: number) => void;
  onDelete?: (id: string) => void;
}

const DeviceCard = ({ device, onToggle, onValueChange, onDelete }: DeviceCardProps) => {
  const getIcon = () => {
    const iconClass = "h-5 w-5 text-white";
    switch (device.type) {
      case "thermostat":
        return <Thermometer className={iconClass} />;
      case "light":
        return <Lightbulb className={iconClass} />;
      case "plug":
        return <Plug className={iconClass} />;
      case "lock":
        return <Lock className={iconClass} />;
      case "blind":
        return <Blinds className={iconClass} />;
      case "camera":
        return <Camera className={iconClass} />;
      default:
        return <Plug className={iconClass} />;
    }
  };

  const getGradientStyle = () => {
    switch (device.type) {
      case "thermostat":
      case "light":
        return {
          background: "linear-gradient(135deg, hsl(var(--smart-primary)), hsl(var(--smart-secondary)))"
        };
      case "lock":
      case "camera":
        return {
          background: "linear-gradient(135deg, hsl(var(--ai-primary)), hsl(var(--ai-secondary)))"
        };
      default:
        return {
          background: "linear-gradient(135deg, hsl(var(--weather-primary)), hsl(var(--weather-secondary)))"
        };
    }
  };

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={getGradientStyle()}>
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{device.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{device.room}</p>
            </div>
          </div>
          <Switch
            checked={device.status === "on"}
            onCheckedChange={() => onToggle(device.id)}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {device.type === "thermostat" && device.value !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temperature</span>
              <span className="font-bold text-2xl">{device.value}°F</span>
            </div>
            <Slider
              value={[device.value]}
              min={60}
              max={85}
              step={1}
              onValueChange={(values) => onValueChange?.(device.id, values[0])}
              disabled={device.status === "off"}
            />
          </div>
        )}
        
        {device.type === "light" && device.value !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Brightness</span>
              <span className="font-medium">{device.value}%</span>
            </div>
            <Slider
              value={[device.value]}
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onValueChange?.(device.id, values[0])}
              disabled={device.status === "off"}
            />
          </div>
        )}
        
        {device.type === "blind" && device.position !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="font-medium">{device.position}%</span>
            </div>
            <Slider
              value={[device.position]}
              min={0}
              max={100}
              step={10}
              onValueChange={(values) => onValueChange?.(device.id, values[0])}
              disabled={device.status === "off"}
            />
          </div>
        )}
        
        {device.type === "lock" && (
          <Badge variant={device.locked ? "default" : "destructive"} className="w-full justify-center">
            {device.locked ? "Locked" : "Unlocked"}
          </Badge>
        )}
        
        {device.status === "on" && (
          <Badge variant="outline" className="w-full justify-center text-smart-primary border-smart-primary">
            Active
          </Badge>
        )}

        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onDelete(device.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Device
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceCard;

