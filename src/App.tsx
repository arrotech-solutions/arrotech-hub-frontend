import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import TutorialButton from './components/TutorialButton';
import TutorialOverlay from './components/TutorialOverlay';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TutorialProvider } from './hooks/useTutorial';
import Activity from './pages/Activity';
import Agents from './pages/Agents';
import Chat from './pages/Chat';
import Connections from './pages/Connections';
// Dashboard removed - UnifiedDashboard is now the primary landing page
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import CreatorProfile from './pages/CreatorProfile';
import Favorites from './pages/Favorites';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Workflows from './pages/Workflows';
import Pricing from './pages/Pricing';
// import RequestAccess from './pages/RequestAccess';
import AdminDashboard from './pages/AdminDashboard'; // Import AdminDashboard
import UnifiedDashboard from './pages/UnifiedDashboard';
import UnifiedInbox from './pages/UnifiedInbox';
import UnifiedTaskView from './pages/UnifiedTaskView';
import UnifiedCalendar from './pages/UnifiedCalendar';
import WhatsAppDashboard from './pages/WhatsAppDashboard';
import TikTokDashboard from './pages/TikTokDashboard';
import PremiumContentUnlock from './pages/PremiumContentUnlock';
import HelpSupport from './pages/HelpSupport';
import TipPage from './pages/TipPage';
import TipVerify from './pages/TipVerify';
import MicrosoftCallback from './pages/MicrosoftCallback';

import { CommandProvider } from './contexts/CommandContext';
import { useCommand } from './hooks/useCommand';
import GlobalCommandPalette from './components/GlobalCommandPalette';
import {
  LayoutDashboard, Mail, CheckSquare, Calendar, Settings as SettingsIcon, LogOut,
  GitBranch, Bot, MessageCircle, Video, ShoppingBag, Link, Activity as ActivityIcon, User
} from 'lucide-react';



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
  // const accessApproved = localStorage.getItem('access_approved_email');

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
    return <Navigate to="/unified" replace />;
  }

  // If not logged in and not approved, redirect to landing page
  // Exception: Allow reset password page to be accessed without prior approval (e.g. new device)
  // If not logged in and not approved, redirect to landing page
  // Exception: Allow reset password page to be accessed without prior approval (e.g. new device)
  /* if (!accessApproved && window.location.pathname !== '/reset-password') {
    return <Navigate to="/" replace />;
  } */

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page / Waitlist */}
      {/* Landing Page / Waitlist */}
      {/* <Route path="/" element={<RequestAccess />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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

      {/* Microsoft OAuth Callback */}
      <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />

      {/* Public Premium Content Unlock (no auth required) */}
      <Route path="/unlock/:linkId" element={<PremiumContentUnlock />} />

      {/* Public Help & Support (no auth required) */}
      <Route path="/help" element={<HelpSupport />} />
      <Route path="/support" element={<HelpSupport />} />

      {/* Public Tip Pages (no auth required) */}
      <Route path="/tip/:username" element={<TipPage />} />
      <Route path="/tip/:username/verify" element={<TipVerify />} />

      {/* Protected Routes */}
      <Route
        path="/unified"
        element={
          <ProtectedRoute>
            <Layout>
              <UnifiedDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/inbox"
        element={
          <ProtectedRoute>
            <Layout>
              <UnifiedInbox />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/tasks"
        element={
          <ProtectedRoute>
            <Layout>
              <UnifiedTaskView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <UnifiedCalendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Redirect old /dashboard to /unified */}
      <Route path="/dashboard" element={<Navigate to="/unified" replace />} />

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
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <Layout>
              <WhatsAppDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tiktok"
        element={
          <ProtectedRoute>
            <Layout>
              <TikTokDashboard />
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
        path="/pricing"
        element={
          <ProtectedRoute>
            <Layout>
              <Pricing />
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
        path="/privacy"
        element={
          <ProtectedRoute>
            <Layout>
              <PrivacyPolicy />
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

      {/* Public Premium Link Unlock Page (No Auth Required) */}
      <Route
        path="/unlock/:linkId"
        element={<PremiumContentUnlock />}
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Component to register default global commands
const DefaultGlobalCommands: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useCommand({ id: 'nav-dashboard', name: 'Go to Workspace', section: 'Navigation', icon: <LayoutDashboard className="w-4 h-4" />, shortcut: ['g', 'd'], action: () => navigate('/unified') });
  useCommand({ id: 'nav-inbox', name: 'Unified Inbox', section: 'Navigation', icon: <Mail className="w-4 h-4" />, shortcut: ['g', 'i'], action: () => navigate('/unified/inbox') });
  useCommand({ id: 'nav-tasks', name: 'Unified Tasks', section: 'Navigation', icon: <CheckSquare className="w-4 h-4" />, shortcut: ['g', 't'], action: () => navigate('/unified/tasks') });
  useCommand({ id: 'nav-calendar', name: 'Unified Calendar', section: 'Navigation', icon: <Calendar className="w-4 h-4" />, shortcut: ['g', 'c'], action: () => navigate('/unified/calendar') });

  // Apps & Tools
  useCommand({ id: 'nav-workflows', name: 'Workflows', section: 'Apps', icon: <GitBranch className="w-4 h-4" />, shortcut: ['g', 'w'], action: () => navigate('/workflows') });
  useCommand({ id: 'nav-agents', name: 'AI Agents', section: 'Apps', icon: <Bot className="w-4 h-4" />, shortcut: ['g', 'a'], action: () => navigate('/agents') });
  useCommand({ id: 'nav-whatsapp', name: 'WhatsApp', section: 'Social', icon: <MessageCircle className="w-4 h-4" />, action: () => navigate('/whatsapp') });
  useCommand({ id: 'nav-tiktok', name: 'TikTok', section: 'Social', icon: <Video className="w-4 h-4" />, action: () => navigate('/tiktok') });
  useCommand({ id: 'nav-marketplace', name: 'Marketplace', section: 'Apps', icon: <ShoppingBag className="w-4 h-4" />, action: () => navigate('/marketplace') });

  // System
  useCommand({ id: 'nav-connections', name: 'Connections', section: 'System', icon: <Link className="w-4 h-4" />, action: () => navigate('/connections') });
  useCommand({ id: 'nav-activity', name: 'Activity Log', section: 'System', icon: <ActivityIcon className="w-4 h-4" />, action: () => navigate('/activity') });
  useCommand({ id: 'nav-profile', name: 'My Profile', section: 'Account', icon: <User className="w-4 h-4" />, action: () => navigate('/profile') });
  useCommand({ id: 'nav-settings', name: 'Settings', section: 'System', icon: <SettingsIcon className="w-4 h-4" />, shortcut: ['g', 's'], action: () => navigate('/settings') });
  useCommand({ id: 'action-logout', name: 'Log Out', section: 'Account', icon: <LogOut className="w-4 h-4" />, action: () => { logout(); navigate('/login'); } });

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CommandProvider>
        <TutorialProvider>
          <AppRoutes />
          <GlobalCommandPalette />
          <DefaultGlobalCommands />
          <TutorialButton />
          <TutorialOverlay />
        </TutorialProvider>
      </CommandProvider>
    </AuthProvider>
  );
};

export default App; 