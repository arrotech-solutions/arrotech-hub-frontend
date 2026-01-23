import React, { useState } from 'react';
import { X, Check, Loader2, Calendar, MapPin, AlignLeft, Clock } from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated: () => void;
    defaultDate?: Date;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated, defaultDate }) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    // Date/Time State (HTML datetime-local expects YYYY-MM-DDThh:mm)
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');

    // Initialize dates when modal opens
    React.useEffect(() => {
        if (isOpen) {
            const now = defaultDate || new Date();
            const start = new Date(now);
            start.setMinutes(0, 0, 0); // Round to start of hour

            const end = new Date(start);
            end.setHours(end.getHours() + 1); // 1 hour duration default

            // Helper to format for input
            const formatForInput = (d: Date) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            setStartDateTime(formatForInput(start));
            setEndDateTime(formatForInput(end));
            setTitle('');
            setDescription('');
            setLocation('');
        }
    }, [isOpen, defaultDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !startDateTime || !endDateTime) {
            toast.error('Please fill in required fields');
            return;
        }

        if (new Date(startDateTime) >= new Date(endDateTime)) {
            toast.error('End time must be after start time');
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.executeMCPTool('google_workspace_calendar', {
                operation: 'create_event',
                summary: title,
                start_time: new Date(startDateTime).toISOString(),
                end_time: new Date(endDateTime).toISOString(),
                description: description,
                location: location
            });

            if (result.success || (result.data && result.data.success)) {
                toast.success('Event created successfully!');
                onEventCreated();
                onClose();
            } else {
                toast.error('Failed to create event: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating event');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        New Event
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                            placeholder="Add title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Starts</label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full pl-9 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2 text-sm"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ends</label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full pl-9 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2 text-sm"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                                placeholder="Add location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <div className="relative">
                            <AlignLeft className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <textarea
                                className="w-full pl-9 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 text-sm"
                                rows={3}
                                placeholder="Add description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title}
                        className="relative isolate overflow-hidden rounded-xl px-4 py-2 font-semibold text-white transition-all duration-300
                        bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700
                        before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100
                        after:absolute after:inset-0 after:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]
                        shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
                        flex items-center disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <span className="relative z-10 flex items-center">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            Save Event
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
