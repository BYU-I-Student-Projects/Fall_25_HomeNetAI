import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeDarkMode } from "@/lib/storage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load heavy components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Locations = lazy(() => import("./pages/Locations"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));
const SmartHome = lazy(() => import("./pages/SmartHome"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Locations />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LocationDetail />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/smart-home"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SmartHome />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ai-insights"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AIInsights />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Analytics />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Settings />
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFound />
              </Suspense>
            } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;