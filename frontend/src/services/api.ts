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


