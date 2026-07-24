import React, { useState, useEffect } from 'react';
import { 
    Inbox, CheckSquare, Calendar, Zap, Bot, Code2, 
    MessageSquare, Mail, Target, Clock, ArrowRight,
    Search, Bell, Settings, Filter, Plus, ChevronRight,
    Trello, CheckCircle2, Layout, Cpu, Sparkles,
    Github, Slack, Globe, Terminal, Play, Save, User
} from 'lucide-react';

const UnifiedPlatformShowcase: React.FC = () => {
    const [activeTab, setActiveTab] = useState('inbox');
    const [step, setStep] = useState(0);

    // Autonomous "GIF-like" cycling through tabs and steps
    useEffect(() => {
        const stepInterval = setInterval(() => {
            setStep(prev => (prev + 1) % 5);
        }, 2000);

        const tabInterval = setInterval(() => {
            setActiveTab(prev => {
                const currentIndex = tabs.findIndex(t => t.id === prev);
                const nextIndex = (currentIndex + 1) % tabs.length;
                return tabs[nextIndex].id;
            });
        }, 10000); // Switch tab every 10 seconds

        return () => {
            clearInterval(stepInterval);
            clearInterval(tabInterval);
        };
    }, []);

    const tabs = [
        { id: 'inbox', label: 'Unified Inbox', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'tasks', label: 'Unified Tasks', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'calendar', label: 'Unified Calendar', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'workflows', label: 'Workflows', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'ai', label: 'Ask AI', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'agents', label: 'Agents', icon: Bot, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                    One Platform. <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">Every tool.</span>
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                    Stop tab-switching. Arrotech Hub unifies your fragmented toolstack into a single, high-performance operating system.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Vertical Tabs Sidebar */}
                <div className="w-full lg:w-72 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 min-w-[160px] md:min-w-0 border-2 relative overflow-hidden ${
                                activeTab === tab.id 
                                ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xl shadow-primary-500/10' 
                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            {/* Auto-cycle Progress Bar */}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full">
                                    <div className="h-full bg-blue-500 animate-progress-horizontal origin-left"></div>
                                </div>
                            )}
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${activeTab === tab.id ? tab.bg : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <tab.icon size={16} className="md:w-5" />
                            </div>
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
                        </button>
                    ))}
                </div>

                {/* Main Showcase Area */}
                <div className="flex-1 w-full perspective-2000">
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl md:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden min-h-[450px] md:min-h-[600px] flex flex-col relative transition-all duration-500 transform hover:rotate-y-1">
                        
                        {/* Browser Chrome */}
                        <div className="flex items-center px-4 md:px-8 py-3 md:py-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <div className="flex space-x-1.5 md:space-x-2 mr-4 md:mr-8">
                                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-rose-400"></div>
                                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-amber-400"></div>
                                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-emerald-400"></div>
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="px-3 md:px-6 py-1 md:py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] md:text-[10px] font-bold text-slate-400 flex items-center gap-2 md:gap-3">
                                    <Globe size={10} className="md:w-3" />
                                    <span className="truncate max-w-[100px] md:max-w-none">app.arrotech.hub/{activeTab}</span>
                                </div>
                            </div>
                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-800 ml-4 md:ml-8"></div>
                        </div>

                        {/* App Content */}
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            {/* Unified Inbox View */}
                            {activeTab === 'inbox' && (
                                <div className="flex flex-col h-full animate-in fade-in duration-500">
                                    <div className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">Unified Inbox</h3>
                                        <div className="flex gap-2">
                                            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-2">
                                                <Plus size={12} className="md:w-3.5" /> Compose
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                                        {[
                                            { provider: 'Slack', user: 'Sarah Miller', text: 'Hey, did you see the new designs?', time: '2m ago', color: 'bg-cyan-500', icon: MessageSquare },
                                            { provider: 'Gmail', user: 'AWS', text: 'Your monthly invoice is ready', time: '15m ago', color: 'bg-rose-500', icon: Mail },
                                            { provider: 'Teams', user: 'Jason Statham', text: 'Can we sync at 4 PM?', time: '1h ago', color: 'bg-blue-500', icon: MessageSquare },
                                            { provider: 'Outlook', user: 'Azure', text: 'Security Alert: New login', time: '3h ago', color: 'bg-slate-600', icon: Mail },
                                        ].map((msg, i) => (
                                            <div key={i} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 transition-all cursor-pointer ${step === i ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 translate-x-1 md:translate-x-2' : 'bg-white dark:bg-slate-900'}`}>
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${msg.color} flex items-center justify-center text-white shrink-0`}>
                                                    <msg.icon size={14} className="md:w-[18px]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between mb-0.5 md:mb-1">
                                                        <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{msg.user}</span>
                                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400">{msg.time}</span>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{msg.text}</p>
                                                </div>
                                                <div className="flex items-center gap-2 hidden sm:flex">
                                                    <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{msg.provider}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action Simulation: AI Tagging */}
                                    {step === 4 && (
                                        <div className="absolute inset-x-0 bottom-10 px-8 animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-white dark:bg-slate-900 border border-blue-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                                                    <Bot size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">AI Assistant</p>
                                                    <p className="text-xs text-slate-500">Categorizing 12 new messages. <span className="text-emerald-500 font-bold">Priority set to High.</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Unified Task View */}
                            {activeTab === 'tasks' && (
                                <div className="flex flex-col h-full animate-in fade-in duration-500">
                                    <div className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">Global Task Engine</h3>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400">
                                                <Filter size={12} className="md:w-3.5" /> <span className="hidden sm:inline">All Projects</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                        {[
                                            { label: 'To Do', items: ['Jira: Fix Auth Bug', 'Trello: Design Review', 'Asana: Update API Docs'], color: 'bg-slate-100 dark:bg-slate-900' },
                                            { label: 'In Progress', items: ['ClickUp: Refactor UI', 'Jira: Staging Deploy'], color: 'bg-blue-50/50 dark:bg-blue-900/10' },
                                            { label: 'Completed', items: ['Trello: User Interview'], color: 'bg-emerald-50/50 dark:bg-emerald-900/10' },
                                        ].map((col, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[9px] md:text-[11px] font-black uppercase text-slate-400 tracking-[0.15em]">{col.label}</span>
                                                    <span className="text-[8px] md:text-[10px] font-bold text-slate-50">{col.items.length}</span>
                                                </div>
                                                <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2 md:space-y-3 ${col.color}`}>
                                                    {col.items.map((item, i) => (
                                                        <div key={i} className={`p-3 md:p-4 bg-white dark:bg-slate-950 rounded-xl md:rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 transition-all ${step === idx + i ? 'ring-2 ring-emerald-500 scale-[1.01] md:scale-[1.02] shadow-xl' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-1 md:mb-2">
                                                                <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${item.includes('Jira') ? 'bg-blue-500' : item.includes('Trello') ? 'bg-cyan-500' : 'bg-rose-500'}`}></div>
                                                                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">{item.split(': ')[0]}</span>
                                                            </div>
                                                            <p className="text-[11px] md:text-[13px] font-bold text-slate-800 dark:text-slate-200">{item.split(': ')[1]}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action Simulation: Auto-sync */}
                                    {step === 2 && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 animate-in zoom-in duration-500">
                                            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full"></div>
                                                <Zap size={24} className="text-amber-500 mb-4 animate-bounce" />
                                                <p className="text-sm font-black mb-2">Automated Sync Executed</p>
                                                <p className="text-xs text-slate-400">Task moved in Jira. <span className="text-emerald-400 font-bold">Trello card auto-archived.</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Unified Calendar View */}
                            {activeTab === 'calendar' && (
                                <div className="flex flex-col h-full animate-in fade-in duration-500">
                                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Unified Calendar</h3>
                                        <div className="flex gap-2">
                                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">Week</div>
                                            <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Month</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 md:p-8 grid grid-cols-4 md:grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
                                        {Array.from({ length: 14 }).map((_, i) => (
                                            <div key={i} className={`bg-white dark:bg-slate-950 p-2 md:p-4 min-h-[100px] md:min-h-[140px] relative ${i >= 8 ? 'hidden md:block' : ''}`}>
                                                <span className="text-[10px] md:text-xs font-bold text-slate-400">{i + 1}</span>
                                                {i === 3 && (
                                                    <div className={`mt-1 md:mt-2 p-1.5 md:p-2 bg-blue-500 text-white rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold shadow-lg transition-all ${step === 0 ? 'scale-110 shadow-primary-500/30' : ''}`}>
                                                        <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                                                            <Globe size={8} className="md:w-[10px]" /> <span className="hidden sm:inline">Google</span>
                                                        </div>
                                                        <span className="truncate block">Product Sync</span>
                                                    </div>
                                                )}
                                                {i === 3 && (
                                                    <div className={`mt-1 p-1.5 md:p-2 bg-blue-500 text-white rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold shadow-lg transition-all ${step === 1 ? 'scale-110 shadow-primary-500/30' : ''}`}>
                                                        <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                                                            <Globe size={8} className="md:w-[10px]" /> <span className="hidden sm:inline">Outlook</span>
                                                        </div>
                                                        <span className="truncate block">Client Call</span>
                                                    </div>
                                                )}
                                                {i === 7 && (
                                                    <div className="mt-1 md:mt-2 p-1.5 md:p-2 bg-emerald-500 text-white rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold">
                                                        <span className="truncate block">Focus Time</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action Simulation: Conflict Detection */}
                                    {step === 2 && (
                                        <div className="absolute bottom-10 right-10 w-72 animate-in slide-in-from-right-8 duration-500">
                                            <div className="bg-rose-500 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20">
                                                <Bell size={20} className="animate-ring" />
                                                <div>
                                                    <p className="text-xs font-black">Conflict Detected</p>
                                                    <p className="text-[10px] opacity-90">2 meetings overlap on Tuesday. AI suggests rescheduling "Client Call".</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Workflows Page View */}
                            {activeTab === 'workflows' && (
                                <div className="flex flex-col h-full animate-in fade-in duration-500 bg-slate-50 dark:bg-slate-950">
                                    <div className="p-8 flex items-center justify-between">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Active Automations</h3>
                                        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-primary-500/25 hover:scale-105 transition-transform flex items-center gap-2">
                                            <Plus size={18} /> New Workflow
                                        </button>
                                    </div>
                                    <div className="flex-1 px-8 space-y-4">
                                        {[
                                            { name: 'Lead Enrichment', status: 'Running', health: 98, triggers: ['Salesforce', 'Slack'], color: 'from-blue-500 to-blue-600' },
                                            { name: 'Onboarding Sequence', status: 'Paused', health: 100, triggers: ['Gmail', 'Stripe'], color: 'from-primary-500 to-secondary-900' },
                                            { name: 'Bug Triage AI', status: 'Running', health: 94, triggers: ['Github', 'Discord'], color: 'from-blue-600 to-blue-700' },
                                        ].map((wf, i) => (
                                            <div key={i} className={`p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-8 transition-all ${step === i ? 'border-blue-500 shadow-xl -translate-y-1' : ''}`}>
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${wf.color} flex items-center justify-center text-white shadow-lg`}>
                                                    <Zap size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-base font-black text-slate-800 dark:text-white mb-1">{wf.name}</h4>
                                                    <div className="flex gap-2">
                                                        {wf.triggers.map(t => <span key={t} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t}</span>)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        <span className="text-[11px] font-black text-slate-800 dark:text-white">{wf.health}% Success</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400">{wf.status}</p>
                                                </div>
                                                <div className="w-px h-10 bg-slate-100 dark:bg-slate-800 mx-2"></div>
                                                <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all cursor-pointer">
                                                    <Play size={16} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action Simulation: Drag-Drop Logic */}
                                    {step === 1 && (
                                        <div className="absolute top-1/2 right-20 w-80 animate-in slide-in-from-right-12 duration-700">
                                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 relative z-20">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                        <Cpu size={20} />
                                                    </div>
                                                    <span className="text-sm font-black">Logic node</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="h-2 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    <div className="mt-6 p-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black text-center uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-all">
                                                        Link HubSpot → Slack
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ask AI Page View */}
                            {activeTab === 'ai' && (
                                <div className="flex flex-col h-full animate-in fade-in duration-500 bg-[#fcfdfe] dark:bg-slate-950">
                                    <div className="flex-1 p-4 md:p-8 flex flex-col justify-end space-y-4 md:space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                                                <Sparkles size={20} />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-sm font-medium leading-relaxed max-w-[80%]">
                                                Hello! I'm your cross-platform agent. I can access all your connected tools. What would you like me to do?
                                            </div>
                                        </div>
                                        
                                        {step >= 1 && (
                                            <div className="flex items-start gap-4 flex-row-reverse animate-in slide-in-from-right-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div className="bg-blue-600 text-white p-4 md:p-6 rounded-3xl shadow-xl shadow-primary-500/10 text-xs md:text-sm font-medium leading-relaxed max-w-[85%] md:max-w-[80%]">
                                                    "Summarize my recent meetings from Google Calendar and draft follow-up tasks in Jira for the action items."
                                                </div>
                                            </div>
                                        )}

                                        {step >= 2 && (
                                            <div className="flex items-start gap-4 animate-in slide-in-from-left-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-3xl shadow-sm space-y-3 md:space-y-4 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Context...</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                                        <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 mb-1 md:mb-2 uppercase">Identified Action Items</p>
                                                            <ul className="text-[11px] md:text-xs space-y-1.5 md:space-y-2">
                                                                <li>• Fix auth bug (ACM-102)</li>
                                                                <li>• Update API documentation</li>
                                                            </ul>
                                                        </div>
                                                        <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl border border-blue-100 dark:border-blue-800">
                                                            <p className="text-[9px] md:text-[10px] font-black text-blue-400 mb-1 md:mb-2 uppercase">Proposed Jira Tasks</p>
                                                            <p className="text-[11px] md:text-xs font-bold text-blue-600 dark:text-blue-300 italic">"Drafting payloads..."</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 md:p-8 pt-0">
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-[2rem] p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-xl">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Plus size={18} className="md:w-5" />
                                            </div>
                                            <div className="flex-1 text-xs md:text-sm text-slate-400 font-medium italic">Type your command...</div>
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
                                                <ArrowRight size={18} className="md:w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Agents (Coding Agent) Page View */}
                            {activeTab === 'agents' && (
                                <div className="flex h-full animate-in fade-in duration-500 bg-[#12091F] text-slate-300 font-mono text-[13px]">
                                    {/* Sidebar */}
                                    <div className="hidden sm:flex w-48 md:w-64 border-r border-slate-800 p-4 md:p-6 flex-col gap-4 md:gap-6">
                                        <div className="flex items-center gap-3 mb-2 md:mb-4">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
                                                <Code2 size={16} className="md:w-5" />
                                            </div>
                                            <span className="font-bold text-white text-xs md:text-sm">Coding Agent</span>
                                        </div>
                                        <div className="space-y-3 md:space-y-4">
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Workspace</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-blue-400 text-[11px] md:text-xs">
                                                    <Github size={12} className="md:w-3.5" /> main-branch
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] md:text-xs">
                                                    <Terminal size={12} className="md:w-3.5" /> node_modules
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] md:text-xs">
                                                    <Layout size={12} className="md:w-3.5" /> src/components
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Main Code Editor View */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="h-10 md:h-12 border-b border-slate-800 flex items-center px-4 md:px-6 justify-between bg-slate-900/50">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <span className="text-white font-bold text-xs md:text-sm">PublicLayout.tsx</span>
                                                <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">Modified</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="px-2 md:px-3 py-1 bg-slate-800 rounded text-[8px] md:text-[10px] font-bold hover:bg-slate-700 cursor-pointer hidden md:block">Discard</div>
                                                <div className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded text-[8px] md:text-[10px] font-bold flex items-center gap-1.5 md:gap-2 hover:bg-blue-500 cursor-pointer">
                                                    <Save size={10} className="md:w-3" /> Commit
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 md:p-8 relative overflow-hidden">
                                            <div className="space-y-0.5 md:space-y-1 text-[11px] md:text-[13px]">
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">1</span> import React from 'react';</p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">2</span> import &#123; Link &#125; from 'react-router-dom';</p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">3</span> </p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">4</span> <span className="text-blue-400">const</span> Navigation = () =&gt; &#123;</p>
                                                <p className={`transition-all duration-500 ${step >= 1 ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'}`}><span className="mr-2 md:mr-4 text-slate-500">5</span>   <span className="text-blue-400">return</span> (</p>
                                                <p className={`transition-all duration-500 ${step >= 2 ? 'bg-emerald-500/20 text-emerald-400 scale-[1.01] translate-x-1 md:translate-x-2' : 'text-slate-300'}`}><span className="mr-2 md:mr-4 text-slate-500">6</span>     &lt;nav className="floating-island"&gt;</p>
                                                <p className={`transition-all duration-500 ${step >= 3 ? 'bg-emerald-500/20 text-emerald-400 scale-[1.01] translate-x-1 md:translate-x-2' : 'text-slate-300'}`}><span className="mr-2 md:mr-4 text-slate-500">7</span>       &lt;GlassCard effect="ultra-blur" /&gt;</p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">8</span>     &lt;/nav&gt;</p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">9</span>   );</p>
                                                <p className="text-slate-500"><span className="mr-2 md:mr-4">10</span> &#125;;</p>
                                            </div>

                                            {/* Action Simulation: Coding Agent Output */}
                                            {step >= 1 && (
                                                <div className="absolute bottom-10 left-10 right-10 animate-in slide-in-from-bottom-8 duration-700">
                                                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                                                    <Code2 size={16} />
                                                                </div>
                                                                <span className="text-xs font-bold text-white">Coding Agent Log</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                <span className="text-[10px] text-emerald-500 font-bold">WRITING...</span>
                                                            </div>
                                                        </div>
                                                        <div className="font-mono text-xs text-slate-400 space-y-1">
                                                            <p><span className="text-emerald-500">✓</span> Successfully analyzed d:\repos\Arrotech Solutions\Hub</p>
                                                            <p><span className="text-emerald-500">✓</span> Implementing glassmorphism logic in PublicLayout.tsx</p>
                                                            <p className="animate-pulse"><span className="text-blue-400">➜</span> Running: <span className="text-white">npm run lint --fix</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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

export default UnifiedPlatformShowcase;
