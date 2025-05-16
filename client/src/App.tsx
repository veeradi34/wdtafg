import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LandingPage from "./pages/LandingPage";
import AuthScreenWrapper from "@/components/AuthScreenWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomeWrapper from "@/components/HomeWrapper"; // Import the updated HomeWrapper
import "./index.css"; // Import global styles
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const { isAuthenticated } = useAuth();
  return (
    <Switch>
      <Route path="/" component={() => <LandingPage isAuthenticated={isAuthenticated} />} />
      <Route path="/app">
        {() => (
          <ProtectedRoute>
            <HomeWrapper />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/login" component={AuthScreenWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;