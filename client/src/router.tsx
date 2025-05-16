// client/src/router.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Home from './pages/home'; // Import your Home component
import AuthScreenWrapper from './components/AuthScreenWrapper'; // Use the wrapper instead of AuthScreen
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import FAQPage from './pages/FAQPage';
import PricingPage from './pages/PricingPage';

// Create AppRouter component that uses auth context
const AppRouter: React.FC = () => {
  // Get authentication status from context
  const { isAuthenticated } = useAuth();

  // Create a browser router with all our routes
  const router = createBrowserRouter([
    {
      path: '/',
      element: <LandingPage isAuthenticated={isAuthenticated} />,
    },
    {
      path: '/faq',
      element: <FAQPage isDarkMode={true} toggleTheme={() => {}} />,
    },
    {
      path: '/pricing',
      element: <PricingPage isDarkMode={true} toggleTheme={() => {}} />,
    },
    {
      path: '/app',
      element: (
        <ProtectedRoute>
          <Home isDarkMode={true} onLogout={() => <Navigate to="/" replace />} />
        </ProtectedRoute>
      ),
    },
    {
      path: '/login',
      element: isAuthenticated ? <Navigate to="/app" replace /> : <AuthScreenWrapper />,
    },
    // Catch-all redirect to landing page
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRouter;