// SmartScheduler.tsx - Phase 4: Intelligent Scheduling Engine
// AI-powered scheduling with natural language input, slot suggestions, and focus time protection

import React, { useState, useCallback } from 'react';
import {
    Calendar, Sparkles, Send, ChevronDown,
    Brain, Coffee, Check, X, ArrowRight
} from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface TimeSlot {
    start: string;
    end: string;
    score: number;
    reason: string;
}

interface FocusBlock {
    title: string;
    start: string;
    end: string;
    duration_hours: number;
    description: string;
}

interface SmartSchedulerProps {
    onEventCreated?: (event: any) => void;
    onClose?: () => void;
}

export default function SmartScheduler({ onEventCreated, onClose }: SmartSchedulerProps) {
    // Natural language input
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Suggestions & results
    const [suggestions, setSuggestions] = useState<TimeSlot[]>([]);
    const [message, setMessage] = useState('');
    const [createdEvent, setCreatedEvent] = useState<any>(null);

    // Quick actions state
    const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
    const [showFocusTime, setShowFocusTime] = useState(false);
    const [focusHours, setFocusHours] = useState(10);
    const [addingBlockId, setAddingBlockId] = useState<string | null>(null);

    // Preferences
    const [preferences, setPreferences] = useState({
        prefer_morning: false,
        prefer_afternoon: false,
        avoid_back_to_back: true
    });
    const [showPrefs, setShowPrefs] = useState(false);

    // Handle natural language scheduling
    const handleSchedule = useCallback(async () => {
        if (!query.trim()) return;

        setIsProcessing(true);
        setSuggestions([]);
        setMessage('');
        setCreatedEvent(null);

        try {
            const result = await apiService.scheduleWithAI(query, preferences);

            if (result.event) {
                setCreatedEvent(result.event);
                toast.success(result.message);
                onEventCreated?.(result.event);
            } else if (result.suggestions && result.suggestions.length > 0) {
                setSuggestions(result.suggestions);
            }

            setMessage(result.message);
        } catch (error) {
            toast.error('Scheduling failed');
        } finally {
            setIsProcessing(false);
        }
    }, [query, preferences, onEventCreated]);

    // Handle slot selection
    const handleSelectSlot = useCallback(async (slot: TimeSlot) => {
        setIsProcessing(true);
        try {
            // Create event with selected slot
            const result = await apiService.executeMCPTool('google_workspace_calendar', {
                operation: 'create_event',
                summary: query.replace(/^schedule\s*/i, '') || 'Meeting',
                start_time: slot.start,
                end_time: slot.end
            });

            if (result.success) {
                toast.success('✅ Event created!');
                setCreatedEvent(result.result?.event);
                setSuggestions([]);
                onEventCreated?.(result.result?.event);
            }
        } catch (error) {
            toast.error('Failed to create event');
        } finally {
            setIsProcessing(false);
        }
    }, [query, onEventCreated]);

    // Handle focus time protection
    const handleProtectFocusTime = useCallback(async () => {
        setIsProcessing(true);
        try {
            const result = await apiService.protectFocusTime(focusHours);
            if (result.success && result.focus_blocks.length > 0) {
                setFocusBlocks(result.focus_blocks);
                toast.success(result.message);
            } else {
                toast.error('No available slots for focus time');
            }
        } catch (error) {
            toast.error('Failed to find focus time slots');
        } finally {
            setIsProcessing(false);
        }
    }, [focusHours]);

    // Create focus block on calendar
    const handleCreateFocusBlock = useCallback(async (block: FocusBlock) => {
        setAddingBlockId(block.start); // Use start time as unique key since ID might be missing
        try {
            const result = await apiService.executeMCPTool('google_workspace_calendar', {
                operation: 'create_event',
                summary: block.title,
                description: block.description,
                start_time: block.start,
                end_time: block.end
            });

            if (result.success) {
                toast.success(`Created: ${block.title}`);
                setFocusBlocks(prev => prev.filter(b => b.start !== block.start));
            }
        } catch (error) {
            toast.error('Failed to create focus block');
        } finally {
            setAddingBlockId(null);
        }
    }, []);

    // Format datetime for display
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Quick prompts
    const quickPrompts = [
        { label: '30 min meeting', query: 'Schedule 30 minute meeting' },
        { label: '1 hour focus', query: 'Block 1 hour for focus time' },
        { label: 'Coffee chat', query: 'Schedule 15 min coffee chat tomorrow' },
        { label: 'Team sync', query: 'Schedule 45 min team sync this week' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-lg w-full max-h-[85vh] flex flex-col mx-4 md:mx-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">Smart Scheduler</h2>
                        <p className="text-white/70 text-sm">AI-powered scheduling</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>

            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {/* Natural Language Input */}
                <div className="space-y-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSchedule()}
                            placeholder="Schedule a 1 hour meeting tomorrow afternoon..."
                            className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder:text-slate-400"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleSchedule}
                            disabled={isProcessing || !query.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors"
                        >
                            {isProcessing ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Quick Prompts */}
                    <div className="flex flex-wrap gap-2">
                        {quickPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setQuery(prompt.query)}
                                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                            >
                                {prompt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preferences Toggle */}
                <div>
                    <button
                        onClick={() => setShowPrefs(!showPrefs)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showPrefs ? 'rotate-180' : ''}`} />
                        Preferences
                    </button>

                    {showPrefs && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.prefer_morning}
                                    onChange={(e) => setPreferences(p => ({ ...p, prefer_morning: e.target.checked, prefer_afternoon: false }))}
                                    className="rounded text-indigo-600"
                                />
                                Prefer morning slots
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.prefer_afternoon}
                                    onChange={(e) => setPreferences(p => ({ ...p, prefer_afternoon: e.target.checked, prefer_morning: false }))}
                                    className="rounded text-indigo-600"
                                />
                                Prefer afternoon slots
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.avoid_back_to_back}
                                    onChange={(e) => setPreferences(p => ({ ...p, avoid_back_to_back: e.target.checked }))}
                                    className="rounded text-indigo-600"
                                />
                                Avoid back-to-back meetings
                            </label>
                        </div>
                    )}
                </div>

                {/* Message / Results */}
                {message && (
                    <div className={`p-3 rounded-xl text-sm ${createdEvent ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Created Event Display */}
                {createdEvent && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                            <Check className="w-5 h-5" />
                            <span className="font-semibold">Event Created!</span>
                        </div>
                        <p className="text-green-800 font-medium">{createdEvent.summary}</p>
                        <p className="text-green-600 text-sm">
                            {formatDateTime(createdEvent.start?.dateTime || createdEvent.start?.date)}
                        </p>
                    </div>
                )}

                {/* Slot Suggestions */}
                {suggestions.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>Available slots (click to book)</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {suggestions.map((slot, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectSlot(slot)}
                                    className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {formatDateTime(slot.start)}
                                            </p>
                                            <p className="text-xs text-slate-500">{slot.reason}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                                {Math.round(slot.score)}% match
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Quick Actions</span>
                    </div>

                    {/* Focus Time Protection */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowFocusTime(!showFocusTime)}
                            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                                    <Coffee className="w-4 h-4 text-purple-700" />
                                </div>
                                <span className="font-medium text-purple-800">Protect Focus Time</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${showFocusTime ? 'rotate-180' : ''}`} />
                        </button>

                        {showFocusTime && (
                            <div className="p-3 bg-purple-50 rounded-xl space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="text-sm text-purple-800">Hours per week:</label>
                                    <input
                                        type="number"
                                        value={focusHours}
                                        onChange={(e) => setFocusHours(parseInt(e.target.value) || 10)}
                                        min={1}
                                        max={40}
                                        className="w-20 px-2 py-1 border border-purple-200 rounded-lg text-center"
                                    />
                                    <button
                                        onClick={handleProtectFocusTime}
                                        disabled={isProcessing}
                                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        {isProcessing ? 'Finding...' : 'Find Slots'}
                                    </button>
                                </div>

                                {/* Focus Blocks List */}
                                {focusBlocks.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {focusBlocks.map((block, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200">
                                                <div>
                                                    <p className="text-sm font-medium text-purple-800">{block.title}</p>
                                                    <p className="text-xs text-purple-600">{formatDateTime(block.start)}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleCreateFocusBlock(block)}
                                                    disabled={addingBlockId === block.start}
                                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs rounded-lg transition-all flex items-center gap-1"
                                                >
                                                    {addingBlockId === block.start ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                            Adding...
                                                        </>
                                                    ) : 'Add to Calendar'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
