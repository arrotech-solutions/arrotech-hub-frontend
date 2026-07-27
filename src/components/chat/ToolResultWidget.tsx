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
import SearchSourceCards from './SearchSourceCards';
import ToolProposalCard from './ToolProposalCard';

interface ToolResultWidgetProps {
    message: Message;
    isDarkMode: boolean;
    responseMode?: 'simple' | 'detailed';
    onViewSources?: (sources: any[]) => void;
}

const ToolResultWidget: React.FC<ToolResultWidgetProps> = ({
    message,
    isDarkMode,
    responseMode = 'simple',
    onViewSources,
}) => {
    if (!message.tools_called) return null;

    const pendingProposals = message.tools_called.filter(
        (t) => t?.result?.pending_confirmation && t?.result?.proposal_id
    );

    return (
        <div className="space-y-4 my-4">
            {pendingProposals.map((tool, idx) => (
                <ToolProposalCard
                    key={`proposal_${tool.result?.proposal_id || idx}`}
                    proposalId={String(tool.result.proposal_id)}
                    summary={tool.result.summary || tool.result.message || `Confirm ${tool.name}`}
                    toolName={tool.name}
                    isDarkMode={isDarkMode}
                />
            ))}

            {message.tools_called.map((tool, idx) => {
                const isSuccess = tool.success !== false && !tool.result?.error;
                const toolContext = (tool as any).context;
                // Proposal cards already rendered above
                if (tool?.result?.pending_confirmation) {
                    return null;
                }

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
                                                    className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-primary-500/20"
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                        )}

                                        {/* Web Search Sources UI */}
                                        {tool.name === 'web_search' && tool.result.sources && Array.isArray(tool.result.sources) && (
                                            <SearchSourceCards 
                                                sources={tool.result.sources} 
                                                isDarkMode={isDarkMode} 
                                                onViewSources={onViewSources}
                                            />
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

                                        {/* WhatsApp inbox / thread widgets */}
                                        {(tool.name === 'whatsapp_inbox' || tool.result?.data?.widget === 'whatsapp_inbox') && tool.result.data?.conversations && (
                                            <div className="space-y-2">
                                                {tool.result.data.conversations.slice(0, 6).map((c: any, i: number) => (
                                                    <a
                                                        key={i}
                                                        href={c.inbox_url || '/inbox'}
                                                        className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-emerald-600' : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300'}`}
                                                    >
                                                        <div>
                                                            <p className="text-xs font-bold">{c.name || c.phone_number}</p>
                                                            <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{c.phone_number}</p>
                                                        </div>
                                                        {(c.unread_count || 0) > 0 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">{c.unread_count}</span>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {(tool.name === 'whatsapp_inbox' || tool.result?.data?.widget === 'whatsapp_thread') && tool.result.data?.messages && (
                                            <div className={`rounded-xl border p-3 space-y-2 max-h-64 overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                {tool.result.data.contact && (
                                                    <a href={tool.result.data.inbox_url || '/inbox'} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                        Open in Inbox <ExternalLink size={12} />
                                                    </a>
                                                )}
                                                {tool.result.data.messages.slice(-8).map((m: any, i: number) => (
                                                    <div key={i} className={`text-xs p-2 rounded-lg ${m.direction === 'incoming' || m.direction === 'INCOMING' ? (isDarkMode ? 'bg-slate-800' : 'bg-gray-100') : (isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50')}`}>
                                                        <p className="opacity-60 text-[10px] mb-0.5">{m.direction}{m.is_agent ? ' · agent' : ''}</p>
                                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Google Workspace quick chips */}
                                        {tool.name?.startsWith('google_workspace_') && tool.result.data && !Array.isArray(tool.result.data) && (
                                            <div className={`flex flex-wrap gap-2 ${isDarkMode ? 'text-sky-200' : 'text-sky-800'}`}>
                                                {tool.result.data.html_link && (
                                                    <a href={tool.result.data.html_link} target="_blank" rel="noreferrer" className="text-xs underline inline-flex items-center gap-1">
                                                        Open in Google <ExternalLink size={12} />
                                                    </a>
                                                )}
                                                {tool.result.data.webViewLink && (
                                                    <a href={tool.result.data.webViewLink} target="_blank" rel="noreferrer" className="text-xs underline inline-flex items-center gap-1">
                                                        Open Drive file <ExternalLink size={12} />
                                                    </a>
                                                )}
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
                                                    className="mt-3 block w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-primary-500/25 text-xs font-bold uppercase tracking-wide"
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
