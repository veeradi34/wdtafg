// client/src/components/HomeWrapper.tsx
import React, { useEffect } from 'react';
import { useLocation } from "wouter";
import Home from '../pages/home'; // Import your existing Home component
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const HomeWrapper: React.FC = () => {
  const { logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
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

  const handleLogout = () => {
    toast({
      title: "Logging out",
      description: "You will be redirected to the landing page",
      duration: 1500,
    });
    
    // Short delay to show toast before logout
    setTimeout(() => {
      logout();
      setLocation('/');
    }, 500);
  };

  // Navigation to profile page
  const navigateToProfile = () => {
    setLocation('/profile');
  };

  return (
    <Home 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme} 
      onLogout={handleLogout}
      onProfileClick={navigateToProfile}
    />
  );
};

export default HomeWrapper;