import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Activity } from 'lucide-react';
import SEO from '../components/SEO';

import arrotechIcon from '../assets/Logo/icon-indigo.svg';
import gmailLogo from '../assets/apps/gmail.png';
import slackLogo from '../assets/apps/slack.jpg';
import mpesaLogo from '../assets/apps/mpesa.png';
import whatsappLogo from '../assets/apps/whatsapp.png';
import trelloLogo from '../assets/apps/trello.jpg';
import jiraLogo from '../assets/apps/jira.jpeg';
import hubspotLogo from '../assets/apps/hub_spot.png';

const INTEGRATIONS: Record<string, any> = {
    'gmail': { name: 'Gmail', color: 'from-red-500 to-red-600', logo: gmailLogo },
    'slack': { name: 'Slack', color: 'from-secondary-700 to-primary-500', logo: slackLogo },
    'mpesa': { name: 'M-Pesa', color: 'from-green-500 to-emerald-600', logo: mpesaLogo },
    'whatsapp': { name: 'WhatsApp', color: 'from-green-400 to-teal-500', logo: whatsappLogo },
    'trello': { name: 'Trello', color: 'from-blue-400 to-blue-600', logo: trelloLogo },
    'jira': { name: 'Jira', color: 'from-blue-600 to-indigo-700', logo: jiraLogo },
    'hubspot': { name: 'HubSpot', color: 'from-orange-400 to-orange-600', logo: hubspotLogo },
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
        <div className="min-h-screen bg-transparent transition-colors">
            <SEO
                title={title}
                description={description}
                url={`/connect/${pair}`}
                keywords={[`${app1.name} ${app2.name} Integration`, `Connect ${app1.name} and ${app2.name}`, `${app1.name} ${app2.name} Automation`, 'Arrotech Hub']}
            />

            {/* Hero */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden bg-transparent transition-colors">
                <div className="absolute inset-0 bg-slate-900/5 dark:bg-transparent transition-colors pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none transition-colors"></div>

                <div className="max-w-5xl mx-auto relative z-10 text-center">
                    {/* Animated Automation Visual */}
                    <div className="flex items-center justify-center gap-2 sm:gap-6 mb-16">
                        {/* App 1 */}
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${app1.color} blur-xl opacity-20 dark:opacity-40 animate-pulse transition-opacity`} />
                            {app1.logo ? (
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xl relative z-10 border border-slate-200 dark:border-slate-700 overflow-hidden transition-transform group-hover:scale-105 p-3 sm:p-4`}>
                                    <img src={app1.logo} alt={app1.name} className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${app1.color} flex items-center justify-center shadow-2xl relative z-10 border border-white/20 dark:border-white/10 text-white font-black text-xl sm:text-3xl transition-transform group-hover:scale-105`}>
                                    {app1.name[0]}
                                </div>
                            )}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap transition-colors">{app1.name}</div>
                        </div>

                        {/* Arrotech Hub Middleman */}
                        <div className="flex flex-col items-center flex-1 max-w-[120px] sm:max-w-[250px] relative">
                            {/* Hidden on mobile, visible on sm+ */}
                            <div className="hidden sm:flex relative items-center justify-center z-10 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 mb-2 p-2.5 transition-colors">
                                <img src={arrotechIcon} alt="Arrotech Hub" className="w-full h-full object-contain" />
                            </div>

                            <div className="text-[9px] sm:text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-1 rounded-full uppercase tracking-widest mb-3 sm:mb-2 animate-pulse border border-indigo-500/20 dark:border-indigo-500/30 whitespace-nowrap flex items-center gap-1 transition-colors">
                                <Activity className="w-3 h-3 hidden sm:block" />
                                Automated via Hub
                            </div>

                            {/* Animated connection lines */}
                            <div className="w-full relative flex items-center justify-center sm:-mt-6">
                                <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 absolute z-0 transition-colors" />
                                <div className="w-full flex justify-between absolute px-1 z-0">
                                    <ArrowRight className="w-4 h-4 text-indigo-500/50 dark:text-indigo-400/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <ArrowRight className="w-4 h-4 text-purple-500/50 dark:text-purple-400/50 animate-pulse" style={{ animationDelay: '200ms' }} />
                                    <ArrowRight className="w-4 h-4 text-indigo-500/50 dark:text-indigo-400/50 animate-pulse" style={{ animationDelay: '400ms' }} />
                                    <ArrowRight className="w-4 h-4 text-purple-500/50 dark:text-purple-400/50 animate-pulse" style={{ animationDelay: '600ms' }} />
                                </div>
                            </div>
                        </div>

                        {/* App 2 */}
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${app2.color} blur-xl opacity-20 dark:opacity-40 animate-pulse transition-opacity`} style={{ animationDelay: '500ms' }} />
                            {app2.logo ? (
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xl relative z-10 border border-slate-200 dark:border-slate-700 overflow-hidden transition-transform group-hover:scale-105 p-3 sm:p-4`}>
                                    <img src={app2.logo} alt={app2.name} className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${app2.color} flex items-center justify-center shadow-2xl relative z-10 border border-white/20 dark:border-white/10 text-white font-black text-xl sm:text-3xl transition-transform group-hover:scale-105`}>
                                    {app2.name[0]}
                                </div>
                            )}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap transition-colors">{app2.name}</div>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white tracking-tight pt-4 transition-colors">
                        Connect <span className={`text-transparent bg-clip-text bg-gradient-to-r ${app1.color}`}>{app1.name}</span> & <span className={`text-transparent bg-clip-text bg-gradient-to-r ${app2.color}`}>{app2.name}</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium transition-colors">
                        {description}
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300"
                    >
                        Start Automating Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-4 py-20">
                <div className="bg-white dark:bg-slate-900/50 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8 md:p-12 transition-colors">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center transition-colors">Seamless {app1.name} and {app2.name} Workflows</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">When this happens in {app1.name}...</h3>
                            <ul className="space-y-3 text-slate-700 dark:text-slate-300 transition-colors">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 transition-colors" />
                                    <span>New message received</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 transition-colors" />
                                    <span>Status updated</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 transition-colors" />
                                    <span>Record created</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 transition-colors">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">...Arrotech Hub does this in {app2.name}</h3>
                            <ul className="space-y-3 text-slate-700 dark:text-slate-300 transition-colors">
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 dark:bg-purple-600 text-white flex items-center justify-center text-xs transition-colors">AI</div>
                                    <span>Generate intelligent response</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 dark:bg-purple-600 text-white flex items-center justify-center text-xs transition-colors">AI</div>
                                    <span>Create task with AI summary</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 dark:bg-purple-600 text-white flex items-center justify-center text-xs transition-colors">AI</div>
                                    <span>Sync customer data seamlessly</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-transparent py-20 px-4 text-center transition-colors">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Build your {app1.name} + {app2.name} integration today</h2>
                <div className="flex justify-center gap-4">
                    <Link to="/register" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5 transition-all">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPairPage;
