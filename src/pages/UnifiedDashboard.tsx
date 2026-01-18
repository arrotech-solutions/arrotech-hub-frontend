import React from 'react';
import InboxWidget from '../components/dashboard/InboxWidget';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import TaskWidget from '../components/dashboard/TaskWidget';
import QuickActions from '../components/dashboard/QuickActions';

const UnifiedDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Workspace
                        </h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Your centralized command center for daily operations.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>System Operational</span>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <QuickActions />

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left Column: Inbox (Span 7) */}
                    <div className="lg:col-span-7 space-y-6">
                        <InboxWidget />
                    </div>

                    {/* Right Column: Calendar & Tasks (Span 5) */}
                    <div className="lg:col-span-5 flex flex-col space-y-6">
                        <CalendarWidget />
                        <TaskWidget />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedDashboard;
