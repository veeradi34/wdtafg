// client/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the auth context types
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  
  // Check for existing auth token or session on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Fetch user info from backend
  const refreshUser = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/auth/user", { credentials: "include" });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(!!userData);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  // Login function (for local/demo login)
  const login = () => {
    // In a real app, this would validate credentials with an API
    const token = "auth-token-" + Date.now();
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    refreshUser();
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    fetch("http://localhost:5001/api/auth/logout", { credentials: "include" });
  };
  
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    refreshUser,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
