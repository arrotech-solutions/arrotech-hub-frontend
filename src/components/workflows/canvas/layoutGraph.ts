import dagre from 'dagre';
import { Edge, Node, Position } from '@xyflow/react';

const NODE_W = 260;
const NODE_H = 120;

export function layoutWithDagre(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_W, height: NODE_H });
  });
  edges.forEach((edge) => {
    if (edge.source && edge.target) g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const isHorizontal = direction === 'LR';
  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: pos.x - NODE_W / 2,
        y: pos.y - NODE_H / 2,
      },
    };
  });
}
