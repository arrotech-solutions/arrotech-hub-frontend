import React from 'react';
import { Shield, Lock, FileText, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-8 py-12 text-white">
                    <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-8 h-8 text-blue-300" />
                        <span className="text-blue-300 font-bold tracking-wider uppercase text-sm">Legal</span>
                    </div>
                    <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
                    <p className="text-blue-100 text-lg max-w-2xl">
                        We are committed to protecting your personal data and ensuring transparency in how we handle it.
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <Globe className="w-6 h-6 mr-2 text-blue-600" />
                            1. Introduction
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Arrotech Hub ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website
                            (and use our applications) and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <Database className="w-6 h-6 mr-2 text-blue-600" />
                            2. The Data We Collect
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <Lock className="w-6 h-6 mr-2 text-blue-600" />
                            3. Your Legal Rights (GDPR & CCPA)
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-900 mb-2">Request Access</h3>
                                <p className="text-sm text-gray-600">Request a copy of the personal data we hold about you.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-900 mb-2">Request Correction</h3>
                                <p className="text-sm text-gray-600">Correct any incomplete or inaccurate data we hold about you.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-900 mb-2">Request Erasure</h3>
                                <p className="text-sm text-gray-600">Ask us to delete or remove personal data where there is no good reason for us continuing to process it.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold text-gray-900 mb-2">Data Portability</h3>
                                <p className="text-sm text-gray-600">Request the transfer of your personal data to you or to a third party.</p>
                            </div>
                        </div>
                        <p className="mt-4 text-gray-600 text-sm">
                            You can exercise these rights within your Account Settings or by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-6 h-6 mr-2 text-blue-600" />
                            4. Contact Us
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
                            <br />
                            <a href="mailto:privacy@arrotechsolutions.com" className="text-blue-600 font-semibold hover:underline">
                                privacy@arrotechsolutions.com
                            </a>
                        </p>
                    </section>
                </div>

                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Last Updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

// Helper component for icon
function Database(props: any) {
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
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    );
}
