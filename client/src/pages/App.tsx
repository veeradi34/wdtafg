// App.tsx - Main application component with fixed authentication flow
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AuthScreen from "@/components/AuthScreen"; // Adjust import path as needed
import Home from "./home"; // Main home component

export default function App() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is already logged in
        const hasToken = localStorage.getItem('authToken') !== null;
        setIsAuthenticated(hasToken);
      } catch (error) {
        console.error("Error checking authentication:", error);
        // In case of any errors, default to unauthenticated
        setIsAuthenticated(false);
      } finally {
        // Always complete loading
        setIsLoading(false);
      }
    };
    
    // Small delay to prevent flash of unauthenticated content
    setTimeout(checkAuth, 300);
  }, []);

  // Function to toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Function to handle login
  const handleLogin = () => {
    try {
      // Create a mock token
      const token = "auth-token-" + Date.now();
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
      
      toast({
        title: "Logged in successfully",
        description: "Welcome to ZeroCode!",
      });
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "Login failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Apply theme changes whenever isDarkMode changes
  useEffect(() => {
    // Safely apply theme changes
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (error) {
      console.error("Error applying theme:", error);
      // Continue execution even if theme application fails
    }
  }, [isDarkMode]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p>Loading ZeroCode...</p>
        </div>
      </div>
    );
  }

  // Show login screen when not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onLogin={handleLogin} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
      />
    );
  }

  // Show main app when authenticated
  return (
    <Home 
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    />
  );
}