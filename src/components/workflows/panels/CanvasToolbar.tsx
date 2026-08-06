import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronDown, GripVertical, X, GitBranch } from 'lucide-react';
import { MCPTool, ToolInfo } from '../../../types';
import {
  TOOL_CATEGORIES,
  TOOLBAR_COLOR_MAP,
  getToolCategory,
  sortCategories,
  CONDITION_TOOL,
} from '../shared/toolCategories';
import { PALETTE_DND_MIME } from '../canvas/types';

interface CanvasToolbarProps {
  tools: (MCPTool | ToolInfo)[];
  onAddTool: (tool: MCPTool | ToolInfo) => void;
  onAddCondition?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isDark?: boolean;
  variant?: 'sidebar' | 'sheet';
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  tools,
  onAddTool,
  onAddCondition,
  isCollapsed,
  onToggleCollapse,
  variant = 'sidebar',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(['Communication', 'AI & LLM', 'Google Workspace', 'Slack'])
  );

  const categorizedTools = useMemo(() => {
    const categories: Record<string, (MCPTool | ToolInfo)[]> = {};
    tools.forEach((tool) => {
      const category = getToolCategory(tool.name, (tool as any).category);
      if (!categories[category]) categories[category] = [];
      categories[category].push(tool);
    });
    // Stable alpha within each bucket
    Object.values(categories).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name))
    );
    return categories;
  }, [tools]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const entries = Object.entries(categorizedTools)
      .map(([cat, catTools]) => {
        const matching = !query
          ? catTools
          : catTools.filter(
              (t) =>
                t.name.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        return [cat, matching] as [string, (MCPTool | ToolInfo)[]];
      })
      .filter(([, catTools]) => catTools.length > 0);

    const orderedKeys = sortCategories(entries.map(([cat]) => cat));
    const byCat = new Map(entries);
    return orderedKeys.map((cat) => [cat, byCat.get(cat)!] as const);
  }, [categorizedTools, searchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const onDragStart = (e: React.DragEvent, toolName: string) => {
    e.dataTransfer.setData(PALETTE_DND_MIME, toolName);
    e.dataTransfer.setData('text/plain', toolName);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isCollapsed && variant === 'sidebar') {
    return (
      <div className="flex h-full w-14 flex-col items-center bg-white/80 py-4 backdrop-blur-xl dark:bg-secondary-950/80">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand tool library"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  const widthClass = variant === 'sheet' ? 'w-full' : 'w-[300px] sm:w-[320px]';

  return (
    <div
      className={`${widthClass} flex h-full flex-col bg-white/90 backdrop-blur-2xl dark:bg-secondary-950/90`}
      role="complementary"
      aria-label="Tool library"
    >
      <div className="border-b border-slate-100 px-4 py-4 dark:border-white/5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-secondary-900 dark:text-white">Tool Library</h3>
            <p className="text-[10px] font-medium text-slate-400">{tools.length} tools · drag or click</p>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Close tool library"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white"
          />
        </div>
        {onAddCondition && (
          <button
            type="button"
            onClick={onAddCondition}
            className="mt-3 flex w-full items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2.5 text-left text-xs font-bold text-accent-900 transition hover:bg-accent-100 dark:border-accent-500/30 dark:bg-accent-500/10 dark:text-accent-200"
          >
            <GitBranch className="h-4 w-4" />
            Add Condition / Router
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'thin' }}>
        {filteredCategories.map(([category, catTools]) => {
            const config = TOOL_CATEGORIES[category] || TOOL_CATEGORIES.General;
            const Icon = config.icon;
            const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0;
            const colorClasses = TOOLBAR_COLOR_MAP[config.color] || TOOLBAR_COLOR_MAP.slate;

            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg border p-1 ${colorClasses}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                      {catTools.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mb-2 ml-1 space-y-0.5">
                    {catTools.map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        draggable
                        onDragStart={(e) => onDragStart(e, tool.name)}
                        onClick={() => onAddTool(tool)}
                        className="group/tool flex w-full cursor-grab items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-primary-200 hover:bg-primary-50/60 active:cursor-grabbing dark:hover:border-primary-500/30 dark:hover:bg-primary-500/10"
                        title={tool.description || tool.name}
                      >
                        <GripVertical className="h-3 w-3 shrink-0 text-slate-300 group-hover/tool:text-primary-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-700 group-hover/tool:text-primary-700 dark:text-slate-300 dark:group-hover/tool:text-primary-300">
                            {tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          {tool.description && (
                            <p className="truncate text-[10px] text-slate-400">{tool.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {filteredCategories.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-400">No tools found</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
        <p className="text-center text-[10px] font-medium text-slate-400">
          Drag onto canvas or click to append
        </p>
        <p className="sr-only">Condition tool id: {CONDITION_TOOL}</p>
      </div>
    </div>
  );
};

export default CanvasToolbar;
