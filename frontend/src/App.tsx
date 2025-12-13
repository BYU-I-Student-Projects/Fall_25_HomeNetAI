import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import LocationDetail from "./pages/LocationDetail";
import SmartHome from "./pages/SmartHome";
import LocationsSmartHome from "./pages/LocationsSmartHome";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AIInsights from "./pages/AIInsights";
import PicoDevices from "./pages/PicoDevices";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Default redirect - if someone goes to root, go to dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Locations />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/smart-home"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SmartHome />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations-smart-home"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationsSmartHome />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ai-insights"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AIInsights />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/pico-devices"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PicoDevices />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </SettingsProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

