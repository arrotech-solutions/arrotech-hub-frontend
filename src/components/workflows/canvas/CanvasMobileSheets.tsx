import React from 'react';
import CanvasToolbar from '../panels/CanvasToolbar';
import { MCPTool, ToolInfo } from '../../../types';

interface CanvasMobileSheetsProps {
  open: boolean;
  onClose: () => void;
  tools: (MCPTool | ToolInfo)[];
  onAddTool: (tool: MCPTool | ToolInfo) => void;
  onAddCondition?: () => void;
  isDark?: boolean;
}

/** Bottom-sheet tool library for tablet/mobile. */
const CanvasMobileSheets: React.FC<CanvasMobileSheetsProps> = ({
  open,
  onClose,
  tools,
  onAddTool,
  onAddCondition,
  isDark,
}) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="Tool library">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Dismiss tool library"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-secondary-950">
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        </div>
        <CanvasToolbar
          tools={tools}
          onAddTool={onAddTool}
          onAddCondition={onAddCondition}
          onToggleCollapse={onClose}
          isDark={isDark}
          variant="sheet"
        />
      </div>
    </div>
  );
};

export default CanvasMobileSheets;
