import React from 'react';
import SEO from '../components/SEO';
import { Shield, Lock, Server, FileCheck } from 'lucide-react';

export default function Security() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="Security & Trust" 
        description="Learn how Arrotech Hub protects your data with enterprise-grade encryption, strict OAuth2 scopes, and continuous monitoring."
        url="/security"
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
            Security & Trust
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your workspace contains your most sensitive data. We don't take that lightly. Arrotech Hub is built on a foundation of zero-trust architecture and enterprise-grade encryption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Lock className="w-8 h-8 text-primary-500 mb-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Encryption</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your OAuth tokens and M-Pesa credentials are mathematically hashed and strictly isolated.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Shield className="w-8 h-8 text-green-500 mb-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">OAuth2 & Scopes</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We never store your Google, Microsoft, or Slack passwords. We use official OAuth2 flows and request the minimum necessary scopes to power your unified inbox and workflows.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <Server className="w-8 h-8 text-blue-500 mb-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Infrastructure</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our backend runs on isolated virtual private clouds (VPCs). Database access is strictly controlled, and all infrastructure changes go through peer-reviewed CI/CD pipelines.
            </p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <FileCheck className="w-8 h-8 text-orange-500 mb-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Compliance</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Arrotech Solutions adheres to global data protection regulations including GDPR. We provide tools for you to export or delete your workspace data at any time.
            </p>
          </div>
        </div>

        <div className="bg-primary-900 dark:bg-secondary-800 rounded-3xl p-8 md:p-12 text-center text-white border border-transparent dark:border-secondary-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Found a vulnerability?</h2>
          <p className="text-primary-100 mb-8 max-w-lg mx-auto">
            We operate a responsible disclosure program. If you believe you have found a security vulnerability in Arrotech Hub, please let us know immediately.
          </p>
          <a 
            href="mailto:security@arrotechsolutions.com"
            className="inline-flex px-6 py-3 rounded-xl bg-white text-primary-900 font-bold hover:bg-slate-100 transition-colors"
          >
            Report an Issue
          </a>
        </div>
      </div>
    </div>
  );
}
