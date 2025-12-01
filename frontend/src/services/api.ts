import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized error:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      console.error('Token in localStorage:', localStorage.getItem('auth_token') ? 'exists' : 'missing');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Location API
export const locationAPI = {
  search: async (query: string) => {
    const response = await api.get(`/locations/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  getUserLocations: async () => {
    const response = await api.get('/locations');
    return response.data;
  },

  addLocation: async (locationData: { name: string; latitude: number; longitude: number }) => {
    const response = await api.post('/locations', locationData);
    return response.data;
  },

  deleteLocation: async (locationId: number) => {
    const response = await api.delete(`/locations/${locationId}`);
    return response.data;
  },
};

// Weather API
export const weatherAPI = {
  getWeather: async (locationId: number) => {
    const response = await api.get(`/weather/${locationId}`);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  chat: async (message: string, conversationId?: string) => {
    const response = await api.post('/ai/chat', {
      message,
      conversation_id: conversationId,
    });
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/ai/insights');
    return response.data;
  },
};

export default api;
