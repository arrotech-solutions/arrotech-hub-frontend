import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Video, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
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

const CalendarWidget: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const response = await apiService.executeMCPTool('google_workspace_calendar', {
        operation: 'list_events',
        time_min: startOfDay,
        time_max: endOfDay,
        max_results: 10
      });

      if (response.success && (response.data?.events || response.result?.events)) {
        const rawEvents = response.data?.events || response.result?.events;
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
            color: 'bg-blue-500', // Default color for now
          };
        });
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-xl">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Today's Schedule</h2>
        </div>
        <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all duration-200">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-600">
            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl mb-4">
              <CalendarIcon className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-[10px]">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="group relative bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-500/30 transition-all duration-300"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 dark:bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(255,70,150,0.45)]"></div>

                <div className="pl-3 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mt-2 space-x-3">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500/50" />
                          <span>{event.time}</span>
                          <span className="mx-2 text-gray-300 dark:text-slate-700">•</span>
                          <span>{event.duration}</span>
                        </div>
                        {event.location && !event.isOnline && (
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-500/50" />
                            <span className="truncate max-w-[120px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {event.isOnline && (
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {event.attendees.slice(0, 3).map((email, i) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white font-bold shadow-sm" title={email}>
                            {email.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {event.attendees.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-gray-500 dark:text-slate-400 font-bold">
                            +{event.attendees.length - 3}
                          </div>
                        )}
                      </div>

                      <button className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all transform active:scale-95 ${event.platform === 'meet' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/30' :
                        event.platform === 'zoom' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30' :
                          event.platform === 'teams' ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/30' :
                            'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}>
                        <Video className="w-3.5 h-3.5" />
                        <span>Join {event.platform === 'meet' ? 'Meet' : event.platform === 'zoom' ? 'Zoom' : event.platform === 'teams' ? 'Teams' : 'Call'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-2xl">
        <button
          onClick={() => window.open('https://calendar.google.com', '_blank')}
          className="w-full py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all shadow-sm active:scale-[0.98]"
        >
          View Full Calendar
        </button>
      </div>
    </div>
  );
};

export default CalendarWidget;
