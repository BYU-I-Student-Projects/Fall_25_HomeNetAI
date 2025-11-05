import { SmartDevice, SavedLocation } from "./storage";
import { CITIES } from "./cityDatabase";
import { generateMockWeather, generateHourlyForecast, generateDailyForecast } from "./mockWeather";

export function getInitialDevices(): SmartDevice[] {
  return [
    {
      id: "thermostat-1",
      name: "Living Room Thermostat",
      type: "thermostat",
      status: "on",
      room: "Living Room",
      value: 72,
    },
    {
      id: "thermostat-2",
      name: "Bedroom Thermostat",
      type: "thermostat",
      status: "on",
      room: "Bedroom",
      value: 68,
    },
    {
      id: "light-1",
      name: "Kitchen Lights",
      type: "light",
      status: "on",
      room: "Kitchen",
      value: 80,
      color: "#FFFFFF",
    },
    {
      id: "light-2",
      name: "Living Room Lights",
      type: "light",
      status: "off",
      room: "Living Room",
      value: 0,
      color: "#FFA500",
    },
    {
      id: "light-3",
      name: "Bedroom Lights",
      type: "light",
      status: "off",
      room: "Bedroom",
      value: 0,
      color: "#FFFFFF",
    },
    {
      id: "plug-1",
      name: "Coffee Maker",
      type: "plug",
      status: "off",
      room: "Kitchen",
    },
    {
      id: "plug-2",
      name: "TV Stand",
      type: "plug",
      status: "on",
      room: "Living Room",
    },
    {
      id: "lock-1",
      name: "Front Door",
      type: "lock",
      status: "off",
      room: "Entrance",
      locked: true,
    },
    {
      id: "lock-2",
      name: "Back Door",
      type: "lock",
      status: "off",
      room: "Backyard",
      locked: true,
    },
    {
      id: "blind-1",
      name: "Living Room Blinds",
      type: "blind",
      status: "on",
      room: "Living Room",
      position: 50,
    },
    {
      id: "blind-2",
      name: "Bedroom Blinds",
      type: "blind",
      status: "on",
      room: "Bedroom",
      position: 100,
    },
    {
      id: "camera-1",
      name: "Front Door Camera",
      type: "camera",
      status: "on",
      room: "Entrance",
    },
    {
      id: "camera-2",
      name: "Backyard Camera",
      type: "camera",
      status: "on",
      room: "Backyard",
    },
  ];
}

export function getInitialLocations(): SavedLocation[] {
  const initialCities = [
    CITIES.find(c => c.id === "nyc")!,
    CITIES.find(c => c.id === "london")!,
    CITIES.find(c => c.id === "tokyo")!,
  ];
  
  return initialCities.map(city => ({
    id: crypto.randomUUID(),
    city,
    weather: generateMockWeather(city),
    hourly: generateHourlyForecast(city),
    daily: generateDailyForecast(city),
    addedAt: new Date().toISOString(),
  }));
}

export function generateAIInsights(locations: SavedLocation[], devices: SmartDevice[]): string[] {
  const insights: string[] = [];
  
  if (locations.length > 0) {
    const hotLocation = locations.reduce((prev, curr) => 
      curr.weather.temperature > prev.weather.temperature ? curr : prev
    );
    
    if (hotLocation.weather.temperature > 85) {
      insights.push(`🌡️ High temperature alert: ${hotLocation.city.name} will reach ${hotLocation.weather.temperature}°F. Consider adjusting your AC.`);
    }
    
    const rainyLocations = locations.filter(l => l.weather.precipitation > 60);
    if (rainyLocations.length > 0) {
      insights.push(`🌧️ Rain expected in ${rainyLocations.length} location(s). Don't forget your umbrella!`);
    }
    
    const avgTemp = locations.reduce((sum, l) => sum + l.weather.temperature, 0) / locations.length;
    if (avgTemp < 50) {
      insights.push(`❄️ Cold weather ahead. Average temperature across your locations: ${Math.round(avgTemp)}°F.`);
    }
  }
  
  const activeDevices = devices.filter(d => d.status === 'on');
  const thermostats = devices.filter(d => d.type === 'thermostat' && d.status === 'on');
  
  if (thermostats.length > 0) {
    const avgTemp = thermostats.reduce((sum, t) => sum + (t.value || 0), 0) / thermostats.length;
    if (avgTemp > 75) {
      insights.push(`💡 Energy tip: Your thermostats are set to ${Math.round(avgTemp)}°F on average. Lowering by 2° can save 10% on cooling costs.`);
    }
  }
  
  const lights = devices.filter(d => d.type === 'light' && d.status === 'on');
  if (lights.length > 3) {
    insights.push(`💡 ${lights.length} lights are currently on. Consider turning off unused lights to save energy.`);
  }
  
  const unlockedDoors = devices.filter(d => d.type === 'lock' && !d.locked);
  if (unlockedDoors.length > 0) {
    insights.push(`🔒 Security alert: ${unlockedDoors.length} door(s) are unlocked.`);
  }
  
  insights.push(`✨ Tip: Create automation rules to optimize your energy usage based on weather conditions.`);
  insights.push(`📊 Your home has ${activeDevices.length} active devices consuming energy right now.`);
  
  return insights;
}

export function generateChatResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
    return "I can help you check the weather! To see detailed weather information, visit the Locations page where you can add and monitor weather for cities worldwide.";
  }
  
  if (lowerMessage.includes('device') || lowerMessage.includes('smart home') || lowerMessage.includes('thermostat') || lowerMessage.includes('light')) {
    return "You can control all your smart home devices from the Smart Home page. I can help you create automation rules to make your home even smarter!";
  }
  
  if (lowerMessage.includes('energy') || lowerMessage.includes('save') || lowerMessage.includes('cost')) {
    return "Great question! Lowering your thermostat by 2°F in winter can save about 10% on heating costs. Also, turning off lights when not in use and using automation rules can significantly reduce energy consumption.";
  }
  
  if (lowerMessage.includes('automation') || lowerMessage.includes('rule')) {
    return "Automation rules let you control devices based on conditions like weather, time, or other device states. For example, you can automatically close blinds when it's sunny or turn on AC when temperature exceeds a threshold.";
  }
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return "Hello! I'm your HomeNetAI assistant. I can help you with weather information, smart home device control, energy optimization, and automation rules. What would you like to know?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can assist with:\n• Weather forecasts and alerts\n• Smart home device control\n• Energy-saving tips\n• Automation rule creation\n• General home management advice\n\nWhat would you like help with?";
  }
  
  return "I'm here to help! You can ask me about weather, smart home devices, energy optimization, or automation. Try asking specific questions like 'How can I save energy?' or 'What's the weather like?'";
}

