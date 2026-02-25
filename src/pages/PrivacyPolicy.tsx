import React from 'react';
import SEO from '../components/SEO';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-transparent pt-24 pb-16 px-4 transition-colors">
            <SEO title="Privacy Policy" description="Privacy Policy for Arrotech Hub" url="/privacy" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors p-8 md:p-12">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">Privacy Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 transition-colors">
                    Last Updated: {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">1. Information We Collect</h2>
                        <p className="mb-4">
                            We collect information to provide better services to all our users. This includes basic information like your email address and name, as well as more complex information like which features you use most often.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">2. How We Use Information</h2>
                        <p className="mb-4">
                            We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Arrotech Hub and our users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">3. Information Sharing</h2>
                        <p className="mb-4">
                            We do not share personal information with companies, organizations, and individuals outside of Arrotech Hub unless one of the following circumstances applies: with your consent, for external processing, or for legal reasons.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">4. Data Security</h2>
                        <p className="mb-4">
                            We work hard to protect Arrotech Hub and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use encryption to keep your data private while in transit.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
