import React from 'react';
import { Shield, Lock, FileText, Globe, Scale, BookOpen, Clock, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Privacy Policy"
                description="Read our Privacy Policy to understand how we collect, use, and protect your data at Arrotech Hub."
                url="/privacy"
                keywords={['Privacy Policy', 'Data Protection', 'GDPR', 'Arrotech Hub Privacy']}
            />
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 px-8 py-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Lock className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start space-x-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-blue-300" />
                            </div>
                            <span className="text-blue-300 font-black tracking-widest uppercase text-xs">Arrotech Hub Legal</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">Privacy Policy</h1>
                        <p className="text-blue-100 text-lg max-w-2xl font-medium leading-relaxed">
                            Your trust is our most valuable asset. We are committed to protecting your personal data and ensuring total transparency in how we handle your information.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 sm:p-12 space-y-12">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Globe className="w-6 h-6 text-blue-600" />
                            1. Introduction
                        </h2>
                        <div className="text-gray-600 leading-relaxed font-medium space-y-4">
                            <p>
                                At Arrotech Hub ("we", "our", or "us"), we operate as a unified platform for AI automation and tool integration. This Privacy Policy outlines how we collect, use, and safeguard your data when you interact with our platform, services, and applications.
                            </p>
                            <p>
                                By using Arrotech Hub, you agree to the practices described in this policy. We ensure that your data is processed in accordance with global data protection standards (GDPR, CCPA) and best security practices.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <Scale className="w-6 h-6 text-blue-600" />
                            2. Data Collection
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-6 mt-4">
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-black text-gray-900 mb-2 uppercase text-xs tracking-wider">Identity & Contact</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    When you create an account, we collect your name, email address, and any profile information provided via third-party providers (Google, Microsoft).
                                </p>
                            </div>
                            <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                <h3 className="font-black text-gray-900 mb-2 uppercase text-xs tracking-wider">Usage & Technical</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    We collect information on how you interact with our tools, your IP address, browser type, and device information to optimize your experience.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            3. Tool Integrations
                        </h2>
                        <p className="text-gray-600 leading-relaxed font-medium">
                            Arrotech Hub allows you to connect third-party applications (Slack, Gmail, etc.). When you connect these tools, we only access the data authorized by you during the OAuth process. We do not store your third-party credentials; we only store encrypted access tokens required to perform automations on your behalf.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                            4. Your Data Rights
                        </h2>
                        <ul className="grid gap-3 font-medium">
                            {[
                                "Right to access your personal data",
                                "Right to correct inaccurate information",
                                "Right to request deletion (Right to be forgotten)",
                                "Right to data portability",
                                "Right to withdraw consent at any time"
                            ].map((right, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    {right}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <FileText className="w-6 h-6 text-blue-600" />
                            5. Contact Information
                        </h2>
                        <div className="bg-gradient-to-r from-gray-900 to-indigo-900 p-8 rounded-2xl text-white">
                            <p className="font-medium mb-4 leading-relaxed">
                                Questions about our Privacy Policy? Our legal team is ready to assist you.
                            </p>
                            <a
                                href="mailto:privacy@arrotechsolutions.com"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-black text-sm transition-all"
                            >
                                <MailIcon className="w-4 h-4" />
                                privacy@arrotechsolutions.com
                            </a>
                        </div>
                    </section>
                </div>

                {/* Footer Section */}
                <div className="bg-gray-50 px-8 py-10 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
                            <Clock className="w-4 h-4" />
                            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex gap-4">
                            <Link to="/login" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-tight">Login</Link>
                            <Link to="/" className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-tight">Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function MailIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )
}

export default PrivacyPolicy;
