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
  hasPageTutorial: (page?: string) => boolean;
  tutorialMode: 'full' | 'page' | 'none';
  availablePages: string[];
  goToPage: (page: string) => void;
  isPageTransitioning: boolean;
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
  // workspace (/unified) is the primary landing after login
  workspace: '/unified',
  unifiedInbox: '/unified/inbox',
  unifiedTasks: '/unified/tasks',
  unifiedCalendar: '/unified/calendar',
  chat: '/chat',
  workflows: '/workflows',
  agents: '/agents',
  codingAgent: '/coding-agent',
  connections: '/connections',
  // MCP tools merged into Workflows — keep key for labels, skip in full tour
  marketplace: '/marketplace',
  favorites: '/favorites',
  productivity: '/usage',
  payments: '/payments',
  activity: '/activity',
  settings: '/settings',
  profile: '/profile',
  creator: '/creator-profile',
  pricing: '/pricing',
  whatsapp: '/whatsapp',
  kra: '/apps/kra',
  tiktok: '/tiktok',
};

/**
 * Full-tour page sequence (new-user guided path).
 * Numeric `order` within a page still controls step order;
 * cross-page navigation uses this list so tours aren't mixed by stale order numbers.
 */
const fullTourPageOrder: string[] = [
  'workspace',
  'unifiedInbox',
  'unifiedTasks',
  'unifiedCalendar',
  'chat',
  'workflows',
  'agents',
  'codingAgent',
  'whatsapp',
  'connections',
  'marketplace',
  'favorites',
  'productivity',
  'payments',
  'activity',
  'settings',
  'profile',
  'creator',
  'pricing',
  'kra',
  'tiktok',
];

// Tutorial steps configuration - using more reliable CSS selectors
const tutorialSteps: TutorialStep[] = [
  // Dashboard steps removed - workspace (UnifiedDashboard) is now the landing page
  // See workspace-* steps below for the new primary tutorial flow

  // Productivity Analytics steps (8 steps) — page route: /usage
  {
    id: 'productivity-intro',
    title: 'Productivity Analytics',
    description: 'Welcome to your performance hub. Track your efficiency, visualize patterns, and build winning habits across all your workflows.',
    target: '.productivity-header-tut',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'productivity',
    order: 1
  },
  {
    id: 'productivity-score',
    title: 'Productivity Score',
    description: 'Your daily efficiency rating (0-100). It aggregates your tasks, emails, and focus time into a single, actionable metric.',
    target: '.productivity-score-tut',
    fallbackTarget: '.lg\\:col-span-2',
    position: 'bottom',
    page: 'productivity',
    order: 2
  },
  {
    id: 'productivity-streak',
    title: 'Streak Tracker',
    description: 'Build consistency! Maintain your daily streak to earn bonus multipliers and level up your performance status.',
    target: '.productivity-streak-tut',
    fallbackTarget: '.bg-gradient-to-br',
    position: 'left',
    page: 'productivity',
    order: 3
  },
  {
    id: 'productivity-trends',
    title: 'Growth Trends',
    description: 'Visualize your performance over the last 30 days. Identify peak periods and areas for improvement at a glance.',
    target: '.productivity-trends-tut',
    fallbackTarget: '.lg\\:col-span-2',
    position: 'top',
    page: 'productivity',
    order: 4
  },
  {
    id: 'productivity-breakdown',
    title: 'Activity Breakdown',
    description: 'See exactly where your time goes. Filter by day, week, or month to analyze your focus across different categories.',
    target: '.productivity-breakdown-tut',
    fallbackTarget: '.bg-white\\/5',
    position: 'right',
    page: 'productivity',
    order: 5
  },
  {
    id: 'productivity-comparison',
    title: 'Weekly Comparison',
    description: 'Measure your progress! See how your current week compares to the previous one with automated trend analysis.',
    target: '.productivity-comparison-tut',
    fallbackTarget: '.bg-white\\/5',
    position: 'right',
    page: 'productivity',
    order: 6
  },
  {
    id: 'productivity-achievements',
    title: 'Milestones',
    description: 'Unlock special badges as you hit productivity targets. Gamify your workday and celebrate your wins!',
    target: '.productivity-achievements-tut',
    fallbackTarget: '.lg\\:col-span-2',
    position: 'top',
    page: 'productivity',
    order: 7
  },
  {
    id: 'productivity-stats',
    title: 'Core Metrics',
    description: 'A rapid overview of your key volumes - emails processed, tasks completed, meetings, and total focus hours.',
    target: '.productivity-stats-tut',
    fallbackTarget: '.bg-white\\/5',
    position: 'top',
    page: 'productivity',
    order: 8
  },

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
    id: 'favorites-collection',
    title: 'Your Collection',
    description: 'Browse saved workflows here, or jump to the marketplace if your list is empty.',
    target: '.favorites-list',
    fallbackTarget: '.favorites-empty-state',
    position: 'top',
    page: 'favorites',
    order: 60
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
    target: '.pricing-hero-tut',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'pricing',
    order: 68
  },
  {
    id: 'pricing-payment-toggle',
    title: 'Billing Cycle',
    description: 'Switch between monthly and yearly billing. Yearly plans include a discount.',
    target: '.pricing-billing-tut',
    fallbackTarget: '.pricing-hero-tut',
    position: 'bottom',
    page: 'pricing',
    order: 69
  },
  {
    id: 'pricing-tiers',
    title: 'Plan Comparison',
    description: 'Compare features, API limits, and pricing across all tiers. Expand a card to see the full feature list.',
    target: '.pricing-plans-tut',
    fallbackTarget: 'main',
    position: 'top',
    page: 'pricing',
    order: 70
  },
  {
    id: 'pricing-features',
    title: 'Feature Matrix',
    description: 'Dive deeper into capability-by-plan comparisons, WhatsApp limits, and what each tier unlocks.',
    target: '.pricing-features-tut',
    fallbackTarget: '.pricing-plans-tut',
    position: 'top',
    page: 'pricing',
    order: 70.5
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
    order: 74
  },

  // Unified Inbox steps

  {
    id: 'inbox-compose',
    title: 'New Message',
    description: 'Quickly compose a new message. You can choose which provider to send through (Gmail, Slack, etc.) from within the compose window.',
    target: '.unified-inbox-compose-tut',
    fallbackTarget: '.unified-inbox-header-tut',
    position: 'right',
    page: 'unifiedInbox',
    order: 77
  },
  {
    id: 'inbox-tabs',
    title: 'Provider Filters',
    description: 'Filter your inbox by communication channel. Switch between all messages, Gmail, Slack, Outlook, or Teams.',
    target: '.unified-inbox-tabs-tut',
    fallbackTarget: '[class*="tabs"]',
    position: 'right',
    page: 'unifiedInbox',
    order: 78
  },
  {
    id: 'inbox-search',
    title: 'Search All Messages',
    description: 'Find any message across all your connected accounts instantly using the unified search.',
    target: '.unified-inbox-search-tut',
    fallbackTarget: 'input[type="text"]',
    position: 'bottom',
    page: 'unifiedInbox',
    order: 79
  },
  {
    id: 'inbox-list',
    title: 'Message List',
    description: 'Your combined message feed. Unread messages are highlighted with a blue dot and AI-powered priority badges.',
    target: '.unified-inbox-list-tut',
    fallbackTarget: '.overflow-y-auto',
    position: 'right',
    page: 'unifiedInbox',
    order: 80
  },
  {
    id: 'inbox-detail',
    title: 'Reading Pane',
    description: 'Select a message to view its full content here. You can archive, star, delete, or reply directly.',
    target: '.unified-inbox-detail-tut',
    fallbackTarget: 'main',
    position: 'left',
    page: 'unifiedInbox',
    order: 81
  },
  {
    id: 'inbox-ai',
    title: 'AI Reply Assistant',
    description: 'When a message is open, use this area for AI-assisted replies and quick suggestions tailored to the conversation.',
    target: '.unified-inbox-ai-tut',
    fallbackTarget: '.unified-inbox-detail-tut',
    position: 'top',
    page: 'unifiedInbox',
    order: 82
  },

  // Unified Tasks steps
  {
    id: 'tasks-intro',
    title: 'Unified Task Hub',
    description: 'Welcome to your central command for tasks. Manage everything from Jira, Trello, Asana, and ClickUp in one powerful interface.',
    target: '.unified-tasks-header',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'unifiedTasks',
    order: 83
  },
  {
    id: 'tasks-stats',
    title: 'Productivity Metrics',
    target: '.tasks-stats-tut',
    fallbackTarget: '.grid',
    description: 'Monitor your task volume, high priority items, and completion rate in real-time across all platforms.',
    position: 'bottom',
    page: 'unifiedTasks',
    order: 84
  },
  {
    id: 'tasks-view-modes',
    title: 'Flexible Visualization',
    target: '.tasks-view-modes-tut',
    fallbackTarget: '.flex',
    description: 'Switch between Kanban board for visual workflow management and List view for rapid task scanning.',
    position: 'bottom',
    page: 'unifiedTasks',
    order: 85
  },
  {
    id: 'tasks-filters',
    title: 'Search & Filter',
    target: '.tasks-filters-tut',
    fallbackTarget: 'input',
    description: 'Instantly find tasks by title or filter by origin platform (Jira, Trello, etc.) to focus on specific workstreams.',
    position: 'bottom',
    page: 'unifiedTasks',
    order: 86
  },
  {
    id: 'tasks-board',
    title: 'Kanban Workflow',
    target: '.tasks-kanban-tut',
    fallbackTarget: '.flex',
    description: 'Drag and drop cards to update status across platforms. Click any card to edit details, assignees, and due dates.',
    position: 'top',
    page: 'unifiedTasks',
    order: 87
  },
  {
    id: 'tasks-new',
    title: 'Unified Creation',
    description: 'Create a new task and sync it directly to any of your connected platforms without leaving the dashboard.',
    target: '.create-task-btn',
    fallbackTarget: 'button',
    position: 'left',
    page: 'unifiedTasks',
    order: 88
  },

  // Unified Calendar steps
  {
    id: 'calendar-intro',
    title: 'Unified Calendar',
    description: 'Your aggregated schedule. View events from Google Calendar and Outlook in a single, high-performance view.',
    target: '.unified-calendar-header-tut',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'unifiedCalendar',
    order: 89
  },
  {
    id: 'calendar-smart',
    title: 'Smart AI Scheduler',
    description: 'Use natural language to schedule meetings. Just type "Lunch with Sarah tomorrow at 12" and let the AI do the heavy lifting.',
    target: '.calendar-smart-scheduler-tut',
    fallbackTarget: 'input',
    position: 'bottom',
    page: 'unifiedCalendar',
    order: 90
  },
  {
    id: 'calendar-views',
    title: 'View Modes',
    description: 'Switch between Month, Week, and Day views depending on your needs. Each view is optimized for performance and clarity.',
    target: '.calendar-view-modes-tut',
    fallbackTarget: 'button',
    position: 'bottom',
    page: 'unifiedCalendar',
    order: 91
  },
  {
    id: 'calendar-sidebar',
    title: 'Mini Preview & Filters',
    description: 'Quickly navigate between months with the mini-calendar and toggle specific calendar sources on or off.',
    target: '.calendar-sidebar-tut',
    fallbackTarget: 'aside',
    position: 'right',
    page: 'unifiedCalendar',
    order: 92
  },
  {
    id: 'calendar-tasks',
    title: 'Task Integration',
    description: 'View your unscheduled tasks from Jira, Trello, and Asana directly alongside your calendar. Drag and drop onto the grid coming soon!',
    target: '.calendar-task-tray-tut',
    fallbackTarget: 'aside',
    position: 'left',
    page: 'unifiedCalendar',
    order: 93
  },
  {
    id: 'calendar-create',
    title: 'Unified Creation',
    description: 'Create new events across any connected platform with a single button click.',
    target: '.calendar-create-btn-tut',
    fallbackTarget: 'button',
    position: 'left',
    page: 'unifiedCalendar',
    order: 94
  },

  // Workflows page steps (6 steps)
  {
    id: 'workflows-intro',
    title: 'Intelligent Workflows',
    description: 'Welcome to the automation engine. Build, manage, and monitor complex cross-platform workflows from this central hub.',
    target: '.workflows-header-tut',
    fallbackTarget: 'h1',
    position: 'bottom',
    page: 'workflows',
    order: 95
  },
  {
    id: 'workflows-builders',
    title: 'Visual Builders',
    description: 'Choose between the visual Canvas Builder for complex logic or the step-by-step Form Builder for quick setups.',
    target: '.workflows-builders-tut',
    fallbackTarget: '.flex',
    position: 'left',
    page: 'workflows',
    order: 96
  },
  {
    id: 'workflows-tabs',
    title: 'Navigation & Library',
    description: 'Manage your active workflows, review execution history, or browse the template library to get started faster.',
    target: '.workflows-tabs-tut',
    fallbackTarget: '.flex',
    position: 'bottom',
    page: 'workflows',
    order: 97
  },
  {
    id: 'workflows-stats',
    title: 'Performance Insights',
    description: 'Monitor your automation ROI with real-time stats on active workflows and successful job executions.',
    target: '.workflows-stats-tut',
    fallbackTarget: '.grid',
    position: 'bottom',
    page: 'workflows',
    order: 98
  },
  {
    id: 'workflows-filters',
    title: 'Advanced Filtering',
    description: 'Quickly locate workflows by name or filter by status. Switch between Grid and List views for optimal management.',
    target: '.workflows-filters-tut',
    fallbackTarget: '.flex',
    position: 'bottom',
    page: 'workflows',
    order: 99
  },
  {
    id: 'workflows-list',
    title: 'Workflow Management',
    description: 'Interact with your workflows directly from the list. Run, edit, share, or delete with a single click.',
    target: '.workflows-list-tut',
    fallbackTarget: '.workflows-empty-tut',
    position: 'top',
    page: 'workflows',
    order: 100
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
    order: 101
  },
  {
    id: 'whatsapp-stats',
    title: 'Dashboard Statistics',
    description: 'Monitor your total contacts, messages today, and active auto-reply rules at a glance.',
    target: '.whatsapp-stats-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'whatsapp',
    order: 102
  },
  {
    id: 'whatsapp-tabs',
    title: 'Navigation Tabs',
    description: 'Switch between Conversations, Auto-Reply rules, and Settings to manage different aspects.',
    target: '.whatsapp-tabs-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'whatsapp',
    order: 103
  },
  {
    id: 'whatsapp-contacts',
    title: 'Contact List',
    description: 'View all your WhatsApp contacts. Search by name or phone number. New contacts appear automatically.',
    target: '.whatsapp-contacts-tut',
    fallbackTarget: 'main',
    position: 'right',
    page: 'whatsapp',
    order: 104
  },
  {
    id: 'whatsapp-chat',
    title: 'Chat Window',
    description: 'Select a contact to view conversation history. Send messages directly and see delivery status.',
    target: '.whatsapp-chat-tut',
    fallbackTarget: 'main',
    position: 'left',
    page: 'whatsapp',
    order: 105
  },
  {
    id: 'whatsapp-auto-reply',
    title: 'Auto-Reply Automation',
    description: 'Create rules to automatically respond to customers 24/7. Use keywords or AI-powered responses.',
    target: '.whatsapp-tab-auto-reply-tut',
    fallbackTarget: 'main',
    position: 'top',
    page: 'whatsapp',
    order: 106
  },
  {
    id: 'whatsapp-broadcast',
    title: 'Broadcast Campaigns',
    description: 'Reach all your contacts at once. Create, schedule, and monitor bulk message campaigns with ease.',
    target: '.whatsapp-tab-broadcast-tut',
    fallbackTarget: 'main',
    position: 'top',
    page: 'whatsapp',
    order: 106.5
  },
  {
    id: 'whatsapp-settings',
    title: 'Profile & Settings',
    description: 'Configure your WhatsApp business profile, message templates, and connection settings from this tab.',
    target: '.whatsapp-tab-settings-tut',
    fallbackTarget: 'main',
    position: 'top',
    page: 'whatsapp',
    order: 106.8
  },

  // KRA GavaConnect steps (5 steps)
  {
    id: 'kra-intro',
    title: 'GavaConnect Portal',
    description: 'Access essential Kenyan government services. This unified portal simplifies your tax and identity-related automations.',
    target: '.kra-header-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'kra',
    order: 107
  },
  {
    id: 'kra-tabs',
    title: 'KRA Services',
    description: 'Switch between PIN verification, NIL filing, registration, and eTIMS services from this sidebar.',
    target: '.kra-tabs-tut',
    fallbackTarget: 'nav',
    position: 'right',
    page: 'kra',
    order: 108
  },
  {
    id: 'kra-content',
    title: 'Service Interaction',
    description: 'Perform your selected tax operation here. Enter details and click the primary action button to execute.',
    target: '.kra-content-tut',
    fallbackTarget: '.flex-1',
    position: 'left',
    page: 'kra',
    order: 109
  },
  {
    id: 'kra-status',
    title: 'Connection Status',
    description: 'Monitor the real-time status of the GavaConnect bridge to ensure successful service execution.',
    target: '.kra-status-tut',
    fallbackTarget: '.bg-white\\/50',
    position: 'bottom',
    page: 'kra',
    order: 110
  },
  {
    id: 'kra-help',
    title: 'Expert Support',
    description: 'Need assistance with specific tax obligations? The digital assistant is here to guide you through complex filings.',
    target: '.kra-help-tut',
    fallbackTarget: '.bg-gradient-to-br',
    position: 'top',
    page: 'kra',
    order: 111
  },

  // TikTok Hub steps (5 steps)
  {
    id: 'tiktok-intro',
    title: 'TikTok Hub',
    description: 'Welcome to your viral command center. Manage your presence and unlock new revenue streams from your TikTok content.',
    target: '.tiktok-header-tut',
    fallbackTarget: 'main',
    position: 'bottom',
    page: 'tiktok',
    order: 112
  },
  {
    id: 'tiktok-stats',
    title: 'Growth Analytics',
    description: 'Track your followers, views, and engagement rate in real-time to optimize your content strategy.',
    target: '.tiktok-stats-tut',
    fallbackTarget: '.grid',
    position: 'bottom',
    page: 'tiktok',
    order: 113
  },
  {
    id: 'tiktok-scheduler',
    title: 'Smart Scheduling',
    description: 'Plan your viral hits in advance. Schedule posts at peak times to maximize reach and engagement.',
    target: '.tiktok-scheduler-tut',
    fallbackTarget: 'main',
    position: 'left',
    page: 'tiktok',
    order: 114
  },
  {
    id: 'tiktok-monetization',
    title: 'Monetization Suite',
    description: 'Turn your views into value. Manage your Tip Jar, Premium Links, and Media Kit from this dashboard.',
    target: '.tiktok-monetization-tut',
    fallbackTarget: '.bg-gradient-to-br',
    position: 'right',
    page: 'tiktok',
    order: 115
  },
  {
    id: 'tiktok-viral',
    title: 'Viral Success Cards',
    description: 'Generate beautiful, shareable cards of your performance metrics to showcase your growth on other platforms.',
    target: '.tiktok-viral-tut',
    fallbackTarget: 'button',
    position: 'top',
    page: 'tiktok',
    order: 116
  },

  // Coding Agent steps (4 steps)
  {
    id: 'coding-intro',
    title: 'Coding Agent Workspace',
    description: 'Provision a secure AI coding sandbox to build, edit, and test code with an autonomous software engineer.',
    target: '.coding-agent-hero-tut',
    fallbackTarget: 'main h1',
    position: 'bottom',
    page: 'codingAgent',
    order: 117
  },
  {
    id: 'coding-repo',
    title: 'Target Repository',
    description: 'Optionally paste a Git repository URL so the agent can clone and work in your project context.',
    target: '.coding-agent-repo-tut',
    fallbackTarget: '.coding-agent-hero-tut',
    position: 'top',
    page: 'codingAgent',
    order: 118
  },
  {
    id: 'coding-start',
    title: 'Start a Session',
    description: 'Launch a sandbox session to open the file tree, terminal, and chat with the coding agent.',
    target: '.coding-agent-start-tut',
    fallbackTarget: 'button',
    position: 'top',
    page: 'codingAgent',
    order: 119
  },
  {
    id: 'coding-workspace',
    title: 'Agent Workspace',
    description: 'Once a session is running, use the file explorer, editor, terminal, and chat panels together to ship changes.',
    target: '.coding-agent-workspace-tut',
    fallbackTarget: '.coding-agent-hero-tut',
    position: 'bottom',
    page: 'codingAgent',
    order: 120
  },
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [pendingPage, setPendingPage] = useState<string | null>(null);
  const [tutorialMode, setTutorialMode] = useState<'full' | 'page' | 'none'>('none');
  const [pageCompletionStatus, setPageCompletionStatus] = useState<PageTutorialStatus>({});

  const pagesWithSteps = React.useMemo(
    () => new Set(tutorialSteps.map((s) => s.page)),
    []
  );
  const availablePages = fullTourPageOrder.filter((p) => pagesWithSteps.has(p) && pageConfig[p]);

  const resolvePageFromPath = useCallback((pathname: string): string => {
    const exact = Object.entries(pageConfig).find(([, route]) => pathname === route);
    if (exact) return exact[0];

    const prefixMatches = Object.entries(pageConfig)
      .filter(([, route]) => route !== '/' && pathname.startsWith(`${route}/`))
      .sort((a, b) => b[1].length - a[1].length);

    if (prefixMatches.length) return prefixMatches[0][0];
    // Unknown routes (e.g. /help) — do not pretend this is the workspace tour
    return '';
  }, []);

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
    const page = resolvePageFromPath(location.pathname);

    if (pendingPage && page === pendingPage) {
      setPendingPage(null);
    }

    if (page !== currentPage) {
      // Avoid resetting to step 0 of the *old* page while navigate() is in flight —
      // pendingPage already holds the destination step index at 0.
      if (!pendingPage || page === pendingPage) {
        setCurrentStepIndex(0);
      }
    }

    setCurrentPage(page);
  }, [location.pathname, currentPage, resolvePageFromPath, pendingPage]);

  // Check if tutorial should be shown for new users
  useEffect(() => {
    if (user && !isCompleted && !isActive) {
      const hasSeenTutorial = localStorage.getItem('tutorial_completed');
      if (!hasSeenTutorial) {
        const timer = setTimeout(() => {
          const page = resolvePageFromPath(location.pathname);
          if (tutorialSteps.some((s) => s.page === page)) {
            setIsActive(true);
            setTutorialMode('page');
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isCompleted, isActive, location.pathname, resolvePageFromPath]);

  // Filter steps for current page (prefer pending destination during route transitions)
  const activePage = pendingPage || currentPage;
  const currentPageSteps = tutorialSteps
    .filter(step => step.page === activePage)
    .sort((a, b) => a.order - b.order);
  const currentStep = currentPageSteps[currentStepIndex] || null;
  const totalSteps = currentPageSteps.length;

  // Check if a page's tutorial has been completed
  const hasCompletedPage = useCallback((page: string) => {
    if (!page) return false;
    return pageCompletionStatus[page] === true;
  }, [pageCompletionStatus]);

  const hasPageTutorial = useCallback((page?: string) => {
    const target = page ?? activePage;
    return Boolean(target && pagesWithSteps.has(target) && pageConfig[target]);
  }, [activePage, pagesWithSteps]);

  // Navigate to a different page
  const goToPage = useCallback((page: string) => {
    const route = pageConfig[page];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  const getNextTourPage = useCallback((page: string) => {
    const idx = fullTourPageOrder.indexOf(page);
    const start = idx === -1 ? 0 : idx + 1;
    for (let i = start; i < fullTourPageOrder.length; i++) {
      const candidate = fullTourPageOrder[i];
      if (pagesWithSteps.has(candidate) && pageConfig[candidate]) return candidate;
    }
    return null;
  }, [pagesWithSteps]);

  const getPrevTourPage = useCallback((page: string) => {
    const idx = fullTourPageOrder.indexOf(page);
    if (idx <= 0) return null;
    for (let i = idx - 1; i >= 0; i--) {
      const candidate = fullTourPageOrder[i];
      if (pagesWithSteps.has(candidate) && pageConfig[candidate]) return candidate;
    }
    return null;
  }, [pagesWithSteps]);

  // Start full tutorial (all pages) — begins at workspace
  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
    setTutorialMode('full');
    const startPage = availablePages[0] || 'workspace';
    const startRoute = pageConfig[startPage] || '/unified';
    if (location.pathname !== startRoute) {
      navigate(startRoute);
    }
  }, [availablePages, location.pathname, navigate]);

  // Start tutorial for current page only
  const startPageTutorial = useCallback((page?: string) => {
    const targetPage = page || currentPage;
    if (!targetPage || !pagesWithSteps.has(targetPage) || !pageConfig[targetPage]) {
      return;
    }
    if (targetPage !== currentPage) {
      setPendingPage(targetPage);
      navigate(pageConfig[targetPage]);
    }
    setIsActive(true);
    setCurrentStepIndex(0);
    setTutorialMode('page');
  }, [currentPage, navigate, pagesWithSteps]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < currentPageSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (tutorialMode === 'full') {
      const newStatus = { ...pageCompletionStatus, [currentPage]: true };
      savePageStatus(newStatus);

      const nextPage = getNextTourPage(currentPage);
      if (nextPage) {
        setPendingPage(nextPage);
        setCurrentStepIndex(0);
        navigate(pageConfig[nextPage]);
      } else {
        setIsActive(false);
        setTutorialMode('none');
        setPendingPage(null);
        localStorage.setItem('tutorial_completed', 'true');
        setIsCompleted(true);

        const allComplete: PageTutorialStatus = {};
        availablePages.forEach(page => {
          allComplete[page] = true;
        });
        savePageStatus(allComplete);
      }
    } else {
      const newStatus = { ...pageCompletionStatus, [currentPage]: true };
      savePageStatus(newStatus);
      setIsActive(false);
      setTutorialMode('none');
    }
  }, [currentStepIndex, currentPageSteps, currentPage, tutorialMode, pageCompletionStatus, savePageStatus, navigate, availablePages, getNextTourPage]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (tutorialMode === 'full') {
      const prevPage = getPrevTourPage(currentPage);
      if (prevPage) {
        const prevPageSteps = tutorialSteps.filter(step => step.page === prevPage);
        setPendingPage(prevPage);
        setCurrentStepIndex(Math.max(0, prevPageSteps.length - 1));
        navigate(pageConfig[prevPage]);
      }
    }
  }, [currentStepIndex, currentPage, tutorialMode, navigate, getPrevTourPage]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setTutorialMode('none');
    setPendingPage(null);
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
    currentPage: activePage,
    setCurrentPage,
    hasCompletedPage,
    hasPageTutorial,
    tutorialMode,
    availablePages,
    goToPage,
    isPageTransitioning: pendingPage !== null,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
