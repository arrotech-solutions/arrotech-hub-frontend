import {
    Shield,
    Zap,
    Building2,
    Crown,
    Sparkles,
    Mail,
    Calendar,
    CheckSquare,
    Bot,
    Headphones,
    TrendingUp,
    Globe,
    LucideIcon,
    MessageCircle,
} from 'lucide-react';

export type BillingCycle = 'monthly' | 'yearly';

export interface WorkspacePlan {
    id: string;
    name: string;
    tagline: string;
    price: number | null;
    priceDisplay: string;
    description: string;
    icon: LucideIcon;
    gradient: string;
    borderColor: string;
    highlight: boolean;
    popular: boolean;
    whatsappLevel: string;
    isTrial?: boolean;
    trialDurationDays?: number;
    features: {
        included: string[];
        excluded: string[];
    };
}

/** Caps for the 7-day trial — full Business preview, bounded usage */
export const TRIAL_USAGE_CAPS = {
    durationDays: 7,
    aiActionsTotal: 75,
    automationRunsTotal: 50,
    activeWorkflows: 5,
    whatsappMessagesSent: 100,
    whatsappContacts: 100,
    broadcastCampaigns: 1,
    broadcastRecipientsMax: 25,
    integrationsPerCategory: 2,
    smartSchedulerUses: 10,
    teamSeats: 1,
};

export const TRIAL_GUARDRAILS = [
    'One trial per verified email — phone verification required for WhatsApp',
    'No credit card needed to start; upgrade anytime during or after trial',
    'Usage caps apply for the full 7 days (not monthly reset)',
    'After day 7, workspace becomes read-only until you pick a paid plan',
    'API access, multi-client mode, and bulk exports require a paid plan',
];

export interface WorkspaceComparisonRow {
    name: string;
    hint?: string;
    free: boolean | string;
    starter: boolean | string;
    business: boolean | string;
    pro: boolean | string;
}

export interface WorkspaceComparisonCategory {
    id: string;
    category: string;
    icon: LucideIcon;
    accent?: 'whatsapp';
    features: WorkspaceComparisonRow[];
}

export interface WhatsAppJourneyStep {
    planId: string;
    label: string;
    title: string;
    capabilities: string[];
}

export const WORKSPACE_PLANS: WorkspacePlan[] = [
    {
        id: 'free',
        name: '7-Day Trial',
        tagline: 'Full Business preview',
        price: 0,
        priceDisplay: '0',
        description:
            'Try Business-level tools — inbox, WhatsApp, AI, and workflows — with fair caps for 7 days.',
        icon: Shield,
        gradient: 'from-violet-500 to-indigo-600',
        borderColor: 'border-violet-200 dark:border-violet-800',
        highlight: false,
        popular: false,
        isTrial: true,
        trialDurationDays: 7,
        whatsappLevel: 'Trial access',
        features: {
            included: [
                'Business-level inbox, calendar & tasks',
                'Send & reply across connected channels',
                'AI Chat & AI-assisted replies',
                'Smart Scheduler (10 uses)',
                'WhatsApp connect, chat & auto-replies',
                '1 broadcast (up to 25 contacts)',
                '5 workflows + marketplace import',
                '75 AI actions · 50 automations (trial total)',
                '2 integrations per category',
                'No credit card required',
            ],
            excluded: [
                'API access & webhooks',
                'Multi-client / agency mode',
                'Unlimited contacts or broadcasts',
                'Bulk data export',
                'Continues after 7 days without upgrade',
            ],
        },
    },
    {
        id: 'starter',
        name: 'Starter',
        tagline: 'Unified Action',
        price: 1500,
        priceDisplay: '1,500',
        description: 'Send, reply, and take action across all your tools.',
        icon: Zap,
        gradient: 'from-blue-500 to-blue-600',
        borderColor: 'border-blue-200 dark:border-blue-800',
        highlight: false,
        popular: false,
        whatsappLevel: 'Connect & Chat',
        features: {
            included: [
                'Unified Inbox (Send & Reply)',
                'Unified Calendar (Create & Edit)',
                'Unified Tasks (Create & Update)',
                'Create tasks from messages',
                'AI Chat (Workspace context)',
                'AI Briefing (Daily & Weekly)',
                '2 email + 2 messaging providers',
                'Google Workspace + Zoho CRM',
                'Telegram integration',
                'Workflow Marketplace (Import)',
                '5 workflows',
                '500 AI actions/month',
                '2,000 automation runs/month',
            ],
            excluded: [
                'AI-assisted replies',
                'Smart Scheduler',
                'Social media management',
                'WhatsApp auto-replies & broadcasts',
            ],
        },
    },
    {
        id: 'business',
        name: 'Business',
        tagline: 'Unified Operations',
        price: 5000,
        priceDisplay: '5,000',
        description: 'Full AI power, social media, and smart automation for growing teams.',
        icon: Building2,
        gradient: 'from-indigo-500 to-purple-600',
        borderColor: 'border-indigo-300 dark:border-indigo-600',
        highlight: true,
        popular: true,
        whatsappLevel: 'Automate & Broadcast',
        features: {
            included: [
                'Everything in Starter, plus:',
                'AI-assisted email replies',
                'Smart Scheduler (AI)',
                'WhatsApp auto-replies & broadcasts',
                'TikTok Dashboard & content tools',
                'Facebook, Instagram, LinkedIn, X',
                'HubSpot, Salesforce CRM',
                'Zoom, Notion, QuickBooks, Xero',
                'Task analytics & progress tracking',
                'API access (5,000 req/day)',
                '3 team members',
                '30 workflows',
                '2,000 AI actions/month',
                'Priority support',
            ],
            excluded: [
                'Multi-client inbox management',
                'SLA tracking & alerts',
                'Advanced scheduling rules',
            ],
        },
    },
    {
        id: 'pro',
        name: 'Pro / Agency',
        tagline: 'Unified Command Center',
        price: 10000,
        priceDisplay: '10,000',
        description: 'Multi-client management, unlimited integrations, and dedicated support.',
        icon: Crown,
        gradient: 'from-purple-500 to-pink-600',
        borderColor: 'border-purple-200 dark:border-purple-800',
        highlight: false,
        popular: false,
        whatsappLevel: 'Scale & Multi-client',
        features: {
            included: [
                'Everything in Business, plus:',
                'Multi-client inbox management',
                'SLA tracking & alerts',
                'Advanced Smart Scheduler',
                'Cross-client calendar view',
                'Client-separated tasks & reports',
                'AI Chat (Power Mode)',
                'AI Briefing (Real-time)',
                'Unlimited integrations',
                'Unlimited workflows',
                'API access (50,000 req/day)',
                '10 team members',
                '5,000 AI actions/month',
                'Dedicated support',
            ],
            excluded: [],
        },
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'Custom Solution',
        price: null,
        priceDisplay: 'Custom',
        description: 'White-label, SSO, compliance, and dedicated infrastructure.',
        icon: Sparkles,
        gradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-200 dark:border-amber-800',
        highlight: false,
        popular: false,
        whatsappLevel: 'Custom deployment',
        features: {
            included: [
                'Everything in Pro, plus:',
                'Dedicated AI models',
                'White-labeling & SSO',
                'Compliance & audit logs',
                'Private deployments',
                'Custom integrations (2/year)',
                'Unlimited team members',
                'Dedicated account manager',
            ],
            excluded: [],
        },
    },
];

/** Visual progression — WhatsApp unlocks as you upgrade workspace plans */
export const WHATSAPP_JOURNEY: WhatsAppJourneyStep[] = [
    {
        planId: 'free',
        label: 'Trial',
        title: 'Try the full WhatsApp stack',
        capabilities: ['Connect & chat live', 'Auto-replies & AI replies', '1 test broadcast (25 contacts)'],
    },
    {
        planId: 'starter',
        label: 'Connect',
        title: 'Chat with customers live',
        capabilities: ['Send & reply on WhatsApp', 'Meta embedded signup', 'Up to 2,000 contacts'],
    },
    {
        planId: 'business',
        label: 'Automate',
        title: 'Let AI handle the volume',
        capabilities: ['Auto-replies & AI replies', 'Broadcast campaigns', 'Templates & analytics'],
    },
    {
        planId: 'pro',
        label: 'Scale',
        title: 'Run WhatsApp across clients',
        capabilities: ['Multi-client inboxes', 'Up to 5 API numbers', 'Unlimited contacts'],
    },
];

export const COMPARISON_CATEGORIES: WorkspaceComparisonCategory[] = [
    {
        id: 'inbox',
        category: 'Unified Inbox',
        icon: Mail,
        features: [
            { name: 'Read messages', free: true, starter: true, business: true, pro: true },
            { name: 'Send & reply', free: true, starter: true, business: true, pro: true },
            { name: 'Create tasks from messages', free: true, starter: true, business: true, pro: true },
            { name: 'AI-assisted replies', free: true, starter: false, business: true, pro: true },
            { name: 'Message triggers', free: 'Up to 3', starter: false, business: true, pro: true },
            { name: 'Multi-client inboxes', free: false, starter: false, business: false, pro: true },
            { name: 'SLA tracking & alerts', free: false, starter: false, business: false, pro: true },
        ],
    },
    {
        id: 'calendar',
        category: 'Unified Calendar',
        icon: Calendar,
        features: [
            { name: 'View events', free: true, starter: true, business: true, pro: true },
            { name: 'Create & edit events', free: true, starter: true, business: true, pro: true },
            { name: 'Smart Scheduler (AI)', free: '10 uses', starter: false, business: true, pro: 'Advanced' },
            { name: 'Conflict detection', free: true, starter: false, business: true, pro: true },
            { name: 'Auto follow-ups', free: true, starter: false, business: true, pro: true },
            { name: 'Advanced scheduling rules', free: false, starter: false, business: false, pro: true },
            { name: 'Cross-client calendar', free: false, starter: false, business: false, pro: true },
        ],
    },
    {
        id: 'tasks',
        category: 'Unified Tasks',
        icon: CheckSquare,
        features: [
            { name: 'View tasks', free: true, starter: true, business: true, pro: true },
            { name: 'Create & update tasks', free: true, starter: true, business: true, pro: true },
            { name: 'Multiple task tools', free: true, starter: false, business: true, pro: true },
            { name: 'Task analytics & progress', free: true, starter: false, business: true, pro: true },
            { name: 'Client-separated tasks', free: false, starter: false, business: false, pro: true },
            { name: 'Advanced reports', free: false, starter: false, business: false, pro: true },
        ],
    },
    {
        id: 'ai',
        category: 'AI & Automation',
        icon: Bot,
        features: [
            { name: 'AI Chat', free: 'Business preview', starter: 'Workspace', business: 'Advanced', pro: 'Power Mode' },
            { name: 'AI Briefing', free: 'Daily', starter: 'Daily/Weekly', business: 'Custom', pro: 'Real-time' },
            { name: 'Smart Scheduler', free: '10 uses', starter: false, business: true, pro: 'Advanced' },
            { name: 'Workflow Builder', free: '5 workflows', starter: '5 workflows', business: '30 workflows', pro: 'Unlimited' },
            { name: 'Workflow Marketplace', free: 'Import', starter: 'Import', business: 'Publish', pro: 'Full access' },
            { name: 'MCP Tools & Agent Hub', free: true, starter: 'Basic', business: true, pro: true },
        ],
    },
    {
        id: 'integrations',
        category: 'Integrations',
        icon: Globe,
        features: [
            { name: 'Gmail / Outlook', free: true, starter: true, business: true, pro: true },
            { name: 'Slack / Teams / Telegram', free: true, starter: true, business: true, pro: true },
            { name: 'WhatsApp Business API', free: true, starter: true, business: true, pro: true },
            { name: 'Jira / Trello / Asana / ClickUp', free: true, starter: true, business: true, pro: true },
            { name: 'Google Workspace / Zoho CRM', free: true, starter: true, business: true, pro: true },
            { name: 'HubSpot / Salesforce', free: false, starter: false, business: true, pro: true },
            { name: 'Facebook / Instagram / LinkedIn / X', free: '1 platform', starter: false, business: true, pro: true },
            { name: 'TikTok Dashboard', free: false, starter: false, business: true, pro: true },
            { name: 'Zoom / Notion', free: true, starter: false, business: true, pro: true },
            { name: 'QuickBooks / Xero', free: false, starter: false, business: true, pro: true },
        ],
    },
    {
        id: 'whatsapp',
        category: 'WhatsApp Business',
        icon: MessageCircle,
        accent: 'whatsapp',
        features: [
            { name: 'Connect WhatsApp Business API', hint: 'Link your business number via Meta', free: true, starter: true, business: true, pro: true },
            { name: 'Embedded signup (Meta SDK)', hint: 'Self-serve number verification', free: true, starter: true, business: true, pro: true },
            { name: 'WhatsApp Business API numbers', free: '1', starter: '1', business: '1', pro: 'Up to 5' },
            { name: 'View WhatsApp in unified inbox', free: true, starter: true, business: true, pro: true },
            { name: 'Send & reply on WhatsApp', free: '100 msgs', starter: true, business: true, pro: true },
            { name: 'Contact management & tags', free: true, starter: true, business: true, pro: true },
            { name: 'Shared team inbox', free: true, starter: false, business: true, pro: true },
            { name: 'Conversation tagging & routing', free: true, starter: false, business: true, pro: true },
            { name: 'Live agent handoff', free: true, starter: false, business: true, pro: true },
            { name: 'Multi-client WhatsApp inboxes', free: false, starter: false, business: false, pro: true },
            { name: 'Template management', hint: 'Pre-approved Meta message templates', free: true, starter: false, business: true, pro: true },
            { name: 'Session window messaging (24hr)', free: true, starter: true, business: true, pro: true },
            { name: 'Webhooks for inbound messages', free: false, starter: false, business: true, pro: true },
            { name: 'Auto-reply rules', free: 'Up to 3', starter: false, business: true, pro: true },
            { name: 'AI-powered WhatsApp replies', free: true, starter: false, business: true, pro: true },
            { name: 'Conversation context memory', free: true, starter: false, business: true, pro: true },
            { name: 'AI handoff to human agent', free: true, starter: false, business: true, pro: true },
            { name: 'Broadcast campaigns', free: '1 × 25 contacts', starter: false, business: true, pro: true },
            { name: 'Campaign scheduling', free: false, starter: false, business: true, pro: true },
            { name: 'Campaign analytics & delivery reports', free: true, starter: false, business: true, pro: true },
            { name: 'WhatsApp contact limit', free: '100', starter: '2,000', business: '10,000', pro: 'Unlimited' },
            { name: 'Team seats (WhatsApp inbox)', free: '1', starter: '1', business: '3', pro: '10' },
            { name: 'Additional WhatsApp numbers', free: '—', starter: 'Add-on', business: 'Add-on', pro: 'Included (5 max)' },
            { name: 'Meta conversation fees', hint: 'Pass-through billing per Meta rates', free: 'Pass-through', starter: 'Pass-through', business: 'Pass-through', pro: 'Pass-through' },
        ],
    },
    {
        id: 'limits',
        category: 'Limits & Support',
        icon: TrendingUp,
        features: [
            { name: 'Trial duration', free: '7 days', starter: '—', business: '—', pro: '—' },
            { name: 'AI actions', free: '75 total', starter: '500/mo', business: '2,000/mo', pro: '5,000/mo' },
            { name: 'Automation runs', free: '50 total', starter: '2,000/mo', business: '15,000/mo', pro: '50,000/mo' },
            { name: 'Active workflows', free: '5', starter: '5', business: '30', pro: 'Unlimited' },
            { name: 'Team members', free: '1', starter: '1', business: '3', pro: '10' },
            { name: 'Integrations per category', free: '2', starter: '2', business: '5', pro: 'Unlimited' },
            { name: 'API access', free: false, starter: false, business: '5K req/day', pro: '50K req/day' },
            { name: 'Bulk export & webhooks', free: false, starter: false, business: true, pro: true },
            { name: 'Organization management', free: false, starter: false, business: true, pro: true },
            { name: 'Security (2FA / Passkeys)', free: true, starter: true, business: true, pro: true },
            { name: 'Support level', free: 'Email', starter: 'Email', business: 'Priority', pro: 'Dedicated' },
        ],
    },
];

export const COMPARISON_LENSES = [
    { id: 'all', label: 'Everything', icon: Sparkles },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'ai', label: 'AI & Workflows', icon: Bot },
    { id: 'integrations', label: 'Integrations', icon: Globe },
] as const;

export type ComparisonLens = (typeof COMPARISON_LENSES)[number]['id'];

export const LENS_CATEGORY_MAP: Record<ComparisonLens, string[]> = {
    all: COMPARISON_CATEGORIES.map((c) => c.id),
    whatsapp: ['whatsapp'],
    ai: ['ai', 'inbox'],
    integrations: ['integrations', 'whatsapp'],
};

export const PRICING_FAQS = [
    {
        question: 'How does the 7-day free trial work?',
        answer: 'You get a full Business preview for 7 days — send messages, use WhatsApp AI, run workflows, and more. Fair usage caps apply for the whole trial (not monthly). No credit card required. After 7 days, pick a paid plan or your workspace becomes read-only.',
    },
    {
        question: 'Why are there limits during the trial?',
        answer: 'The trial is designed so you can genuinely evaluate the product — not run production at scale for free. Caps on AI actions, messages, broadcasts, and contacts keep things fair while still letting you feel the full experience.',
    },
    {
        question: 'Can I start another trial with a different email?',
        answer: 'No. One trial per verified email, and WhatsApp requires phone verification. This prevents abuse while keeping signup friction low for real businesses.',
    },
    {
        question: 'How does M-Pesa payment work after the trial?',
        answer: 'We use Paystack for secure M-Pesa STK Push. Select a plan before or after your trial ends, approve on your phone, and your limits expand immediately.',
    },
    {
        question: 'What WhatsApp features are included in the trial?',
        answer: 'Connect your number, chat live (100 messages), set up to 3 auto-replies, use AI replies, manage 100 contacts, and send one test broadcast to up to 25 people. Full broadcasts and scale unlock on Business.',
    },
    {
        question: 'What happens when I hit a trial limit?',
        answer: 'We warn you at 80% usage. When a cap is reached, that feature pauses until you upgrade — your data stays intact. Upgrade anytime to remove limits.',
    },
    {
        question: 'Can I cancel my subscription at any time?',
        answer: 'Yes. Cancel from account settings anytime — access continues until the end of your billing period.',
    },
];

export const PLAN_COLUMN_KEYS = ['free', 'starter', 'business', 'pro'] as const;
export type PlanColumnKey = (typeof PLAN_COLUMN_KEYS)[number];

export const PLAN_COLUMN_LABELS: Record<PlanColumnKey, string> = {
    free: '7-Day Trial',
    starter: 'Starter',
    business: 'Business',
    pro: 'Pro',
};
