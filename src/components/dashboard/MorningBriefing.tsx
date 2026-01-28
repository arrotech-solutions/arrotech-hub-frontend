import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sun, CheckCircle, AlertTriangle, ArrowRight, Coffee, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api';


interface BriefingData {
    greeting: string;
    headline: string;
    summary: string;
    priorities: string[];
    urgent_emails?: { sender: string; subject: string; reason: string }[];
    risks: string[];
    suggested_actions: { label: string; action: string }[];
}

const MorningBriefing: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState<string | null>(null);
    const [zenMode, setZenMode] = useState(false);

    useEffect(() => {
        const loadBriefing = async () => {
            try {
                // Real API Call
                const res = await apiService.getMorningBriefing();
                if (res) {
                    setData(res as unknown as BriefingData);
                }
            } catch (error) {
                console.error("Failed to load briefing", error);
            } finally {
                setLoading(false);
            }
        };
        loadBriefing();
    }, []);

    const handleAction = async (actionId: string, label: string) => {
        // Intercept Navigation Actions
        if (actionId.startsWith('nav-')) {
            const routes: Record<string, string> = {
                'nav-settings': '/settings',
                'nav-marketplace': '/marketplace',
                'nav-calendar': '/unified/calendar',
                'nav-tasks': '/unified/tasks',
                'nav-inbox': '/unified/inbox',
                'nav-profile': '/profile'
            };
            const route = routes[actionId] || '/dashboard';
            navigate(route);
            onClose();
            return;
        }

        setProcessingAction(actionId);
        try {
            const res = await apiService.executeBriefingAction(actionId);
            // Show real feedback from backend
            if (res.success) {
                alert(res.message || `Action "${label}" executed successfully!`);
            } else {
                alert(`Action completed with warnings: ${res.message || 'Check logs for details.'}`);
            }
        } catch (error) {
            console.error("Action failed", error);
            alert("Failed to execute action. Please try again.");
        } finally {
            setProcessingAction(null);
        }
    };

    if (!data && !loading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Content Card - Scrollable and responsive */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col">

                {/* Decorative Header */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 flex-shrink-0" />

                {/* Scrollable Content Area */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-gray-500 font-medium animate-pulse">Analyzing your day...</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wide uppercase text-xs mb-1">
                                        <Sun className="w-4 h-4" />
                                        <span>Morning Briefing</span>
                                    </div>
                                    <h1 className={`font-bold text-gray-900 mb-1 ${zenMode ? 'text-4xl' : 'text-3xl'}`}>
                                        {data?.greeting}, {user?.name?.split(' ')[0] || 'Creator'}.
                                    </h1>
                                    <p className={`text-gray-500 font-light ${zenMode ? 'text-2xl' : 'text-xl'}`}>
                                        {data?.headline}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Zen Mode Toggle */}
                                    <button
                                        onClick={() => setZenMode(!zenMode)}
                                        className={`p-2 rounded-full transition-all ${zenMode ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                        title={zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* ZEN MODE VIEW */}
                            {zenMode ? (
                                <div className="py-8 text-center space-y-8">
                                    {/* Calming Summary */}
                                    <p className="text-lg text-gray-600 font-light max-w-md mx-auto leading-relaxed">
                                        {data?.summary}
                                    </p>

                                    {/* Top 3 Focus Items */}
                                    <div className="space-y-4 max-w-md mx-auto">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                                            Focus on these today
                                        </h3>
                                        {data?.priorities.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                                <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-bold text-indigo-600">
                                                    {i + 1}
                                                </span>
                                                <span className="text-gray-700 font-medium text-left">
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Zen Footer */}
                                    <div className="pt-6">
                                        <button
                                            onClick={onClose}
                                            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full font-medium text-lg flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Start My Focused Day
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* NORMAL MODE - Main Grid - Stacks on mobile */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Col: Priorities */}
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                Top Priorities
                                            </h3>
                                            <div className="space-y-3">
                                                {data?.priorities.map((item, i) => (
                                                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-default">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-gray-700 text-sm leading-relaxed">
                                                            {item}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Col: Summary & Risks */}
                                        <div className="space-y-6">
                                            {/* NEW: Urgent Emails Section */}
                                            {data?.urgent_emails && data.urgent_emails.length > 0 && (
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2 text-sm">
                                                        <Mail className="w-4 h-4" />
                                                        Urgent Communications
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {data?.urgent_emails.map((email, i) => (
                                                            <div key={i} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-semibold text-gray-900 text-sm">{email.sender}</span>
                                                                    <span className="text-xs text-red-500 font-medium px-2 py-0.5 bg-red-100 rounded-full">Urgent</span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm font-medium leading-tight mb-1">{email.subject}</p>
                                                                <p className="text-gray-500 text-xs">{email.reason}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2 text-sm">
                                                    <Coffee className="w-4 h-4" />
                                                    Daily Summary
                                                </h3>
                                                <p className="text-indigo-800/80 text-sm leading-relaxed">
                                                    {data?.summary}
                                                </p>
                                            </div>

                                            {data?.risks.length ? (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                        Potential Risks
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {data?.risks.map((risk, i) => (
                                                            <li key={i} className="flex gap-2 text-sm text-amber-700/80 items-start">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                                {risk}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex flex-wrap gap-3">
                                            {/* Dedicated Draft Replies Button - Only shows when there are urgent emails */}
                                            {data?.urgent_emails && data.urgent_emails.length > 0 && (
                                                <button
                                                    onClick={() => handleAction('email.draft_replies', 'Draft Replies')}
                                                    disabled={!!processingAction}
                                                    className={`px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2 ${processingAction === 'email.draft_replies' ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    {processingAction === 'email.draft_replies' ? 'Drafting...' : 'Draft Replies'}
                                                </button>
                                            )}
                                            {/* Other suggested actions from LLM */}
                                            {data?.suggested_actions
                                                .filter(a => a.action !== 'email.draft_replies')
                                                .map((action, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleAction(action.action, action.label)}
                                                        disabled={!!processingAction}
                                                        className={`px-4 py-2 bg-white border border-gray-200 shadow-sm text-gray-600 text-sm rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all font-medium ${processingAction === action.action ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        {processingAction === action.action ? 'Processing...' : action.label}
                                                    </button>
                                                ))}
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
                                        >
                                            Start My Day <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MorningBriefing;
