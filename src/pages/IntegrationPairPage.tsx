import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import SEO from '../components/SEO';

const INTEGRATIONS: Record<string, any> = {
    'gmail': { name: 'Gmail', color: 'from-red-500 to-red-600' },
    'slack': { name: 'Slack', color: 'from-purple-500 to-pink-500' },
    'mpesa': { name: 'M-Pesa', color: 'from-green-500 to-emerald-600' },
    'whatsapp': { name: 'WhatsApp', color: 'from-green-400 to-teal-500' },
    'trello': { name: 'Trello', color: 'from-blue-400 to-blue-600' },
    'jira': { name: 'Jira', color: 'from-blue-600 to-indigo-700' },
    'hubspot': { name: 'HubSpot', color: 'from-orange-400 to-orange-600' },
};

const getTitle = (app1: string, app2: string) => {
    return `Connect ${app1} to ${app2} using AI Automation | Arrotech Hub`;
};

const getDescription = (app1: string, app2: string) => {
    return `Easily integrate ${app1} and ${app2}. Automate your workflows, sync data, and manage everything from the Arrotech Hub unified workspace in minutes.`;
};

const IntegrationPairPage: React.FC = () => {
    const { pair } = useParams<{ pair: string }>();

    // Attempt to split the pair into two apps
    const apps = pair ? pair.split('-') : [];
    const app1Key = apps[0]?.toLowerCase();
    const app2Key = apps[1]?.toLowerCase();

    const app1 = app1Key ? INTEGRATIONS[app1Key] || { name: app1Key.charAt(0).toUpperCase() + app1Key.slice(1), color: 'from-gray-500 to-gray-700' } : null;
    const app2 = app2Key ? INTEGRATIONS[app2Key] || { name: app2Key.charAt(0).toUpperCase() + app2Key.slice(1), color: 'from-blue-500 to-blue-700' } : null;

    if (!app1 || !app2 || apps.length !== 2) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Integration Pair Not Found</h1>
                    <Link to="/unified" className="text-blue-600 hover:underline">View All Integrations</Link>
                </div>
            </div>
        );
    }

    const title = getTitle(app1.name, app2.name);
    const description = getDescription(app1.name, app2.name);

    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title={title}
                description={description}
                url={`/connect/${pair}`}
                keywords={[`${app1.name} ${app2.name} Integration`, `Connect ${app1.name} and ${app2.name}`, `${app1.name} ${app2.name} Automation`, 'Arrotech Hub']}
            />

            {/* Hero */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -z-10"></div>

                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="flex items-center justify-center gap-6 mb-8">
                        <div className="inline-block p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
                            <div className={`w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${app1.color} text-white font-black text-2xl shadow-inner`}>
                                {app1.name[0]}
                            </div>
                        </div>

                        <ArrowLeftRight className="w-10 h-10 text-purple-400" />

                        <div className="inline-block p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
                            <div className={`w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${app2.color} text-white font-black text-2xl shadow-inner`}>
                                {app2.name[0]}
                            </div>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 text-gray-900 tracking-tight">
                        Connect <span className={`text-transparent bg-clip-text bg-gradient-to-r ${app1.color}`}>{app1.name}</span> & <span className={`text-transparent bg-clip-text bg-gradient-to-r ${app2.color}`}>{app2.name}</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        {description}
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300"
                    >
                        Start Automating Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-4 py-20">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Seamless {app1.name} and {app2.name} Workflows</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <h3 className="text-xl font-bold mb-4">When this happens in {app1.name}...</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                    <span>New message received</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                    <span>Status updated</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                    <span>Record created</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                            <h3 className="text-xl font-bold mb-4">...Arrotech Hub does this in {app2.name}</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">AI</div>
                                    <span>Generate intelligent response</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">AI</div>
                                    <span>Create task with AI summary</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">AI</div>
                                    <span>Sync customer data seamlessly</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 py-20 px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Build your {app1.name} + {app2.name} integration today</h2>
                <div className="flex justify-center gap-4">
                    <Link to="/register" className="bg-white text-purple-700 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPairPage;
