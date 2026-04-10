import React, { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout'; // New shared layout
import TutorialButton from './components/TutorialButton';
import TutorialOverlay from './components/TutorialOverlay';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TutorialProvider } from './hooks/useTutorial';

import { CommandProvider } from './contexts/CommandContext';
import { useCommand } from './hooks/useCommand';
import GlobalCommandPalette from './components/GlobalCommandPalette';
import {
  LayoutDashboard, Mail, CheckSquare, Calendar, Settings as SettingsIcon, LogOut,
  GitBranch, Bot, MessageCircle, Video, ShoppingBag, Link, Activity as ActivityIcon, User
} from 'lucide-react';

const Usage = lazy(() => import('./pages/Usage'));
const Agents = lazy(() => import('./pages/Agents'));
const Chat = lazy(() => import('./pages/Chat'));
const Connections = lazy(() => import('./pages/Connections'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Login = lazy(() => import('./pages/Login'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Payments = lazy(() => import('./pages/Payments'));
const Profile = lazy(() => import('./pages/Profile'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const IntegrationPage = lazy(() => import('./pages/IntegrationPage'));
const IntegrationPairPage = lazy(() => import('./pages/IntegrationPairPage'));
const UseCasePage = lazy(() => import('./pages/UseCasePage'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Workflows = lazy(() => import('./pages/Workflows'));
const Pricing = lazy(() => import('./pages/Pricing'));
const DeveloperPortal = lazy(() => import('./pages/DeveloperPortal'));

const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const UnifiedInbox = lazy(() => import('./pages/UnifiedInbox'));
const UnifiedTaskView = lazy(() => import('./pages/UnifiedTaskView'));
const UnifiedCalendar = lazy(() => import('./pages/UnifiedCalendar'));
const WhatsAppDashboard = lazy(() => import('./pages/WhatsAppDashboard'));
const TikTokDashboard = lazy(() => import('./pages/TikTokDashboard'));
const PremiumContentUnlock = lazy(() => import('./pages/PremiumContentUnlock'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const TipPage = lazy(() => import('./pages/TipPage'));
const TipVerify = lazy(() => import('./pages/TipVerify'));
const MicrosoftCallback = lazy(() => import('./pages/MicrosoftCallback'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Terms = lazy(() => import('./pages/Terms'));
const KraDashboard = lazy(() => import('./pages/apps/KraDashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CreateOrganization = lazy(() => import('./pages/CreateOrganization'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));



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

// Email Verification Guard — redirects unverified users to /verify-email
const RequireVerifiedEmail: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is logged in but email is not verified, redirect to verification
  if (user && user.email_verified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={
        <PublicRoute>
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        </PublicRoute>
      } />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/pricing" element={
        <PublicLayout>
          <Pricing />
        </PublicLayout>
      } />
      <Route path="/help" element={
        <PublicLayout>
          <HelpSupport />
        </PublicLayout>
      } />
      <Route path="/privacy" element={
        <PublicLayout>
          <PrivacyPolicy />
        </PublicLayout>
      } />
      <Route path="/terms" element={
        <PublicLayout>
          <Terms />
        </PublicLayout>
      } />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* SEO Growth Pages - Wrapped in PublicLayout */}
      <Route path="/vs/:competitor" element={
        <PublicLayout>
          <ComparisonPage />
        </PublicLayout>
      } />
      <Route path="/integrations/:slug" element={
        <PublicLayout>
          <IntegrationPage />
        </PublicLayout>
      } />
      <Route path="/connect/:pair" element={
        <PublicLayout>
          <IntegrationPairPage />
        </PublicLayout>
      } />
      <Route path="/use-cases/:slug" element={
        <PublicLayout>
          <UseCasePage />
        </PublicLayout>
      } />
      <Route path="/blog" element={
        <PublicLayout>
          <Blog />
        </PublicLayout>
      } />
      <Route path="/blog/:slug" element={
        <PublicLayout>
          <BlogPost />
        </PublicLayout>
      } />

      {/* Microsoft OAuth Callback */}
      <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />

      {/* Organization Onboarding (Protected) */}
      <Route path="/onboarding" element={
        <ProtectedRoute><RequireVerifiedEmail><Onboarding /></RequireVerifiedEmail></ProtectedRoute>
      } />
      <Route path="/create-organization" element={
        <ProtectedRoute><RequireVerifiedEmail><CreateOrganization /></RequireVerifiedEmail></ProtectedRoute>
      } />
      <Route path="/org/settings" element={
        <ProtectedRoute><RequireVerifiedEmail><Layout><OrganizationSettings /></Layout></RequireVerifiedEmail></ProtectedRoute>
      } />

      {/* Public Premium Content Unlock (no auth required) */}
      <Route path="/unlock/:linkId" element={<PremiumContentUnlock />} />

      {/* Email Verification (protected but NOT wrapped in RequireVerifiedEmail) */}
      <Route path="/verify-email" element={
        <ProtectedRoute><VerifyEmail /></ProtectedRoute>
      } />

      {/* Organization Invitation Accept (public — invitee may not be logged in) */}
      <Route path="/invite/:token" element={<AcceptInvite />} />

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
            <RequireVerifiedEmail>
              <Layout>
                <UnifiedDashboard />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/inbox"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <UnifiedInbox />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/tasks"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <UnifiedTaskView />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />
      <Route
        path="/unified/calendar"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <UnifiedCalendar />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />
      {/* Redirect old /dashboard to /unified */}
      <Route path="/dashboard" element={<Navigate to="/unified" replace />} />

      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Connections />
              </Layout>
            </RequireVerifiedEmail>
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
            <RequireVerifiedEmail>
              <Layout>
                <Workflows />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/agents"
        element={
          <ProtectedRoute>
            <Layout>
              <Agents />
            </Layout>
          </ProtectedRoute>
        }
      /> */}

      <Route
        path="/usage"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Usage />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <WhatsAppDashboard />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tiktok"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <TikTokDashboard />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Marketplace />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/apps/kra"
        element={
          <ProtectedRoute>
            <Layout>
              <KraDashboard />
            </Layout>
          </ProtectedRoute>
        }
      /> */}

      <Route
        path="/templates"
        element={<Navigate to="/workflows" replace />}
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Favorites />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator-profile"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <CreatorProfile />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Payments />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />


      {/* <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <Layout>
              <Activity />
            </Layout>
          </ProtectedRoute>
        }
      /> */}



      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Settings />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <Profile />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/developer"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Layout>
                <DeveloperPortal />
              </Layout>
            </RequireVerifiedEmail>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <RequireVerifiedEmail>
              <Chat />
            </RequireVerifiedEmail>
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

const FallbackLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CommandProvider>
          <TutorialProvider>
            <Suspense fallback={<FallbackLoader />}>
              <AppRoutes />
            </Suspense>
            <GlobalCommandPalette />
            <DefaultGlobalCommands />
            <TutorialButton />
            <TutorialOverlay />
          </TutorialProvider>
        </CommandProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App; 