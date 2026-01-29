import {
  Activity,
  Award,

  Bot,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  Database,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  Workflow,
  X,
  Zap,
  LayoutDashboard,
  Share2,
  Phone,
  Video
} from 'lucide-react';
import logo from '../assets/Logo/icononly_transparent_nobuffer.png';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FloatingActionMenu from './FloatingActionMenu';
import NotificationsDropdown from './NotificationsDropdown';
import CookieConsent from './CookieConsent';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['Workspace']); // Default expanded

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const navigation = [
    {
      name: 'Workspace',
      icon: LayoutDashboard,
      description: 'Unified view of all apps',
      badge: 'New',
      children: [
        {
          name: 'Overview',
          href: '/unified',
          icon: Home,
          description: 'Dashboard overview',
          badge: null
        },
        {
          name: 'Inbox',
          href: '/unified/inbox',
          icon: MessageCircle,
          description: 'Unified Inbox',
          badge: null
        },
        {
          name: 'Task View',
          href: '/unified/tasks',
          icon: Workflow,
          description: 'Unified Tasks',
          badge: null
        },
        {
          name: 'Calendar',
          href: '/unified/calendar',
          icon: Activity,
          description: 'Unified Calendar',
          badge: null
        }
      ]
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageCircle,
      description: 'AI-powered conversations',
      badge: null
    },
    {
      name: 'Workflows',
      href: '/workflows',
      icon: Workflow,
      description: 'Automated processes',
      badge: 'New'
    },
    {
      name: 'Agents',
      href: '/agents',
      icon: Bot,
      description: 'AI agents management',
      badge: null
    },
    {
      name: 'Channels',
      icon: Share2,
      description: 'Social & messaging platforms',
      badge: 'New',
      children: [
        {
          name: 'WhatsApp',
          href: '/whatsapp',
          icon: Phone,
          description: 'WhatsApp Business automation',
          badge: 'New'
        },
        {
          name: 'TikTok',
          href: '/tiktok',
          icon: Video,
          description: 'Viral content scheduler',
          badge: 'New'
        }
      ]
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingBag,
      description: 'Share and discover workflows',
      badge: 'New'
    },
    {
      name: 'Favorites',
      href: '/favorites',
      icon: Heart,
      description: 'Saved workflows',
      badge: null
    },
    {
      name: 'Creator Profile',
      href: '/creator-profile',
      icon: Award,
      description: 'Manage your creator profile',
      badge: null
    },
    {
      name: 'Connections',
      href: '/connections',
      icon: Database,
      description: 'External integrations',
      badge: null
    },
    {
      name: 'Payments & Subscriptions',
      href: '/payments',
      icon: CreditCard,
      description: 'Billing and subscriptions',
      badge: null
    },
    {
      name: 'Pricing',
      href: '/pricing',
      icon: Sparkles,
      description: 'Upgrade your plan',
      badge: 'New'
    },
    {
      name: 'Activity',
      href: '/activity',
      icon: Activity,
      description: 'System monitoring',
      badge: null
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account configuration',
      badge: null
    },
  ];

  // Add Admin Dashboard if user is admin
  if (user?.email === 'support@arrotechsolutions') {
    navigation.splice(1, 0, {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: Shield,
      description: 'Manage access requests',
      badge: null
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
    }
  };

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      case 'pro':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  const renderNavItem = (item: any, isMobile: boolean = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || (item.children && item.children.some((child: any) => location.pathname === child.href));
    const isExpanded = expandedMenus.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={`w-full group flex items-center ${collapsed && !isMobile ? 'px-2 justify-center' : 'px-4'} py-3 rounded-xl transition-all duration-200 ${isActive && !isExpanded
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            title={collapsed && !isMobile ? item.name : undefined}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${collapsed && !isMobile ? 'mx-auto' : 'mr-3'} ${isActive && !isExpanded ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
              {collapsed && !isMobile && item.badge && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></span>
              )}
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isActive && !isExpanded ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            )}
          </button>

          {/* Children */}
          {isExpanded && (!collapsed || isMobile) && (
            <div className="ml-4 pl-4 border-l border-gray-200 space-y-1 mt-1">
              {item.children.map((child: any) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.href;
                return (
                  <Link
                    key={child.name}
                    to={child.href}
                    className={`group flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${isChildActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <ChildIcon className={`w-4 h-4 mr-3 ${isChildActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="text-sm font-medium">{child.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center ${collapsed && !isMobile ? 'px-2 justify-center' : 'px-4'} py-3 rounded-xl transition-all duration-200 ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        title={collapsed && !isMobile ? item.name : undefined}
        onClick={() => isMobile && setSidebarOpen(false)}
      >
        <div className="relative">
          <Icon className={`w-5 h-5 ${collapsed && !isMobile ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
          {collapsed && !isMobile && item.badge && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></span>
          )}
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
              {item.description}
            </p>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Arrotech Hub" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  Arrotech Hub
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSubscriptionColor(user.subscription_tier)}`}>
                <div className="flex items-center space-x-1">
                  {getSubscriptionIcon(user.subscription_tier)}
                  <span className="capitalize">{user.subscription_tier}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 min-h-0 p-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => renderNavItem(item, true))}
          </nav>

          {/* Logout Section */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200/50">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`sidebar hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-40 ${collapsed ? 'lg:w-24' : 'lg:w-80'
        }`}>
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl shadow-xl border-r border-gray-200/50">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200/50">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <img src={logo} alt="Arrotech Hub" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                    Arrotech Hub
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered Platform</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto">
                <img src={logo} alt="Arrotech Hub" className="w-10 h-10 object-contain" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${collapsed ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-100'
                }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${collapsed ? 'rotate-180 text-blue-600' : ''
                }`} />
            </button>
          </div>

          {/* User Profile Section */}
          {!collapsed && (
            <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSubscriptionColor(user.subscription_tier)}`}>
                  <div className="flex items-center space-x-1">
                    {getSubscriptionIcon(user.subscription_tier)}
                    <span className="capitalize">{user.subscription_tier}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 min-h-0 p-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => renderNavItem(item, false))}
          </nav>

          {/* Logout Section */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200/50">
            <button
              onClick={handleLogout}
              className={`flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors ${collapsed ? 'justify-center' : ''
                }`}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-24' : 'lg:pl-80'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>

              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />

              {/* User Dropdown */}
              <div className="relative user-dropdown">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <div className="mt-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-white inline-block ${getSubscriptionColor(user.subscription_tier)}`}>
                          <div className="flex items-center space-x-1">
                            {getSubscriptionIcon(user.subscription_tier)}
                            <span className="capitalize">{user.subscription_tier}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3 text-gray-500" />
                      Profile
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-gray-500" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Floating Action Menu - Help, AI Assistant, Tutorial */}
      <FloatingActionMenu />
      <CookieConsent />
    </div>
  );
};

export default Layout; 