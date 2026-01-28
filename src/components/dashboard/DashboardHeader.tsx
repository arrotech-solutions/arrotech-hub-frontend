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
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl overflow-hidden relative group dashboard-header-tut">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500" />

            <div className="relative p-6 px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Greeting & Time */}
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
                        {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{userName}</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-medium ml-1 flex items-center gap-2">
                        <span>{formattedTime}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-gray-400 text-base">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </p>
                </div>

                {/* Right: Focus Toggle */}
                <div className="flex items-center gap-4">
                    <div onClick={onToggleFocusMode} className={`cursor-pointer group/toggle flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${isFocusMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-white/60 border-white/60 text-gray-600 hover:bg-white hover:shadow-md'}`}>
                        <div className={`p-1.5 rounded-full transition-colors ${isFocusMode ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover/toggle:text-indigo-500'}`}>
                            <Zap className={`w-4 h-4 ${isFocusMode ? 'fill-current' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold leading-none">Focus Mode</span>
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${isFocusMode ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {isFocusMode ? 'Active' : 'Off'}
                            </span>
                        </div>

                        {/* Switch Visual */}
                        <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${isFocusMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isFocusMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
