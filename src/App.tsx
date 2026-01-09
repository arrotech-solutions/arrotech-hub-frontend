import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import TutorialButton from './components/TutorialButton';
import TutorialOverlay from './components/TutorialOverlay';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TutorialProvider } from './hooks/useTutorial';
import Activity from './pages/Activity';
import Agents from './pages/Agents';
import Chat from './pages/Chat';
import Connections from './pages/Connections';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import CreatorProfile from './pages/CreatorProfile';
import Favorites from './pages/Favorites';
import MpesaAgent from './pages/MpesaAgent';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Workflows from './pages/Workflows';
import RequestAccess from './pages/RequestAccess';
import AdminDashboard from './pages/AdminDashboard'; // Import AdminDashboard

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const accessApproved = localStorage.getItem('access_approved_email');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    if (user.email?.toLowerCase() === 'support@arrotechsolutions') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in and not approved, redirect to landing page
  if (!accessApproved) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page / Waitlist */}
      <Route path="/" element={<RequestAccess />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <Layout>
              <Connections />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirect old MCP Tools route to Workflows */}
      <Route
        path="/mcp-tools"
        element={<Navigate to="/workflows" replace />}
      />

      <Route
        path="/workflows"
        element={
          <ProtectedRoute>
            <Layout>
              <Workflows />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <Layout>
              <Agents />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/agents/mpesa"
        element={
          <ProtectedRoute>
            <Layout>
              <MpesaAgent />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <Layout>
              <Marketplace />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={<Navigate to="/workflows" replace />}
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Layout>
              <Favorites />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator-profile"
        element={
          <ProtectedRoute>
            <Layout>
              <CreatorProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Layout>
              <Activity />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TutorialProvider>
        <AppRoutes />
        <TutorialButton />
        <TutorialOverlay />
      </TutorialProvider>
    </AuthProvider>
  );
};

export default App; 