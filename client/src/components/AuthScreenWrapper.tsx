// client/src/components/AuthScreenWrapper.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import AuthScreen from '@/components/AuthScreen'; // Import the AuthScreen component
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AuthScreenWrapper: React.FC = () => {
  const { login } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if there's a stored preference, otherwise use dark mode as default
    const storedTheme = localStorage.getItem('theme');
    return storedTheme ? storedTheme === 'dark' : true;
  });

  // Apply theme on component mount and when it changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    
    toast({
      title: `Switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode`,
      description: `The interface is now in ${!isDarkMode ? 'dark' : 'light'} mode.`,
      duration: 2000,
    });
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    login();
    navigate('/app');
  };

  return (
    <AuthScreen 
      onLogin={handleLoginSuccess} 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme} 
    />
  );
};

export default AuthScreenWrapper;