import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { BookOpen, Terminal, Zap, Puzzle, MessageSquare, CreditCard, ArrowRight } from 'lucide-react';

const docCategories = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of setting up Arrotech Hub, connecting your first app, and navigating the unified workspace.',
    icon: BookOpen,
    link: '#',
  },
  {
    title: 'API Reference',
    description: 'Detailed documentation for the Arrotech Hub REST and WebSocket APIs. Build custom integrations and webhooks.',
    icon: Terminal,
    link: '#',
  },
  {
    title: 'Workflow Automation',
    description: 'Master the drag-and-drop workflow builder. Learn about triggers, actions, conditions, and AI processing nodes.',
    icon: Zap,
    link: '#',
  },
  {
    title: 'App Integrations',
    description: 'Specific setup guides for Gmail, Slack, Microsoft Teams, Outlook, Jira, ClickUp, and more.',
    icon: Puzzle,
    link: '#',
  },
  {
    title: 'Unified Inbox',
    description: 'Configure channel syncing, thread management, and AI-powered categorization for your central communication hub.',
    icon: MessageSquare,
    link: '#',
  },
  {
    title: 'Monetization & M-Pesa',
    description: 'Set up your TikTok Premium Links, manage digital products, and configure automated M-Pesa withdrawals.',
    icon: CreditCard,
    link: '#',
  }
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="Documentation" 
        description="Learn how to use Arrotech Hub. Read guides on integrations, workflows, the API, and monetization tools."
        url="/docs"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
            Documentation
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to build, automate, and manage your unified workspace with Arrotech Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docCategories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <Link 
                key={idx}
                to={category.link}
                className="group bg-white dark:bg-secondary-800 rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-200 dark:border-secondary-700 transition-all flex flex-col h-full"
              >
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow mb-6 leading-relaxed">
                  {category.description}
                </p>
                <div className="flex items-center text-primary-600 dark:text-primary-400 font-bold text-sm mt-auto group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  Read docs <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
