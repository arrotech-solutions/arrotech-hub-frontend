import React, { useState, useEffect } from 'react';
import { 
    Bot, Terminal, Code2, Settings, Layers, Database, Globe, 
    Play, Square, Check, ArrowRight, Activity, 
    FileCode2, MessagesSquare, LineChart, Cpu, 
    GitPullRequest, AlertCircle, Search, Mail
} from 'lucide-react';

const AutonomousAgentsShowcase: React.FC = () => {
    const [activeAgent, setActiveAgent] = useState<'coding' | 'support' | 'sales'>('coding');
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    const agents = {
        coding: {
            name: "Senior Engineer",
            icon: <Code2 className="w-5 h-5" />,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            prompt: "You are a senior React developer. Monitor GitHub for PRs, review code for performance, and fix syntax errors autonomously.",
            tools: [
                { name: "GitHub API", icon: <GitPullRequest className="w-4 h-4" /> },
                { name: "Terminal", icon: <Terminal className="w-4 h-4" /> },
                { name: "File System", icon: <FileCode2 className="w-4 h-4" /> }
            ],
            steps: [
                "Ingesting PR #402 diff...",
                "Running static analysis...",
                "Identified memory leak in useEffect.",
                "Applying useCallback fix...",
                "Executing test suite (124/124 passed).",
                "Awaiting human approval to merge."
            ]
        },
        support: {
            name: "Tier 1 Support",
            icon: <MessagesSquare className="w-5 h-5" />,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            prompt: "You are a customer success agent. Read incoming tickets, query the billing database, and draft resolution emails.",
            tools: [
                { name: "Zendesk", icon: <Bot className="w-4 h-4" /> },
                { name: "Stripe API", icon: <Database className="w-4 h-4" /> },
                { name: "Gmail", icon: <Mail className="w-4 h-4" /> }
            ],
            steps: [
                "Analyzing ticket: 'Billing failed'",
                "Querying Stripe for user sub_123...",
                "Found expired card ending in 4242.",
                "Drafting secure update link...",
                "Generating personalized email...",
                "Awaiting SDR approval to send."
            ]
        },
        sales: {
            name: "Sales SDR",
            icon: <LineChart className="w-5 h-5" />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            prompt: "You are a sales development rep. Monitor HubSpot for new leads, enrich data via Clearbit, and draft outreach.",
            tools: [
                { name: "HubSpot", icon: <Database className="w-4 h-4" /> },
                { name: "Clearbit", icon: <Search className="w-4 h-4" /> },
                { name: "LinkedIn", icon: <Globe className="w-4 h-4" /> }
            ],
            steps: [
                "Found 50 new inbound leads.",
                "Enriching 'Sarah J.' profile...",
                "Detected high-value Enterprise tier.",
                "Reviewing company outreach guidelines...",
                "Drafting custom LinkedIn message...",
                "Paused: Enterprise lead requires review."
            ]
        }
    };

    const currentData = agents[activeAgent];

    // Simulation effect
    useEffect(() => {
        setProgress(0);
        setCurrentStep(0);
        setIsRunning(true);
        
        let step = 0;
        const interval = setInterval(() => {
            if (step < currentData.steps.length - 1) {
                step++;
                setCurrentStep(step);
                setProgress((step / (currentData.steps.length - 1)) * 100);
            } else {
                setIsRunning(false);
                clearInterval(interval);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [activeAgent, currentData.steps.length]);

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800/50">
            {/* Architectural Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest mb-8 shadow-xl">
                        <Layers className="w-4 h-4" />
                        <span>Autonomous Workforce</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">
                        Don't just automate. <br/>
                        <span className="text-blue-600 dark:text-blue-500">Orchestrate.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Build specialized AI agents, equip them with your tools, and unleash them on complex workflows. Total autonomy, complete oversight.
                    </p>
                </div>

                {/* Showstopper UI */}
                <div className="relative group">
                    {/* Glowing Aura */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-accent-400/20 to-secondary-800/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    
                    <div className="relative bg-slate-50 dark:bg-secondary-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col xl:flex-row min-h-[600px]">
                        
                        {/* Left Column: Agent Builder Panel */}
                        <div className="w-full xl:w-1/3 bg-white dark:bg-secondary-950 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-20">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white tracking-tight">Agent Studio</span>
                                </div>
                                <button className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                                    <Settings className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                                {/* Agent Selector */}
                                <div>
                                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Select Persona</h4>
                                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                                        {(Object.keys(agents) as Array<keyof typeof agents>).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveAgent(key)}
                                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeAgent === key ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {agents[key].name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* System Prompt */}
                                <div>
                                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        System Instruction
                                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px]">Editable</span>
                                    </h4>
                                    <div className="p-4 bg-slate-50 dark:bg-secondary-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-400 leading-relaxed relative">
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                        </div>
                                        {currentData.prompt}
                                    </div>
                                </div>

                                {/* Equipped Tools Visualization */}
                                <div>
                                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Equipped Tools</h4>
                                    <div className="relative">
                                        {/* Connector Line */}
                                        <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700 z-0"></div>
                                        
                                        <div className="space-y-4 relative z-10">
                                            {currentData.tools.map((tool, i) => (
                                                <div key={i} className="flex items-center gap-4 group">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-white dark:bg-slate-900 transition-all shadow-sm group-hover:shadow-md ${currentData.border} ${currentData.color}`}>
                                                        {tool.icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{tool.name}</div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Connected
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Execution Engine */}
                        <div className="w-full xl:w-2/3 bg-slate-50 dark:bg-secondary-950 relative flex flex-col">
                            {/* Execution Header */}
                            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/50 dark:bg-secondary-950/50 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className={`w-4 h-4 ${isRunning ? currentData.color : 'text-slate-400'}`} />
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">Runtime Engine</span>
                                    </div>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                        <span className="text-slate-500">Status:</span>
                                        <span className={isRunning ? currentData.color : 'text-slate-400'}>
                                            {isRunning ? 'Executing...' : 'Awaiting Human Input'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-slate-500">Latency: 42ms</div>
                                    <button onClick={() => { setProgress(0); setCurrentStep(0); setIsRunning(true); }} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                        {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Execution Content (Split Panes) */}
                            <div className="flex-1 flex flex-col md:flex-row">
                                {/* Trace / Plan Pane */}
                                <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
                                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Execution Trace</h4>
                                    
                                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                                        {currentData.steps.map((step, index) => (
                                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                                                
                                                {/* Status Node */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-secondary-950 bg-white dark:bg-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-500">
                                                    {index < currentStep ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : index === currentStep ? (
                                                        <div className={`w-3 h-3 rounded-full animate-ping ${currentData.bg} ${currentData.color}`}></div>
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                                    )}
                                                </div>

                                                {/* Content Card */}
                                                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border shadow-sm transition-all duration-500 ${
                                                    index < currentStep ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70' :
                                                    index === currentStep ? `bg-white dark:bg-slate-900 border-2 ${currentData.border} scale-105 shadow-lg` :
                                                    'bg-transparent border-dashed border-slate-200 dark:border-slate-800 opacity-40'
                                                }`}>
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Step 0{index + 1}</div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{step}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Terminal Output Pane */}
                                <div className="w-full md:w-7/12 bg-slate-900 dark:bg-black/40 flex flex-col">
                                    <div className="p-3 bg-slate-800/50 dark:bg-white/5 border-b border-slate-700/50 dark:border-white/10 flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-mono text-slate-300">agent_output.log</span>
                                    </div>
                                    <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed text-slate-300 overflow-y-auto space-y-2">
                                        {currentData.steps.slice(0, currentStep + 1).map((log, i) => (
                                            <div key={i} className="animate-fade-in flex gap-3">
                                                <span className="text-slate-600 select-none">[{new Date().toISOString().substring(11, 19)}]</span>
                                                <span className={
                                                    i === currentData.steps.length - 1 && !isRunning ? 'text-amber-400 font-bold' :
                                                    'text-blue-300'
                                                }>
                                                    {i === currentData.steps.length - 1 && !isRunning ? `> ${log}` : `> [INFO] ${log}`}
                                                </span>
                                            </div>
                                        ))}
                                        {isRunning && (
                                            <div className="flex gap-3 animate-pulse">
                                                <span className="text-slate-600 select-none">[{new Date().toISOString().substring(11, 19)}]</span>
                                                <span className="w-2 h-4 bg-slate-500 rounded-sm mt-0.5"></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footer (Human in the loop) */}
                                    <div className="p-4 bg-slate-800/80 dark:bg-black/60 border-t border-slate-700/50 dark:border-white/10 backdrop-blur-md transition-all duration-500">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Progress</span>
                                            <span className="text-xs font-mono font-bold text-white">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 dark:bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${isRunning ? currentData.bg.replace('/10', '') : 'bg-amber-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        
                                        {/* Action buttons appear only when paused at the end */}
                                        <div className={`flex justify-end gap-3 transition-all duration-500 ${!isRunning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                                            <button className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                                                Reject Action
                                            </button>
                                            <button className="px-5 py-2 text-xs font-bold bg-white text-slate-900 hover:bg-blue-50 rounded-lg shadow-lg shadow-white/10 transition-all flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Approve Execution
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AutonomousAgentsShowcase;
