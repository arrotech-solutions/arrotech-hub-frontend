import React from 'react';
import { X, MapPin, Users, Video, Calendar as CalendarIcon, Trash2, Edit3 } from 'lucide-react';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any; // Using any for flexibility with the existing CalendarEvent interface
    focusMode?: boolean;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, focusMode }) => {
    if (!isOpen || !event) return null;

    // Determine platform colors/icons
    const getPlatformStyle = () => {
        if (event.platform === 'zoom') return { bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-50', border: 'border-blue-100', name: 'Zoom Meeting' };
        if (event.platform === 'meet') return { bg: 'bg-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-50', border: 'border-yellow-100', name: 'Google Meet' };
        if (event.platform === 'teams') return { bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-50', border: 'border-indigo-100', name: 'Microsoft Teams' };
        return { bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-50', border: 'border-indigo-100', name: 'Event' };
    };

    const style = getPlatformStyle();

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
                ${focusMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-white border border-white/50 text-slate-900'}
            `}>
                {/* Decorative Header Bar */}
                <div className={`h-2 w-full ${style.bg}`} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${focusMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8">
                    {/* Platform Badge */}
                    {event.type === 'google' && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                            <CalendarIcon className="w-3 h-3" /> Google Calendar
                        </div>
                    )}

                    {/* Title */}
                    <h2 className="text-2xl font-bold leading-tight mb-2">{event.title}</h2>

                    {/* Time & Date */}
                    <div className={`text-base font-medium mb-6 ${focusMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        {event.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        <span className="mx-2 opacity-50">•</span>
                        {event.time} - {event.endTime || '1h'}
                    </div>

                    {/* Actions (Join Button) */}
                    {event.isOnline && (
                        <div className="mb-8">
                            <button className={`
                                w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg hover:translate-y-[-2px]
                                ${style.bg} text-white shadow-${style.bg}/30
                            `}>
                                <Video className="w-5 h-5" />
                                Join {style.name}
                            </button>
                        </div>
                    )}

                    {/* Details List */}
                    <div className="space-y-4">
                        {/* Description/Context */}
                        {event.description && (
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-lg h-fit ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-400'}`}>
                                    <div className="h-1.5 w-4 rounded-full bg-current opacity-50" />
                                    <div className="h-1.5 w-2.5 rounded-full bg-current opacity-50 mt-1" />
                                </div>
                                <p className={`text-sm leading-relaxed ${focusMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Attendees */}
                        <div className="flex gap-4 items-start">
                            <div className={`p-2 rounded-lg ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-400'}`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${focusMode ? 'text-slate-500' : 'text-gray-400'}`}>Attendees</h4>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${focusMode ? 'border-slate-900 bg-slate-700' : 'border-white bg-indigo-100 text-indigo-600'}`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${focusMode ? 'border-slate-900 bg-slate-800 text-slate-400' : 'border-white bg-gray-100 text-gray-500'}`}>
                                        +2
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        {event.location && (
                            <div className="flex gap-4 items-center">
                                <div className={`p-2 rounded-lg ${focusMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-400'}`}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <span className={`text-sm ${focusMode ? 'text-slate-300' : 'text-slate-700'}`}>{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className={`mt-8 pt-6 border-t flex justify-between ${focusMode ? 'border-slate-800' : 'border-gray-100'}`}>
                        <button className={`text-xs font-bold flex items-center gap-2 transition-colors ${focusMode ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}>
                            <Trash2 className="w-4 h-4" /> Delete Event
                        </button>
                        <button className={`text-xs font-bold flex items-center gap-2 transition-colors ${focusMode ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-indigo-600'}`}>
                            <Edit3 className="w-4 h-4" /> Edit Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
