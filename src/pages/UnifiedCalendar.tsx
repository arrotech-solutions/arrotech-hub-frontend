import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Plus,
    Loader2, MapPin, CheckSquare,
    MoreHorizontal, LayoutGrid, Menu, Sparkles, Clock, Zap,
    ArrowRight
} from 'lucide-react';
import apiService from '../services/api';
import { ClickUpLogo, TrelloLogo, JiraLogo } from '../components/BrandIcons';
import CreateEventModal from '../components/dashboard/CreateEventModal';
import EventDetailsModal from '../components/dashboard/EventDetailsModal';

interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    endTime?: string;
    duration: string;
    type: 'google' | 'outlook';
    location?: string;
    isOnline?: boolean;
    platform?: 'zoom' | 'teams' | 'meet';
    attendees: string[];
    date: Date;
    color?: string;
}

interface Task {
    id: string;
    title: string;
    subtitle: string;
    platform: 'clickup' | 'jira' | 'trello' | 'asana';
    status: string;
}

const UnifiedCalendar: React.FC = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [taskLoading, setTaskLoading] = useState(false);

    // Responsive State
    const [showSidebar, setShowSidebar] = useState(true);
    const [showTaskTray, setShowTaskTray] = useState(true);

    // Filter State
    const [calendarFilters, setCalendarFilters] = useState<{ [key: string]: boolean }>({ google: true, outlook: true });

    // Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // V2 UI States
    const [focusMode, setFocusMode] = useState(false);
    const [taskFilter, setTaskFilter] = useState('All');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setShowSidebar(false);
                setShowTaskTray(false);
            } else {
                setShowSidebar(true);
                setShowTaskTray(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- FETCHING LOGIC (Preserved) ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setTaskLoading(true);
        try {
            const connectionsRes = await apiService.getConnections();
            // Default to empty array if data is missing
            const activePlatforms = connectionsRes.data?.map((c: any) => c.platform) || [];

            const eventPromises = [];
            const taskPromises = [];

            // 1. Events (Google Calendar)
            if ((activePlatforms.includes('google_workspace') || activePlatforms.includes('google_calendar')) && calendarFilters.google) {
                const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                start.setDate(start.getDate() - 7); // Buffer
                const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
                end.setDate(end.getDate() + 7); // Buffer

                eventPromises.push(apiService.executeMCPTool('google_workspace_calendar', {
                    operation: 'list_events',
                    time_min: start.toISOString(),
                    time_max: end.toISOString(),
                    max_results: 200
                }).then(res => ({ type: 'google', res })));
            }


            // 2. Tasks
            if (activePlatforms.includes('clickup')) {
                taskPromises.push(apiService.executeMCPTool('clickup_task_management', { operation: 'get_teams' })
                    .then(async (teamsRes) => {
                        const teams = teamsRes.data?.teams || teamsRes.result?.teams || [];
                        if (teams.length > 0) return { type: 'clickup', res: await apiService.executeMCPTool('clickup_task_management', { operation: 'get_team_tasks', team_id: teams[0].id, include_closed: false }) };
                        return { type: 'clickup', res: null };
                    }));
            }
            if (activePlatforms.includes('jira')) {
                // Use broader JQL from UnifiedTaskView
                taskPromises.push(apiService.executeMCPTool('jira_issue_tracking', { action: 'search_issues', jql: 'updated >= -30d order by updated DESC' }).then(res => ({ type: 'jira', res })));
            }
            if (activePlatforms.includes('trello')) {
                taskPromises.push(apiService.executeMCPTool('trello_project_management', { action: 'search_cards', query: 'is:open' }).then(res => ({ type: 'trello', res })));
            }

            const [eventResults, taskResults] = await Promise.all([
                Promise.allSettled(eventPromises),
                Promise.allSettled(taskPromises)
            ]);

            // Process Events
            const newEvents: CalendarEvent[] = [];
            eventResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value?.res) {
                    const { res } = result.value;
                    const data = res.data || res.result;
                    if (data?.events) {
                        newEvents.push(...data.events.map((e: any) => ({
                            id: e.id,
                            title: e.summary || 'No Title',
                            date: new Date(e.start?.dateTime || e.start?.date || new Date()),
                            time: e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
                            endTime: e.end?.dateTime ? new Date(e.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                            duration: '1h',
                            type: 'google',
                            isOnline: !!e.meet_link || !!(e.description || '').includes('zoom'),
                            platform: (e.meet_link ? 'meet' : (e.description || '').includes('zoom') ? 'zoom' : (e.description || '').includes('teams') ? 'teams' : undefined),
                            location: e.location,
                            attendees: [],
                            color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        })));
                    }
                }
            });

            // Process Tasks
            const newTasks: Task[] = [];
            taskResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value?.res) {
                    const { type, res } = result.value;
                    const data = res.data || res.result; // Handle { data: ... } or { result: ... } or direct

                    if (type === 'clickup' && data?.tasks) {
                        data.tasks.forEach((t: any) => {
                            const status = (t.status?.status || '').toLowerCase();
                            if (!status.includes('closed') && !status.includes('done') && !status.includes('complete')) {
                                newTasks.push({ id: t.id, title: t.name, subtitle: t.list?.name || 'ClickUp', platform: 'clickup', status: t.status.status });
                            }
                        });
                    } else if (type === 'jira') {
                        const issues = data?.issues || data?.data?.issues || []; // Robust check
                        issues.forEach((i: any) => {
                            // Use UnifiedTaskView mapping logic
                            const statusRaw = i.status || '';
                            const statusLower = statusRaw.toLowerCase();
                            if (!statusLower.includes('done') && !statusLower.includes('complete') && !statusLower.includes('closed') && !statusLower.includes('resolved')) {
                                newTasks.push({ id: i.key, title: i.summary || 'Issue', subtitle: i.project || 'Jira', platform: 'jira', status: i.status || 'Open' });
                            }
                        });
                    } else if (type === 'trello') {
                        const cards = data?.cards || data?.data?.cards || []; // Robust check
                        cards.forEach((c: any) => {
                            // Use UnifiedTaskView mapping logic
                            const listName = (c.list?.name || c.listName || '').toLowerCase();
                            if (!listName.includes('done') && !listName.includes('complete') && !listName.includes('closed')) {
                                newTasks.push({ id: c.id, title: c.name, subtitle: c.board?.name || 'Trello', platform: 'trello', status: c.listName || c.list?.name || 'Card' });
                            }
                        });
                    }
                }
            });

            setEvents(newEvents);
            setTasks(newTasks);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setTaskLoading(false);
        }
    }, [viewDate, calendarFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- GRID HELPERS (Preserved) ---
    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

        const days: (Date | null)[] = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        const remainingCells = 7 - (days.length % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                days.push(null);
            }
        }

        return days;
    };

    const getWeekDays = (date: Date) => {
        const current = new Date(date);
        const day = current.getDay();
        const diff = current.getDate() - day;
        const startOfWeek = new Date(current.setDate(diff));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const getHours = () => {
        const hours = [];
        for (let i = 0; i < 24; i++) hours.push(i);
        return hours;
    };

    const next = () => {
        const d = new Date(viewDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
        if (viewMode === 'week') d.setDate(d.getDate() + 7);
        if (viewMode === 'day') d.setDate(d.getDate() + 1);
        setViewDate(d);
    };

    const prev = () => {
        const d = new Date(viewDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
        if (viewMode === 'week') d.setDate(d.getDate() - 7);
        if (viewMode === 'day') d.setDate(d.getDate() - 1);
        setViewDate(d);
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const getPlatformIcon = (platform: string) => {
        if (platform === 'clickup') return <ClickUpLogo className="w-3.5 h-3.5" />;
        if (platform === 'jira') return <JiraLogo className="w-3.5 h-3.5" />;
        if (platform === 'trello') return <TrelloLogo className="w-3.5 h-3.5" />;
        return <CheckSquare className="w-3.5 h-3.5" />;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // --- LAYOUT HELPER FOR OVERLAPS ---
    const calculateEventLayout = (eventsForDay: CalendarEvent[]) => {
        // 1. Sort by start time, then duration
        const sortedEvents = [...eventsForDay].sort((a, b) => {
            const startA = a.date.getHours() * 60 + a.date.getMinutes();
            const startB = b.date.getHours() * 60 + b.date.getMinutes();
            if (startA !== startB) return startA - startB;
            return 0; // Simple sort
        });

        // 2. Simple column packing (Greedy)
        const columns: CalendarEvent[][] = [];
        const layout: { [key: string]: { left: string; width: string } } = {};

        sortedEvents.forEach(event => {
            const startTime = event.date.getHours() * 60 + event.date.getMinutes();

            // Find first column where this event fits without overlapping
            let colIndex = -1;
            for (let i = 0; i < columns.length; i++) {
                const lastEventInCol = columns[i][columns[i].length - 1];
                const lastEventStart = lastEventInCol.date.getHours() * 60 + lastEventInCol.date.getMinutes();
                const lastEventEnd = lastEventStart + 60; // Simplified assumption

                if (startTime >= lastEventEnd) {
                    colIndex = i;
                    break;
                }
            }

            if (colIndex !== -1) {
                columns[colIndex].push(event);
            } else {
                columns.push([event]);
                colIndex = columns.length - 1;
            }
        });

        // 3. Assign widths based on total columns overlapping at any point (Simplified: Just share space equally based on total columns)
        // A more robust algo would be distinct clusters, but for now, equal width per column
        const totalCols = columns.length;
        sortedEvents.forEach(e => {
            // Find which column e is in
            const colIdx = columns.findIndex(col => col.includes(e));
            if (colIdx !== -1) {
                layout[e.id] = {
                    left: `${(colIdx / totalCols) * 100}%`,
                    width: `${95 / totalCols}%` // Leave a tiny gap
                };
            }
        });

        return layout;
    };


    return (
        <div className={`flex h-screen bg-slate-50 relative overflow-hidden font-sans transition-colors duration-500 ${focusMode ? 'bg-slate-900 text-white' : 'text-slate-900'}`}>
            {/* Ambient Background - "Glassmorphism Command Center" Vibe */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${focusMode ? 'opacity-20' : 'opacity-100'}`}>
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/60 to-transparent" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px]" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {(showSidebar || showTaskTray) && (
                <div
                    className="lg:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => { setShowSidebar(false); setShowTaskTray(false); }}
                />
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative z-10 min-w-0 transition-all duration-300">

                {/* 1. SUPERIOR HEADER (Smart Input & Navigation) */}
                <div className={`
                    h-20 px-6 flex items-center justify-between sticky top-0 z-30 transition-all duration-300 overflow-x-auto no-scrollbar gap-4
                    ${focusMode ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/70 border-b border-white/50'}
                    backdrop-blur-xl
                `}>
                    <div className="flex items-center gap-6">
                        {/* Toggle Sidebar Trigger (Mobile/Desktop) */}
                        <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-xl transition-all ${focusMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-slate-500'}`}>
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Title & Nav */}
                        <div className="flex items-center gap-4">
                            <h2 className={`text-2xl font-bold tracking-tight ${focusMode ? 'text-white' : 'text-slate-900'}`}>
                                {monthNames[viewDate.getMonth()]} <span className="font-normal opacity-60">{viewDate.getFullYear()}</span>
                            </h2>
                            <div className="flex items-center gap-1">
                                <button onClick={prev} className={`p-1.5 rounded-lg transition-all ${focusMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-slate-600'}`}><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={next} className={`p-1.5 rounded-lg transition-all ${focusMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-slate-600'}`}><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <button
                                onClick={() => { setViewDate(new Date()); setViewMode('day'); }}
                                className={`ml-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${focusMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:shadow-sm'}`}
                            >
                                Today
                            </button>
                        </div>
                    </div>

                    {/* Smart Input Bar - "Command Center" Feature */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity ${focusMode ? 'opacity-10' : ''}`} />
                        <div className={`relative flex items-center w-full h-11 px-4 rounded-2xl transition-all border ${focusMode ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-indigo-100 text-slate-700 placeholder-indigo-300 shadow-sm'}`}>
                            <Sparkles className={`w-4 h-4 mr-3 ${focusMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            <input
                                type="text"
                                placeholder="Ask AI to schedule... 'Lunch with Sarah tomorrow at 12'"
                                className="w-full bg-transparent border-none focus:outline-none text-sm font-medium"
                            />
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${focusMode ? 'bg-slate-700 text-slate-400' : 'bg-indigo-50 text-indigo-400'}`}>⌘K</span>
                            </div>
                        </div>
                    </div>

                    {/* View Toggles & Actions */}
                    <div className="flex items-center gap-3">
                        <div className={`flex p-1 rounded-xl border ${focusMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                            {(['month', 'week', 'day'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setViewMode(m)}
                                    className={`
                                        px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all
                                        ${viewMode === m
                                            ? (focusMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-indigo-600 shadow-sm')
                                            : (focusMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}
                                    `}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className={`p-2.5 rounded-xl border transition-all ${focusMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-100'}`}
                            title="Toggle Focus Mode"
                        >
                            <Zap className={`w-4 h-4 ${focusMode ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={() => setShowTaskTray(!showTaskTray)}
                            className={`p-2.5 rounded-xl border transition-all ${showTaskTray ? (focusMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600') : (focusMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-gray-200 text-gray-500')}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsEventModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">Create</span>
                        </button>
                    </div>
                </div>

                {/* 2. CALENDAR GRID AREA */}
                <div className="flex-1 overflow-hidden relative flex">
                    {loading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    )}
                    {/* Left Mini Sidebar (Collapsible) */}
                    <div className={`
                        transition-all duration-300 ease-in-out border-r flex-col
                        ${showSidebar ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4 overflow-hidden'}
                        ${focusMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/40 border-white/40'}
                        backdrop-blur-xl hidden lg:flex
                    `}>
                        <div className="p-6">
                            <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${focusMode ? 'text-slate-500' : 'text-gray-400'}`}>Mini Calendar</div>
                            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs mb-6">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className={`font-medium ${focusMode ? 'text-slate-500' : 'text-gray-400'}`}>{d}</div>)}
                                {getMonthDays(viewDate).map((d, i) => (
                                    <div key={i}
                                        onClick={() => d && setViewDate(d)}
                                        className={`
                                            w-7 h-7 flex items-center justify-center rounded-full mx-auto transition-all
                                            ${!d ? '' : 'cursor-pointer'}
                                            ${d && isToday(d) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : ''}
                                            ${d && !isToday(d) && (focusMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-indigo-50')}
                                        `}
                                    >
                                        {d ? d.getDate() : ''}
                                    </div>
                                ))}
                            </div>

                            <div className={`h-px w-full my-6 ${focusMode ? 'bg-slate-800' : 'bg-indigo-50'}`} />

                            <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${focusMode ? 'text-slate-500' : 'text-gray-400'}`}>Calendars</div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${calendarFilters.google ? 'bg-indigo-500 border-indigo-500' : (focusMode ? 'border-slate-600' : 'border-gray-300')}`}>
                                        {calendarFilters.google && <ArrowRight className="w-3 h-3 text-white -rotate-45" />}
                                    </div>
                                    <input type="checkbox" checked={calendarFilters.google} onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))} className="hidden" />
                                    <span className={`w-2 h-2 rounded-full bg-indigo-500 ${!calendarFilters.google ? 'opacity-50' : ''}`} />
                                    <span className={`transition-colors ${focusMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>Work</span>
                                </label>
                                <label className="flex items-center gap-3 text-sm font-medium cursor-not-allowed opacity-50">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${focusMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`} />
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className={`${focusMode ? 'text-slate-500' : 'text-gray-400'}`}>Personal</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* V2 Calendar Views */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar relative">
                        {/* MONTH VIEW V2 */}
                        {viewMode === 'month' && (
                            <div className="h-full flex flex-col min-w-[800px] lg:min-w-0">
                                <div className={`grid grid-cols-7 border-b ${focusMode ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-white/60 border-indigo-50/50 text-gray-500'} backdrop-blur-sm sticky top-0 z-10`}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-widest opacity-70">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                                    {getMonthDays(viewDate).map((date, i) => {
                                        if (!date) return <div key={i} className={`border-b border-r ${focusMode ? 'border-slate-800/50 bg-slate-800/20' : 'border-indigo-50/30 bg-indigo-50/10'} ${i % 7 === 6 ? 'border-r-0' : ''}`} />;

                                        const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());
                                        const isCurrentMonth = date.getMonth() === viewDate.getMonth();

                                        return (
                                            <div key={i} onClick={() => date && setViewDate(date)} className={`
                                                relative border-b border-r p-2 transition-all duration-200 group
                                                ${focusMode ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-indigo-50/50 hover:bg-white/80'}
                                                ${i % 7 === 6 ? 'border-r-0' : ''}
                                                ${!isCurrentMonth ? 'opacity-40 grayscale' : ''}
                                            `}>
                                                <div className={`
                                                    w-7 h-7 mb-2 flex items-center justify-center rounded-full text-sm font-semibold transition-all
                                                    ${isToday(date)
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110'
                                                        : (focusMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-700 group-hover:text-indigo-600 group-hover:bg-indigo-50')}
                                                `}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1.5">
                                                    {dayEvents.slice(0, 4).map(e => (
                                                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }} className={`
                                                            group/event flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-[1.02]
                                                            ${focusMode ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20' : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 hover:shadow-sm'}
                                                        `}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${focusMode ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
                                                            <span className="truncate font-semibold">{e.time.replace(':00 ', ' ')}</span>
                                                            <span className="truncate opacity-80">{e.title}</span>
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 4 && (
                                                        <div className={`text-[10px] font-bold px-2 ${focusMode ? 'text-slate-500' : 'text-slate-400'}`}>+{dayEvents.length - 4} more</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* WEEK VIEW V2 */}
                        {viewMode === 'week' && (
                            <div className="flex flex-col h-full min-w-[800px] lg:min-w-0">
                                <div className={`grid grid-cols-8 border-b sticky top-0 z-20 ${focusMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/80 border-indigo-50'} backdrop-blur-md`}>
                                    <div className={`p-4 text-center text-xs font-bold border-r ${focusMode ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-indigo-50'}`}>UTC+3</div>
                                    {getWeekDays(viewDate).map((d, i) => (
                                        <div key={i}
                                            onClick={() => setViewDate(d)}
                                            className={`py-3 text-center border-r cursor-pointer transition-colors ${focusMode ? 'border-slate-800 hover:bg-slate-800' : 'border-indigo-50 hover:bg-indigo-50'} ${i === 6 ? 'border-r-0' : ''}`}>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${focusMode ? 'text-slate-500' : 'text-indigo-400'}`}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</div>
                                            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold transition-all ${isToday(d) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : (focusMode ? 'text-slate-200' : 'text-slate-800')}`}>{d.getDate()}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                                    <div className="grid grid-cols-8 auto-rows-[60px]">
                                        {/* Time Column with Current Time Line Mockup */}
                                        <div className={`col-span-1 border-r ${focusMode ? 'border-slate-800 bg-slate-800/20' : 'border-indigo-50 bg-indigo-50/30'}`}>
                                            {getHours().map(h => (
                                                <div key={h} className={`h-[60px] text-[10px] font-medium p-2 text-right -mt-2.5 ${focusMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Days Columns */}
                                        {getWeekDays(viewDate).map((d, colIndex) => (
                                            <div key={colIndex} className={`col-span-1 border-r relative group ${focusMode ? 'border-slate-800 hover:bg-white/5' : 'border-indigo-50 hover:bg-indigo-50/30'}`}>
                                                {getHours().map(h => (
                                                    <div key={h} className={`h-[60px] border-b ${focusMode ? 'border-slate-800/50' : 'border-indigo-50/50'}`} />
                                                ))}

                                                {/* Current Time Indicator for Today */}
                                                {isToday(d) && (
                                                    <div className="absolute w-full h-0.5 bg-red-500 z-20 pointer-events-none" style={{ top: '45%' }}>
                                                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                                                    </div>
                                                )}

                                                {(() => {
                                                    const dayEvents = events.filter(e => e.date.toDateString() === d.toDateString());
                                                    const layout = calculateEventLayout(dayEvents);

                                                    return dayEvents.map(e => {
                                                        const startHour = e.date.getHours();
                                                        const startMin = e.date.getMinutes();
                                                        const top = startHour * 60 + startMin;
                                                        const style = layout[e.id] || { left: '4px', width: '95%' };

                                                        return (
                                                            <div key={e.id}
                                                                onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                                                                className={`
                                                                    absolute p-2 rounded-xl border z-10 
                                                                    cursor-pointer transition-all hover:scale-[1.03] hover:z-20
                                                                    flex flex-col justify-center overflow-hidden
                                                                    ${focusMode
                                                                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 hover:bg-indigo-600/30 shadow-lg shadow-black/20'
                                                                        : 'bg-white/90 border-indigo-100 text-indigo-900 hover:bg-indigo-50 hover:border-indigo-200 shadow-md shadow-indigo-100'}
                                                                `}
                                                                style={{
                                                                    top: `${top}px`,
                                                                    height: '56px',
                                                                    left: style.left,
                                                                    width: style.width
                                                                }}
                                                            >
                                                                <div className="font-bold text-xs truncate leading-tight mb-0.5">{e.title}</div>
                                                                <div className={`text-[10px] truncate flex items-center gap-1 ${focusMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {e.time}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DAY VIEW V2 */}
                        {viewMode === 'day' && (
                            <div className="flex flex-col h-full">
                                <div className={`p-6 border-b flex items-center justify-center ${focusMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/80 border-indigo-50'}`}>
                                    <div className="text-center">
                                        <div className={`text-sm font-bold uppercase tracking-widest mb-1 ${focusMode ? 'text-slate-500' : 'text-indigo-400'}`}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][viewDate.getDay()]}</div>
                                        <div className={`text-4xl font-extrabold ${focusMode ? 'text-white' : 'text-slate-900'}`}>{viewDate.getDate()}</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                                    <div className="flex min-h-[1440px]">
                                        <div className={`w-20 border-r shrink-0 ${focusMode ? 'border-slate-800 bg-slate-800/20' : 'border-indigo-50 bg-indigo-50/30'}`}>
                                            {getHours().map(h => (
                                                <div key={h} className={`h-[60px] text-xs font-medium p-3 text-right ${focusMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`flex-1 relative ${focusMode ? 'bg-slate-900' : 'bg-white'}`}>
                                            {getHours().map(h => (
                                                <div key={h} className={`h-[60px] border-b ${focusMode ? 'border-slate-800/50' : 'border-indigo-50/50'}`} />
                                            ))}
                                            {(() => {
                                                const dayEvents = events.filter(e => e.date.toDateString() === viewDate.toDateString());
                                                const layout = calculateEventLayout(dayEvents);

                                                return dayEvents.map(e => {
                                                    const startHour = e.date.getHours();
                                                    const startMin = e.date.getMinutes();
                                                    const top = startHour * 60 + startMin;
                                                    const style = layout[e.id] || { left: '0%', width: '100%' };

                                                    return (
                                                        <div key={e.id}
                                                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                                                            className={`
                                                                 absolute p-4 rounded-2xl border z-10 shadow-lg cursor-pointer
                                                                 transition-all hover:scale-[1.01] hover:-translate-y-1
                                                                 ${focusMode ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-indigo-900/20' : 'bg-white border-indigo-100 text-indigo-900 shadow-indigo-100/50'}
                                                             `}
                                                            style={{
                                                                top: `${top}px`,
                                                                height: '100px',
                                                                left: `calc(${style.left} + 1rem)`,
                                                                width: `calc(${style.width} - 2rem)`
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-bold text-base mb-1">{e.title}</h3>
                                                                    <div className={`flex items-center gap-2 text-xs font-medium ${focusMode ? 'text-indigo-300' : 'text-indigo-500'}`}>
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        {e.time} - {e.endTime}
                                                                    </div>
                                                                </div>
                                                                {e.isOnline && (
                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${focusMode ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                        Online
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {e.location && (
                                                                <div className={`flex items-center gap-1.5 mt-3 text-xs ${focusMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                    <MapPin className="w-3.5 h-3.5" /> {e.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. AMIE-STYLE TASK SIDEBAR (Right) */}
                    <div className={`
                         transition-all duration-300 border-l flex flex-col z-20
                         ${showTaskTray ? 'w-[340px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-4 overflow-hidden'}
                         ${focusMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/60 border-indigo-50'}
                         backdrop-blur-xl hidden lg:flex
                    `}>
                        <div className={`p-5 border-b flex items-center justify-between ${focusMode ? 'border-slate-800' : 'border-indigo-50'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${focusMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <CheckSquare className="w-4 h-4" />
                                </div>
                                <h3 className={`font-bold ${focusMode ? 'text-white' : 'text-slate-900'}`}>Unscheduled Tasks</h3>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{tasks.length}</span>
                        </div>

                        {/* Task Filters */}
                        <div className="px-4 py-3 flex gap-2 overflow-x-auto custom-scrollbar">
                            {['All', 'ClickUp', 'Jira', 'Trello'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTaskFilter(f)}
                                    className={`
                                   px-3 py-1 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap
                                   ${taskFilter === f
                                            ? (focusMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                            : (focusMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600')}
                               `}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {taskLoading ? (
                                <div className="flex flex-col items-center justify-center h-40 opacity-50">
                                    <Loader2 className={`w-6 h-6 animate-spin ${focusMode ? 'text-white' : 'text-indigo-600'}`} />
                                </div>
                            ) : (
                                tasks
                                    .filter(t => taskFilter === 'All' || t.platform.toLowerCase() === taskFilter.toLowerCase())
                                    .map(task => (
                                        <div key={task.id} className={`
                                        group relative p-4 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing
                                        ${focusMode
                                                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/30 text-slate-300'
                                                : 'bg-white/80 border-indigo-50 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40'}
                                    `}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    {getPlatformIcon(task.platform)}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${focusMode ? 'bg-slate-900 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                                                        {task.platform}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className={`text-sm font-semibold mb-1 leading-snug line-clamp-2 ${focusMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-800 group-hover:text-emerald-600'}`}>
                                                {task.title}
                                            </h4>
                                            <p className={`text-xs truncate ${focusMode ? 'text-slate-500' : 'text-slate-400'}`}>{task.subtitle}</p>

                                            {/* Drag Handle Visual */}
                                            <div className={`absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity ${focusMode ? 'text-slate-600' : 'text-gray-300'}`}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))
                            )}

                            {/* Empty State */}
                            {!taskLoading && tasks.length === 0 && (
                                <div className={`text-center py-10 ${focusMode ? 'text-slate-600' : 'text-gray-300'}`}>
                                    <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">All caught up!</p>
                                </div>
                            )}
                        </div>

                        {/* Task Footer */}
                        <div className={`p-4 border-t ${focusMode ? 'border-slate-800 bg-slate-900/50' : 'border-indigo-50 bg-gray-50/50'}`}>
                            <button className={`w-full py-2.5 rounded-xl font-semibold text-xs border border-dashed transition-all flex items-center justify-center gap-2 ${focusMode ? 'border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500/50' : 'border-gray-300 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>
                                <Plus className="w-3.5 h-3.5" /> Add Task Manually
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${focusMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${focusMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; }
            `}</style>

            <CreateEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onEventCreated={fetchData}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                focusMode={focusMode}
            />
        </div>
    );
};

export default UnifiedCalendar;
