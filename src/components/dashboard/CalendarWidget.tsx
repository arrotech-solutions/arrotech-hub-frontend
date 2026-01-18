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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Today's Schedule</h2>
        </div>
        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="p-3 bg-gray-50 rounded-full mb-3">
              <CalendarIcon className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-100 transition-all duration-300"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"></div>

                <div className="pl-3 flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          <span>{event.time}</span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span>{event.duration}</span>
                        </div>
                        {event.location && !event.isOnline && (
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            <span className="truncate max-w-[120px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-gray-300 hover:text-gray-500 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {event.isOnline && (
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {event.attendees.slice(0, 3).map((email, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white flex items-center justify-center text-[8px] text-white font-medium shadow-sm" title={email}>
                            {email.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {event.attendees.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] text-gray-500 font-medium">
                            +{event.attendees.length - 3}
                          </div>
                        )}
                      </div>

                      <button className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all transform active:scale-95 ${event.platform === 'meet' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                        event.platform === 'zoom' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                          event.platform === 'teams' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        <Video className="w-3 h-3" />
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
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <button
          onClick={() => window.open('https://calendar.google.com', '_blank')}
          className="w-full py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          View Full Calendar
        </button>
      </div>
    </div>
  );
};

export default CalendarWidget;
