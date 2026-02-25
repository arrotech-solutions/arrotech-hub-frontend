import React from 'react';
import SEO from '../components/SEO';

const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-transparent pt-24 pb-16 px-4 transition-colors">
            <SEO title="Terms of Service" description="Terms of Service for Arrotech Hub" url="/terms" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors p-8 md:p-12">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">Terms of Service</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 transition-colors">
                    Last Updated: {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">1. Acceptance of Terms</h2>
                        <p className="mb-4">
                            By accessing and using Arrotech Hub, you accept and agree to be bound by the terms and provision of this agreement. Use of our services constitutes your agreement to all such terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">2. Description of Service</h2>
                        <p className="mb-4">
                            Arrotech Hub provides users with access to a rich collection of resources, including various automation tools, unified inboxes, templates, and AI workflows. You understand and agree that the service is provided "AS-IS".
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">3. User Conduct</h2>
                        <p className="mb-4">
                            You agree to use the service only for lawful purposes. You are prohibited from any use of the service that would constitute a violation of any applicable law, regulation, or rule.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">4. Modifications to Service</h2>
                        <p className="mb-4">
                            Arrotech Hub reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Terms;
