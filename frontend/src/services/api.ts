/**
 * API Service - Clean integration with backend
 * Connects frontend to Fall_25_HomeNetAI backend API
 */

const API_BASE_URL = "http://localhost:8000";

// Development bypass - set to true to skip authentication redirects
const BYPASS_AUTH = false; // Set to false to enable authentication

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`[API] Making request to: ${BASE_URL}${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        // Only redirect to login if bypass is disabled
        if (!BYPASS_AUTH) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          throw new Error('Unauthorized - Please login again');
        }
        // In bypass mode, just throw the error without redirecting
        throw new Error('Unauthorized - Authentication bypass is enabled');
      }
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Response data received`);
    return data;
  } catch (error: any) {
    console.error(`[API] Request error:`, error);
    // Handle network errors (like "Failed to fetch")
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Cannot connect to backend server. Make sure the backend is running at http://localhost:8000');
    }
    // Handle abort errors
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled or timed out');
    }
    // Re-throw other errors
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const data = await apiRequest<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token);
    }
    return data;
  },

  login: async (username: string, password: string) => {
    const data = await apiRequest<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return apiRequest<{ id: number; username: string; email: string; created_at: string }>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },
};

// Images API
export const imagesAPI = {
  getLocationImage: (locationName: string): string => {
    // Use backend proxy to avoid CORS issues
    return `${BASE_URL}/images/location/${encodeURIComponent(locationName)}`;
  },
};

// Locations API
export const locationsAPI = {
  getAll: async () => {
    return apiRequest<{ locations: Array<{ id: number; name: string; latitude: number; longitude: number; created_at: string }> }>('/locations');
  },

  search: async (query: string) => {
    return apiRequest<{ results: Array<{ name: string; country: string; admin1: string; latitude: number; longitude: number; display_name: string }> }>(`/locations/search?query=${encodeURIComponent(query)}`);
  },

  add: async (name: string, latitude: number, longitude: number) => {
    return apiRequest<{ id: number; message: string }>('/locations', {
      method: 'POST',
      body: JSON.stringify({ name, latitude, longitude }),
    });
  },

  delete: async (locationId: number) => {
    return apiRequest<{ message: string }>(`/locations/${locationId}`, {
      method: 'DELETE',
    });
  },
};

// Weather API
export const weatherAPI = {
  getForLocation: async (locationId: number) => {
    return apiRequest<{
      location: string;
      current_weather: {
        temperature: number;
        windspeed: number;
        winddirection: number;
        weathercode: number;
        time: string;
      };
      daily_forecast: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        precipitation_probability_max: number[];
        wind_speed_10m_max: number[];
        uv_index_max: number[];
      };
      hourly_forecast: {
        time: string[];
        temperature_2m: number[];
        apparent_temperature: number[];
        relative_humidity_2m: number[];
        precipitation: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
        cloud_cover: number[];
        uv_index: number[];
      };
    }>(`/weather/${locationId}`);
  },
};

// Devices API
export const devicesAPI = {
  getAll: async () => {
    return apiRequest<Array<{
      id: number;
      name: string;
      type: string;
      status: string;
      room: string | null;
      value: number | null;
      color: string | null;
      locked: boolean | null;
      position: number | null;
      created_at: string;
      updated_at: string;
    }>>('/devices');
  },

  update: async (deviceId: number, updates: {
    status?: string;
    value?: number;
    room?: string;
    name?: string;
    color?: string;
    locked?: boolean;
    position?: number;
  }) => {
    return apiRequest<{
      id: number;
      name: string;
      type: string;
      status: string;
      room: string | null;
      value: number | null;
      color: string | null;
      locked: boolean | null;
      position: number | null;
      created_at: string;
      updated_at: string;
    }>(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// AI API
export const aiAPI = {
  chat: async (message: string, conversationId?: string) => {
    console.log('[AI API] Sending chat message:', message.substring(0, 50));
    // Add timeout to prevent hanging (120 seconds - Gemini can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[AI API] Request timeout after 120 seconds');
      controller.abort();
    }, 120000);
    
    try {
      const result = await apiRequest<{
        response: string;
        conversation_id: string;
        timestamp: string;
      }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversation_id: conversationId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('[AI API] Chat response received');
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('[AI API] Error:', error);
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        throw new Error('Request timed out. The AI service may be taking too long to respond.');
      }
      throw error;
    }
  },

  getInsights: async () => {
    return apiRequest<Array<{
      type: string;
      title: string;
      message: string;
    }>>('/ai/insights');
  },
};

// Analytics API
export const analyticsAPI = {
  getHistoricalData: async (locationId: number, days: number = 7) => {
    return apiRequest<{
      location_id: number;
      data: Array<{
        timestamp: string;
        temperature: number;
        humidity: number;
        precipitation: number;
        wind_speed: number;
      }>;
    }>(`/analytics/historical/${locationId}?days=${days}`);
  },

  getTrends: async (locationId: number) => {
    return apiRequest<{
      location_id: number;
      trends: {
        temperature: { trend: string; change: number };
        humidity: { trend: string; change: number };
        precipitation: { trend: string; change: number };
      };
    }>(`/analytics/trends/${locationId}`);
  },

  getForecastAccuracy: async (locationId: number) => {
    return apiRequest<{
      location_id: number;
      accuracy: number;
      metrics: any;
    }>(`/analytics/forecast-accuracy/${locationId}`);
  },
};

// Alerts API
export const alertsAPI = {
  getAlerts: async () => {
    return apiRequest<{
      alerts: Array<{
        id: string;
        location_id: number;
        location_name: string;
        type: string;
        severity: string;
        title: string;
        message: string;
        timestamp: string;
      }>;
    }>('/alerts');
  },

  dismissAlert: async (alertId: string) => {
    return apiRequest<{ message: string }>(`/alerts/${alertId}/dismiss`, {
      method: 'POST',
    });
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    return apiRequest<{
      user_id: number;
      temperature_unit: string;
      wind_speed_unit: string;
      precipitation_unit: string;
      time_format: string;
      theme: string;
      notifications_enabled: boolean;
      alert_types: string[];
    }>('/settings');
  },

  updateSettings: async (settings: {
    temperature_unit?: string;
    wind_speed_unit?: string;
    precipitation_unit?: string;
    time_format?: string;
    theme?: string;
    notifications_enabled?: boolean;
    alert_types?: string[];
  }) => {
    return apiRequest<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

