import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

const data = [
    { name: 'Mon', activity: 40 },
    { name: 'Tue', activity: 30 },
    { name: 'Wed', activity: 20 },
    { name: 'Thu', activity: 27 },
    { name: 'Fri', activity: 18 },
    { name: 'Sat', activity: 23 },
    { name: 'Sun', activity: 34 },
];

const ProductivityPulse: React.FC = () => {
    return (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl p-5 flex flex-col h-full relative overflow-hidden group">
            {/* Subtle background gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-xl">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-800">Pulse</h3>
                </div>

                <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12%</span>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-4 z-10">
                <div className="text-3xl font-bold text-gray-800">82%</div>
                <p className="text-xs text-gray-500 font-medium">Productivity Score</p>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[100px] w-full -ml-4">
                <ResponsiveContainer width="115%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#059669', fontWeight: 600 }}
                            cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="activity"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorActivity)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProductivityPulse;
