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

import ToolInsightCard from './ToolInsightCard';

interface ToolResultWidgetProps {
    message: Message;
    isDarkMode: boolean;
    responseMode?: 'simple' | 'detailed';
}

const ToolResultWidget: React.FC<ToolResultWidgetProps> = ({
    message,
    isDarkMode,
    responseMode = 'simple',
}) => {
    if (!message.tools_called) return null;

    return (
        <div className="space-y-4 my-4">
            {message.tools_called.map((tool, idx) => {
                const isSuccess = tool.success !== false && !tool.result?.error;
                const toolContext = (tool as any).context;

                return (
                    <ToolInsightCard
                        key={idx}
                        tool={tool}
                        context={toolContext}
                        isDarkMode={isDarkMode}
                        mode={responseMode}
                    >
                        {/* Content Body */}
                        {tool.result && (
                            <div className="pt-2">
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

                                        {/* Web Search Sources UI */}
                                        {tool.name === 'web_search' && tool.result.sources && Array.isArray(tool.result.sources) && (
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Globe size={12} className="text-cyan-500" />
                                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                        {tool.result.sources.length} sources found
                                                    </span>
                                                </div>
                                                <div className="flex space-x-2 overflow-x-auto pb-2">
                                                    {tool.result.sources.map((src: any, i: number) => (
                                                        <a
                                                            key={i}
                                                            href={src.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex-shrink-0 w-52 rounded-xl border p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group ${
                                                                isDarkMode
                                                                    ? 'bg-gray-900/60 border-gray-700/50 hover:border-cyan-500/40'
                                                                    : 'bg-gray-50 border-gray-200 hover:border-cyan-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-2 mb-1.5">
                                                                {src.favicon ? (
                                                                    <img src={src.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                ) : (
                                                                    <Globe size={10} className="text-gray-400" />
                                                                )}
                                                                <span className={`text-[9px] font-medium truncate ${isDarkMode ? 'text-cyan-400/70' : 'text-cyan-600/70'}`}>
                                                                    {src.domain}
                                                                </span>
                                                                <ExternalLink size={9} className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" />
                                                            </div>
                                                            <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                {src.title}
                                                            </p>
                                                        </a>
                                                    ))}
                                                </div>
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

                                        {/* Workflow Created UI */}
                                        {tool.name === 'workflow_management' && tool.result.workflow_id && (
                                            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'}`}>
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <Zap size={18} className="text-purple-500" />
                                                    <div>
                                                        <p className="text-sm font-bold text-purple-700">Workflow Draft Created</p>
                                                        <p className="text-xs text-purple-600">{tool.result.message}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/workflows/${tool.result.workflow_id}`}
                                                    className="mt-3 block w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 text-xs font-bold uppercase tracking-wide"
                                                >
                                                    View & Edit Workflow
                                                </a>
                                            </div>
                                        )}

                                        {/* Generic Data Visualizer (Table/Grid) */}
                                        {/* Handle Array of Objects (Table View) */}
                                        {tool.result.data && Array.isArray(tool.result.data) && tool.result.data.length > 0 && typeof tool.result.data[0] === 'object' && (
                                            <div className="overflow-x-auto">
                                                <table className={`w-full text-left border-collapse text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    <thead>
                                                        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                            {Object.keys(tool.result.data[0]).slice(0, 4).map(key => (
                                                                <th key={key} className="py-2 px-3 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                                                    {key.replace(/_/g, ' ')}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {tool.result.data.slice(0, 5).map((row: any, i: number) => (
                                                            <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} hover:bg-black/5 dark:hover:bg-white/5`}>
                                                                {Object.keys(row).slice(0, 4).map(key => (
                                                                    <td key={key} className="py-2 px-3 truncate max-w-[150px]">
                                                                        {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {tool.result.data.length > 5 && (
                                                    <div className="p-2 text-center text-[10px] opacity-60">
                                                        + {tool.result.data.length - 5} more items
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Handle Object (Key-Value Grid) */}
                                        {tool.result.data && !Array.isArray(tool.result.data) && typeof tool.result.data === 'object' && (
                                            <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl ${isDarkMode ? 'bg-gray-900/40' : 'bg-gray-50/50'}`}>
                                                {Object.entries(tool.result.data).slice(0, 8).map(([key, value]) => {
                                                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null; // Skip nested objects for grid
                                                    return (
                                                        <div key={key} className="p-2">
                                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {key.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {Array.isArray(value) ? `Array[${value.length}]` : String(value)}
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

                            </div>
                        )}
                    </ToolInsightCard>
                );
            })}
        </div>
    );
};

export default ToolResultWidget;
