import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, MessageSquare, TrendingUp, Users, Zap, Loader2 } from 'lucide-react';
import apiService from '../../services/api';

interface AnalyticsData {
    period_days: number;
    message_trends: Record<string, { incoming: number; outgoing: number }>;
    total_incoming: number;
    total_outgoing: number;
    response_rate: number;
    auto_replies_sent: number;
    new_contacts: number;
    busiest_hours: { hour: number; count: number }[];
    csat?: {
        total_responses: number;
        average_score: number | null;
        breakdown: Record<number, number>;
    };
}

const WhatsAppAnalyticsTab: React.FC = () => {
    const [days, setDays] = useState(7);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const resp = await apiService.getWhatsAppAnalytics(days);
                if (resp.success) setData(resp.data);
            } catch {
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [days]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16 text-slate-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Unable to load analytics</p>
            </div>
        );
    }

    const trendDays = Object.keys(data.message_trends).sort();
    const maxTrend = Math.max(
        1,
        ...trendDays.flatMap((d) => [
            data.message_trends[d]?.incoming || 0,
            data.message_trends[d]?.outgoing || 0,
        ])
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inbox Analytics</h2>
                    <p className="text-sm text-slate-500">Message volume, response rate, and peak hours</p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Incoming', value: data.total_incoming, icon: MessageSquare, color: 'text-blue-600' },
                    { label: 'Outgoing', value: data.total_outgoing, icon: TrendingUp, color: 'text-green-600' },
                    { label: 'Response rate', value: `${data.response_rate}%`, icon: Zap, color: 'text-amber-600' },
                    { label: 'New contacts', value: data.new_contacts, icon: Users, color: 'text-purple-600' },
                ].map((card) => (
                    <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <card.icon className={`w-4 h-4 ${card.color} shrink-0`} />
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{card.label}</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-4 sm:p-6 overflow-x-auto">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Messages per day</h3>
                {trendDays.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages in this period</p>
                ) : (
                    <div className="space-y-3">
                        {trendDays.map((day) => {
                            const incoming = data.message_trends[day]?.incoming || 0;
                            const outgoing = data.message_trends[day]?.outgoing || 0;
                            return (
                                <div key={day}>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>{day}</span>
                                        <span>{incoming} in · {outgoing} out</span>
                                    </div>
                                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="bg-blue-500 rounded-l-full"
                                            style={{ width: `${(incoming / maxTrend) * 100}%` }}
                                        />
                                        <div
                                            className="bg-green-500 rounded-r-full"
                                            style={{ width: `${(outgoing / maxTrend) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Busiest hours
                    </h3>
                    {data.busiest_hours.length === 0 ? (
                        <p className="text-sm text-slate-500">No data yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.busiest_hours.map((h) => (
                                <li key={h.hour} className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {String(h.hour).padStart(2, '0')}:00 – {String(h.hour).padStart(2, '0')}:59
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">{h.count} msgs</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Automation</h3>
                    <p className="text-3xl font-bold text-green-600">{data.auto_replies_sent}</p>
                    <p className="text-sm text-slate-500 mt-1">Auto-replies triggered (all time)</p>
                </div>
            </div>

            {data.csat && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Customer satisfaction (CSAT)</h3>
                    {data.csat.total_responses === 0 ? (
                        <p className="text-sm text-slate-500">No CSAT responses yet — surveys send when conversations are marked resolved.</p>
                    ) : (
                        <div className="flex flex-wrap items-end gap-6">
                            <div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.csat.average_score ?? '—'}</p>
                                <p className="text-sm text-slate-500">Average / 5 ({data.csat.total_responses} responses)</p>
                            </div>
                            <div className="flex gap-2 items-end flex-1 min-w-[200px]">
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <div key={score} className="flex-1 text-center">
                                        <div
                                            className="mx-auto w-full max-w-[2rem] bg-green-500 rounded-t"
                                            style={{
                                                height: `${Math.max(8, ((data.csat?.breakdown[score] || 0) / data.csat!.total_responses) * 64)}px`,
                                            }}
                                        />
                                        <span className="text-xs text-slate-500">{score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WhatsAppAnalyticsTab;
