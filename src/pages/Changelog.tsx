import React from 'react';
import SEO from '../components/SEO';
import { Rocket, Zap, Bug, Shield } from 'lucide-react';

const releases = [
  {
    version: 'v2.1.0',
    date: 'August 15, 2026',
    title: 'M-Pesa Integration & TikTok Monetization',
    description: 'We are thrilled to introduce native M-Pesa integration, allowing creators to monetize their TikTok and social content seamlessly within Arrotech Hub.',
    changes: [
      { type: 'feature', icon: Rocket, text: 'Added M-Pesa automated withdrawals and payment processing.' },
      { type: 'feature', icon: Zap, text: 'Launched TikTok Premium Link generation for exclusive content.' },
      { type: 'improvement', icon: Shield, text: 'Enhanced OAuth2 security flow for Microsoft and Google integrations.' }
    ]
  },
  {
    version: 'v2.0.0',
    date: 'July 28, 2026',
    title: 'The Unified Workspace Update',
    description: 'The biggest update to Arrotech Hub yet. We have completely overhauled the architecture to bring your inbox, tasks, and calendar into a single, unified view.',
    changes: [
      { type: 'feature', icon: Rocket, text: 'Unified Inbox: Connect Gmail, Outlook, Slack, and Teams in one place.' },
      { type: 'feature', icon: Rocket, text: 'Unified Task View: Syncs bidirectionally with Jira, ClickUp, Trello, and Asana.' },
      { type: 'feature', icon: Zap, text: 'Real-time WebSocket support for instant messaging and notifications.' },
      { type: 'bugfix', icon: Bug, text: 'Fixed an issue where deeply nested workflow triggers would occasionally timeout.' }
    ]
  },
  {
    version: 'v1.5.0',
    date: 'June 10, 2026',
    title: 'Advanced AI & Workflow Automation',
    description: 'Brought powerful AI capabilities directly into your workflows to automate data extraction and categorization.',
    changes: [
      { type: 'feature', icon: Rocket, text: 'Added AI Node to Workflow Builder for text summarization.' },
      { type: 'improvement', icon: Zap, text: 'Optimized workflow execution engine to handle 10x higher concurrency.' },
      { type: 'bugfix', icon: Bug, text: 'Resolved UI glitch in the drag-and-drop workflow canvas on Safari.' }
    ]
  }
];

export default function Changelog() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="Changelog" 
        description="See what's new in Arrotech Hub. Explore recent product updates, new features, and bug fixes."
        url="/changelog"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
            Changelog
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            New updates and improvements to Arrotech Hub.
          </p>
        </div>

        <div className="space-y-12">
          {releases.map((release, idx) => (
            <div key={idx} className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700 p-6 md:p-8 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {release.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-bold px-2.5 py-0.5 rounded-full">
                      {release.version}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {release.date}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                {release.description}
              </p>

              <div className="space-y-4">
                {release.changes.map((change, cIdx) => {
                  const Icon = change.icon;
                  const iconColor = 
                    change.type === 'feature' ? 'text-primary-500 dark:text-primary-400' :
                    change.type === 'bugfix' ? 'text-red-500 dark:text-red-400' :
                    change.type === 'improvement' ? 'text-green-500 dark:text-green-400' : 'text-slate-500';
                    
                  return (
                    <div key={cIdx} className="flex items-start gap-3">
                      <div className={`mt-0.5 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {change.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
