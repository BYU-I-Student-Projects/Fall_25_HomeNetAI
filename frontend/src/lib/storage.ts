// Types for local storage (legacy - will be replaced with API)
export interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  icon: string;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  icon: string;
  condition: string;
  precipitation: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface SavedLocation {
  id: string;
  city: City;
  weather: WeatherData;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  addedAt: string;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'thermostat' | 'light' | 'plug' | 'lock' | 'blind' | 'camera';
  status: 'on' | 'off';
  room: string;
  value?: number; // For temperature, brightness, etc.
  color?: string; // For lights
  locked?: boolean; // For locks
  position?: number; // For blinds (0-100)
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  devices: string[];
}

// User authentication - Updated to work with API
export function saveUser(user: User): void {
  localStorage.setItem('homenet_user', JSON.stringify(user));
}

export function getUser(): User | null {
  const userData = localStorage.getItem('homenet_user');
  const token = localStorage.getItem('auth_token');
  
  if (!userData || !token) return null;
  
  return JSON.parse(userData);
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('homenet_user');
  localStorage.removeItem('homenet_session');
}

export function isAuthenticated(): boolean {
  return localStorage.getItem('auth_token') !== null;
}

// Locations - Will be replaced with API calls
export function saveLocations(locations: SavedLocation[]): void {
  localStorage.setItem('homenet_locations', JSON.stringify(locations));
}

export function getLocations(): SavedLocation[] {
  const data = localStorage.getItem('homenet_locations');
  return data ? JSON.parse(data) : [];
}

export function addLocation(location: SavedLocation): void {
  const locations = getLocations();
  locations.push(location);
  saveLocations(locations);
}

export function updateLocation(id: string, updates: Partial<SavedLocation>): void {
  const locations = getLocations();
  const index = locations.findIndex(l => l.id === id);
  
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates };
    saveLocations(locations);
  }
}

export function deleteLocation(id: string): void {
  const locations = getLocations().filter(l => l.id !== id);
  saveLocations(locations);
}

// Smart devices
export function saveDevices(devices: SmartDevice[]): void {
  localStorage.setItem('homenet_devices', JSON.stringify(devices));
}

export function getDevices(): SmartDevice[] {
  const data = localStorage.getItem('homenet_devices');
  return data ? JSON.parse(data) : [];
}

export function updateDevice(id: string, updates: Partial<SmartDevice>): void {
  const devices = getDevices();
  const index = devices.findIndex(d => d.id === id);
  
  if (index !== -1) {
    devices[index] = { ...devices[index], ...updates };
    saveDevices(devices);
  }
}

export function addDevice(device: SmartDevice): void {
  const devices = getDevices();
  devices.push(device);
  saveDevices(devices);
}

export function deleteDevice(id: string): void {
  const devices = getDevices().filter(d => d.id !== d.id);
  saveDevices(devices);
}

// Automation rules
export function saveRules(rules: AutomationRule[]): void {
  localStorage.setItem('homenet_rules', JSON.stringify(rules));
}

export function getRules(): AutomationRule[] {
  const data = localStorage.getItem('homenet_rules');
  return data ? JSON.parse(data) : [];
}

export function addRule(rule: AutomationRule): void {
  const rules = getRules();
  rules.push(rule);
  saveRules(rules);
}

export function updateRule(id: string, updates: Partial<AutomationRule>): void {
  const rules = getRules();
  const index = rules.findIndex(r => r.id === id);
  
  if (index !== -1) {
    rules[index] = { ...rules[index], ...updates };
    saveRules(rules);
  }
}

export function deleteRule(id: string): void {
  const rules = getRules().filter(r => r.id !== id);
  saveRules(rules);
}

// Preferences
export function saveDarkMode(isDark: boolean): void {
  localStorage.setItem('homenet_darkmode', isDark ? 'dark' : 'light');
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function getDarkMode(): boolean {
  const stored = localStorage.getItem('homenet_darkmode');
  
  if (!stored) {
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  return stored === 'dark';
}

// Initialize dark mode on load
export function initializeDarkMode(): void {
  if (getDarkMode()) {
    document.documentElement.classList.add('dark');
  }
}

// Data export/import
export function exportData(): string {
  const data = {
    user: getUser(),
    locations: getLocations(),
    devices: getDevices(),
    rules: getRules(),
    darkMode: getDarkMode(),
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): void {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.user) saveUser(data.user);
    if (data.locations) saveLocations(data.locations);
    if (data.devices) saveDevices(data.devices);
    if (data.rules) saveRules(data.rules);
    if (typeof data.darkMode === 'boolean') saveDarkMode(data.darkMode);
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Invalid data format');
  }
}

export function resetData(): void {
  localStorage.removeItem('homenet_locations');
  localStorage.removeItem('homenet_devices');
  localStorage.removeItem('homenet_rules');
}

