import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  page: string; // Which page this step belongs to
  order: number;
  fallbackTarget?: string; // Fallback selector if primary doesn't exist
}

interface PageTutorialStatus {
  [page: string]: boolean;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  totalSteps: number;
  startTutorial: () => void;
  startPageTutorial: (page?: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  completePageTutorial: () => void;
  isCompleted: boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  hasCompletedPage: (page: string) => boolean;
  tutorialMode: 'full' | 'page' | 'none';
  availablePages: string[];
  goToPage: (page: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Page configuration with routes
const pageConfig: Record<string, string> = {
  // dashboard removed - workspace (/unified) is now the primary landing
  workspace: '/unified',  // UnifiedDashboard
  chat: '/chat',
  workflows: '/workflows',
  agents: '/agents',
  connections: '/connections',
  payments: '/payments',
  activity: '/activity',
  settings: '/settings',
  profile: '/profile',
  marketplace: '/marketplace',
  favorites: '/favorites',
  creator: '/creator-profile',
  mcptools: '/mcp-tools',
  pricing: '/pricing',
  unifiedInbox: '/unified/inbox',
  unifiedTasks: '/unified/tasks',
  unifiedCalendar: '/unified/calendar',
  whatsapp: '/whatsapp',
};

// Tutorial steps configuration - using more reliable CSS selectors
const tutorialSteps: TutorialStep[] = [
  // Dashboard steps removed - workspace (UnifiedDashboard) is now the landing page
  // See workspace-* steps below for the new primary tutorial flow

  // Chat page steps (7 steps)
  {
    id: 'chat-sidebar',
    title: 'Chat Sidebar',
    description: 'Your chat sidebar contains AI provider selection, conversation history, and new chat button.',
    target: '.chat-sidebar',
    fallbackTarget: '[class*="sidebar"]',
    position: 'right',
    page: 'chat',
    order: 5
  },
  {
    id: 'chat-provider',
    title: 'AI Provider Selection',
    description: 'Select your AI provider (Ollama, OpenAI, Gemini, Claude, etc.). The green dot shows connection status.',
    target: '.chat-provider-select',
    fallbackTarget: 'select',
    position: 'bottom',
    page: 'chat',
    order: 6
  },
  {
    id: 'chat-conversations',
    title: 'Conversation History',
    description: 'Your chats are organized by time. Click to continue a conversation, hover for rename/delete options.',
    target: '.chat-conversations-list',
    fallbackTarget: '.chat-history-empty',
    position: 'right',
    page: 'chat',
    order: 7
  },
  {
    id: 'chat-new-conversation',
    title: 'New Conversation',
    description: 'Start a fresh conversation. Previous chats are automatically saved and accessible from the history.',
    target: '.chat-new-conversation',
    fallbackTarget: 'button[class*="gradient"]',
    position: 'top',
    page: 'chat',
    order: 8
  },
  {
    id: 'chat-messages',
    title: 'Messages Area',
    description: 'Your conversation appears here. AI responses include tool execution results and structured data.',
    target: '.chat-messages-area',
    fallbackTarget: '.chat-messages-empty',
    position: 'left',
    page: 'chat',
    order: 9
  },
  {
    id: 'chat-input',
    title: 'Message Input',
    description: 'Type your message here. Use the microphone for voice input, or attach files with the paperclip icon.',
    target: '.chat-input-container',
    fallbackTarget: '.chat-input',
    position: 'top',
    page: 'chat',
    order: 10
  },
  {
    id: 'chat-send',
    title: 'Send Message',
    description: 'Click Send or press Enter. The AI can execute tools from your connections and return structured results.',
    target: '.chat-send-btn',
    fallbackTarget: 'button[class*="gradient"]',
    position: 'left',
    page: 'chat',
    order: 11
  },

  // Workflows page steps (6 steps)
  {
    id: 'workflows-intro',
    title: 'Workflows Dashboard',
    description: 'Create and manage automated workflows that chain tools and services together.',
    target: '.workflows-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'workflows',
    order: 12
  },
  {
    id: 'workflows-create',
    title: 'Create New Workflow',
    description: 'Build workflows manually or create them from successful chat conversations with the AI.',
    target: '.workflow-builder',
    fallbackTarget: 'button[class*="Create"]',
    position: 'left',
    page: 'workflows',
    order: 13
  },
  {
    id: 'workflows-tabs',
    title: 'Workflows & Executions',
    description: 'Switch between viewing your workflows and their execution history with these tabs.',
    target: '.workflows-tabs',
    fallbackTarget: '.bg-white.rounded-xl.shadow-sm.border',
    position: 'bottom',
    page: 'workflows',
    order: 14
  },
  {
    id: 'workflows-stats',
    title: 'Workflow Statistics',
    description: 'Track total workflows, active count, drafts, and completed executions at a glance.',
    target: '.workflows-stats',
    fallbackTarget: '.grid.grid-cols-1.md\\:grid-cols-4',
    position: 'bottom',
    page: 'workflows',
    order: 15
  },
  {
    id: 'workflows-filters',
    title: 'Search & Filter',
    description: 'Search workflows by name and filter by status. Toggle between grid and list views.',
    target: '.workflows-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'workflows',
    order: 16
  },
  {
    id: 'workflows-actions',
    title: 'Workflow Actions',
    description: 'Execute workflows, view details, edit configurations, or delete. Use the Execute modal for input data.',
    target: '.execute-workflow-btn',
    fallbackTarget: '.workflows-list-empty',
    position: 'left',
    page: 'workflows',
    order: 17
  },

  // Agents page steps (5 steps)
  {
    id: 'agents-intro',
    title: 'Autonomous Agents',
    description: 'Create intelligent agents that execute workflows automatically based on schedules or triggers.',
    target: '.agents-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'agents',
    order: 18
  },
  {
    id: 'agents-create',
    title: 'Create New Agent',
    description: 'Build an agent from a workflow. Configure scheduling, notifications, and error handling.',
    target: '.create-agent-btn',
    fallbackTarget: 'button[class*="Create"]',
    position: 'left',
    page: 'agents',
    order: 19
  },
  {
    id: 'agents-stats',
    title: 'Agent Statistics',
    description: 'Monitor total agents, active count, paused agents, and completed executions.',
    target: '.agents-stats',
    fallbackTarget: '.grid.grid-cols-1.md\\:grid-cols-4',
    position: 'bottom',
    page: 'agents',
    order: 20
  },
  {
    id: 'agents-filters',
    title: 'Search & Filter Agents',
    description: 'Find agents by name and filter by status. Switch between grid and list views.',
    target: '.agents-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'agents',
    order: 21
  },
  {
    id: 'agents-actions',
    title: 'Agent Controls',
    description: 'Start, pause, or stop agents. View execution history and modify configurations.',
    target: '.agent-actions-container',
    fallbackTarget: '.agents-list-empty',
    position: 'left',
    page: 'agents',
    order: 22
  },

  // Connections page steps (3 steps)
  {
    id: 'connections-intro',
    title: 'Integrations Hub',
    description: 'Connect and manage third-party services - Slack, HubSpot, Google, and more.',
    target: '.connections-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'connections',
    order: 23
  },
  {
    id: 'connections-filters',
    title: 'Filter & Search',
    description: 'Find integrations by category or search by name to quickly locate the service you need.',
    target: '.connections-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'connections',
    order: 24
  },
  {
    id: 'connections-grid',
    title: 'Available Platforms',
    description: 'Browse all supported platforms. Click "Connect" to set up a new integration or "Manage" to configure existing ones.',
    target: '.available-platforms',
    fallbackTarget: '.grid',
    position: 'top',
    page: 'connections',
    order: 25
  },

  // MCP Tools steps (4 steps)
  {
    id: 'mcptools-intro',
    title: 'MCP Tools Explorer',
    description: 'Browse and execute AI capabilities provided by the Model Context Protocol (MCP).',
    target: '.mcptools-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'mcptools',
    order: 28
  },
  {
    id: 'mcptools-stats',
    title: 'Tools Overview',
    description: 'See the total number of available tools and their categories at a glance.',
    target: '.mcptools-stats',
    fallbackTarget: '.grid.grid-cols-1',
    position: 'bottom',
    page: 'mcptools',
    order: 29
  },
  {
    id: 'mcptools-filters',
    title: 'Find Tools',
    description: 'Search for specific tools or filter by category to find exactly what you need.',
    target: '.mcptools-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'mcptools',
    order: 30
  },
  {
    id: 'mcptools-list',
    title: 'Execute Tools',
    description: 'Click on any tool to configure its parameters and execute it directly from the UI.',
    target: '.mcptools-list',
    fallbackTarget: '.grid.grid-cols-1',
    position: 'top',
    page: 'mcptools',
    order: 31
  },

  // Payments page steps (4 steps)
  {
    id: 'payments-intro',
    title: 'Payment Center',
    description: 'Manage payments, subscriptions, and billing for your Mini-Hub account.',
    target: '.payments-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'payments',
    order: 32
  },
  {
    id: 'payments-actions',
    title: 'Payment Methods',
    description: 'Pay using M-Pesa mobile money or Stripe credit card. Click either button to start.',
    target: '.payment-actions',
    fallbackTarget: 'button[class*="M-Pesa"], button[class*="Stripe"]',
    position: 'bottom',
    page: 'payments',
    order: 33
  },
  {
    id: 'payments-stats',
    title: 'Billing Overview',
    description: 'Track total payments, pending transactions, and active subscriptions.',
    target: '.payment-stats',
    fallbackTarget: '.grid.grid-cols-1',
    position: 'bottom',
    page: 'payments',
    order: 34
  },
  {
    id: 'payments-history',
    title: 'Transaction History',
    description: 'View all past payments and subscriptions with status, amounts, and timestamps.',
    target: '.payment-history',
    fallbackTarget: '.payments-list-empty',
    position: 'top',
    page: 'payments',
    order: 35
  },

  // Activity page steps (4 steps)
  {
    id: 'activity-intro',
    title: 'Activity Monitor',
    description: 'Monitor system activity, track performance metrics, and review audit logs.',
    target: '.activity-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'activity',
    order: 36
  },
  {
    id: 'activity-metrics',
    title: 'System Metrics',
    description: 'Real-time performance - CPU usage, memory, active connections, and error rates.',
    target: '.system-metrics',
    fallbackTarget: '.grid.grid-cols-1.md\\:grid-cols-4',
    position: 'bottom',
    page: 'activity',
    order: 37
  },
  {
    id: 'activity-filters',
    title: 'Filter Activity',
    description: 'Search activities, filter by category, and select date ranges for detailed analysis.',
    target: '.activity-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'activity',
    order: 38
  },
  {
    id: 'activity-logs',
    title: 'Activity Logs',
    description: 'Detailed logs with timestamps, descriptions, categories, and status indicators.',
    target: '.activity-list',
    fallbackTarget: '.activity-list-empty',
    position: 'top',
    page: 'activity',
    order: 39
  },

  // Settings page steps (4 steps)
  {
    id: 'settings-intro',
    title: 'Application Settings',
    description: 'Configure notifications, API keys, dashboard layout, integrations, and security.',
    target: '.settings-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'settings',
    order: 40
  },
  {
    id: 'settings-categories',
    title: 'Settings Navigation',
    description: 'Click categories to switch sections - Notifications, API, Dashboard, Integrations, Security.',
    target: '.settings-categories',
    fallbackTarget: '.lg\\:col-span-1',
    position: 'right',
    page: 'settings',
    order: 41
  },
  {
    id: 'settings-content',
    title: 'Settings Panel',
    description: 'Configure options for the selected category. Toggle switches and fill in fields as needed.',
    target: '.settings-content',
    fallbackTarget: '.lg\\:col-span-2',
    position: 'left',
    page: 'settings',
    order: 42
  },
  {
    id: 'settings-save',
    title: 'Save Changes',
    description: 'Remember to save your changes! Click "Save Changes" in the header after modifications.',
    target: '.settings-actions',
    fallbackTarget: 'button[class*="Save"]',
    position: 'bottom',
    page: 'settings',
    order: 43
  },

  // Profile page steps (4 steps)
  {
    id: 'profile-intro',
    title: 'Profile Settings',
    description: 'Manage your account information, API access, and security settings.',
    target: '.profile-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'profile',
    order: 44
  },
  {
    id: 'profile-personal',
    title: 'Personal Information',
    description: 'Update your name and email address. Click Save Changes to apply updates.',
    target: '.personal-info-section',
    fallbackTarget: 'form',
    position: 'bottom',
    page: 'profile',
    order: 45
  },
  {
    id: 'profile-api',
    title: 'API Key Management',
    description: 'View, copy, or regenerate your API key. Keep it secure for external integrations.',
    target: '.api-key-section',
    fallbackTarget: '[class*="api"]',
    position: 'bottom',
    page: 'profile',
    order: 46
  },
  {
    id: 'profile-security',
    title: 'Password Security',
    description: 'Change your password here. Use a strong password with mixed characters.',
    target: '.security-section',
    fallbackTarget: '[class*="Password"]',
    position: 'top',
    page: 'profile',
    order: 47
  },



  // Marketplace steps (5 steps)
  {
    id: 'marketplace-intro',
    title: 'Workflow Marketplace',
    description: 'Discover and import community-built intelligent workflows for your business.',
    target: '.marketplace-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'marketplace',
    order: 54
  },
  {
    id: 'marketplace-trending',
    title: 'Trending Workflows',
    description: 'See the most popular and highly-rated workflows this week.',
    target: '.marketplace-trending-header',
    fallbackTarget: '.marketplace-tabs',
    position: 'bottom',
    page: 'marketplace',
    order: 55
  },
  {
    id: 'marketplace-tabs',
    title: 'Browse & Your Activity',
    description: 'Manage your shared workflows and your downloaded tools.',
    target: '.marketplace-tabs',
    fallbackTarget: '.bg-gray-100/50',
    position: 'bottom',
    page: 'marketplace',
    order: 56
  },
  {
    id: 'marketplace-filters',
    title: 'Filter Marketplace',
    description: 'Search by keyword or filter by category and popularity.',
    target: '.marketplace-filters',
    fallbackTarget: 'input[placeholder*="Search"]',
    position: 'bottom',
    page: 'marketplace',
    order: 57
  },
  {
    id: 'marketplace-list',
    title: 'Workflow Selection',
    description: 'Review workflow details, steps, and ratings before importing to your account.',
    target: '.marketplace-list',
    fallbackTarget: '.marketplace-list-empty',
    position: 'top',
    page: 'marketplace',
    order: 58
  },

  // Favorites steps (3 steps)
  {
    id: 'favorites-intro',
    title: 'Saved Workflows',
    description: 'Access your bookmarked workflows from the marketplace for quick reference.',
    target: '.favorites-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'favorites',
    order: 59
  },
  {
    id: 'favorites-list',
    title: 'Your Favorites',
    description: 'Manage your saved collection. You can view details or remove items easily.',
    target: '.favorites-list',
    fallbackTarget: '.favorites-empty-state',
    position: 'top',
    page: 'favorites',
    order: 60
  },
  {
    id: 'favorites-empty',
    title: 'Find New Workflows',
    description: 'If you haven\'t saved any yet, head over to the marketplace to explore!',
    target: '.favorites-empty-state',
    fallbackTarget: 'button',
    position: 'top',
    page: 'favorites',
    order: 61
  },

  // Creator Profile steps (6 steps)
  {
    id: 'creator-intro',
    title: 'Creator Profile',
    description: 'Personalize your public presence and showcase your contributions to the community.',
    target: '.creator-header',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'creator',
    order: 62
  },
  {
    id: 'creator-card',
    title: 'Profile Customization',
    description: 'Update your bio, social links, and public visibility settings.',
    target: '.creator-profile-card',
    fallbackTarget: '.bg-white.rounded-xl',
    position: 'bottom',
    page: 'creator',
    order: 63
  },
  {
    id: 'creator-stats',
    title: 'Creator Stats',
    description: 'Track your impact with total downloads, reviews, and average rating.',
    target: '.creator-stats',
    fallbackTarget: '.grid-cols-6',
    position: 'bottom',
    page: 'creator',
    order: 64
  },
  {
    id: 'creator-workflows',
    title: 'Public Workflows',
    description: 'View all workflows you\'ve shared with the marketplace.',
    target: '.creator-workflows',
    fallbackTarget: '.creator-workflows-empty',
    position: 'top',
    page: 'creator',
    order: 65
  },
  {
    id: 'creator-activity',
    title: 'Creator Activity',
    description: 'Monitor engagement with your workflows and new follower alerts.',
    target: '.creator-activity',
    fallbackTarget: '.creator-activity-empty',
    position: 'top',
    page: 'creator',
    order: 66
  },
  {
    id: 'creator-leaderboard',
    title: 'Top Creators',
    description: 'See where you stand among the community\'s most influential contributors.',
    target: '.creator-top-leaderboard',
    fallbackTarget: '.creator-leaderboard',
    position: 'left',
    page: 'creator',
    order: 67
  },

  // Pricing page steps (4 steps)
  {
    id: 'pricing-intro',
    title: 'Subscription Plans',
    description: 'Choose the plan that fits your business needs - from Free Lite to Business Pro.',
    target: '.text-center.mb-16',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'pricing',
    order: 68
  },
  {
    id: 'pricing-payment-toggle',
    title: 'Payment Method',
    description: 'Switch between M-Pesa mobile money and Card payment methods.',
    target: '.bg-white.dark\\:bg-gray-800.p-1.rounded-lg',
    fallbackTarget: 'button',
    position: 'bottom',
    page: 'pricing',
    order: 69
  },
  {
    id: 'pricing-tiers',
    title: 'Plan Comparison',
    description: 'Compare features, API limits, and pricing across all tiers. The Starter plan is most popular for growing businesses.',
    target: '.grid.grid-cols-1.md\\:grid-cols-3',
    fallbackTarget: '.relative.bg-white',
    position: 'top',
    page: 'pricing',
    order: 70
  },
  {
    id: 'pricing-features',
    title: 'Local Business Features',
    description: 'M-Pesa integration, Kenyan market optimization, automated tax reporting, and enterprise security.',
    target: '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4',
    fallbackTarget: '.mt-20',
    position: 'top',
    page: 'pricing',
    order: 71
  },

  // Workspace / UnifiedDashboard steps (4 steps)
  {
    id: 'workspace-welcome',
    title: 'Unified Workspace',
    description: 'Your command center for email, tasks, and calendar - all in one intelligent dashboard.',
    target: '.dashboard-header-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'workspace',
    order: 71
  },
  {
    id: 'workspace-inbox',
    title: 'Unified Inbox',
    description: 'Messages from Gmail, Outlook, Slack, and Teams in one place. Filter, search, and reply without switching apps.',
    target: '.unified-inbox-tut',
    fallbackTarget: '.lg\\:col-span-7',
    position: 'right',
    page: 'workspace',
    order: 72
  },
  {
    id: 'workspace-calendar',
    title: 'Calendar Hub',
    description: 'View upcoming events from Google Calendar and Outlook. Join meetings or schedule new ones.',
    target: '.calendar-hub-tut',
    fallbackTarget: '.lg\\:col-span-5',
    position: 'left',
    page: 'workspace',
    order: 73
  },
  {
    id: 'workspace-tasks',
    title: 'Task Hub',
    description: 'Manage tasks from Jira, Trello, ClickUp, and Asana. Track status, priority, and create new tasks.',
    target: '.task-hub-tut',
    fallbackTarget: '.lg\\:col-span-5',
    position: 'left',
    page: 'workspace',
    order: 75
  },

  // Unified Inbox steps
  {
    id: 'inbox-intro',
    title: 'Unified Inbox',
    description: 'All your communications in one place. Switch tabs to filter by provider like Gmail, Slack, or Teams.',
    target: '.unified-inbox-header',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'unifiedInbox',
    order: 76
  },
  {
    id: 'inbox-search',
    title: 'Search Messages',
    description: 'Quickly find any message across all connected platforms.',
    target: '.unified-inbox-search',
    fallbackTarget: 'input[type="text"]',
    position: 'bottom',
    page: 'unifiedInbox',
    order: 77
  },

  // Unified Tasks steps
  {
    id: 'tasks-intro',
    title: 'Unified Task View',
    description: 'Manage tasks from Jira, Trello, Asana, and ClickUp in a single list.',
    target: '.unified-tasks-header',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'unifiedTasks',
    order: 78
  },
  {
    id: 'tasks-new',
    title: 'Create Task',
    description: 'Add a new task directly from here. It will sync back to the source platform.',
    target: '.create-task-btn',
    fallbackTarget: 'button',
    position: 'left',
    page: 'unifiedTasks',
    order: 79
  },

  // Unified Calendar steps
  {
    id: 'calendar-intro',
    title: 'Unified Calendar',
    description: 'Your aggregated schedule. View events from Google Calendar and Outlook.',
    target: '.unified-calendar-header',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'unifiedCalendar',
    order: 80
  },

  // WhatsApp steps (6 steps)
  {
    id: 'whatsapp-intro',
    title: 'WhatsApp Business Hub',
    description: 'Manage all your WhatsApp customer conversations, auto-replies, and business profile from one place.',
    target: '.whatsapp-header-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'whatsapp',
    order: 81
  },
  {
    id: 'whatsapp-stats',
    title: 'Dashboard Statistics',
    description: 'Monitor your total contacts, messages today, and active auto-reply rules at a glance.',
    target: '.whatsapp-stats-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'whatsapp',
    order: 82
  },
  {
    id: 'whatsapp-tabs',
    title: 'Navigation Tabs',
    description: 'Switch between Conversations, Auto-Reply rules, and Settings to manage different aspects.',
    target: '.whatsapp-tabs-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'whatsapp',
    order: 83
  },
  {
    id: 'whatsapp-contacts',
    title: 'Contact List',
    description: 'View all your WhatsApp contacts. Search by name or phone number. New contacts appear automatically when they message you.',
    target: '.overflow-y-auto',
    fallbackTarget: 'main',
    position: 'right',
    page: 'whatsapp',
    order: 84
  },
  {
    id: 'whatsapp-chat',
    title: 'Chat Window',
    description: 'Select a contact to view conversation history. Send messages directly and see delivery status (sent, delivered, read).',
    target: '.lg\\:col-span-2',
    fallbackTarget: 'main',
    position: 'left',
    page: 'whatsapp',
    order: 85
  },
  {
    id: 'whatsapp-auto-reply',
    title: 'Auto-Reply Automation',
    description: 'Create rules to automatically respond to customers 24/7. Use keywords, business hours, or AI-powered responses.',
    target: '.space-y-6',
    fallbackTarget: 'main',
    position: 'top',
    page: 'whatsapp',
    order: 86
  },
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tutorialMode, setTutorialMode] = useState<'full' | 'page' | 'none'>('none');
  const [pageCompletionStatus, setPageCompletionStatus] = useState<PageTutorialStatus>({});

  // Available pages for tutorial
  const availablePages = Object.keys(pageConfig);

  // Load completion status from localStorage
  useEffect(() => {
    const savedStatus = localStorage.getItem('tutorial_page_status');
    if (savedStatus) {
      try {
        setPageCompletionStatus(JSON.parse(savedStatus));
      } catch {
        // Invalid JSON, ignore
      }
    }

    const completedFull = localStorage.getItem('tutorial_completed');
    if (completedFull === 'true') {
      setIsCompleted(true);
    }
  }, []);

  // Save completion status to localStorage
  const savePageStatus = useCallback((status: PageTutorialStatus) => {
    setPageCompletionStatus(status);
    localStorage.setItem('tutorial_page_status', JSON.stringify(status));
  }, []);

  // Update current page based on location
  useEffect(() => {
    const pathname = location.pathname;
    let page = 'dashboard';

    // Check for exact matches first
    for (const [pageName, route] of Object.entries(pageConfig)) {
      if (pathname === route) {
        page = pageName;
        break;
      }
    }

    // If no exact match, check for starts-with (for routes with params)
    if (page === 'dashboard' && pathname !== '/') {
      for (const [pageName, route] of Object.entries(pageConfig)) {
        if (route !== '/' && pathname.startsWith(route)) {
          page = pageName;
          break;
        }
      }
    }

    // Reset step index when page changes
    if (page !== currentPage) {
      setCurrentStepIndex(0);
    }

    setCurrentPage(page);
  }, [location.pathname, currentPage]);

  // Check if tutorial should be shown for new users
  useEffect(() => {
    if (user && !isCompleted && !isActive) {
      const hasSeenTutorial = localStorage.getItem('tutorial_completed');
      if (!hasSeenTutorial) {
        // Show tutorial for new users after a short delay
        const timer = setTimeout(() => {
          setIsActive(true);
          setTutorialMode('page');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isCompleted, isActive]);

  // Filter steps for current page
  const currentPageSteps = tutorialSteps.filter(step => step.page === currentPage);
  const currentStep = currentPageSteps[currentStepIndex] || null;
  const totalSteps = currentPageSteps.length;

  // Check if a page's tutorial has been completed
  const hasCompletedPage = useCallback((page: string) => {
    return pageCompletionStatus[page] === true;
  }, [pageCompletionStatus]);

  // Navigate to a different page
  const goToPage = useCallback((page: string) => {
    const route = pageConfig[page];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  // Start full tutorial (all pages)
  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
    setTutorialMode('full');
    // Start from dashboard
    if (currentPage !== 'dashboard') {
      navigate('/');
    }
  }, [currentPage, navigate]);

  // Start tutorial for current page only
  const startPageTutorial = useCallback((page?: string) => {
    if (page && page !== currentPage) {
      navigate(pageConfig[page] || '/');
    }
    setIsActive(true);
    setCurrentStepIndex(0);
    setTutorialMode('page');
  }, [currentPage, navigate]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < currentPageSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (tutorialMode === 'full') {
      // Mark current page as complete
      const newStatus = { ...pageCompletionStatus, [currentPage]: true };
      savePageStatus(newStatus);

      // Find next page with tutorials
      const currentOrder = currentPageSteps[currentStepIndex]?.order || 0;
      const nextStepData = tutorialSteps.find(step => step.order > currentOrder);

      if (nextStepData && nextStepData.page !== currentPage) {
        // Navigate to next page
        const nextRoute = pageConfig[nextStepData.page];
        if (nextRoute) {
          setCurrentStepIndex(0);
          navigate(nextRoute);
        }
      } else {
        // No more pages, complete tutorial
        setIsActive(false);
        setTutorialMode('none');
        localStorage.setItem('tutorial_completed', 'true');
        setIsCompleted(true);

        // Mark all pages as complete
        const allComplete: PageTutorialStatus = {};
        availablePages.forEach(page => {
          allComplete[page] = true;
        });
        savePageStatus(allComplete);
      }
    } else {
      // Page tutorial mode - just complete this page
      const newStatus = { ...pageCompletionStatus, [currentPage]: true };
      savePageStatus(newStatus);
      setIsActive(false);
      setTutorialMode('none');
    }
  }, [currentStepIndex, currentPageSteps, currentPage, tutorialMode, pageCompletionStatus, savePageStatus, navigate, availablePages]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (tutorialMode === 'full') {
      // Find previous page with tutorials
      const currentOrder = currentPageSteps[0]?.order || 0;
      const prevSteps = tutorialSteps.filter(step => step.order < currentOrder);

      if (prevSteps.length > 0) {
        const prevStep = prevSteps[prevSteps.length - 1];
        const prevRoute = pageConfig[prevStep.page];
        if (prevRoute) {
          navigate(prevRoute);
          // Set to last step of previous page
          const prevPageSteps = tutorialSteps.filter(step => step.page === prevStep.page);
          setCurrentStepIndex(prevPageSteps.length - 1);
        }
      }
    }
  }, [currentStepIndex, currentPageSteps, tutorialMode, navigate]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setTutorialMode('none');
    localStorage.setItem('tutorial_completed', 'true');
    setIsCompleted(true);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setTutorialMode('none');
    localStorage.setItem('tutorial_completed', 'true');
    setIsCompleted(true);

    // Mark all pages as complete
    const allComplete: PageTutorialStatus = {};
    availablePages.forEach(page => {
      allComplete[page] = true;
    });
    savePageStatus(allComplete);
  }, [availablePages, savePageStatus]);

  const completePageTutorial = useCallback(() => {
    // Mark current page as complete
    const newStatus = { ...pageCompletionStatus, [currentPage]: true };
    savePageStatus(newStatus);

    setIsActive(false);
    setTutorialMode('none');
  }, [currentPage, pageCompletionStatus, savePageStatus]);

  const value: TutorialContextType = {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    startTutorial,
    startPageTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    completePageTutorial,
    isCompleted,
    currentPage,
    setCurrentPage,
    hasCompletedPage,
    tutorialMode,
    availablePages,
    goToPage,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
