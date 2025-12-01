import { City } from "./cityDatabase";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
  humidity: number;
}

const weatherConditions = [
  { condition: "Clear", icon: "☀️", precipChance: 0 },
  { condition: "Partly Cloudy", icon: "⛅", precipChance: 10 },
  { condition: "Cloudy", icon: "☁️", precipChance: 20 },
  { condition: "Overcast", icon: "🌥️", precipChance: 30 },
  { condition: "Light Rain", icon: "🌦️", precipChance: 60 },
  { condition: "Rain", icon: "🌧️", precipChance: 80 },
  { condition: "Thunderstorm", icon: "⛈️", precipChance: 90 },
  { condition: "Snow", icon: "❄️", precipChance: 70 },
  { condition: "Fog", icon: "🌫️", precipChance: 5 },
];

// Simplified weather generation for better performance
export function generateMockWeather(city: City): WeatherData {
  // Use city ID as seed for consistent weather
  const seed = city.id.charCodeAt(0) + city.id.charCodeAt(1);
  const temp = 70 + (seed % 30) - 15; // 55-85°F range
  const weatherIndex = seed % weatherConditions.length;
  const weather = weatherConditions[weatherIndex];
  
  return {
    temperature: temp,
    feelsLike: temp + (seed % 6) - 3,
    humidity: 50 + (seed % 30),
    windSpeed: 10 + (seed % 20),
    windDirection: seed % 360,
    pressure: 1000 + (seed % 20),
    uvIndex: seed % 11,
    visibility: 10 + (seed % 10),
    condition: weather.condition,
    icon: weather.icon,
    precipitation: weather.precipChance,
  };
}

export function generateHourlyForecast(city: City): HourlyForecast[] {
  const forecast: HourlyForecast[] = [];
  const baseWeather = generateMockWeather(city);
  const seed = city.id.charCodeAt(0);
  
  for (let i = 0; i < 12; i++) { // Reduced from 24 to 12 hours
    const hour = new Date();
    hour.setHours(hour.getHours() + i * 2); // Every 2 hours
    
    const tempVariation = (seed + i) % 10 - 5;
    const weather = weatherConditions[(seed + i) % weatherConditions.length];
    
    forecast.push({
      time: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temperature: baseWeather.temperature + tempVariation,
      condition: weather.condition,
      icon: weather.icon,
      precipitation: weather.precipChance,
    });
  }
  
  return forecast;
}

export function generateDailyForecast(city: City): DailyForecast[] {
  const forecast: DailyForecast[] = [];
  const baseWeather = generateMockWeather(city);
  const seed = city.id.charCodeAt(0);
  
  for (let i = 0; i < 5; i++) { // Reduced from 7 to 5 days
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const weather = weatherConditions[(seed + i) % weatherConditions.length];
    const baseTemp = baseWeather.temperature + ((seed + i) % 10) - 5;
    
    forecast.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      high: baseTemp + 5,
      low: baseTemp - 5,
      condition: weather.condition,
      icon: weather.icon,
      precipitation: weather.precipChance,
      humidity: 50 + (seed + i) % 30,
    });
  }
  
  return forecast;
}
