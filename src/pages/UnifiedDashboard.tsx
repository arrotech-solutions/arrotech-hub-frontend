import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import UnifiedInboxTile from '../components/dashboard/UnifiedInboxTile';
import TaskHubTile from '../components/dashboard/TaskHubTile';
import CommandPalette from '../components/dashboard/CommandPalette';

import CalendarHubTile from '../components/dashboard/CalendarHubTile';
import ComposeMessageModal from '../components/dashboard/ComposeMessageModal';
import CreateTaskModal from '../components/dashboard/CreateTaskModal';
import apiService from '../services/api';

const UnifiedDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [connections, setConnections] = useState<any[]>([]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await apiService.getConnections();
                if (res.data) {
                    setConnections(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch connections", err);
            }
        };
        fetchConnections();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 relative">
            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

            <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">
                {/* Header Row */}
                <div className="dashboard-header-tut">
                    <DashboardHeader
                        userName={user?.name || 'User'}
                        isFocusMode={isFocusMode}
                        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                    />
                </div>

                {/* Main Grid Layout (Bento Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* Left Column: Inbox (Span 7, Height 2 rows) */}
                    <div className="lg:col-span-7 lg:row-span-2 h-[544px] unified-inbox-tut">
                        <UnifiedInboxTile onCompose={() => setIsComposeOpen(true)} />
                    </div>

                    {/* Right Column Top: Calendar (Span 5, Height 1 row) */}
                    <div className="lg:col-span-5 h-[240px] calendar-hub-tut">
                        <CalendarHubTile />
                    </div>

                    {/* Right Column Middle: Task Hub (Span 5, Height 1 row) */}
                    <div className="lg:col-span-5 h-[280px] task-hub-tut">
                        <TaskHubTile onCreateTask={() => setIsCreateTaskOpen(true)} />
                    </div>


                </div>
            </div>

            {/* Modals */}
            <ComposeMessageModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
            <CreateTaskModal
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
                connections={connections}
                onTaskCreated={() => { }} // Force refresh logic would go here via context/prop
            />

            {/* Global Command Palette */}
            <CommandPalette
                onCreateTask={() => setIsCreateTaskOpen(true)}
                onComposeMessage={() => setIsComposeOpen(true)}
            />
        </div>
    );
};

export default UnifiedDashboard;
