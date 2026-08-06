import {
  CreditCard, ShoppingBag, FileText, Truck, Users,
  Leaf, Activity, Settings, Globe, Palette, Shield,
  BarChart3, Zap, Droplets, Bot, MessageCircle, Map as MapIcon, Code2,
  Briefcase, Calendar, Mail, Database, Megaphone, CheckSquare,
} from 'lucide-react';

export type CategoryConfig = {
  icon: any;
  color: string;
};

/**
 * Stable display order for the canvas library (most-used builder categories first).
 * Only categories that have tools are shown.
 */
export const CATEGORY_DISPLAY_ORDER: string[] = [
  'Logic',
  'Communication',
  'AI & LLM',
  'Agents',
  'Google Workspace',
  'Knowledge Base',
  'Slack',
  'CRM',
  'Productivity',
  'Fintech',
  'Accounting',
  'E-commerce',
  'Analytics',
  'Maps',
  'Coding',
  'Social',
  'Logistics',
  'Human Resources',
  'Agritech',
  'Healthtech',
  'Utilities',
  'File Management',
  'Web Tools',
  'Content Creation',
  'Marketing',
  'Email',
  'Meetings',
  'Advanced',
  'Enterprise',
  'System',
  'General',
];

export const TOOL_CATEGORIES: Record<string, CategoryConfig> = {
  Logic: { icon: Zap, color: 'amber' },
  Communication: { icon: MessageCircle, color: 'green' },
  'AI & LLM': { icon: Bot, color: 'fuchsia' },
  Agents: { icon: Bot, color: 'fuchsia' },
  'Google Workspace': { icon: Calendar, color: 'sky' },
  'Knowledge Base': { icon: Database, color: 'violet' },
  Slack: { icon: Users, color: 'violet' },
  CRM: { icon: Briefcase, color: 'orange' },
  Productivity: { icon: CheckSquare, color: 'indigo' },
  Fintech: { icon: CreditCard, color: 'emerald' },
  Accounting: { icon: FileText, color: 'indigo' },
  'E-commerce': { icon: ShoppingBag, color: 'blue' },
  Analytics: { icon: BarChart3, color: 'blue' },
  Maps: { icon: MapIcon, color: 'cyan' },
  Coding: { icon: Code2, color: 'slate' },
  Social: { icon: Megaphone, color: 'pink' },
  Logistics: { icon: Truck, color: 'amber' },
  'Human Resources': { icon: Users, color: 'rose' },
  Agritech: { icon: Leaf, color: 'green' },
  Healthtech: { icon: Activity, color: 'red' },
  Utilities: { icon: Droplets, color: 'cyan' },
  'File Management': { icon: FileText, color: 'violet' },
  'Web Tools': { icon: Globe, color: 'orange' },
  'Content Creation': { icon: Palette, color: 'pink' },
  Marketing: { icon: Megaphone, color: 'orange' },
  Email: { icon: Mail, color: 'sky' },
  Meetings: { icon: Users, color: 'blue' },
  Advanced: { icon: Zap, color: 'indigo' },
  Enterprise: { icon: Shield, color: 'red' },
  System: { icon: Settings, color: 'slate' },
  General: { icon: Settings, color: 'slate' },
  Trigger: { icon: Zap, color: 'violet' },
};

type MatchRule = {
  category: string;
  /** Return true when this tool belongs in the category. Evaluated in order. */
  test: (n: string) => boolean;
};

/**
 * Prefix-first, most-specific-first rules.
 * Never use bare `includes('ai_')` / `includes('agent')` early — those steal Slack/WhatsApp tools.
 */
const NAME_RULES: MatchRule[] = [
  { category: 'Logic', test: (n) => n === 'condition_router' || n.startsWith('condition_') || n === 'condition' || n.startsWith('if_') },

  { category: 'Slack', test: (n) => n.startsWith('slack_') },
  { category: 'Communication', test: (n) =>
    n.startsWith('whatsapp_') || n.startsWith('telegram_') || n.startsWith('instagram_') || n.startsWith('teams_') },
  { category: 'Google Workspace', test: (n) =>
    n.startsWith('google_workspace_') || n.startsWith('google_') },
  { category: 'CRM', test: (n) =>
    n.startsWith('hubspot_') || n.startsWith('salesforce_') || n.startsWith('zoho_crm') || n.startsWith('pipedrive_') },
  { category: 'Accounting', test: (n) =>
    n.startsWith('quickbooks_') || n.startsWith('xero_') || n.startsWith('kra_') || n.startsWith('itax')
    || n.startsWith('zoho_books') || n.startsWith('lipabiz') || n.startsWith('sasapay') },
  { category: 'Fintech', test: (n) =>
    n.startsWith('mpesa_') || n.startsWith('payment_') || n.startsWith('paystack_') || n.startsWith('flutterwave_')
    || n.startsWith('airtel_') || n.startsWith('t_kash') || n.startsWith('equity_jenga') || n.startsWith('kopo_kopo')
    || n.startsWith('cellulant_') || n.startsWith('pesapal_') || n.startsWith('ipay_') || n.startsWith('little_pay')
    || n.includes('mpesa') },
  { category: 'Knowledge Base', test: (n) =>
    n.startsWith('rag_') || n.startsWith('pinecone_') || n.startsWith('qdrant_') || n.startsWith('weaviate_')
    || n.startsWith('llamaparse_') || n.startsWith('unstructured_') || n.startsWith('firecrawl_') || n.startsWith('context_') },
  { category: 'AI & LLM', test: (n) =>
    n.startsWith('ai_') || n === 'conversational_agent' || n.startsWith('conversational_') },
  { category: 'Agents', test: (n) =>
    (n.endsWith('_agent') || n.includes('_agent_')) && !n.startsWith('coding_') && !n.startsWith('ai_') },
  { category: 'Analytics', test: (n) =>
    n.startsWith('ga4_') || n.startsWith('powerbi_') || n.startsWith('analytics_') },
  { category: 'Productivity', test: (n) =>
    n.startsWith('asana_') || n.startsWith('notion_') || n.startsWith('jira_') || n.startsWith('trello_')
    || n.startsWith('clickup_') || n.startsWith('airtable_') || n.startsWith('monday_') },
  { category: 'Meetings', test: (n) => n.startsWith('zoom_') || n.startsWith('meet_') },
  { category: 'Email', test: (n) =>
    n.startsWith('outlook_') || n.startsWith('email_') || n.startsWith('zoho_mail') || n.startsWith('zoho_desk') },
  { category: 'Social', test: (n) =>
    n.startsWith('linkedin_') || n.startsWith('facebook_') || n.startsWith('twitter_') || n.startsWith('tiktok_')
    || n.startsWith('social_') },
  { category: 'Maps', test: (n) => n.startsWith('maps.') || n.startsWith('maps_') || n.startsWith('geocode') },
  { category: 'Coding', test: (n) => n.startsWith('coding_') || n === 'execute_python_code' || n.startsWith('github_') },
  { category: 'Logistics', test: (n) =>
    n.startsWith('logistics_') || n.startsWith('amitruck') || n.startsWith('lori') || n.startsWith('sendy')
    || n.startsWith('busybee') || n.startsWith('fargo') || n.startsWith('g4s') },
  { category: 'Human Resources', test: (n) =>
    n.startsWith('hr_') || n.startsWith('workpay') || n.startsWith('seamlesshr') || n.startsWith('bamboo')
    || n.startsWith('placeholder_hr') },
  { category: 'E-commerce', test: (n) =>
    n.startsWith('ecommerce_') || n.startsWith('jumia') || n.startsWith('kilimall') || n.startsWith('jiji')
    || n.startsWith('order_') || n.startsWith('inventory_') },
  { category: 'Agritech', test: (n) =>
    n.startsWith('agri') || n.includes('shamba') || n.includes('digifarm') || n.includes('farmdrive') || n.includes('iprocure') },
  { category: 'Healthtech', test: (n) =>
    n.startsWith('health') || n.includes('mydawa') || n.includes('penda') || n.includes('ilara') || n.includes('tibu') },
  { category: 'Utilities', test: (n) =>
    n.startsWith('utility') || n.includes('kenya_power') || n.includes('nairobi_water') || n.includes('safaricom_biz') || n.includes('zuku') },
  { category: 'File Management', test: (n) => n.startsWith('file_') },
  { category: 'Web Tools', test: (n) => n.startsWith('web_') },
  { category: 'Content Creation', test: (n) => n.startsWith('content_') },
  { category: 'Marketing', test: (n) =>
    n.startsWith('marketing_') || n.startsWith('campaign_') || n.startsWith('lead_') || n.startsWith('ab_') },
  { category: 'Advanced', test: (n) => n.startsWith('advanced_') || n.startsWith('workflow_') || n.startsWith('predictive_') },
  { category: 'Enterprise', test: (n) =>
    n.startsWith('enterprise_') || n.startsWith('white_label') || n.startsWith('multi_tenant') || n.startsWith('api_management')
    || n.startsWith('real_estate') || n.startsWith('rent_') },
  { category: 'System', test: (n) =>
    n === 'search_tools' || n === 'get_tool_schema' || n === 'list_tool_categories' || n.startsWith('placeholder_') },
  { category: 'Productivity', test: (n) => n.startsWith('zoho_') },
];

const BACKEND_CATEGORY_MAP: Record<string, string> = {
  ai: 'AI & LLM',
  llm: 'AI & LLM',
  agents: 'Agents',
  agent: 'Agents',
  coding_agent: 'Coding',
  coding: 'Coding',
  planning: 'Coding',
  maps: 'Maps',
  communication: 'Communication',
  messaging: 'Communication',
  payments: 'Fintech',
  fintech: 'Fintech',
  commerce: 'E-commerce',
  ecommerce: 'E-commerce',
  marketing: 'Marketing',
  crm: 'CRM',
  sales: 'CRM',
  analytics: 'Analytics',
  knowledge_base: 'Knowledge Base',
  knowledge: 'Knowledge Base',
  rag: 'Knowledge Base',
  file_management: 'File Management',
  web_tools: 'Web Tools',
  content_creation: 'Content Creation',
  advanced: 'Advanced',
  enterprise: 'Enterprise',
  system: 'System',
  email: 'Email',
  real_estate: 'Enterprise',
  localization: 'Utilities',
  hr: 'Human Resources',
  logistics: 'Logistics',
  accounting: 'Accounting',
  productivity: 'Productivity',
  social: 'Social',
  google: 'Google Workspace',
  slack: 'Slack',
  general: 'General',
};

export function getToolCategory(toolName: string, backendCategory?: string | null): string {
  const n = (toolName || '').toLowerCase().trim();
  if (!n) return 'General';

  for (const rule of NAME_RULES) {
    if (rule.test(n)) return rule.category;
  }

  if (backendCategory) {
    const key = backendCategory.toLowerCase().trim().replace(/\s+/g, '_');
    if (BACKEND_CATEGORY_MAP[key]) return BACKEND_CATEGORY_MAP[key];
    const titled = backendCategory
      .split(/[_\s]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (TOOL_CATEGORIES[titled]) return titled;
  }

  return 'General';
}

export function sortCategories(categories: string[]): string[] {
  const rank = new Map(CATEGORY_DISPLAY_ORDER.map((c, i) => [c, i]));
  return [...categories].sort((a, b) => {
    const ra = rank.get(a) ?? 900;
    const rb = rank.get(b) ?? 900;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

export const CATEGORY_TW: Record<string, { bg: string; border: string; text: string }> = {
  Fintech: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/25', text: 'text-emerald-700 dark:text-emerald-300' },
  'E-commerce': { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/25', text: 'text-sky-700 dark:text-sky-300' },
  Accounting: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/25', text: 'text-indigo-700 dark:text-indigo-300' },
  Logistics: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/25', text: 'text-amber-700 dark:text-amber-300' },
  'Human Resources': { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/25', text: 'text-rose-700 dark:text-rose-300' },
  Agritech: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/25', text: 'text-green-700 dark:text-green-300' },
  Healthtech: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/25', text: 'text-red-700 dark:text-red-300' },
  Utilities: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/25', text: 'text-cyan-700 dark:text-cyan-300' },
  'Knowledge Base': { bg: 'bg-secondary-50 dark:bg-secondary-500/15', border: 'border-secondary-200 dark:border-secondary-500/30', text: 'text-secondary-800 dark:text-secondary-200' },
  'AI & LLM': { bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-200 dark:border-primary-500/25', text: 'text-primary-700 dark:text-primary-300' },
  Agents: { bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-200 dark:border-primary-500/25', text: 'text-primary-700 dark:text-primary-300' },
  Slack: { bg: 'bg-secondary-50 dark:bg-secondary-500/15', border: 'border-secondary-200 dark:border-secondary-500/30', text: 'text-secondary-700 dark:text-secondary-200' },
  CRM: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/25', text: 'text-orange-700 dark:text-orange-300' },
  HubSpot: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/25', text: 'text-orange-700 dark:text-orange-300' },
  Analytics: { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/25', text: 'text-sky-700 dark:text-sky-300' },
  Communication: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/25', text: 'text-emerald-700 dark:text-emerald-300' },
  'Google Workspace': { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/25', text: 'text-sky-700 dark:text-sky-300' },
  Productivity: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/25', text: 'text-indigo-700 dark:text-indigo-300' },
  Maps: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/25', text: 'text-cyan-700 dark:text-cyan-300' },
  Coding: { bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-300' },
  Social: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/25', text: 'text-pink-700 dark:text-pink-300' },
  'File Management': { bg: 'bg-secondary-50 dark:bg-secondary-500/15', border: 'border-secondary-200 dark:border-secondary-500/30', text: 'text-secondary-700 dark:text-secondary-200' },
  'Web Tools': { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/25', text: 'text-orange-700 dark:text-orange-300' },
  'Content Creation': { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/25', text: 'text-pink-700 dark:text-pink-300' },
  Marketing: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/25', text: 'text-orange-700 dark:text-orange-300' },
  Email: { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/25', text: 'text-sky-700 dark:text-sky-300' },
  Meetings: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/25', text: 'text-blue-700 dark:text-blue-300' },
  Advanced: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/25', text: 'text-indigo-700 dark:text-indigo-300' },
  Enterprise: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/25', text: 'text-red-700 dark:text-red-300' },
  System: { bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300' },
  Logic: { bg: 'bg-accent-50 dark:bg-accent-500/10', border: 'border-accent-200 dark:border-accent-500/30', text: 'text-accent-800 dark:text-accent-300' },
  General: { bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300' },
  Trigger: { bg: 'bg-secondary-50 dark:bg-secondary-500/15', border: 'border-secondary-200 dark:border-secondary-500/30', text: 'text-secondary-800 dark:text-secondary-200' },
};

export const TOOLBAR_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  blue: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  sky: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  rose: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
  violet: 'bg-secondary-100 text-secondary-800 border-secondary-200 dark:bg-secondary-500/20 dark:text-secondary-200 dark:border-secondary-500/30',
  fuchsia: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-600',
  gray: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-600',
  purple: 'bg-secondary-100 text-secondary-800 border-secondary-200 dark:bg-secondary-500/20 dark:text-secondary-200 dark:border-secondary-500/30',
};

export function requiredPlatformForTool(toolName: string): string | null {
  const n = toolName.toLowerCase();
  if (n.includes('whatsapp')) return 'whatsapp';
  if (n.includes('telegram')) return 'telegram';
  if (n.includes('slack')) return 'slack';
  if (n.includes('instagram')) return 'instagram';
  if (n.includes('google') || n.includes('drive') || n.includes('sheets') || n.includes('gmail')) return 'google_workspace';
  if (n.includes('hubspot')) return 'hubspot';
  return null;
}

export function isAgentTool(toolName: string): boolean {
  const n = toolName.toLowerCase();
  return n === 'conversational_agent' || n.startsWith('conversational_') || (n.endsWith('_agent') && !n.startsWith('coding_'));
}

export function isMessagingSendTool(toolName: string): boolean {
  const n = toolName.toLowerCase();
  return n.includes('whatsapp_send') || n.includes('telegram_send') || n === 'whatsapp_send_message' || n === 'telegram_send_message';
}

export const CONDITION_TOOL = 'condition_router';
