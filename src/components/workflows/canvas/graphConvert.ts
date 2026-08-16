import { Edge, MarkerType, Node } from '@xyflow/react';
import { getToolCategory, CONDITION_TOOL, isAgentTool, isMessagingSendTool } from '../shared/toolCategories';
import { WorkflowNodeData, WorkflowStep } from './types';

export const EDGE_STYLE = {
  stroke: 'var(--color-primary-500, #FF4696)',
  strokeWidth: 2.5,
};

export const EDGE_MARKER = {
  type: MarkerType.ArrowClosed as const,
  color: 'var(--color-primary-500, #FF4696)',
};

export const defaultEdgeOptions = {
  type: 'insertable',
  animated: true,
  style: EDGE_STYLE,
  markerEnd: EDGE_MARKER,
};

function formatLabel(toolName: string): string {
  return toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function channelBadgeFor(toolName: string): string | null {
  const n = toolName.toLowerCase();
  if (n.includes('whatsapp')) return 'WhatsApp';
  if (n.includes('telegram')) return 'Telegram';
  if (n.includes('slack')) return 'Slack';
  if (n.includes('instagram')) return 'Instagram';
  return null;
}

function makeStepNode(
  step: WorkflowStep,
  index: number,
  position: { x: number; y: number },
  branchKey?: string
): Node {
  const isCondition =
    step.tool_name === CONDITION_TOOL ||
    step.tool_name === 'condition';

  return {
    id: `step-${step.id}`,
    type: 'workflowNode',
    position,
    data: {
      label: formatLabel(step.tool_name),
      toolName: step.tool_name,
      category: isCondition ? 'Logic' : getToolCategory(step.tool_name),
      description: step.description,
      stepNumber: index + 1,
      isConfigured:
        Object.keys(step.tool_parameters || {}).length > 0 ||
        isCondition ||
        step.tool_name === CONDITION_TOOL,
      parameters: step.tool_parameters || {},
      retry_config: step.retry_config || { max_retries: 3, retry_delay: 30 },
      timeout: step.timeout ?? 60,
      condition: step.condition,
      isCondition,
      branchKey: branchKey || step.branch_key,
      isAgentAware: isAgentTool(step.tool_name) || isMessagingSendTool(step.tool_name),
      channelBadge: channelBadgeFor(step.tool_name),
      executionStatus: 'idle',
    } as WorkflowNodeData,
  };
}

/**
 * Convert steps → RF nodes/edges.
 * Supports linear chains and condition branches via step.condition.branches
 * or explicit branch_key on child steps.
 */
export function stepsToNodesAndEdges(
  steps: WorkflowStep[],
  triggerType: string
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const triggerNode: Node = {
    id: 'trigger',
    type: 'workflowNode',
    position: { x: 280, y: 40 },
    data: {
      label: 'Start',
      toolName: 'trigger',
      category: 'Trigger',
      description: `${triggerType} trigger`,
      stepNumber: 0,
      isConfigured: true,
      isTrigger: true,
      triggerType,
      executionStatus: 'idle',
    } as WorkflowNodeData,
  };
  nodes.push(triggerNode);

  if (!steps.length) return { nodes, edges };

  // Detect branch graph: steps with branch_key or condition routers
  const hasBranchMeta = steps.some((s) => s.branch_key || s.condition?.branches);

  if (!hasBranchMeta) {
    steps.forEach((step, index) => {
      const node = makeStepNode(step, index, { x: 280, y: 180 + index * 170 });
      nodes.push(node);
      const sourceId = index === 0 ? 'trigger' : `step-${steps[index - 1].id}`;
      edges.push({
        id: `e-${sourceId}-${node.id}`,
        source: sourceId,
        target: node.id,
        ...defaultEdgeOptions,
      });
    });
    return { nodes, edges };
  }

  // Graph with routers: place linearly by step_number, fan branches horizontally
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  const branchColumns: Record<string, number> = { true: -1, false: 1, default: 0 };
  let colCounter = 2;

  sorted.forEach((step, index) => {
    const bk = step.branch_key || '';
    let col = 0;
    if (bk) {
      if (!(bk in branchColumns)) {
        branchColumns[bk] = colCounter++;
      }
      col = branchColumns[bk];
    }
    const x = 280 + col * 280;
    const y = 180 + index * 150;
    nodes.push(makeStepNode(step, index, { x, y }, bk || undefined));
  });

  // Wire: prefer condition.branches map, else sequential by parent
  sorted.forEach((step, index) => {
    const nodeId = `step-${step.id}`;
    const data = nodes.find((n) => n.id === nodeId)?.data as WorkflowNodeData | undefined;

    if (data?.isCondition && step.condition?.branches) {
      Object.entries(step.condition.branches as Record<string, string | number>).forEach(([key, targetRef]) => {
        // Prefer stable step_number refs; fall back to step id for legacy saves
        let targetStep =
          sorted.find((s) => String(s.step_number) === String(targetRef)) ||
          sorted.find((s) => String(s.id) === String(targetRef));
        if (!targetStep) return;
        const targetId = `step-${targetStep.id}`;
        edges.push({
          id: `e-${nodeId}-${targetId}-${key}`,
          source: nodeId,
          target: targetId,
          sourceHandle: key === 'false' ? 'false' : key === 'true' ? 'true' : undefined,
          label: key,
          data: { branchKey: key },
          ...defaultEdgeOptions,
        });
      });
      return;
    }

    // Default: connect from previous non-branch sibling or trigger
    if (index === 0) {
      edges.push({
        id: `e-trigger-${nodeId}`,
        source: 'trigger',
        target: nodeId,
        ...defaultEdgeOptions,
      });
      return;
    }

    // Find nearest prior step without conflicting branch, or the condition parent
    const prev = sorted[index - 1];
    const prevId = `step-${prev.id}`;
    const prevIsCondition =
      prev.tool_name === CONDITION_TOOL || prev.tool_name === 'condition' || !!prev.condition?.branches;

    // Router already wired its branch targets above — don't re-wire sequentially
    if (prevIsCondition && prev.condition?.branches) {
      const branchTargets = new Set(
        Object.values(prev.condition.branches as Record<string, string | number>).map(String)
      );
      if (branchTargets.has(String(step.step_number)) || branchTargets.has(String(step.id))) {
        return;
      }
    }

    if (prevIsCondition && step.branch_key) {
      edges.push({
        id: `e-${prevId}-${nodeId}-${step.branch_key}`,
        source: prevId,
        target: nodeId,
        sourceHandle: step.branch_key === 'false' ? 'false' : step.branch_key === 'true' ? 'true' : undefined,
        label: step.branch_key,
        data: { branchKey: step.branch_key },
        ...defaultEdgeOptions,
      });
    } else if (prevIsCondition) {
      // Don't attach non-keyed steps to the router sequentially
      return;
    } else if (!step.branch_key || step.branch_key === prev.branch_key) {
      edges.push({
        id: `e-${prevId}-${nodeId}`,
        source: prevId,
        target: nodeId,
        ...defaultEdgeOptions,
      });
    } else {
      // Orphaned branch child — connect from parent condition if nothing else
      const parentCondition = sorted.find(
        (s) =>
          (s.tool_name === CONDITION_TOOL || !!s.condition?.branches) &&
          s.step_number < step.step_number
      );
      const source = parentCondition ? `step-${parentCondition.id}` : 'trigger';
      edges.push({
        id: `e-${source}-${nodeId}`,
        source,
        target: nodeId,
        sourceHandle: step.branch_key === 'false' ? 'false' : step.branch_key === 'true' ? 'true' : undefined,
        label: step.branch_key,
        data: { branchKey: step.branch_key },
        ...defaultEdgeOptions,
      });
    }
  });

  return { nodes, edges };
}

/** Topological / BFS order from trigger into WorkflowStep[] with branch metadata. */
export function nodesToSteps(nodes: Node[], edges: Edge[]): WorkflowStep[] {
  const stepNodes = nodes.filter((n) => n.id !== 'trigger');
  const adjacency = new Map<string, { target: string; branchKey?: string }[]>();
  edges.forEach((e) => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    const branchKey =
      (e.data as any)?.branchKey ||
      (typeof e.label === 'string' ? e.label : undefined) ||
      e.sourceHandle ||
      undefined;
    adjacency.get(e.source)!.push({ target: e.target, branchKey });
  });

  const visited = new Set<string>();
  const ordered: { id: string; branchKey?: string }[] = [];

  function walk(id: string, branchKey?: string) {
    if (visited.has(id)) return;
    visited.add(id);
    if (id !== 'trigger') ordered.push({ id, branchKey });
    (adjacency.get(id) || []).forEach((next) =>
      walk(next.target, next.branchKey || branchKey)
    );
  }

  walk('trigger');

  stepNodes.forEach((n) => {
    if (!visited.has(n.id)) ordered.push({ id: n.id });
  });

  const idToStepNumber = new Map(ordered.map((o, index) => [o.id, index + 1]));

  return ordered
    .map(({ id, branchKey }, index) => {
      const node = stepNodes.find((n) => n.id === id);
      if (!node) return null;
      const data = node.data as unknown as WorkflowNodeData;
      const stepId = id.replace(/^step-/, '');

      let condition = data.isCondition || data.toolName === CONDITION_TOOL
        ? data.condition
        : undefined;
      if (data.isCondition || data.toolName === CONDITION_TOOL) {
        const outs = adjacency.get(id) || [];
        // Persist branch targets as step_number (stable across server UUID reassignment)
        const branches: Record<string, number> = {};
        outs.forEach((o) => {
          const key = o.branchKey || 'default';
          const num = idToStepNumber.get(o.target);
          if (num != null) branches[key] = num;
        });
        condition = {
          ...(typeof condition === 'object' && condition ? condition : {}),
          type: 'router',
          expression: (condition as any)?.expression || data.parameters?.expression || '',
          branches,
        };
      }

      return {
        id: stepId,
        step_number: index + 1,
        tool_name: data.toolName,
        tool_parameters: data.parameters || {},
        description: data.description || '',
        retry_config: data.retry_config || { max_retries: 3, retry_delay: 30 },
        timeout: data.timeout ?? 60,
        condition,
        branch_key: branchKey || data.branchKey,
      } as WorkflowStep;
    })
    .filter(Boolean) as WorkflowStep[];
}

export function renumberSteps(nodes: Node[], edges?: Edge[]): Node[] {
  if (!edges || edges.length === 0) {
    let stepCount = 0;
    return nodes.map((n) => {
      if (n.id === 'trigger') return n;
      stepCount += 1;
      return { ...n, data: { ...n.data, stepNumber: stepCount } };
    });
  }

  const adjacency = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const order: string[] = [];
  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    if (id !== 'trigger') order.push(id);
    (adjacency.get(id) || []).forEach(walk);
  }
  walk('trigger');
  nodes.forEach((n) => {
    if (n.id !== 'trigger' && !visited.has(n.id)) order.push(n.id);
  });

  const indexById = new Map(order.map((id, i) => [id, i + 1]));
  return nodes.map((n) => {
    if (n.id === 'trigger') return n;
    const stepNumber = indexById.get(n.id) ?? (n.data as any)?.stepNumber;
    return { ...n, data: { ...n.data, stepNumber } };
  });
}
