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

export function generateMockWeather(city: City): WeatherData {
  const now = new Date();
  const month = now.getMonth();
  const isWinter = month >= 11 || month <= 2;
  const isSummer = month >= 5 && month <= 8;
  
  let baseTemp = 15;
  const latEffect = Math.abs(city.latitude) * -0.5;
  baseTemp += latEffect;
  
  if (city.latitude > 0) {
    if (isSummer) baseTemp += 15;
    if (isWinter) baseTemp -= 15;
  } else {
    if (isSummer) baseTemp -= 15;
    if (isWinter) baseTemp += 15;
  }
  
  const temp = baseTemp + (Math.random() * 10 - 5);
  
  let weatherIndex: number;
  if (temp > 30) {
    weatherIndex = Math.random() > 0.7 ? 0 : 1;
  } else if (temp < 0) {
    weatherIndex = Math.random() > 0.6 ? 7 : 2;
  } else {
    weatherIndex = Math.floor(Math.random() * weatherConditions.length);
  }
  
  const weather = weatherConditions[weatherIndex];
  
  return {
    temperature: Math.round(temp),
    feelsLike: Math.round(temp + (Math.random() * 6 - 3)),
    humidity: Math.round(40 + Math.random() * 50),
    windSpeed: Math.round(5 + Math.random() * 25),
    windDirection: Math.round(Math.random() * 360),
    pressure: Math.round(990 + Math.random() * 40),
    uvIndex: Math.max(0, Math.round(Math.random() * 11)),
    visibility: Math.round(5 + Math.random() * 15),
    condition: weather.condition,
    icon: weather.icon,
    precipitation: weather.precipChance,
  };
}

export function generateHourlyForecast(city: City): HourlyForecast[] {
  const forecast: HourlyForecast[] = [];
  const baseWeather = generateMockWeather(city);
  
  for (let i = 0; i < 24; i++) {
    const hour = new Date();
    hour.setHours(hour.getHours() + i);
    
    const tempVariation = Math.sin((i - 6) * Math.PI / 12) * 5;
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    forecast.push({
      time: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temperature: Math.round(baseWeather.temperature + tempVariation),
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
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const baseTemp = baseWeather.temperature + (Math.random() * 10 - 5);
    
    forecast.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      high: Math.round(baseTemp + 5 + Math.random() * 3),
      low: Math.round(baseTemp - 5 - Math.random() * 3),
      condition: weather.condition,
      icon: weather.icon,
      precipitation: weather.precipChance,
      humidity: Math.round(40 + Math.random() * 50),
    });
  }
  
  return forecast;
}

