export interface BlogPost {
    id?: number;
    slug: string;
    title: string;
    description: string;
    content: string;
    cover_image?: string;
    author: string;
    author_avatar?: string;
    date: string;
    readTime: string;
    tags: string[];
    category?: string;
    category_color?: string;
    is_featured?: boolean;
    views_count?: number;
    image?: string;
}

export const BLOG_CATEGORIES = [
    { name: 'All', slug: 'all', color: '#6B7280' },
    { name: 'Automation', slug: 'automation', color: '#7C3AED' },
    { name: 'Productivity', slug: 'productivity', color: '#2563EB' },
    { name: 'Product Updates', slug: 'product-updates', color: '#059669' },
    { name: 'Engineering', slug: 'engineering', color: '#DC2626' },
    { name: 'Business', slug: 'business', color: '#D97706' },
    { name: 'Industry Trends', slug: 'industry-trends', color: '#8B5CF6' },
];

// Seed blog posts for SEO
export const BLOG_POSTS: BlogPost[] = [
    {
        id: 1,
        slug: 'how-to-use-chatgpt-api-business-automation',
        title: 'How to use ChatGPT API for Business Automation in 2024',
        description: 'Learn how to integrate the ChatGPT API into your business workflows. Automate customer support, lead qualification, and content creation effortlessly.',
        content: `
# How to use ChatGPT API for Business Automation

The ChatGPT API has revolutionized how businesses operate. From automating routine customer service inquiries to generating bulk marketing content, the possibilities are endless.

## 1. Automating Customer Support
By connecting the ChatGPT API to your WhatsApp or Slack channels, you can instantly respond to customer queries 24/7. Arrotech Hub makes this seamless with built-in integrations.

## 2. Lead Qualification
Instead of having sales reps manually qualify leads, use an AI Sales Agent driven by ChatGPT to ask the right questions and route high-intent leads to your CRM (like HubSpot).

## 3. Dynamic Content Generation
Generate personalized emails, reports, and social media posts automatically.

Stop doing manual work. Start automating with Arrotech Hub today.
        `,
        cover_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
        author: 'Sarah Chen',
        date: 'October 15, 2023',
        readTime: '5 min read',
        tags: ['ChatGPT', 'AI API', 'Workflow Automation'],
        category: 'Automation',
        category_color: '#7C3AED',
        is_featured: true,
        views_count: 1240
    },
    {
        id: 2,
        slug: 'best-zapier-alternatives-built-in-ai',
        title: 'Top 5 Zapier Alternatives with Built-in AI Automation',
        description: 'Looking for a Zapier alternative? Discover the best platforms that offer advanced AI agents, cheaper pricing, and unified workspaces.',
        content: `
# Top 5 Zapier Alternatives with Built-in AI

Zapier has been the king of automation for a long time, but new AI-native platforms are taking over. If you need more than just simple 'If This Then That' logic, you need an AI-first workflow builder.

## 1. Arrotech Hub
Unlike Zapier, Arrotech Hub isn't just a middleware. It's a unified workspace that combines your Inbox, Calendar, and AI Agents. Plus, it supports native M-Pesa payments.

## 2. Make.com
A strong visual builder, but lacks the out-of-the-box AI marketing employees that Arrotech provides.

## 3. n8n
Great for technical users who want to self-host, but requires significant setup.

## 4. Gumloop
Excellent for building custom AI scripts, but less focused on daily operational workflows like unified inbox management.

Choose Arrotech Hub for the ultimate AI business automation experience.
        `,
        cover_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
        author: 'Michael Ochieng',
        date: 'October 10, 2023',
        readTime: '4 min read',
        tags: ['Zapier Alternative', 'Make.com', 'AI Tools'],
        category: 'Productivity',
        category_color: '#2563EB',
        is_featured: false,
        views_count: 890
    },
    {
        id: 3,
        slug: 'automate-lead-generation-ai-marketing',
        title: 'How to Automate Lead Generation with AI Marketing Employees',
        description: 'Stop cold calling. Learn how AI marketing agents can automatically capture, score, and route leads directly to your sales team.',
        content: `
# Automate Lead Generation with AI Marketing

Generating high-quality leads is the lifeblood of any business. But doing it manually is slow and expensive. Enter AI Marketing Employees.

## The Old Way
- Manual cold emails
- Slow form responses
- No lead scoring

## The New Way (with Arrotech Hub)
- **Instant WhatsApp Replies:** An AI agent answers queries immediately.
- **Automated CRM Sync:** Lead data is instantly pushed to HubSpot.
- **Slack Alerts:** Your sales team gets notified in Slack only when a lead is highly qualified.

Start building your AI marketing engine with Arrotech Hub today.
        `,
        cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
        author: 'David Kim',
        date: 'October 5, 2023',
        readTime: '6 min read',
        tags: ['Lead Generation', 'AI Marketing', 'HubSpot'],
        category: 'Business',
        category_color: '#D97706',
        is_featured: false,
        views_count: 560
    }
];
