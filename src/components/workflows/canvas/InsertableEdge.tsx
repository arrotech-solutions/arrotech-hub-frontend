import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { Plus } from 'lucide-react';

export type InsertableEdgeData = {
  branchKey?: string;
  onInsert?: (edgeId: string) => void;
};

const InsertableEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  label,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const edgeData = data as InsertableEdgeData | undefined;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {label ? (
              <span className="rounded-md bg-secondary-900/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                {String(label)}
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Insert step between nodes"
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onInsert?.(id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-primary-600 shadow-md transition hover:scale-110 hover:bg-primary-50 dark:bg-secondary-900 dark:text-primary-400 dark:hover:bg-secondary-800"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(InsertableEdge);
