import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Video, Loader2, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';

interface Event {
    id: string;
    title: string;
    time: string;
    duration: string;
    type: 'google' | 'outlook' | 'apple';
    location?: string;
    isOnline?: boolean;
    platform?: 'zoom' | 'teams' | 'meet';
    attendees: string[];
    color: string;
}

const CalendarHubTile: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

            console.log('[CalendarHubTile] Fetching events with params:', {
                operation: 'list_events',
                time_min: startOfDay,
                time_max: nextWeek,
                max_results: 10
            });

            const response = await apiService.executeTool('google_workspace_calendar', {
                operation: 'list_events',
                time_min: startOfDay,
                time_max: nextWeek,
                max_results: 10 // Increased limit to find next events
            });

            console.log('[CalendarHubTile] API Response:', response);

            if (response.success && (response.data?.events || response.result?.events)) {
                const rawEvents = response.data?.events || response.result?.events;
                console.log('[CalendarHubTile] Raw Events:', rawEvents);

                const mappedEvents: Event[] = rawEvents.map((e: any) => {
                    const startDate = new Date(e.start);
                    const endDate = new Date(e.end);
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const durationMinutes = Math.floor(durationMs / 60000);
                    const duration = durationMinutes < 60 ? `${durationMinutes}m` : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? (durationMinutes % 60) + 'm' : ''}`;

                    let platform: 'meet' | 'zoom' | 'teams' | undefined = undefined;
                    if (e.meet_link || (e.description && e.description.includes('meet.google.com'))) {
                        platform = 'meet';
                    } else if (e.description && e.description.includes('zoom.us')) {
                        platform = 'zoom';
                    } else if (e.description && e.description.includes('teams.microsoft.com')) {
                        platform = 'teams';
                    }

                    return {
                        id: e.id,
                        title: e.summary || 'No Title',
                        time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        duration: duration,
                        type: 'google',
                        location: e.location,
                        isOnline: !!platform || !!e.meet_link,
                        platform: platform,
                        attendees: Array.isArray(e.attendees) ? e.attendees.map((a: any) => a.email || '') : [],
                        color: 'bg-indigo-500',
                    };
                });
                console.log('[CalendarHubTile] Mapped Events:', mappedEvents);
                setEvents(mappedEvents);
            } else {
                console.warn('[CalendarHubTile] Fetch failed or no events found. Success:', response.success);
            }
        } catch (err) {
            console.error('[CalendarHubTile] Error fetching calendar events:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl flex flex-col h-full overflow-hidden group transition-all hover:shadow-2xl relative">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/20 flex items-center justify-between z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Up Next
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        {events.length} events today
                    </p>
                </div>
                <div className="p-2 bg-white/50 rounded-xl hover:bg-white transition-colors cursor-pointer text-gray-500 hover:text-indigo-600">
                    <CalendarIcon className="w-5 h-5" />
                </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-0">
                {events.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">No upcoming events</span>
                    </div>
                )}

                {events.map((event, index) => (
                    <div key={event.id} className="group/item relative flex items-start gap-4 p-3 bg-white/40 hover:bg-white/70 rounded-xl border border-white/40 hover:border-indigo-100 transition-all cursor-pointer">
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[3.5rem] pt-1 border-r border-white/30 pr-3">
                            <span className="text-xs font-bold text-gray-800">{event.time}</span>
                            <span className="text-[10px] font-medium text-gray-400 mt-0.5">{event.duration}</span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover/item:text-indigo-600 transition-colors">
                                {event.title}
                            </h3>

                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {event.isOnline ? (
                                    <div className={`flex items-center gap-1 ${event.platform === 'meet' ? 'text-blue-600' :
                                        event.platform === 'zoom' ? 'text-blue-500' :
                                            event.platform === 'teams' ? 'text-indigo-600' : 'text-gray-500'
                                        }`}>
                                        <Video className="w-3 h-3" />
                                        <span className="font-medium">
                                            {event.platform === 'meet' ? 'Google Meet' : event.platform === 'zoom' ? 'Zoom' : event.platform === 'teams' ? 'Teams' : 'Online'}
                                        </span>
                                    </div>
                                ) : event.location ? (
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{event.location}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Action Button (Hover) */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0">
                            <div className="p-1.5 bg-indigo-500 rounded-lg text-white shadow-sm hover:bg-indigo-600">
                                {event.isOnline ? <Video className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.1);
                border-radius: 4px;
            }
        `}</style>
        </div>
    );
};

export default CalendarHubTile;
