import React from 'react';
import {
    FileText,
    Download,
    Image as ImageIcon,
    Globe,
    MessageCircle,
    BarChart3,
    User,
    Activity,
    XCircle,
    Zap,
    ExternalLink
} from 'lucide-react';
import { Message } from '../../types';

interface ToolResultWidgetProps {
    message: Message;
    isDarkMode: boolean;
    showDetailedResults?: boolean;
}

const ToolResultWidget: React.FC<ToolResultWidgetProps> = ({
    message,
    isDarkMode,
    showDetailedResults = true,
}) => {
    if (!message.tools_called) return null;

    const renderToolIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('slack')) return <MessageCircle size={14} />;
        if (n.includes('hubspot') || n.includes('sale') || n.includes('customer')) return <User size={14} />;
        if (n.includes('analytics') || n.includes('report') || n.includes('ga4')) return <BarChart3 size={14} />;
        if (n.includes('file')) return <FileText size={14} />;
        if (n.includes('web')) return <Globe size={14} />;
        if (n.includes('image')) return <ImageIcon size={14} />;
        if (n.includes('security')) return <Zap size={14} />;
        return <Activity size={14} />;
    };

    const getToolColor = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('slack')) return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
        if (n.includes('hubspot') || n.includes('sale')) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (n.includes('analytics')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        if (n.includes('file')) return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
        if (n.includes('web')) return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
        if (n.includes('error')) return 'text-red-500 bg-red-500/10 border-red-500/20';
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    };

    return (
        <div className="space-y-4 my-4">
            {message.tools_called.map((tool, idx) => {
                const isSuccess = tool.success !== false && !tool.result?.error;
                const colorClass = isSuccess ? getToolColor(tool.name) : getToolColor('error');

                return (
                    <div
                        key={idx}
                        className={`rounded-2xl border transition-all duration-300
              ${isDarkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100 shadow-sm'}
              ${!isSuccess ? 'border-red-500/20' : ''}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-transparent group cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl border ${colorClass}`}>
                                    {isSuccess ? renderToolIcon(tool.name) : <XCircle size={14} />}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {tool.name.replace(/_/g, ' ')}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <span className={`text-[10px] font-medium ${isSuccess ? 'text-green-500' : 'text-red-400'}`}>
                                            {isSuccess ? 'Execution Successful' : 'Execution Failed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                Tool Call
                            </div>
                        </div>

                        {/* Content Body */}
                        {showDetailedResults && tool.result && (
                            <div className="p-4 pt-2">
                                {/* Specific Tool Renderers */}
                                {isSuccess ? (
                                    <div className="space-y-3">
                                        {/* File Download UI */}
                                        {tool.name === 'file_management' && tool.result.data?.filename && (
                                            <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-indigo-50 border-indigo-100'}`}>
                                                <div className="flex items-center space-x-3">
                                                    <FileText size={18} className="text-indigo-500" />
                                                    <div>
                                                        <p className="text-xs font-bold text-indigo-700">{tool.result.data.filename}</p>
                                                        <p className="text-[10px] text-indigo-500">{(tool.result.data.size / 1024).toFixed(1)} KB • Ready for download</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/api/chat/download/${message.conversation_id}/${message.id}/${tool.result.data.filename}`}
                                                    download={tool.result.data.filename}
                                                    className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* Image Result UI */}
                                        {tool.name === 'content_creation' && tool.result.data?.image_url && (
                                            <div className="mt-2 group relative">
                                                <img
                                                    src={tool.result.data.image_url}
                                                    alt="AI generated"
                                                    className="w-full rounded-xl border border-gray-200 shadow-md transition-transform group-hover:scale-[1.01]"
                                                />
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={tool.result.data.image_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-xl text-gray-700 hover:text-indigo-600"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Slack Channel List UI */}
                                        {tool.name === 'slack_team_management' && tool.result.data?.channels && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {tool.result.data.channels.slice(0, 4).map((ch: any, i: number) => (
                                                    <div key={i} className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-purple-500 font-bold">#</span>
                                                            <span className="text-xs font-bold truncate">{ch.name}</span>
                                                        </div>
                                                        <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{ch.member_count} members</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Generic Data Visualizer (Table/Grid) */}
                                        {tool.result.data && !Array.isArray(tool.result.data) && typeof tool.result.data === 'object' && (
                                            <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl ${isDarkMode ? 'bg-gray-900/40' : 'bg-gray-50/50'}`}>
                                                {Object.entries(tool.result.data).slice(0, 6).map(([key, value]) => {
                                                    if (typeof value === 'object' || Array.isArray(value)) return null;
                                                    return (
                                                        <div key={key} className="p-2">
                                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {key.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {String(value)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Error Rendering */
                                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                                        <p className="text-xs font-bold text-red-600 mb-1">Error Message</p>
                                        <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                                            {tool.result.error || tool.result.message || 'Unknown error occurred while calling this tool.'}
                                        </p>
                                        {tool.result.status_code && (
                                            <div className="mt-3 flex items-center space-x-2">
                                                <span className="text-[10px] font-bold uppercase text-red-400">Status Code: {tool.result.status_code}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Raw Footer (Debug) */}
                                <details className="mt-3 group">
                                    <summary className={`text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:underline transition-all
                    ${isDarkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                                        View Raw Response
                                    </summary>
                                    <pre className={`mt-2 p-3 text-[10px] rounded-xl overflow-x-auto max-h-40
                    ${isDarkMode ? 'bg-gray-900 text-indigo-400' : 'bg-gray-50 text-indigo-600 border border-gray-100'}`}>
                                        {JSON.stringify(tool.result, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ToolResultWidget;
