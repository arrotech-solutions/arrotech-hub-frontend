import React, { useState, useEffect } from 'react';
import { User, Bot, Target, MessageSquare, Mail, Zap, CheckCircle2, Database, Trello, LayoutDashboard, Inbox, CheckSquare, Settings, Search } from 'lucide-react';

const HeroAIChatMockup: React.FC = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer1 = setTimeout(() => setStep(1), 500); // 0.5s: User starts typing
        const timer2 = setTimeout(() => setStep(2), 1500); // 1.5s: User finishes typing
        const timer3 = setTimeout(() => setStep(3), 2200); // 2.2s: AI thinking (Searching CRM)
        const timer3a = setTimeout(() => setStep(4), 3200); // 3.2s: AI thinking (Drafting payload)
        const timer4 = setTimeout(() => setStep(5), 4200); // 4.2s: AI executing tools...
        const timer5 = setTimeout(() => setStep(6), 6000); // 6s: AI response complete
        const timer6 = setTimeout(() => setStep(7), 8500); // 8.5s: User replies "Yes"
        const timer7 = setTimeout(() => setStep(8), 9500); // 9.5s: AI confirms workflow

        const reset = setTimeout(() => setStep(0), 14000); // Reset loop

        return () => {
            clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
            clearTimeout(timer3a); clearTimeout(timer4); clearTimeout(timer5);
            clearTimeout(timer6); clearTimeout(timer7); clearTimeout(reset);
        };
    }, [step === 0]); // Re - run when step resets to 0

    return (
        <div className="w-full max-w-2xl text-left relative z-10 w-full sm:mx-auto h-full min-h-[400px] sm:min-h-[450px] lg:min-h-[550px]">
            {/* Window Chrome */}
            <div className="bg-slate-50 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/50 dark:ring-white/10 flex flex-col h-full absolute inset-0">
                {/* Traffic Lights / macOS Chrome */}
                <div className="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900 shrink-0">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Simulated Sidebar */}
                    <div className="w-14 sm:w-48 bg-[#0a0f1d] dark:bg-slate-950 border-r border-slate-800/50 flex flex-col shrink-0 text-slate-400">
                        <div className="h-12 flex items-center justify-center sm:justify-start sm:px-4 border-b border-slate-800/50 mb-2">
                            <div className="w-6 h-6 rounded bg-indigo-500 flex shrink-0 shadow-lg shadow-indigo-500/20"></div>
                            <span className="ml-3 font-bold text-white hidden sm:block truncate text-xs">Arrotech Hub</span>
                        </div>

                        <div className="px-2 mb-2 hidden sm:block">
                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 border border-slate-800 text-slate-300 text-[10px] font-bold w-full cursor-pointer hover:bg-white/10 transition-colors">
                                <MessageSquare size={12} />
                                New Chat
                            </div>
                        </div>

                        <div className="flex-1 space-y-1 sm:px-2 py-2 overflow-y-auto no-scrollbar">
                            <div className="flex justify-center sm:justify-start items-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                <LayoutDashboard size={18} className="shrink-0" />
                                <span className="ml-3 text-xs font-medium hidden sm:block">Dashboard</span>
                            </div>
                            <div className="flex justify-center sm:justify-start items-center p-2 rounded-lg bg-indigo-600/20 text-indigo-400 cursor-pointer relative">
                                <div className="absolute left-0 top-1 bottom-1 w-1 bg-indigo-500 rounded-r shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                                <Bot size={18} className="shrink-0" />
                                <span className="ml-3 text-xs font-bold hidden sm:block">Ask AI</span>
                            </div>
                            <div className="flex justify-center sm:justify-start items-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                <Inbox size={18} className="shrink-0" />
                                <span className="ml-3 text-xs font-medium hidden sm:block">Inbox</span>
                            </div>
                            <div className="flex justify-center sm:justify-start items-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                <CheckSquare size={18} className="shrink-0" />
                                <span className="ml-3 text-xs font-medium hidden sm:block">Tasks</span>
                            </div>
                        </div>
                        <div className="p-2 sm:px-2 border-t border-slate-800/50 mb-2">
                            <div className="flex justify-center sm:justify-start items-center p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                                <Settings size={18} className="shrink-0" />
                                <span className="ml-3 text-xs hidden sm:block">Settings</span>
                            </div>
                        </div>
                    </div>

                    {/* Main UI Pane */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0f172a]">
                        {/* Simulated Top Navbar */}
                        <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 shrink-0 bg-white/80 dark:bg-slate-900/80 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                                    <Bot size={16} className="text-indigo-500" />
                                    Agent Workspace
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Live
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1 rounded-md text-[10px] border border-slate-200 dark:border-slate-700">
                                    <Search size={12} />
                                    <span>Quick Search...</span>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-2 ring-white dark:ring-slate-900 shrink-0 shadow-sm"></div>
                            </div>
                        </div>

                        {/* Chat Window Area */}
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent flex flex-col justify-end">

                            {/* Floating starting text if empty */}
                            {step === 0 && (
                                <div className="m-auto text-center animate-pulse flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
                                        <Bot size={20} className="text-indigo-400" />
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400 tracking-tight">Listening for instructions...</div>
                                    <div className="mt-2 flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce"></div>
                                    </div>
                                </div>
                            )}

                            {/* Initial User Prompt */}
                            <div className={`flex flex-col items-end transition-all duration-500 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute'}`}>
                                <div className="flex max-w-[85%] flex-row-reverse">
                                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ml-3 bg-gradient-to-br from-indigo-500 to-purple-600 ring-4 ring-indigo-500/10">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-indigo-600/20 text-[13px] leading-relaxed font-medium">
                                        {step === 1 ? (
                                            <span className="animate-pulse">Typing...</span>
                                        ) : (
                                            <span>We just closed the Acme Corp deal! Update HubSpot, transition the Jira Epic, let the team know, and send the onboarding sequence.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Thinking / Tool Executing */}
                            {step >= 3 && step < 6 && (
                                <div className="flex flex-col items-start transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 mt-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg mr-3 bg-gradient-to-br from-emerald-400 to-teal-500">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                        <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-3">
                                            {step === 3 && (
                                                <>
                                                    <div className="flex space-x-1">
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400">Querying CRM database...</span>
                                                </>
                                            )}
                                            {step === 4 && (
                                                <>
                                                    <Database size={14} className="text-purple-500 animate-pulse" />
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Drafting operational payloads...</span>
                                                </>
                                            )}
                                            {step === 5 && (
                                                <>
                                                    <Zap size={14} className="text-amber-500 animate-pulse" />
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Running Tool Executor Pipeline...</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Response containing rich widget */}
                            {step >= 6 && (
                                <div className="flex flex-col items-start transition-all duration-500 transform animate-in fade-in slide-in-from-bottom-2 mt-4">
                                    <div className="flex max-w-[85%] flex-row">
                                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg mr-3 bg-gradient-to-br from-emerald-400 to-teal-500 ring-4 ring-emerald-500/10">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm px-5 py-4 rounded-2xl text-[13px] leading-relaxed w-full">
                                            <div className="space-y-4">
                                                <p className="font-medium">Operation readout for <span className="text-indigo-500">Acme Corp</span>:</p>

                                                {/* Rich Tool Widget Mockup */}
                                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden shadow-inner">
                                                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Multi-Tool Pipeline</span>
                                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-500/20">4 Actions Sync'd</span>
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        <div className="flex items-center gap-3 text-[12px] bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                                                            <Target size={14} className="text-rose-500 shrink-0" />
                                                            <span className="truncate">CRM Status: <span className="font-bold">Closed-Won</span></span>
                                                            <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[12px] bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                                                            <Trello size={14} className="text-blue-500 shrink-0" />
                                                            <span className="truncate">Jira Epic: <span className="font-bold">ACM-1</span> moved</span>
                                                            <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[12px] bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                                                            <MessageSquare size={14} className="text-purple-500 shrink-0" />
                                                            <span className="truncate">Slack Broadcast: <span className="font-bold">#sales-wins</span></span>
                                                            <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[12px] bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                                                            <Mail size={14} className="text-indigo-500 shrink-0" />
                                                            <span className="truncate">Gmail: Onboarding Sequence Sent</span>
                                                            <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-[12px]">
                                                        Save as 'Deal Won' workflow template?
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* User Follow-up */}
                            {step >= 7 && (
                                <div className="flex flex-col items-end transition-all duration-500 transform animate-in fade-in slide-in-from-bottom-2 mt-4">
                                    <div className="flex max-w-[85%] flex-row-reverse">
                                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ml-3 bg-gradient-to-br from-indigo-500 to-purple-600">
                                            <User size={16} className="text-white" />
                                        </div>
                                        <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 text-[15px]">
                                            Yes, structure that into a saved workflow!
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Workflow Confirmation */}
                            {step >= 8 && (
                                <div className="flex flex-col items-start transition-all duration-500 transform animate-in fade-in slide-in-from-bottom-2 mt-4 pb-4">
                                    <div className="flex max-w-[85%] flex-row">
                                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/20 mr-3 bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-white dark:ring-[#0b1120] mb-1">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-5 py-4 rounded-2xl rounded-tl-sm relative overflow-hidden group/conf">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover/conf:scale-150 transition-transform duration-700"></div>
                                            
                                            <div className="flex items-center gap-4 relative z-10 w-full pr-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-500/20 dark:to-green-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                                                    <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">Workflow template created</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">"Deal Won Pipeline" is now available in your Workflows tab.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroAIChatMockup;
