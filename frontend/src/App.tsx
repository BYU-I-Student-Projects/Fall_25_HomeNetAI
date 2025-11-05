import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeDarkMode } from "@/lib/storage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import LocationDetail from "./pages/LocationDetail";
import SmartHome from "./pages/SmartHome";
import AIInsights from "./pages/AIInsights";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeDarkMode();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
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
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

