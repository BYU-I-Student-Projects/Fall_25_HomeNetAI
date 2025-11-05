/**
 * Weather helper functions
 * Maps weather codes to descriptions and icons
 */

// Weather code mapping based on WMO Weather interpretation codes
export const WEATHER_CODE_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Clear", icon: "☀️" },
  1: { condition: "Mainly Clear", icon: "🌤️" },
  2: { condition: "Partly Cloudy", icon: "⛅" },
  3: { condition: "Overcast", icon: "☁️" },
  45: { condition: "Foggy", icon: "🌫️" },
  48: { condition: "Depositing Rime Fog", icon: "🌫️" },
  51: { condition: "Light Drizzle", icon: "🌦️" },
  53: { condition: "Moderate Drizzle", icon: "🌦️" },
  55: { condition: "Dense Drizzle", icon: "🌧️" },
  56: { condition: "Light Freezing Drizzle", icon: "🌨️" },
  57: { condition: "Dense Freezing Drizzle", icon: "🌨️" },
  61: { condition: "Slight Rain", icon: "🌦️" },
  63: { condition: "Moderate Rain", icon: "🌧️" },
  65: { condition: "Heavy Rain", icon: "🌧️" },
  66: { condition: "Light Freezing Rain", icon: "🌨️" },
  67: { condition: "Heavy Freezing Rain", icon: "🌨️" },
  71: { condition: "Slight Snow", icon: "❄️" },
  73: { condition: "Moderate Snow", icon: "❄️" },
  75: { condition: "Heavy Snow", icon: "❄️" },
  77: { condition: "Snow Grains", icon: "❄️" },
  80: { condition: "Slight Rain Showers", icon: "🌦️" },
  81: { condition: "Moderate Rain Showers", icon: "🌧️" },
  82: { condition: "Violent Rain Showers", icon: "🌧️" },
  85: { condition: "Slight Snow Showers", icon: "🌨️" },
  86: { condition: "Heavy Snow Showers", icon: "🌨️" },
  95: { condition: "Thunderstorm", icon: "⛈️" },
  96: { condition: "Thunderstorm with Hail", icon: "⛈️" },
  99: { condition: "Thunderstorm with Heavy Hail", icon: "⛈️" },
};

export function getWeatherCondition(code: number): { condition: string; icon: string } {
  return WEATHER_CODE_MAP[code] || { condition: "Unknown", icon: "☀️" };
}

export function formatWeatherData(weatherData: any) {
  const currentWeather = weatherData?.current_weather || {};
  const weatherCode = currentWeather.weathercode || 0;
  const weatherInfo = getWeatherCondition(weatherCode);
  
  return {
    temperature: Math.round(currentWeather.temperature || 0),
    feelsLike: Math.round(currentWeather.apparent_temperature || 0),
    condition: weatherInfo.condition,
    icon: weatherInfo.icon,
    humidity: currentWeather.relativehumidity_2m || 0,
    windSpeed: Math.round(currentWeather.windspeed_10m || 0),
    windDirection: currentWeather.winddirection_10m || 0,
    pressure: 1012, // Not available in current API
    visibility: 10, // Not available in current API
    uvIndex: currentWeather.uv_index || 0,
    precipitation: currentWeather.precipitation_probability || 0,
  };
}

