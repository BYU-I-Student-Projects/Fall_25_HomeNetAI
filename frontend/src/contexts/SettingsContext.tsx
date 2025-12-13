import React, { createContext, useContext, useEffect, useState } from "react";

type TemperatureUnit = "fahrenheit" | "celsius";
type WindSpeedUnit = "mph" | "kmh";

interface SettingsContextType {
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  formatTemperature: (tempF: number) => string;
  convertTemperature: (tempF: number) => number;
  windSpeedUnit: WindSpeedUnit;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  convertWindSpeed: (speedMph: number) => number;
  windSpeedSymbol: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to convert Fahrenheit to Celsius
const fahrenheitToCelsius = (tempF: number): number => {
  return (tempF - 32) * 5 / 9;
};

// Helper function to convert mph to km/h
const mphToKmh = (mph: number): number => {
  return mph * 1.60934;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(() => {
    const stored = localStorage.getItem("temperatureUnit") as TemperatureUnit | null;
    return stored || "fahrenheit";
  });

  const [windSpeedUnit, setWindSpeedUnit] = useState<WindSpeedUnit>(() => {
    const stored = localStorage.getItem("windSpeedUnit") as WindSpeedUnit | null;
    return stored || "mph";
  });

  useEffect(() => {
    localStorage.setItem("temperatureUnit", temperatureUnit);
  }, [temperatureUnit]);

  useEffect(() => {
    localStorage.setItem("windSpeedUnit", windSpeedUnit);
  }, [windSpeedUnit]);

  const convertTemperature = (tempF: number): number => {
    if (temperatureUnit === "celsius") {
      return fahrenheitToCelsius(tempF);
    }
    return tempF;
  };

  const formatTemperature = (tempF: number): string => {
    if (temperatureUnit === "celsius") {
      return `${fahrenheitToCelsius(tempF).toFixed(0)}°C`;
    }
    return `${Math.round(tempF)}°F`;
  };

  const convertWindSpeed = (speedMph: number): number => {
    if (windSpeedUnit === "kmh") {
      return mphToKmh(speedMph);
    }
    return speedMph;
  };

  const windSpeedSymbol = windSpeedUnit === "kmh" ? "km/h" : "mph";

  return (
    <SettingsContext.Provider value={{ 
      temperatureUnit, 
      setTemperatureUnit, 
      formatTemperature, 
      convertTemperature,
      windSpeedUnit,
      setWindSpeedUnit,
      convertWindSpeed,
      windSpeedSymbol
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
