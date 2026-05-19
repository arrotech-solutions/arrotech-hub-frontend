import React, { useEffect, useState } from 'react';
import { Play, Database, MessageSquare, Zap, ArrowRight, Bot, Github, Mail, Globe, Sparkles } from 'lucide-react';

const VisualWorkflowShowcase: React.FC = () => {
    const [activePath, setActivePath] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(true);

    // Sequence of animations
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setActivePath(prev => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-slate-50 dark:bg-[#060B14] transition-colors border-t border-slate-200 dark:border-slate-800/50">
            {/* Massive Glowing Orbs */}
            <div className="absolute top-1/2 left-1/4 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest mb-8 shadow-2xl">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Infinite Scalability</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.05]">
                        Visual orchestration for <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">complex logic.</span>
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Connect agents, APIs, and databases using our state-of-the-art visual builder. No code required. Just pure, unadulterated power.
                    </p>
                </div>

                {/* The Crazy Canvas */}
                <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-white/50 dark:bg-[#0B1221]/80 rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden group">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    {/* Canvas Toolbar */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-lg">
                            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isPlaying ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : 'bg-green-100 dark:bg-green-900/50 text-green-600'}`}>
                                {isPlaying ? <span className="w-3 h-3 bg-amber-600 dark:bg-amber-400 rounded-sm"></span> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                                {isPlaying ? 'SIMULATION ACTIVE' : 'PAUSED'}
                            </span>
                        </div>
                    </div>

                    {/* Node Graph Area */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center transform scale-75 md:scale-100">
                        
                        {/* SVG Connecting Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' }}>
                            <defs>
                                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            
                            {/* Path 1: Trigger -> AI Model */}
                            <path d="M 30% 50% C 40% 50%, 40% 30%, 50% 30%" fill="none" stroke="url(#line-gradient)" strokeWidth="3" className={`transition-all duration-500 ${activePath === 0 || activePath === 1 ? 'opacity-100' : 'opacity-20'}`} strokeDasharray="8 8" strokeDashoffset={isPlaying ? -100 : 0} style={{ animation: isPlaying ? 'dash 2s linear infinite' : 'none' }} />
                            
                            {/* Path 2: AI Model -> Database */}
                            <path d="M 50% 30% C 60% 30%, 65% 50%, 75% 50%" fill="none" stroke="url(#line-gradient-2)" strokeWidth="3" className={`transition-all duration-500 ${activePath === 1 || activePath === 2 ? 'opacity-100' : 'opacity-20'}`} strokeDasharray="8 8" strokeDashoffset={isPlaying ? -100 : 0} style={{ animation: isPlaying ? 'dash 2s linear infinite' : 'none' }} />

                            {/* Path 3: Trigger -> Webhook */}
                            <path d="M 30% 50% C 40% 50%, 40% 70%, 50% 70%" fill="none" stroke="url(#line-gradient)" strokeWidth="3" className={`transition-all duration-500 ${activePath === 2 || activePath === 3 ? 'opacity-100' : 'opacity-20'}`} strokeDasharray="8 8" strokeDashoffset={isPlaying ? -100 : 0} style={{ animation: isPlaying ? 'dash 2s linear infinite' : 'none' }} />

                            {/* Path 4: Webhook -> Slack */}
                            <path d="M 50% 70% C 60% 70%, 65% 50%, 75% 50%" fill="none" stroke="url(#line-gradient-2)" strokeWidth="3" className={`transition-all duration-500 ${activePath === 3 || activePath === 0 ? 'opacity-100' : 'opacity-20'}`} strokeDasharray="8 8" strokeDashoffset={isPlaying ? -100 : 0} style={{ animation: isPlaying ? 'dash 2s linear infinite' : 'none' }} />
                        </svg>

                        {/* Nodes */}
                        
                        {/* 1. Trigger Node (Left) */}
                        <div className="absolute left-[30%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative group/node">
                                <div className={`absolute -inset-4 bg-blue-500/20 rounded-full blur-xl transition-all duration-500 ${activePath === 0 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
                                <div className={`w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 shadow-2xl flex items-center justify-center relative transition-all duration-300 ${activePath === 0 ? 'border-blue-500 scale-110' : 'border-slate-200 dark:border-slate-700 scale-100'}`}>
                                    <Globe className={`w-8 h-8 ${activePath === 0 ? 'text-blue-500' : 'text-slate-500'}`} />
                                    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur">Webhook Trigger</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Reasoning Agent (Top Middle) */}
                        <div className="absolute left-[50%] top-[30%] -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative group/node">
                                <div className={`absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl transition-all duration-500 ${activePath === 1 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
                                <div className={`w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 shadow-2xl flex items-center justify-center relative transition-all duration-300 ${activePath === 1 ? 'border-cyan-500 scale-110' : 'border-slate-200 dark:border-slate-700 scale-100'}`}>
                                    <Bot className={`w-10 h-10 ${activePath === 1 ? 'text-cyan-500' : 'text-slate-500'}`} />
                                    
                                    {/* Action Popup */}
                                    <div className={`absolute -top-12 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg shadow-xl transition-all duration-300 ${activePath === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                        <Sparkles className="w-3 h-3 inline mr-1 text-cyan-400" />
                                        Reasoning...
                                    </div>
                                    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur">Support Agent</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. API Action (Bottom Middle) */}
                        <div className="absolute left-[50%] top-[70%] -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative group/node">
                                <div className={`absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl transition-all duration-500 ${activePath === 3 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
                                <div className={`w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 shadow-2xl flex items-center justify-center relative transition-all duration-300 ${activePath === 3 ? 'border-emerald-500 scale-110' : 'border-slate-200 dark:border-slate-700 scale-100'}`}>
                                    <Github className={`w-8 h-8 ${activePath === 3 ? 'text-emerald-500' : 'text-slate-500'}`} />
                                    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur">GitHub API</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Output / Database (Right) */}
                        <div className="absolute left-[75%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative group/node">
                                <div className={`absolute -inset-4 bg-blue-600/20 rounded-full blur-xl transition-all duration-500 ${activePath === 2 || activePath === 0 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
                                <div className={`w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 shadow-2xl flex items-center justify-center relative transition-all duration-300 ${activePath === 2 || activePath === 0 ? 'border-blue-600 scale-110' : 'border-slate-200 dark:border-slate-700 scale-100'}`}>
                                    <Database className={`w-10 h-10 ${activePath === 2 || activePath === 0 ? 'text-blue-600' : 'text-slate-500'}`} />
                                    
                                    {/* Success Popup */}
                                    <div className={`absolute -top-12 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl transition-all duration-300 ${activePath === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                        ✓ Record Updated
                                    </div>
                                    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur">PostgreSQL</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Embedded Keyframe definition for SVG dash animation */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}} />
        </section>
    );
};

export default VisualWorkflowShowcase;
