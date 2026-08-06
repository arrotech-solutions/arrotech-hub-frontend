import React, { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { getToolCategory } from '../shared/toolCategories';
import { MCPTool, ToolInfo } from '../../../types';

interface CanvasAssistStripProps {
  tools: (MCPTool | ToolInfo)[];
  onSuggest: (tool: MCPTool | ToolInfo) => void;
  onClose: () => void;
}

/** Lightweight local suggest — matches keywords to tool names without blocking on LLM. */
function suggestTools(prompt: string, tools: (MCPTool | ToolInfo)[], limit = 4): (MCPTool | ToolInfo)[] {
  const q = prompt.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = tools
    .map((tool) => {
      const hay = `${tool.name} ${tool.description || ''} ${getToolCategory(tool.name)}`.toLowerCase();
      let score = 0;
      tokens.forEach((t) => {
        if (hay.includes(t)) score += 2;
        if (tool.name.toLowerCase().includes(t)) score += 3;
      });
      if (q.includes('whatsapp') && hay.includes('whatsapp')) score += 5;
      if (q.includes('telegram') && hay.includes('telegram')) score += 5;
      if ((q.includes('sheet') || q.includes('google')) && (hay.includes('sheet') || hay.includes('google'))) score += 4;
      if (q.includes('condition') || q.includes('if ') || q.includes('branch')) {
        if (hay.includes('condition') || tool.name === 'condition_router') score += 6;
      }
      if (q.includes('agent') && hay.includes('agent')) score += 4;
      return { tool, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.tool);
}

const CanvasAssistStrip: React.FC<CanvasAssistStripProps> = ({ tools, onSuggest, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<(MCPTool | ToolInfo)[]>([]);

  const run = () => {
    setBusy(true);
    // Non-blocking: microtask simulate assist latency
    window.setTimeout(() => {
      setResults(suggestTools(prompt, tools));
      setBusy(false);
    }, 180);
  };

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-lg rounded-2xl border border-secondary-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-secondary-700 dark:bg-secondary-950/95 sm:left-auto sm:right-24 sm:mx-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-secondary-800 dark:text-secondary-100">
          <Sparkles className="h-3.5 w-3.5 text-primary-500" aria-hidden />
          Describe next step
          <span className="ml-1 font-medium text-slate-400">(keyword match)</span>
        </div>
        <button type="button" aria-label="Close AI assist" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/10">
          <X className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="e.g. send WhatsApp confirmation…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
        />
        <button
          type="button"
          onClick={run}
          disabled={busy || !prompt.trim()}
          className="rounded-xl bg-secondary-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-primary-500"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suggest'}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 space-y-1">
          {results.map((tool) => (
            <li key={tool.name}>
              <button
                type="button"
                onClick={() => onSuggest(tool)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-primary-50 dark:text-slate-200 dark:hover:bg-primary-500/10"
              >
                {tool.name.replace(/_/g, ' ')}
                <span className="ml-2 text-[10px] text-slate-400">{getToolCategory(tool.name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length === 0 && prompt && !busy && (
        <p className="mt-2 text-[11px] text-slate-400">No matches — try different keywords or open the library.</p>
      )}
    </div>
  );
};

export default CanvasAssistStrip;
