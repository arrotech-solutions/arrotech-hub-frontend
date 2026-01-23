import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, RefreshCw,
    Loader2, Video, MapPin, Search, CheckSquare,
    MoreHorizontal, LayoutGrid, Menu
} from 'lucide-react';
import apiService from '../services/api';
import { ClickUpLogo, TrelloLogo, JiraLogo } from '../components/BrandIcons';
import CreateEventModal from '../components/dashboard/CreateEventModal';

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

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
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

    // --- FETCHING LOGIC ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setTaskLoading(true);
        try {
            const connectionsRes = await apiService.getConnections();
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

    // --- GRID HELPERS ---
    // Returns (Date | null) array, sparse
    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

        const days: (Date | null)[] = [];

        // Pad start with nulls (empty cells for previous month)
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        // Pad end to complete the last week row
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
        if (platform === 'clickup') return <ClickUpLogo className="w-3 h-3" />;
        if (platform === 'jira') return <JiraLogo className="w-3 h-3" />;
        if (platform === 'trello') return <TrelloLogo className="w-3 h-3" />;
        return <CheckSquare className="w-3 h-3" />;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="flex h-screen bg-slate-50 text-gray-900 overflow-hidden font-sans relative">

            {(showSidebar || showTaskTray) && (
                <div
                    className="md:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => { setShowSidebar(false); setShowTaskTray(false); }}
                />
            )}

            {showSidebar && (
                <div className="fixed inset-y-0 left-0 z-50 md:relative md:z-0 w-64 flex flex-col border-r border-gray-100 bg-white/95 backdrop-blur-xl md:bg-gray-50/50 shadow-2xl md:shadow-none animate-in slide-in-from-left-4 duration-300">
                    <div className="p-6">
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-indigo-600" />
                            Calendar
                        </h1>
                    </div>

                    <div className="px-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                            <div className="flex gap-1">
                                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-500 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                            {/* Mini Calendar also sparse for consistency */}
                            {getMonthDays(viewDate).map((d, i) => {
                                const isDay = !!d;
                                return (
                                    <div key={i}
                                        onClick={() => d && setViewDate(d)}
                                        className={`
                                        w-6 h-6 flex items-center justify-center rounded-full mx-auto 
                                        ${isDay ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default'}
                                        ${d && isToday(d) ? 'bg-indigo-600 text-white font-bold hover:bg-indigo-700' : ''}
                                        ${!isDay ? '' : 'text-gray-700'}
                                     `}>
                                        {d ? d.getDate() : ''}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">My Calendars</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={calendarFilters.google}
                                    onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className={`w-2 h-2 rounded-full bg-indigo-500 ${!calendarFilters.google ? 'opacity-50' : ''}`}></span>
                                <span className="group-hover:text-gray-900 transition-colors">Work (Google)</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-gray-400 cursor-not-allowed group" title="Not connected">
                                <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 opacity-50" />
                                <span className="w-2 h-2 rounded-full bg-purple-500 opacity-50"></span>
                                <span className="transition-colors">Personal (Outlook)</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col bg-white relative min-w-0">
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white/80 backdrop-blur-sm sticky top-0 z-20 overflow-x-auto custom-scrollbar gap-4">
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900 whitespace-nowrap">
                                {viewMode === 'month' && `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                                {viewMode === 'week' && `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                                {viewMode === 'day' && `${monthNames[viewDate.getMonth()]} ${viewDate.getDate()}, ${viewDate.getFullYear()}`}
                            </h2>
                            <div className="flex items-center gap-1 text-gray-500">
                                <button onClick={prev} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={next} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="flex items-center bg-gray-100/80 p-1 ml-4 shrink-0 rounded-xl border border-gray-200/50">
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}>Month</button>
                            <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}>Week</button>
                            <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-gray-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}>Day</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <button onClick={() => setIsEventModalOpen(true)} className="relative isolate overflow-hidden rounded-xl px-3 md:px-4 py-2 font-semibold text-white transition-all duration-300
                            bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700
                            before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100
                            after:absolute after:inset-0 after:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]
                            shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                            flex items-center gap-2 group">
                            <Plus className="w-4 h-4 relative z-10" />
                            <span className="hidden md:inline relative z-10">Create Event</span>
                        </button>
                        <button onClick={() => { setViewDate(new Date()); setViewMode('day'); }} className="px-3 md:px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-all hover:shadow-md active:scale-[0.98] whitespace-nowrap">
                            Today
                        </button>
                        <button onClick={() => setShowTaskTray(!showTaskTray)} className={`p-2 rounded-xl transition-all border shadow-sm hover:shadow-md active:scale-[0.98] ${showTaskTray ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button onClick={fetchData} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6">
                    <div className={`
                        bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col min-w-[600px] md:min-w-0 transition-all
                        ${viewMode === 'month' ? 'min-h-full' : 'h-full overflow-hidden'}
                    `}>
                        {/* MONTH VIEW */}
                        {viewMode === 'month' && (
                            <>
                                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="py-2 text-center text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 auto-rows-fr">
                                    {getMonthDays(viewDate).map((date, i) => {
                                        if (!date) {
                                            return (
                                                <div key={i} className={`
                                                border-b border-r border-gray-100 p-1 md:p-2 min-h-[100px] relative bg-gray-50/10
                                                ${i % 7 === 6 ? 'border-r-0' : ''}
                                            `} />
                                            );
                                        }

                                        const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());

                                        return (
                                            <div key={i} className={`
                                            border-b border-r border-gray-100 p-1 md:p-2 min-h-[100px] relative group hover:bg-gray-50/50 transition-all
                                            ${i % 7 === 6 ? 'border-r-0' : ''}
                                        `}>
                                                <div className="flex justify-between items-start mb-1 h-[24px]">
                                                    <span className={`text-xs md:text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full 
                                                    ${isToday(date) ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                                                        {date.getDate()}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    {dayEvents.slice(0, 4).map(e => (
                                                        <div key={e.id} className={`
                                                        text-[10px] px-1 md:px-2 py-1 rounded md:rounded-md border ${e.color} 
                                                        cursor-pointer truncate flex items-center gap-1 font-medium shadow-sm hover:shadow-md transition-all
                                                    `}>
                                                            {e.isOnline && <Video className="w-2 h-2 text-current opacity-70 hidden md:block" />}
                                                            <span className="truncate">{e.time.replace(':00 ', ' ')} <span className="hidden md:inline">{e.title}</span></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {/* WEEK VIEW */}
                        {viewMode === 'week' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/50">
                                    <div className="p-2 text-center text-xs font-semibold text-gray-400 border-r border-gray-200">GMT+3</div>
                                    {getWeekDays(viewDate).map((d, i) => (
                                        <div key={i} className={`p-2 text-center border-r border-gray-200 ${i === 6 ? 'border-r-0' : ''}`}>
                                            <div className="text-[10px] uppercase text-gray-500 font-semibold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</div>
                                            <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full mt-1 ${isToday(d) ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}>
                                                {d.getDate()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto relative">
                                    <div className="grid grid-cols-8 auto-rows-[60px]">
                                        <div className="col-span-1 border-r border-gray-200 bg-gray-50/20">
                                            {getHours().map(h => (
                                                <div key={h} className="h-[60px] border-b border-gray-100 text-[10px] text-gray-400 p-1 text-right relative -top-2">
                                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                                                </div>
                                            ))}
                                        </div>

                                        {getWeekDays(viewDate).map((d, colIndex) => (
                                            <div key={colIndex} className="col-span-1 border-r border-gray-100 relative">
                                                {getHours().map(h => (
                                                    <div key={h} className="h-[60px] border-b border-gray-100" />
                                                ))}
                                                {events
                                                    .filter(e => e.date.toDateString() === d.toDateString())
                                                    .map(e => {
                                                        const startHour = parseInt(e.time.split(':')[0]) + (e.time.includes('PM') && !e.time.startsWith('12') ? 12 : 0);
                                                        const top = isNaN(startHour) ? 0 : startHour * 60;
                                                        return (
                                                            <div key={e.id}
                                                                className={`absolute left-0.5 right-0.5 p-1 rounded border overflow-hidden text-[10px] ${e.color} z-10 shadow-sm`}
                                                                style={{ top: `${top}px`, height: '58px' }}
                                                            >
                                                                <div className="font-bold truncate">{e.title}</div>
                                                                <div className="truncate text-xs opacity-75">{e.time}</div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DAY VIEW */}
                        {viewMode === 'day' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-sm uppercase text-gray-500 font-semibold">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][viewDate.getDay()]}</div>
                                        <div className={`text-2xl font-bold inline-flex w-10 h-10 items-center justify-center rounded-full mt-1 ${isToday(viewDate) ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}>
                                            {viewDate.getDate()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto relative">
                                    <div className="flex relative min-h-[1440px]">
                                        <div className="w-16 md:w-20 border-r border-gray-200 bg-gray-50/20 shrink-0">
                                            {getHours().map(h => (
                                                <div key={h} className="h-[60px] border-b border-gray-100 text-xs text-gray-400 p-2 text-right">
                                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 relative">
                                            {getHours().map(h => (
                                                <div key={h} className="h-[60px] border-b border-gray-100" />
                                            ))}
                                            {events
                                                .filter(e => e.date.toDateString() === viewDate.toDateString())
                                                .map(e => {
                                                    return (
                                                        <div key={e.id}
                                                            className={`absolute left-2 right-2 p-3 rounded-lg border ${e.color} z-10 shadow-md`}
                                                            style={{ top: '100px', height: '80px' }}
                                                        >
                                                            <div className="font-bold">{e.title}</div>
                                                            <div className="opacity-75">{e.time} - {e.endTime}</div>
                                                            {e.location && <div className="flex items-center gap-1 mt-1 text-xs opacity-75"><MapPin className="w-3 h-3" /> {e.location}</div>}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showTaskTray && (
                <div className="fixed inset-y-0 right-0 z-50 md:relative md:z-30 w-80 border-l border-gray-200/60 bg-white flex flex-col shadow-2xl md:shadow-none animate-in slide-in-from-right-4 duration-300">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-gray-900">Task Tray</h3>
                        </div>
                        <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{tasks.length}</div>
                    </div>

                    <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter tasks..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {taskLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-xs">Loading tasks...</span>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No active tasks found</p>
                                <p className="text-xs text-gray-400 mt-1">Check "To Do" or "Open" tasks in your apps</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-grab active:cursor-grabbing transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {task.platform}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {task.status}
                                            </span>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-1">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {getPlatformIcon(task.platform)}
                                        <span className="truncate max-w-[150px]">{task.subtitle}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
            `}</style>

            <CreateEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onEventCreated={fetchData}
            />
        </div>
    );
};

export default UnifiedCalendar;
