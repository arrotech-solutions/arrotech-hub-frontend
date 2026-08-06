import React from 'react';
import { Background, BackgroundVariant, Controls, MiniMap, Node } from '@xyflow/react';
import { WorkflowNodeData } from './types';

interface CanvasChromeProps {
  isDark?: boolean;
  showMiniMap?: boolean;
}

/** React Flow chrome: grid, controls, minimap — brand-token colors. */
export function CanvasChrome({ isDark, showMiniMap = true }: CanvasChromeProps) {
  return (
    <>
      <Background
        variant={BackgroundVariant.Cross}
        gap={22}
        size={1.5}
        color={isDark ? '#3d2a55' : '#E4DCEC'}
      />
      <Controls
        showInteractive={false}
        aria-label="Canvas zoom controls"
        className={
          isDark
            ? '!rounded-2xl !border !border-white/20 !bg-secondary-950/95 !shadow-lg [&>button]:!bg-transparent [&>button]:!border-white/10'
            : '!rounded-2xl !border !border-slate-200 !bg-white/95 !shadow-lg'
        }
      />
      {showMiniMap && (
        <MiniMap
          pannable
          zoomable
          aria-label="Workflow overview map"
          className="!rounded-xl !border !border-slate-200 !bg-white/90 dark:!border-secondary-700 dark:!bg-secondary-900/90"
          maskColor={isDark ? 'rgba(15, 10, 25, 0.7)' : 'rgba(240, 240, 245, 0.65)'}
          bgColor={isDark ? '#1a1228' : '#f8f7fb'}
          nodeStrokeColor={isDark ? '#E8DFF5' : '#1E1033'}
          nodeStrokeWidth={2}
          nodeColor={(n: Node) => {
            // Trigger: light violet in dark mode so it reads on the dark minimap bg
            if (n.id === 'trigger') return isDark ? '#C4B0E0' : '#1E1033';
            const d = n.data as WorkflowNodeData;
            if (!d?.isConfigured) return '#F5A623';
            return '#FF4696';
          }}
        />
      )}
    </>
  );
}

export default CanvasChrome;
