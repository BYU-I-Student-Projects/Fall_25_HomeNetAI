/**
 * API Service - Clean integration with backend
 * Connects frontend to Fall_25_HomeNetAI backend API
 */

const API_BASE_URL = 'http://localhost:8000';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
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

// Location API
export const locationAPI = {
  search: async (query: string) => {
    return apiRequest<{ results: Array<{
      name: string;
      country: string;
      admin1: string;
      latitude: number;
      longitude: number;
      display_name: string;
    }> }>(`/locations/search?query=${encodeURIComponent(query)}`);
  },

  getUserLocations: async () => {
    return apiRequest<{ locations: Array<{
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      created_at: string;
    }> }>('/locations');
  },

  addLocation: async (name: string, latitude: number, longitude: number) => {
    return apiRequest<{ id: number; message: string }>('/locations', {
      method: 'POST',
      body: JSON.stringify({ name, latitude, longitude }),
    });
  },

  deleteLocation: async (locationId: number) => {
    return apiRequest<{ message: string }>(`/locations/${locationId}`, {
      method: 'DELETE',
    });
  },
};

// Weather API
export const weatherAPI = {
  getWeather: async (locationId: number) => {
    return apiRequest<{
      location: string;
      current_weather: any;
      daily_forecast: any;
    }>(`/weather/${locationId}`);
  },
};

