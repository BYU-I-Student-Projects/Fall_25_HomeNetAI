import axios from "axios";
import { getAuthToken } from "@/lib/storage";

const BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("No auth token found for request:", config.url);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Authentication failed:", error.response.data);
      // Clear invalid token
      localStorage.removeItem('homenet_jwt_token');
    }
    return Promise.reject(error);
  }
);

// Auth
export async function apiLogin(username: string, password: string) {
  const res = await api.post("/auth/login", { username, password });
  return res.data as { access_token: string; token_type: string; user_id: number };
}

export async function apiRegister(username: string, email: string, password: string) {
  const res = await api.post("/auth/register", { username, email, password });
  return res.data as { access_token: string; token_type: string; user_id: number };
}

export async function apiMe() {
  const res = await api.get("/auth/me");
  return res.data as { id: number; username: string; email: string; created_at: string };
}

// Locations
export type SearchLocationResult = {
  name: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  display_name: string;
};

export async function apiSearchLocations(query: string) {
  const res = await api.get("/locations/search", { params: { query } });
  return (res.data.results ?? []) as SearchLocationResult[];
}

export type UserLocation = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export async function apiGetLocations() {
  const res = await api.get("/locations");
  return (res.data.locations ?? []) as UserLocation[];
}

export async function apiAddLocation(payload: { name: string; latitude: number; longitude: number }) {
  const res = await api.post("/locations", payload);
  return res.data as { id: number; message: string };
}

export async function apiDeleteLocation(id: number) {
  const res = await api.delete(`/locations/${id}`);
  return res.data as { message: string };
}

// Weather
export type WeatherResponse = {
  location: string | { id: number; name: string; latitude?: number; longitude?: number };
  current_weather?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

export async function apiGetWeather(locationId: number) {
  const res = await api.get(`/weather/${locationId}`);
  return res.data as WeatherResponse;
}

// User data management
export async function apiClearUserData() {
  const res = await api.delete("/user/data");
  return res.data as { message: string };
}

// AI & Chat
export type ChatMessage = {
  message: string;
  conversation_id?: string;
};

export type ChatResponse = {
  response: string;
  conversation_id: string;
  timestamp: string;
};

export async function apiChatWithAI(message: string, conversationId?: string) {
  const res = await api.post("/ai/chat", { message, conversation_id: conversationId });
  return res.data as ChatResponse;
}

export type AIInsight = {
  type: string;
  title: string;
  message: string;
};

export async function apiGetAIInsights() {
  const res = await api.get("/ai/insights");
  return res.data as { insights: AIInsight[] };
}

// Analytics
export type HistoricalDataPoint = {
  timestamp: string;
  temperature: number | null;
  apparent_temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  wind_speed: number | null;
  uv_index: number | null;
};

export type Statistics = {
  mean: number | null;
  min: number | null;
  max: number | null;
  std: number | null;
};

export type HistoricalDataResponse = {
  data: HistoricalDataPoint[];
  statistics: {
    temperature: Statistics;
    humidity: Statistics;
    precipitation: Statistics;
    wind_speed: Statistics;
  };
  data_points: number;
  period_days: number;
};

export async function apiGetHistoricalData(locationId: number, days: number = 30) {
  const res = await api.get(`/analytics/historical/${locationId}`, { params: { days } });
  return res.data as HistoricalDataResponse;
}

export type TrendResponse = {
  metric: string;
  trend: string;
  slope: number;
  slope_per_day: number;
  direction: string;
  confidence: number;
  data_points: number;
  predictions: number[];
  current_value: number | null;
  predicted_24h: number | null;
};

export async function apiGetTrends(locationId: number, metric: string = "temperature", days: number = 30) {
  const res = await api.get(`/analytics/trends/${locationId}`, { params: { metric, days } });
  return res.data as TrendResponse;
}

export type ForecastResponse = {
  location_id: number;
  forecast_hours: number;
  generated_at: string;
  forecasts: {
    [metric: string]: {
      current: number | null;
      predicted: number | null;
      trend: string;
      confidence: number;
    };
  };
};

export async function apiGetForecast(locationId: number, hours: number = 24) {
  const res = await api.get(`/analytics/forecast/${locationId}`, { params: { hours } });
  return res.data as ForecastResponse;
}

// Alerts
export type Alert = {
  id: number;
  user_id: number;
  location_id: number;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  expires_at: string | null;
};

export async function apiGetAlerts(locationId?: number) {
  const params = locationId ? { location_id: locationId } : {};
  const res = await api.get("/alerts", { params });
  return res.data as { alerts: Alert[] };
}

export async function apiMarkAlertAsRead(alertId: number) {
  const res = await api.patch(`/alerts/${alertId}/read`);
  return res.data as { message: string };
}

export async function apiDeleteAlert(alertId: number) {
  const res = await api.delete(`/alerts/${alertId}`);
  return res.data as { message: string };
}

export async function apiGenerateAlerts(locationId: number) {
  const res = await api.post(`/alerts/generate/${locationId}`);
  return res.data as { alerts_generated: number; alerts: Alert[] };
}

// Settings
export type UserSettings = {
  id: number;
  user_id: number;
  temperature_unit: string;
  wind_speed_unit: string;
  precipitation_unit: string;
  time_format: string;
  theme: string;
  notifications_enabled: boolean;
  alert_email_enabled: boolean;
  alert_push_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export async function apiGetSettings() {
  const res = await api.get("/settings");
  return res.data as UserSettings;
}

export async function apiUpdateSettings(settings: Partial<UserSettings>) {
  const res = await api.put("/settings", settings);
  return res.data as UserSettings;
}

// Legacy exports for backward compatibility
export const aiAPI = {
  chat: apiChatWithAI,
  getInsights: apiGetAIInsights
};

export const locationAPI = {
  getAll: apiGetLocations,
  getById: apiGetLocation,
  create: apiAddLocation,
  addLocation: apiAddLocation,
  delete: apiDeleteLocation,
  search: async (query: string) => {
    // Placeholder for search functionality - can be implemented later
    const res = await api.get("/locations/search", { params: { q: query } });
    return res.data;
  }
};