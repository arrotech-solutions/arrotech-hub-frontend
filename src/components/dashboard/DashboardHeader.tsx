import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface DashboardHeaderProps {
    userName: string;
    isFocusMode: boolean;
    onToggleFocusMode: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    userName,
    isFocusMode,
    onToggleFocusMode
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Time-based greeting
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formattedTime = currentTime.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl overflow-hidden relative group dashboard-header-tut transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-500/10 dark:via-transparent dark:to-purple-500/10 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500" />

            <div className="relative p-6 px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Greeting & Time */}
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white tracking-tight transition-colors">
                        {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-700 to-primary-500 dark:from-indigo-400 dark:to-purple-400">{userName}</span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-slate-400 font-medium ml-1 flex items-center gap-2 transition-colors">
                        <span>{formattedTime}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-700"></span>
                        <span className="text-gray-400 dark:text-slate-500 text-base">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </p>
                </div>

                {/* Right: Focus Toggle */}
                <div className="flex items-center gap-4 z-10">
                    <div onClick={onToggleFocusMode} className={`cursor-pointer group/toggle flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-300 ${isFocusMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30'}`}>
                        <div className={`p-2 rounded-xl transition-all ${isFocusMode ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 group-hover/toggle:text-indigo-500 group-hover/toggle:bg-indigo-50 dark:group-hover/toggle:bg-indigo-500/10'}`}>
                            <Zap className={`w-4 h-4 ${isFocusMode ? 'fill-current' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold leading-none tracking-tight transition-colors">Focus Mode</span>
                            <span className={`text-[10px] uppercase tracking-[0.15em] font-black mt-1 transition-colors ${isFocusMode ? 'text-indigo-200' : 'text-gray-400 dark:text-slate-500'}`}>
                                {isFocusMode ? 'Activated' : 'Off'}
                            </span>
                        </div>

                        {/* Switch Visual */}
                        <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${isFocusMode ? 'bg-indigo-900/40 dark:bg-black/40' : 'bg-gray-200 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ease-spring ${isFocusMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
