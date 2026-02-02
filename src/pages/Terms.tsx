import React from 'react';
import { Gavel, Scale, FileText, CheckCircle2, ShieldAlert, Zap, Globe, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-indigo-800 via-blue-900 to-gray-900 px-8 py-14 text-white relative overflow-hidden text-center sm:text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Gavel className="w-56 h-56" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-center sm:justify-start space-x-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Scale className="w-6 h-6 text-indigo-300" />
                            </div>
                            <span className="text-indigo-300 font-black tracking-widest uppercase text-xs">Arrotech Hub Agreements</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter">Terms of Service</h1>
                        <p className="text-indigo-100 text-lg max-w-2xl font-medium leading-relaxed">
                            Welcome to Arrotech Hub. These Terms of Service govern your use of our website and services. By accessing our platform, you agree to be bound by these rules.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 sm:p-12 space-y-12 font-medium">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">1. Acceptance of Terms</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Arrotech Solutions provides the Arrotech Hub platform to you subject to the following Terms of Service. We reserve the right to update these terms at any time without notice. Your continued use of the platform after changes are posted constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">2. User Conduct</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You agree to use Arrotech Hub only for lawful purposes. You are prohibited from:
                        </p>
                        <div className="grid gap-3">
                            {[
                                "Violating any international, federal, or state laws",
                                "Infringing upon or violating our intellectual property rights",
                                "Uploading viruses, malware, or any other malicious code",
                                "Interfering with the security features of the Hub",
                                "Automating the platform in a way that creates excessive server load"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                                    <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5 group-hover:text-indigo-600" />
                                    <span className="text-sm">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">3. Service Provision</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to maintain 99.9% uptime for Arrotech Hub. However, we do not guarantee uninterrupted access. Service may be suspended temporarily for maintenance or due to technical failures beyond our control. We reserve the right to modify or discontinue any feature of the platform at any time.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">4. Limitation of Liability</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed italic p-6 bg-gray-50 rounded-2xl border-l-4 border-indigo-600">
                            "Arrotech Hub and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service."
                        </p>
                    </section>

                    {/* Quick navigation to register */}
                    <div className="pt-8 border-t border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black mb-2 tracking-tight">Ready to start?</h3>
                                <p className="font-medium opacity-90">Experience the next generation of AI automation.</p>
                            </div>
                            <Link
                                to="/register"
                                className="bg-white text-indigo-700 px-8 py-4 rounded-full font-black uppercase text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                            >
                                Get Started Free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-gray-50 px-8 py-10 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest">
                            <Clock className="w-4 h-4" />
                            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex gap-4">
                            <Link to="/privacy" className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-tight">Privacy Policy</Link>
                            <Link to="/" className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-tight">Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
