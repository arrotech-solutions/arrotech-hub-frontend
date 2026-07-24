import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import apiService from '../../services/api';
import { chart } from '../../theme';

interface TrendDay {
    date: string;
    score: number;
}

const ProductivityPulse: React.FC = () => {
    const [data, setData] = useState<{ name: string; activity: number }[]>([]);
    const [score, setScore] = useState<number | null>(null);
    const [changePercent, setChangePercent] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                // Get 7-day trends for the pulse chart
                const trendsRes = await apiService.request({ method: 'GET', url: '/productivity/trends', params: { days: 7 } });
                const scores: TrendDay[] = trendsRes.data?.scores || [];

                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const chartData = scores.map((s: TrendDay) => ({
                    name: dayNames[new Date(s.date).getDay()],
                    activity: s.score,
                }));
                setData(chartData);

                // Get daily score for the hero number
                const dailyRes = await apiService.request({ method: 'GET', url: '/productivity/score/daily' });
                if (dailyRes.data?.score !== undefined) {
                    setScore(dailyRes.data.score);
                }

                // Get weekly comparison for the change percentage
                const compRes = await apiService.request({ method: 'GET', url: '/productivity/comparison' });
                if (compRes.data?.change_percentage !== undefined) {
                    setChangePercent(compRes.data.change_percentage);
                }
            } catch (error) {
                console.error('Failed to fetch productivity pulse:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPulse();
    }, []);

    const TrendIcon = () => {
        if (changePercent === null) return null;
        if (changePercent > 0) return <TrendingUp className="w-3.5 h-3.5" />;
        if (changePercent < 0) return <TrendingDown className="w-3.5 h-3.5" />;
        return <Minus className="w-3.5 h-3.5" />;
    };

    const trendColor = changePercent !== null && changePercent >= 0
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10';

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-xl p-5 flex flex-col h-full relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
            {/* Subtle background gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-widest text-xs">Pulse</h3>
                </div>

                {changePercent !== null && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trendColor}`}>
                        <TrendIcon />
                        <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="mb-4 z-10">
                {loading ? (
                    <div className="text-4xl font-black text-gray-300 dark:text-slate-600 tracking-tighter animate-pulse">—</div>
                ) : (
                    <div className="text-4xl font-black text-gray-800 dark:text-white tracking-tighter">
                        {score !== null ? `${score}%` : '—'}
                    </div>
                )}
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Productivity Score</p>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[100px] w-full -ml-4">
                <ResponsiveContainer width="115%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chart.primary} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 16, 51, 0.95)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 70, 150, 0.2)',
                                boxShadow: '0 10px 15px -3px rgba(30, 16, 51, 0.45)',
                                backdropFilter: 'blur(8px)'
                            }}
                            itemStyle={{ color: chart.primary, fontWeight: 800, fontSize: '12px' }}
                            labelStyle={{ color: chart.muted, marginBottom: '4px', fontWeight: 600 }}
                            cursor={{ stroke: chart.primary, strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="activity"
                            stroke={chart.primary}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorActivity)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProductivityPulse;
