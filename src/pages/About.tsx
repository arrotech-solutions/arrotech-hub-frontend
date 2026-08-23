import React from 'react';
import SEO from '../components/SEO';
import { Target, Heart, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="About Us" 
        description="Learn about Arrotech Solutions, the team behind Arrotech Hub, and our mission to unify modern work."
        url="/about"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
            Our Mission
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We are building the unified operating system for modern professionals. By bringing disjointed apps, messages, and payments into one seamless hub, we give you back your time and focus.
          </p>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-secondary-700 mb-16 transition-colors">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
            The Arrotech Story
          </h2>
          <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
            <p>
              Arrotech Solutions was founded in Nairobi, Kenya, with a simple observation: modern work is broken. Professionals spend more time switching between Slack, Gmail, Teams, Jira, and ClickUp than they do actually working. 
            </p>
            <p>
              Information is siloed, notifications are overwhelming, and context is constantly lost. For digital creators in emerging markets, the barrier is even higher—juggling content platforms while struggling with fragmented payment gateways.
            </p>
            <p>
              We built <strong>Arrotech Hub</strong> to solve this. It's not just another app; it's the app that aggregates all your other apps. From our AI-powered unified inbox that categorizes messages across all your channels, to our native M-Pesa integrations that help creators monetize effortlessly, we are committed to building technology that works the way you do.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Target className="w-10 h-10 text-primary-500 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Our Vision</h3>
            <p className="text-slate-600 dark:text-slate-400">
              A world where technology operates silently in the background, surfacing exactly what you need, when you need it, without the noise.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Heart className="w-10 h-10 text-red-500 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Creator First</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We empower African creators with the tools to monetize their audience globally while getting paid locally and instantly.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Shield className="w-10 h-10 text-green-500 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Uncompromising Privacy</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your data is yours. We employ enterprise-grade encryption and strict data segregation to ensure your integrations remain secure.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Globe className="w-10 h-10 text-blue-500 mb-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Built for the World</h3>
            <p className="text-slate-600 dark:text-slate-400">
              While our roots are in Kenya, our infrastructure and integrations are designed to support remote teams and creators globally.
            </p>
          </div>
        </div>

        <div className="text-center bg-primary-900 dark:bg-secondary-800 rounded-3xl p-10 md:p-16 border border-transparent dark:border-secondary-700">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to unify your workspace?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of professionals and creators who have taken back control of their time with Arrotech Hub.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-primary-900 bg-white hover:bg-slate-50 rounded-xl transition-all hover:scale-105 shadow-xl"
          >
            Get Started for Free
          </Link>
        </div>
      </div>
    </div>
  );
}
