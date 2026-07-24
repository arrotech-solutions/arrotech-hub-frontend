import React, { useState, useEffect } from 'react';
import { 
    User, Bot, Target, MessageSquare, Mail, Zap, CheckCircle2, 
    Database, Trello, LayoutDashboard, Inbox, CheckSquare, 
    Settings, Search, BarChart3, PieChart, Activity, Globe,
    ArrowUpRight, TrendingUp, Bell, MousePointer2, Sparkles
} from 'lucide-react';

const HeroAIChatMockup: React.FC = () => {
    const [step, setStep] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const timer1 = setTimeout(() => setStep(1), 500); 
        const timer2 = setTimeout(() => setStep(2), 1500); 
        const timer3 = setTimeout(() => setStep(3), 2200); 
        const timer3a = setTimeout(() => setStep(4), 3200); 
        const timer4 = setTimeout(() => setStep(5), 4200); 
        const timer5 = setTimeout(() => setStep(6), 6000); 
        const timer6 = setTimeout(() => setStep(7), 8500); 
        const timer7 = setTimeout(() => setStep(8), 9500); 

        const reset = setTimeout(() => setStep(0), 14000); 

        return () => {
            clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
            clearTimeout(timer3a); clearTimeout(timer4); clearTimeout(timer5);
            clearTimeout(timer6); clearTimeout(timer7); clearTimeout(reset);
        };
    }, [step === 0]);

    // Floating animation for mouse/cursor simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setMousePos({
                x: Math.sin(Date.now() / 1000) * 20 + 40,
                y: Math.cos(Date.now() / 1500) * 15 + 50
            });
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-3xl text-left relative z-10 sm:mx-auto h-[400px] sm:h-[550px] lg:h-[600px] perspective-2000">
            {/* Background Glows */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none [animation-delay:2s]"></div>

            {/* Main Window Container */}
            <div className="bg-white/80 dark:bg-slate-950/90 backdrop-blur-3xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/50 dark:ring-white/10 flex flex-col h-full relative transition-all duration-700 transform hover:rotate-y-2 group">
                
                {/* Dashboard Toolbar */}
                <div className="flex items-center px-4 md:px-6 py-3 md:py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 shrink-0">
                    <div className="flex space-x-2 mr-6">
                        <div className="w-3 h-3 rounded-full bg-rose-400/80 shadow-[0_0_10px_rgba(251,113,133,0.3)]"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4">
                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center gap-2">
                            <Globe size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">arrotech.hub/workspace-a</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative">
                            <Bell size={16} className="text-slate-400 md:w-[18px]" />
                            <div className="absolute top-0 right-0 w-1.5 md:w-2 h-1.5 md:h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></div>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border border-white dark:border-slate-800 shadow-lg"></div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Compact Sidebar */}
                    <div className="w-12 md:w-16 bg-slate-50/50 dark:bg-slate-950/50 border-r border-slate-200/30 dark:border-slate-800/30 flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6 shrink-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                            <div className="w-5 h-5 bg-white rounded-sm rotate-45"></div>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                            {[LayoutDashboard, Bot, Inbox, CheckSquare, Activity].map((Icon, i) => (
                                <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${i === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>
                                    <Icon size={20} />
                                </div>
                            ))}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all">
                            <Settings size={20} />
                        </div>
                    </div>

                    {/* Main Content Pane */}
                    <div className="flex-1 flex flex-col bg-[#fcfdfe] dark:bg-slate-950 relative">
                        {/* Mesh Gradient Background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                        </div>

                        {/* Top Context Bar */}
                        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md relative z-10">
                            <div className="flex items-center gap-2 md:gap-3">
                                <h3 className="text-[10px] md:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Active Operation Center</h3>
                                <div className="px-1.5 md:px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[7px] md:text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">System Optimal</div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex items-center gap-1 md:gap-2">
                                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Reasoning: 98%</span>
                                </div>
                            </div>
                        </div>

                        {/* Scrolling Chat Canvas */}
                        <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar relative z-10">
                            {/* Message Loop */}
                            {step >= 1 && (
                                <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="bg-blue-600 text-white px-4 md:px-5 py-2 md:py-3 rounded-2xl rounded-tr-none shadow-xl shadow-blue-600/10 text-[11px] md:text-[13px] font-medium max-w-[85%] leading-relaxed">
                                        Update the Acme Corp deal to Closed-Won, sync it to Jira, and trigger the onboarding workflow.
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium">Just now • Sarah Miller</span>
                                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                    </div>
                                </div>
                            )}

                            {step >= 3 && step < 6 && (
                                <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-4">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                            </div>
                                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {step === 3 && "Accessing HubSpot Data Layer..."}
                                                {step === 4 && "Compiling Jira Payload..."}
                                                {step === 5 && "Syncing Multi-Protocol Actions..."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step >= 6 && (
                                <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-4 md:p-5 rounded-2xl rounded-tl-none shadow-lg">
                                            <p className="text-[11px] md:text-[13px] text-slate-600 dark:text-slate-300 font-medium mb-3 md:mb-4">I've executed the synchronized updates for <span className="text-blue-600 font-bold">Acme Corp</span>:</p>
                                            
                                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                                                {[
                                                    { icon: Target, label: 'HubSpot', desc: 'Closed-Won', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                                    { icon: Trello, label: 'Jira', desc: 'Epic Moved', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                                    { icon: MessageSquare, label: 'Slack', desc: 'Broadcasted', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                                                    { icon: Mail, label: 'Gmail', desc: 'Sequence Sent', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                                ].map((action, i) => (
                                                    <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 group/card">
                                                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg ${action.bg} flex items-center justify-center ${action.color} group-hover/card:scale-110 transition-transform flex-shrink-0`}>
                                                            <action.icon size={12} className="md:w-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">{action.label}</p>
                                                            <p className="text-[9px] md:text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{action.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step >= 8 && (
                                <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl rounded-tl-none flex items-center gap-4 w-full">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-none mb-1">Automation Blueprint Saved</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">"Deal-Won Pipeline" is now live for all team members.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prompt Input area */}
                        <div className="p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-800/30 relative z-10">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                    <Zap size={16} />
                                </div>
                                <div className="flex-1 text-[13px] text-slate-400 font-medium">Ask AI to run complex cross-app tasks...</div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                        <Search size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rich Right Sidebar Widgets */}
                    <div className="hidden lg:flex w-72 bg-white/50 dark:bg-slate-950/50 border-l border-slate-200/30 dark:border-slate-800/30 flex-col p-6 gap-6 relative">
                        {/* Mesh background for sidebar */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent"></div>

                        {/* Performance Widget */}
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Team Performance</h4>
                                <ArrowUpRight size={14} className="text-emerald-500" />
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400">Efficiency</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">+24.5%</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                    </div>
                                </div>
                                <div className="h-12 flex items-end gap-1 px-1">
                                    {[30, 45, 25, 60, 40, 85, 55, 70].map((h, i) => (
                                        <div key={i} className="flex-1 bg-blue-500/10 rounded-t-sm relative group overflow-hidden">
                                            <div 
                                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 delay-300"
                                                style={{ height: `${step > 0 ? h : 0}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Actions Widget */}
                        <div className="flex-1 space-y-4 relative z-10">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Live Activity Feed</h4>
                            <div className="space-y-3">
                                {[
                                    { user: 'Sarah K.', action: 'Deploying v2.4', time: 'Just now', icon: Zap, color: 'bg-amber-500' },
                                    { user: 'Alex D.', action: 'New Jira Ticket', time: '2m ago', icon: Target, color: 'bg-blue-500' },
                                    { user: 'AI Bot', action: 'Lead Enriched', time: '5m ago', icon: Bot, color: 'bg-emerald-500' },
                                ].map((act, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 group cursor-pointer">
                                        <div className={`w-8 h-8 rounded-full ${act.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/5`}>
                                            <act.icon size={12} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{act.action}</p>
                                            <p className="text-[9px] text-slate-400 font-medium">{act.user} • {act.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating "AI Recommendation" Widget */}
                        <div className="mt-auto bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/50 rounded-2xl p-4 text-white shadow-xl shadow-black/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <div className="relative z-10">
                                <Sparkles size={20} className="mb-3 text-white/80" />
                                <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-1">AI Suggestion</p>
                                <p className="text-[12px] font-bold leading-tight mb-3">Optimize Slack-to-Jira pipeline for 15% faster triage.</p>
                                <button className="w-full py-2 bg-white text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">Apply Logic</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulated Cursor */}
                <div 
                    className="absolute pointer-events-none transition-all duration-300 z-50 mix-blend-difference"
                    style={{ 
                        left: `${mousePos.x}%`, 
                        top: `${mousePos.y}%`,
                        opacity: step > 0 ? 1 : 0
                    }}
                >
                    <MousePointer2 size={24} className="text-white fill-white shadow-2xl drop-shadow-lg" />
                </div>
            </div>

            {/* Absolute Floating Badges for extra depth */}
            <div className="absolute -left-12 top-1/4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-4 rounded-2xl shadow-2xl hidden xl:flex flex-col items-center gap-1 animate-float z-20">
                <PieChart size={24} className="text-cyan-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400">ALLOCATION</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">82%</span>
            </div>

            <div className="absolute -right-8 bottom-1/4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-4 rounded-2xl shadow-2xl hidden xl:flex flex-col items-center gap-1 animate-float-delayed z-20">
                <BarChart3 size={24} className="text-blue-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400">VELOCITY</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">12.4x</span>
            </div>
        </div>
    );
};

export default HeroAIChatMockup;
