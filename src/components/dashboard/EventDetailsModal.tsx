import React from 'react';
import { X, MapPin, Users, Video, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any; // Using any for flexibility with the existing CalendarEvent interface
    onReschedule?: (event: any, newStart: Date) => Promise<void>;
    focusMode?: boolean;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, focusMode, onReschedule }) => {
    const [isRescheduling, setIsRescheduling] = React.useState(false);
    const [rescheduleDate, setRescheduleDate] = React.useState('');
    const [rescheduleTime, setRescheduleTime] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen && event) {
            setIsRescheduling(false);
            setRescheduleDate(event.date.toISOString().split('T')[0]);
            // Convert "10:00 AM" to "10:00" for input[type="time"]
            // Simplified: assuming event.time is parsable or we parse it
            // For now, let's try to extract time. This is tricky without a clear format, 
            // but let's assume standard "HH:MM AM/PM" or similar. 
            // A robust way would be to have the Date object for start time.
            // Let's assume we can parse it for the demo or just reset to empty.
            setRescheduleTime('');
        }
    }, [isOpen, event]);

    if (!isOpen || !event) return null;

    // Determine platform colors/icons
    const getPlatformStyle = () => {
        if (event.platform === 'zoom') return { bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-50', border: 'border-blue-100', name: 'Zoom Meeting' };
        if (event.platform === 'meet') return { bg: 'bg-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-50', border: 'border-yellow-100', name: 'Google Meet' };
        if (event.platform === 'teams') return { bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-50', border: 'border-indigo-100', name: 'Microsoft Teams' };
        return { bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-50', border: 'border-indigo-100', name: 'Event' };
    };

    const style = getPlatformStyle();

    const handleSaveReschedule = async () => {
        setIsLoading(true);
        try {
            if (onReschedule) {
                // Construct new Date object
                const [year, month, day] = rescheduleDate.split('-').map(Number);

                let hours = 9, mins = 0;
                if (rescheduleTime) {
                    [hours, mins] = rescheduleTime.split(':').map(Number);
                } else {
                    hours = event.date.getHours();
                    mins = event.date.getMinutes();
                }

                const newStart = new Date(year, month - 1, day, hours, mins);

                await onReschedule(event, newStart);
            }
            setIsRescheduling(false);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100
                ${focusMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border border-white/50 dark:border-slate-800 text-slate-900 dark:text-white'}
            `}>
                {/* Decorative Header Bar */}
                <div className={`h-2 w-full ${style.bg}`} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${focusMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500'}`}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8">
                    {/* Platform Badge */}
                    {event.type === 'google' && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                            <CalendarIcon className="w-3 h-3" /> Google Calendar
                        </div>
                    )}

                    {/* Title */}
                    <h2 className="text-2xl font-bold leading-tight mb-2 tracking-tight">{event.title}</h2>

                    {/* Time & Date (Dynamic) */}
                    {isRescheduling ? (
                        <div className={`mb-6 p-5 rounded-2xl border space-y-4 transition-all duration-300 ${focusMode ? 'border-slate-700 bg-slate-800/50' : 'border-indigo-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-800/30'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${focusMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className={`text-sm font-bold ${focusMode ? 'text-slate-200' : 'text-indigo-900 dark:text-white'}`}>Reschedule Event</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${focusMode ? 'text-slate-500' : 'text-indigo-400 dark:text-indigo-400'}`}>New Date</label>
                                    <div className="relative group">
                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${focusMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-indigo-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400'}`}>
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="date"
                                            value={rescheduleDate}
                                            onChange={e => setRescheduleDate(e.target.value)}
                                            className={`
                                                w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none
                                                ${focusMode
                                                    ? 'bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(255,70,150,0.3)]'
                                                    : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-slate-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:shadow-md dark:shadow-none'
                                                }
                                            `}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${focusMode ? 'text-slate-500' : 'text-indigo-400 dark:text-indigo-400'}`}>New Time</label>
                                    <div className="relative group">
                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${focusMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-indigo-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400'}`}>
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="time"
                                            value={rescheduleTime}
                                            onChange={e => setRescheduleTime(e.target.value)}
                                            className={`
                                                w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm font-bold transition-all outline-none
                                                ${focusMode
                                                    ? 'bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(255,70,150,0.3)]'
                                                    : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-slate-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:shadow-md dark:shadow-none'
                                                }
                                            `}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`text-base font-medium mb-6 ${focusMode ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {event.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            <span className="mx-2 opacity-50">•</span>
                            {event.time} - {event.endTime || '1h'}
                        </div>
                    )}

                    {/* Actions (Join Button) */}
                    {event.isOnline && !isRescheduling && (
                        <div className="mb-8">
                            <button className={`
                                w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg hover:translate-y-[-2px]
                                ${style.bg} text-white shadow-${style.bg}/30 active:scale-[0.98]
                            `}>
                                <Video className="w-5 h-5" />
                                Join {style.name}
                            </button>
                        </div>
                    )}

                    {/* Details List */}
                    {!isRescheduling && (
                        <div className="space-y-5">
                            {/* Description/Context */}
                            {event.description && (
                                <div className="flex gap-4">
                                    <div className={`p-2 rounded-lg h-fit ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                        <div className="h-1.5 w-4 rounded-full bg-current opacity-50" />
                                        <div className="h-1.5 w-2.5 rounded-full bg-current opacity-50 mt-1" />
                                    </div>
                                    <p className={`text-sm leading-relaxed ${focusMode ? 'text-slate-400' : 'text-gray-600 dark:text-slate-400'}`}>
                                        {event.description}
                                    </p>
                                </div>
                            )}

                            {/* Attendees */}
                            <div className="flex gap-4 items-start">
                                <div className={`p-2 rounded-lg ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${focusMode ? 'text-slate-500' : 'text-gray-400 dark:text-slate-500'}`}>Attendees</h4>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${focusMode ? 'border-slate-900 bg-slate-700' : 'border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${focusMode ? 'border-slate-900 bg-slate-800 text-slate-400' : 'border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500'}`}>
                                            +2
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            {event.location && (
                                <div className="flex gap-4 items-center">
                                    <div className={`p-2 rounded-lg ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-medium ${focusMode ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>{event.location}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className={`mt-8 pt-6 border-t flex justify-end gap-3 ${focusMode ? 'border-slate-800' : 'border-gray-100 dark:border-slate-800'}`}>
                        {isRescheduling ? (
                            <>
                                <button
                                    onClick={() => setIsRescheduling(false)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${focusMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveReschedule}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? 'Saving...' : 'Confirm Change'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsRescheduling(true)}
                                className={`text-xs font-bold flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${focusMode ? 'text-indigo-400 hover:bg-slate-800' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}
                            >
                                <CalendarIcon className="w-4 h-4" /> Reschedule Event
                            </button>
                        )}
                        {/* Delete Button Removed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
