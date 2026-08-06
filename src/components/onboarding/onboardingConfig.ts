import {
  Inbox,
  Bot,
  Sparkles,
  Workflow,
  Share2,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import type { OnboardingPrimaryGoal } from '../../types';

export interface OnboardingGoalOption {
  id: OnboardingPrimaryGoal;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

export const ONBOARDING_GOALS: OnboardingGoalOption[] = [
  {
    id: 'unified_productivity',
    title: 'Unify my work',
    description: 'Inbox, tasks, and calendar across the tools you already use',
    icon: Inbox,
    accent: 'from-primary-500 to-primary-600',
  },
  {
    id: 'messaging_agents',
    title: 'Messaging agents',
    description: 'WhatsApp & Telegram ordering, support, and auto-replies',
    icon: Bot,
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'ask_ai',
    title: 'Ask AI copilot',
    description: 'Chat with your email, calendar, CRM, and connected apps',
    icon: Sparkles,
    accent: 'from-violet-500 to-primary-500',
  },
  {
    id: 'automations',
    title: 'Automate workflows',
    description: 'Build and run zero-code automations across your stack',
    icon: Workflow,
    accent: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'social_content',
    title: 'Social & content',
    description: 'Connect Instagram, Facebook, LinkedIn, X, and TikTok',
    icon: Share2,
    accent: 'from-rose-500 to-orange-500',
  },
  {
    id: 'exploring',
    title: 'Just exploring',
    description: 'A light tour — pick a direction anytime later',
    icon: Compass,
    accent: 'from-secondary-500 to-secondary-700',
  },
];

export interface RecommendedApp {
  id: string;
  name: string;
  hint: string;
}

export const GOAL_RECOMMENDED_APPS: Record<OnboardingPrimaryGoal, RecommendedApp[]> = {
  unified_productivity: [
    { id: 'google_workspace', name: 'Google Workspace', hint: 'Gmail, Calendar, Drive' },
    { id: 'outlook', name: 'Microsoft Outlook', hint: 'Email & calendar' },
    { id: 'slack', name: 'Slack', hint: 'Team messages in one inbox' },
    { id: 'teams', name: 'Microsoft Teams', hint: 'Channels & chats' },
  ],
  messaging_agents: [
    { id: 'whatsapp', name: 'WhatsApp Business', hint: 'Ordering & support agents' },
    { id: 'telegram', name: 'Telegram', hint: 'Bot ordering & replies' },
  ],
  ask_ai: [
    { id: 'google_workspace', name: 'Google Workspace', hint: 'Best starting point for Ask AI' },
    { id: 'outlook', name: 'Microsoft Outlook', hint: 'Email & calendar context' },
  ],
  automations: [
    { id: 'google_workspace', name: 'Google Workspace', hint: 'Sheets, Gmail, Drive steps' },
    { id: 'slack', name: 'Slack', hint: 'Notify & trigger workflows' },
    { id: 'hubspot', name: 'HubSpot', hint: 'CRM automation' },
  ],
  social_content: [
    { id: 'instagram', name: 'Instagram', hint: 'Business profile & content' },
    { id: 'facebook', name: 'Facebook Pages', hint: 'Page posts & insights' },
    { id: 'tiktok', name: 'TikTok', hint: 'Content scheduler workspace' },
    { id: 'linkedin', name: 'LinkedIn', hint: 'Professional network' },
  ],
  exploring: [
    { id: 'google_workspace', name: 'Google Workspace', hint: 'Connect one app to see Hub in action' },
  ],
};

export const GOAL_LANDING: Record<OnboardingPrimaryGoal, string> = {
  unified_productivity: '/unified/inbox',
  messaging_agents: '/agents?tab=deploy',
  ask_ai: '/chat',
  automations: '/workflows',
  social_content: '/connections',
  exploring: '/unified',
};

export const GOAL_FIRST_WIN: Record<
  OnboardingPrimaryGoal,
  { title: string; description: string; cta: string; activation: string }
> = {
  unified_productivity: {
    title: 'Open your unified inbox',
    description: 'See messages from Gmail, Outlook, Slack, Teams, and WhatsApp in one place.',
    cta: 'Go to Inbox',
    activation: 'first_inbox_open',
  },
  messaging_agents: {
    title: 'Deploy a messaging agent',
    description: 'Start from a WhatsApp or Telegram template for ordering or support.',
    cta: 'Open Agents',
    activation: 'agent_hub_open',
  },
  ask_ai: {
    title: 'Ask AI something useful',
    description: 'Try “Summarize my unread email” once Google or Outlook is connected.',
    cta: 'Open Ask AI',
    activation: 'ask_ai_open',
  },
  automations: {
    title: 'Browse automation templates',
    description: 'Pick a template and connect the apps it needs — no code required.',
    cta: 'Open Automations',
    activation: 'workflows_open',
  },
  social_content: {
    title: 'Connect a social channel',
    description: 'Link Instagram, Facebook, TikTok, or LinkedIn to manage content from Hub.',
    cta: 'Open Connections',
    activation: 'social_connections_open',
  },
  exploring: {
    title: 'Explore your workspace',
    description: 'Hub unifies work, agents, and AI. Start from the overview and follow the checklist.',
    cta: 'Go to Workspace',
    activation: 'explore_workspace',
  },
};

export const ONBOARDING_RESUME_KEY = 'hub_onboarding_resume_step';
export const ONBOARDING_VERSION = 1;

export const CHECKLIST_BY_GOAL: Record<
  OnboardingPrimaryGoal,
  { id: string; label: string; href: string }[]
> = {
  unified_productivity: [
    { id: 'connect_mail', label: 'Connect Gmail or Outlook', href: '/connections' },
    { id: 'open_inbox', label: 'Open Unified Inbox', href: '/unified/inbox' },
    { id: 'open_tasks', label: 'Check Unified Tasks', href: '/unified/tasks' },
    { id: 'open_calendar', label: 'Open Unified Calendar', href: '/unified/calendar' },
  ],
  messaging_agents: [
    { id: 'connect_wa', label: 'Connect WhatsApp or Telegram', href: '/connections' },
    { id: 'create_agent', label: 'Deploy an agent from a template', href: '/agents?tab=deploy' },
    { id: 'wa_workspace', label: 'Explore WhatsApp workspace', href: '/whatsapp' },
  ],
  ask_ai: [
    { id: 'connect_ctx', label: 'Connect Google Workspace or Outlook', href: '/connections' },
    { id: 'ask_prompt', label: 'Send your first Ask AI prompt', href: '/chat' },
  ],
  automations: [
    { id: 'browse_templates', label: 'Browse automation templates', href: '/workflows' },
    { id: 'connect_apps', label: 'Connect apps your automation needs', href: '/connections' },
  ],
  social_content: [
    { id: 'connect_social', label: 'Connect a social account', href: '/connections' },
    { id: 'tiktok_ws', label: 'Open TikTok workspace', href: '/tiktok' },
  ],
  exploring: [
    { id: 'connect_one', label: 'Connect your first app', href: '/connections' },
    { id: 'try_ai', label: 'Try Ask AI', href: '/chat' },
    { id: 'see_inbox', label: 'Peek at Unified Inbox', href: '/unified/inbox' },
  ],
};
