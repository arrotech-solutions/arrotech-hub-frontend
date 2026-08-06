import { useCallback, useRef, useState } from 'react';
import { Edge, Node } from '@xyflow/react';

export type GraphSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

const MAX_HISTORY = 50;

function cloneSnapshot(nodes: Node[], edges: Edge[]): GraphSnapshot {
  return {
    nodes: nodes.map((n) => ({ ...n, position: { ...n.position }, data: { ...n.data } })),
    edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : e.data })),
  };
}

export function useCanvasHistory() {
  const past = useRef<GraphSnapshot[]>([]);
  const future = useRef<GraphSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  const pushHistory = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), cloneSnapshot(nodes, edges)];
      future.current = [];
      syncFlags();
    },
    [syncFlags]
  );

  const undo = useCallback(
    (current: GraphSnapshot): GraphSnapshot | null => {
      if (!past.current.length) return null;
      const prev = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [...future.current, cloneSnapshot(current.nodes, current.edges)];
      syncFlags();
      return prev;
    },
    [syncFlags]
  );

  const redo = useCallback(
    (current: GraphSnapshot): GraphSnapshot | null => {
      if (!future.current.length) return null;
      const next = future.current[future.current.length - 1];
      future.current = future.current.slice(0, -1);
      past.current = [...past.current, cloneSnapshot(current.nodes, current.edges)];
      syncFlags();
      return next;
    },
    [syncFlags]
  );

  const clearHistory = useCallback(() => {
    past.current = [];
    future.current = [];
    syncFlags();
  }, [syncFlags]);

  return { pushHistory, undo, redo, canUndo, canRedo, clearHistory };
}
