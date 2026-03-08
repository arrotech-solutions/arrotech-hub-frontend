import React, { useState, useMemo } from 'react';
import {
    Search, ChevronRight, ChevronDown, GripVertical,
    CreditCard, ShoppingBag, FileText, Truck, Users,
    Leaf, Activity, Settings, Globe, Palette, Shield,
    BarChart3, Zap, Droplets, X
} from 'lucide-react';
import { MCPTool, ToolInfo } from '../../types';

const TOOL_CATEGORIES: Record<string, { icon: any; color: string; prefix?: string; keywords?: string[] }> = {
    'Fintech': { icon: CreditCard, color: 'emerald', keywords: ['payment', 'mpesa', 'airtel', 't_kash', 'equity_jenga', 'flutterwave', 'paystack', 'kopo_kopo', 'cellulant', 'pesapal', 'ipay', 'little_pay'] },
    'E-commerce': { icon: ShoppingBag, color: 'blue', keywords: ['ecommerce', 'jumia', 'kilimall', 'jiji', 'masoko', 'copia', 'twiga', 'wasoko', 'sky_garden'] },
    'Accounting': { icon: FileText, color: 'indigo', keywords: ['accounting', 'kra', 'itax', 'quickbooks', 'xero', 'zoho', 'lipabiz', 'sasapay'] },
    'Logistics': { icon: Truck, color: 'amber', keywords: ['logistics', 'amitruck', 'lori', 'sendy', 'busybee', 'fargo', 'g4s'] },
    'Human Resources': { icon: Users, color: 'rose', keywords: ['hr', 'workpay', 'seamlesshr', 'bitrix', 'bamboo'] },
    'Agritech': { icon: Leaf, color: 'green', keywords: ['agri', 'shamba', 'digifarm', 'apollo', 'iprocure', 'farmdrive'] },
    'Healthtech': { icon: Activity, color: 'red', keywords: ['health', 'mydawa', 'penda', 'ilara', 'tibu'] },
    'Utilities': { icon: Droplets, color: 'cyan', keywords: ['utility', 'kenya_power', 'nairobi_water', 'safaricom_biz', 'zuku'] },
    'Slack': { icon: Users, color: 'purple', prefix: 'slack_' },
    'HubSpot': { icon: BarChart3, color: 'orange', prefix: 'hubspot_' },
    'Analytics': { icon: BarChart3, color: 'blue', prefix: 'ga4_' },
    'Communication': { icon: Users, color: 'green', prefix: 'whatsapp_' },
    'File Management': { icon: FileText, color: 'purple', prefix: 'file_' },
    'Web Tools': { icon: Globe, color: 'orange', prefix: 'web_' },
    'Content Creation': { icon: Palette, color: 'pink', prefix: 'content_' },
    'Advanced': { icon: Zap, color: 'indigo', prefix: 'advanced_' },
    'Enterprise': { icon: Shield, color: 'red', prefix: 'enterprise_' },
    'General': { icon: Settings, color: 'gray', prefix: '' },
};

function getToolCategory(toolName: string): string {
    const lowerName = toolName.toLowerCase();
    for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
        if (config.prefix && lowerName.startsWith(config.prefix)) return category;
        if (config.keywords) {
            for (const keyword of config.keywords) {
                if (lowerName.includes(keyword)) return category;
            }
        }
    }
    return 'General';
}

const COLOR_MAP: Record<string, string> = {
    'emerald': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'blue': 'bg-blue-100 text-blue-700 border-blue-200',
    'indigo': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'amber': 'bg-amber-100 text-amber-700 border-amber-200',
    'rose': 'bg-rose-100 text-rose-700 border-rose-200',
    'green': 'bg-green-100 text-green-700 border-green-200',
    'red': 'bg-red-100 text-red-700 border-red-200',
    'cyan': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'purple': 'bg-purple-100 text-purple-700 border-purple-200',
    'orange': 'bg-orange-100 text-orange-700 border-orange-200',
    'pink': 'bg-pink-100 text-pink-700 border-pink-200',
    'gray': 'bg-gray-100 text-gray-700 border-gray-200',
};

interface CanvasToolbarProps {
    tools: (MCPTool | ToolInfo)[];
    onAddTool: (tool: MCPTool | ToolInfo) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isDark?: boolean;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ tools, onAddTool, isCollapsed, onToggleCollapse, isDark }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['All']));

    const categorizedTools = useMemo(() => {
        const categories: Record<string, (MCPTool | ToolInfo)[]> = {};
        tools.forEach(tool => {
            const category = getToolCategory(tool.name);
            if (!categories[category]) categories[category] = [];
            categories[category].push(tool);
        });
        return categories;
    }, [tools]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categorizedTools;
        const query = searchQuery.toLowerCase();
        const filtered: Record<string, (MCPTool | ToolInfo)[]> = {};
        Object.entries(categorizedTools).forEach(([cat, catTools]) => {
            const matching = catTools.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
            if (matching.length > 0) filtered[cat] = matching;
        });
        return filtered;
    }, [categorizedTools, searchQuery]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    if (isCollapsed) {
        return (
            <div className={`w-12 backdrop-blur-xl border-r flex flex-col items-center py-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                <button
                    onClick={onToggleCollapse}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    title="Expand toolbar"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className={`w-72 backdrop-blur-xl border-r flex flex-col h-full shadow-xl ${isDark ? 'bg-gray-800/95 border-gray-700 shadow-black/20' : 'bg-white/95 border-gray-200 shadow-gray-200/20'}`}>
            {/* Header */}
            <div className={`px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tool Library</h3>
                        <p className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{tools.length} tools available</p>
                    </div>
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search tools..."
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:bg-gray-700' : 'bg-gray-50 border-gray-200 focus:bg-white placeholder:text-gray-400'}`}
                    />
                </div>
            </div>

            {/* Tool List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                {Object.entries(filteredCategories)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, catTools]) => {
                        const config = TOOL_CATEGORIES[category] || TOOL_CATEGORIES['General'];
                        const Icon = config.icon;
                        const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0;
                        const colorClasses = COLOR_MAP[config.color] || COLOR_MAP['gray'];

                        return (
                            <div key={category}>
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors group ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-1 rounded-lg border ${colorClasses}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{category}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-400 bg-gray-100'}`}>
                                            {catTools.length}
                                        </span>
                                        {isExpanded
                                            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                            : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                        }
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="ml-2 space-y-0.5 mb-2">
                                        {catTools.map(tool => (
                                            <button
                                                key={tool.name}
                                                onClick={() => onAddTool(tool)}
                                                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl border border-transparent transition-all group/tool text-left ${isDark ? 'hover:bg-blue-900/30 hover:border-blue-800' : 'hover:bg-blue-50 hover:border-blue-200'}`}
                                                title={tool.description || tool.name}
                                            >
                                                <GripVertical className={`w-3 h-3 transition-colors flex-shrink-0 ${isDark ? 'text-gray-600 group-hover/tool:text-blue-400' : 'text-gray-300 group-hover/tool:text-blue-400'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-semibold truncate transition-colors ${isDark ? 'text-gray-300 group-hover/tool:text-blue-300' : 'text-gray-700 group-hover/tool:text-blue-700'}`}>
                                                        {tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </p>
                                                    {tool.description && (
                                                        <p className={`text-[10px] truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{tool.description}</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                {Object.keys(filteredCategories).length === 0 && (
                    <div className="text-center py-8 px-4">
                        <Search className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No tools found</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Try a different search term</p>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <p className={`text-[10px] text-center font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click a tool to add it to the canvas
                </p>
            </div>
        </div>
    );
};

export default CanvasToolbar;
