import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Save, Loader2, AlertCircle, MousePointer, Clock, Webhook, Play,
  ArrowLeft, Layout, Undo2, Redo2, Sparkles, PanelLeft, Menu,
} from 'lucide-react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from '../../lib/notify';
import apiService from '../../services/api';
import { MCPTool, ToolInfo } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useIsDark } from '../../hooks/useIsDark';
import WorkflowNodeComponent from './nodes/WorkflowNode';
import CanvasToolbar from './panels/CanvasToolbar';
import NodeConfigPanel, { NodeConfigPanelHandle, NodeConfigPendingUpdate } from './NodeConfigPanel';
import CanvasEmptyState from './canvas/CanvasEmptyState';
import InsertableEdge from './canvas/InsertableEdge';
import ValidationStrip from './canvas/ValidationStrip';
import CanvasAssistStrip from './canvas/CanvasAssistStrip';
import CanvasChrome from './canvas/CanvasChrome';
import CanvasMobileSheets from './canvas/CanvasMobileSheets';
import {
  CanvasTemplateId,
  skeletonStepsFor,
} from './canvas/TemplateDropZones';
import {
  defaultEdgeOptions,
  EDGE_STYLE,
  renumberSteps,
  stepsToNodesAndEdges,
} from './canvas/graphConvert';
import { layoutWithDagre } from './canvas/layoutGraph';
import { useCanvasHistory } from './canvas/useCanvasHistory';
import { useCanvasSave } from './canvas/useCanvasSave';
import {
  CanvasState,
  PALETTE_DND_MIME,
  TriggerType,
  WorkflowNodeData,
  WorkflowStep,
} from './canvas/types';
import {
  CONDITION_TOOL,
  getToolCategory,
  isAgentTool,
  isMessagingSendTool,
  requiredPlatformForTool,
} from './shared/toolCategories';

export type { CanvasState };

interface WorkflowCanvasProps {
  open: boolean;
  onClose: () => void;
  onWorkflowCreated?: (workflow: any) => void;
  onSwitchToForm?: (data: CanvasState) => void;
  initialData?: any;
  initialCanvasState?: CanvasState | null;
}

const nodeTypes = { workflowNode: WorkflowNodeComponent };
const edgeTypes = { insertable: InsertableEdge };

function mapInitialSteps(initialData: any): WorkflowStep[] {
  if (!initialData?.steps) return [];
  const branchKeys = initialData.workflow_metadata?.branch_keys || {};
  return initialData.steps
    .map((s: any) => ({
      id: String(s.id || Math.random().toString(36).slice(2, 11)),
      step_number: s.step_number,
      tool_name: s.tool_name,
      tool_parameters: s.tool_parameters || {},
      description: s.description || '',
      retry_config: s.retry_config,
      timeout: s.timeout,
      condition: s.condition,
      branch_key:
        s.branch_key ||
        branchKeys[s.id] ||
        branchKeys[String(s.step_number)] ||
        branchKeys[s.step_number],
    }))
    .sort((a: WorkflowStep, b: WorkflowStep) => a.step_number - b.step_number);
}

function mergePendingIntoNodes(nodes: Node[], pending: NodeConfigPendingUpdate): Node[] {
  return nodes.map((n) => {
    if (n.id !== pending.nodeId) return n;
    const data = n.data as WorkflowNodeData;
    const nextCondition =
      data.isCondition || data.toolName === CONDITION_TOOL
        ? { ...(data.condition || {}), type: 'router', expression: pending.conditionExpression }
        : data.condition;
    return {
      ...n,
      data: {
        ...data,
        parameters: pending.parameters,
        description: pending.description,
        retry_config: pending.retry_config,
        timeout: pending.timeout,
        condition: nextCondition,
        isConfigured: true,
      },
    };
  });
}

function WorkflowCanvasInner({
  open,
  onClose,
  onWorkflowCreated,
  onSwitchToForm,
  initialData,
  initialCanvasState,
}: WorkflowCanvasProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('manual');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(false);
  const [showAssist, setShowAssist] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [availableTools, setAvailableTools] = useState<(MCPTool | ToolInfo)[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [insertEdgeId, setInsertEdgeId] = useState<string | null>(null);
  const rf = useReactFlow();
  const skipHistory = useRef(false);
  const panelRef = useRef<NodeConfigPanelHandle>(null);
  const { pushHistory, undo, redo, canUndo, canRedo, clearHistory } = useCanvasHistory();
  const { saving, error, setError, handleSave, getCanvasState } = useCanvasSave();
  const { lastEvent } = useWebSocket();
  const isEditing = !!initialData?.id;
  const isDark = useIsDark();

  const applyPanelFlush = useCallback(
    (baseNodes: Node[]): Node[] => {
      const pending = panelRef.current?.flush();
      if (!pending) return baseNodes;
      return mergePendingIntoNodes(baseNodes, pending);
    },
    []
  );

  const updateTriggerConfig = useCallback((key: string, value: any) => {
    setTriggerConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const decorateConnectionStatus = useCallback(
    (nds: Node[]): Node[] => {
      const platforms = new Set(
        (connections || [])
          .filter((c: any) => {
            const s = String(c.status || c.connection_status || '').toLowerCase();
            return s === 'connected' || s === 'active' || c.is_active === true;
          })
          .map((c: any) => String(c.platform || c.provider || c.type || '').toLowerCase())
      );
      return nds.map((n) => {
        if (n.id === 'trigger') return n;
        const data = n.data as WorkflowNodeData;
        const platform = requiredPlatformForTool(data.toolName);
        if (!platform) {
          return {
            ...n,
            data: {
              ...data,
              connectionStatus: null,
              isAgentAware: isAgentTool(data.toolName) || isMessagingSendTool(data.toolName),
            },
          };
        }
        const connected = [...platforms].some((p) => p.includes(platform) || platform.includes(p));
        return {
          ...n,
          data: {
            ...data,
            connectionStatus: connected ? 'connected' : 'needs_connect',
            connectionLabel: connected ? `${platform} connected` : undefined,
            isAgentAware: isAgentTool(data.toolName) || isMessagingSendTool(data.toolName),
            channelBadge: data.channelBadge,
          },
        };
      });
    },
    [connections]
  );

  const applyGraph = useCallback(
    (nextNodes: Node[], nextEdges: Edge[], recordHistory = true) => {
      if (recordHistory && !skipHistory.current) {
        pushHistory(nodes, edges);
      }
      setNodes(decorateConnectionStatus(renumberSteps(nextNodes, nextEdges)));
      setEdges(nextEdges);
    },
    [decorateConnectionStatus, edges, nodes, pushHistory, setEdges, setNodes]
  );

  const initState = useCallback(() => {
    clearHistory();
    if (initialCanvasState) {
      setWorkflowName(initialCanvasState.workflowName);
      setWorkflowDescription(initialCanvasState.description);
      setTriggerType((initialCanvasState.triggerType as TriggerType) || 'manual');
      setTriggerConfig(initialCanvasState.triggerConfig || {});
      setCategory(initialCanvasState.category);
      setTags(initialCanvasState.tags);
      setVariables(initialCanvasState.variables || {});
      const { nodes: n, edges: e } = stepsToNodesAndEdges(
        initialCanvasState.steps,
        initialCanvasState.triggerType
      );
      setNodes(decorateConnectionStatus(n));
      setEdges(e);
    } else if (initialData) {
      setWorkflowName(initialData.name || '');
      setWorkflowDescription(initialData.description || '');
      setTriggerType((initialData.trigger_type?.toLowerCase() as TriggerType) || 'manual');
      setTriggerConfig(initialData.trigger_config || {});
      setCategory(initialData.workflow_metadata?.category || '');
      setTags(initialData.workflow_metadata?.tags?.join(', ') || '');
      setVariables(initialData.variables || {});
      const mapped = mapInitialSteps(initialData);
      const { nodes: n, edges: e } = stepsToNodesAndEdges(
        mapped,
        (initialData.trigger_type?.toLowerCase() as TriggerType) || 'manual'
      );
      setNodes(decorateConnectionStatus(n));
      setEdges(e);
    } else {
      setWorkflowName('');
      setWorkflowDescription('');
      setTriggerType('manual');
      setTriggerConfig({});
      setCategory('');
      setTags('');
      setVariables({});
      const { nodes: n, edges: e } = stepsToNodesAndEdges([], 'manual');
      setNodes(n);
      setEdges(e);
    }
    setSelectedNode(null);
    setError(null);
    setInsertEdgeId(null);
  }, [clearHistory, decorateConnectionStatus, initialCanvasState, initialData, setEdges, setError, setNodes]);

  useEffect(() => {
    if (!open) return;
    initState();
    (async () => {
      try {
        setLoadingTools(true);
        const [toolsRes, connRes] = await Promise.all([
          apiService.getMCPTools(true),
          apiService.getConnections().catch(() => ({ success: false, data: [] })),
        ]);
        if (toolsRes.success) setAvailableTools(toolsRes.data || []);
        if (connRes.success) setConnections(connRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTools(false);
      }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!connections.length) return;
    setNodes((nds) => decorateConnectionStatus(nds));
  }, [connections, decorateConnectionStatus, setNodes]);

  // Execution overlay from websocket
  useEffect(() => {
    if (!lastEvent || !open || !initialData?.id) return;
    const type = lastEvent.type || '';
    const data = lastEvent.data || {};
    const wfId = data.workflow_id || data.workflowId;
    if (wfId && String(wfId) !== String(initialData.id)) return;

    if (type.includes('step') || type.includes('workflow')) {
      const stepId = data.step_id || data.stepId || data.node_id;
      const status = String(data.status || data.step_status || type).toLowerCase();
      if (!stepId) return;
      const nodeId = String(stepId).startsWith('step-') ? String(stepId) : `step-${stepId}`;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId && n.id !== `step-${stepId}`) return n;
          let executionStatus: WorkflowNodeData['executionStatus'] = 'running';
          if (status.includes('success') || status.includes('completed')) executionStatus = 'success';
          else if (status.includes('fail') || status.includes('error')) executionStatus = 'failed';
          else if (status.includes('running') || status.includes('start')) executionStatus = 'running';
          return { ...n, data: { ...n.data, executionStatus } };
        })
      );
    }
  }, [lastEvent, open, initialData, setNodes]);

  const withInsertHandlers = useCallback(
    (eds: Edge[]): Edge[] =>
      eds.map((e) => ({
        ...e,
        type: 'insertable',
        data: {
          ...(e.data || {}),
          onInsert: (edgeId: string) => {
            setInsertEdgeId(edgeId);
            setMobileLibraryOpen(true);
            setToolbarCollapsed(false);
            toast('Pick a tool to insert');
          },
        },
      })),
    []
  );

  useEffect(() => {
    setEdges((eds) => withInsertHandlers(eds));
  }, []); // mount once — handlers refreshed via setInsertEdgeId

  const createToolNode = useCallback(
    (tool: MCPTool | ToolInfo | { name: string; description?: string }, position?: { x: number; y: number }) => {
      const stepId = `s_${Date.now()}`;
      const existing = nodes.filter((n) => n.id !== 'trigger');
      const newNodeId = `step-${stepId}`;
      const isCondition = tool.name === CONDITION_TOOL;
      const schemaProps = (tool as any).inputSchema?.properties;
      const noParams = !schemaProps || Object.keys(schemaProps).length === 0;
      const newNode: Node = {
        id: newNodeId,
        type: 'workflowNode',
        position: position || { x: 280, y: 180 + existing.length * 170 },
        data: {
          label: tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          toolName: tool.name,
          category: isCondition ? 'Logic' : getToolCategory(tool.name),
          description: isCondition ? 'Route on condition' : `Execute ${tool.name}`,
          stepNumber: existing.length + 1,
          isConfigured: isCondition || noParams,
          parameters: isCondition ? { expression: '' } : {},
          retry_config: { max_retries: 3, retry_delay: 30 },
          timeout: 60,
          isCondition,
          condition: isCondition ? { type: 'router', expression: '', branches: {} } : undefined,
          isAgentAware: isAgentTool(tool.name) || isMessagingSendTool(tool.name),
          channelBadge: tool.name.toLowerCase().includes('whatsapp')
            ? 'WhatsApp'
            : tool.name.toLowerCase().includes('telegram')
              ? 'Telegram'
              : null,
          executionStatus: 'idle',
        } as WorkflowNodeData,
      };
      return { newNode, newNodeId };
    },
    [nodes]
  );

  const handleAddTool = useCallback(
    (tool: MCPTool | ToolInfo, atPosition?: { x: number; y: number }) => {
      const { newNode, newNodeId } = createToolNode(tool, atPosition);

      if (insertEdgeId) {
        const edge = edges.find((e) => e.id === insertEdgeId);
        if (edge) {
          const mid = {
            x: ((nodes.find((n) => n.id === edge.source)?.position.x || 0) +
              (nodes.find((n) => n.id === edge.target)?.position.x || 0)) /
              2,
            y:
              ((nodes.find((n) => n.id === edge.source)?.position.y || 0) +
                (nodes.find((n) => n.id === edge.target)?.position.y || 0)) /
                2 +
              40,
          };
          newNode.position = atPosition || mid;
          const e1: Edge = {
            id: `e-${edge.source}-${newNodeId}`,
            source: edge.source,
            target: newNodeId,
            sourceHandle: edge.sourceHandle,
            ...defaultEdgeOptions,
          };
          const e2: Edge = {
            id: `e-${newNodeId}-${edge.target}`,
            source: newNodeId,
            target: edge.target,
            targetHandle: edge.targetHandle,
            ...defaultEdgeOptions,
          };
          const nextEdges = withInsertHandlers([
            ...edges.filter((e) => e.id !== insertEdgeId),
            e1,
            e2,
          ]);
          applyGraph([...nodes, newNode], nextEdges);
          setInsertEdgeId(null);
          setSelectedNode(newNodeId);
          setMobileLibraryOpen(false);
          toast.success(`Inserted ${tool.name}`);
          requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 400 }));
          return;
        }
      }

      const existing = nodes.filter((n) => n.id !== 'trigger');
      // Prefer selected step tip, else unique sink (no outgoing), else last array node
      const selectedStep =
        selectedNode && selectedNode !== 'trigger'
          ? nodes.find((n) => n.id === selectedNode)
          : null;
      const sinks = existing.filter((n) => !edges.some((e) => e.source === n.id));
      const tip =
        selectedStep ||
        (sinks.length === 1 ? sinks[0] : null) ||
        (existing.length > 0 ? existing[existing.length - 1] : nodes.find((n) => n.id === 'trigger'));
      const newEdge: Edge = {
        id: `e-${tip?.id}-${newNodeId}`,
        source: tip?.id || 'trigger',
        target: newNodeId,
        ...defaultEdgeOptions,
      };
      applyGraph([...nodes, newNode], withInsertHandlers([...edges, newEdge]));
      setSelectedNode(newNodeId);
      setMobileLibraryOpen(false);
      toast.success(`Added ${tool.name}`);
      requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 400 }));
    },
    [applyGraph, createToolNode, edges, insertEdgeId, nodes, rf, selectedNode, withInsertHandlers]
  );

  const handleAddCondition = useCallback(() => {
    handleAddTool({ name: CONDITION_TOOL, description: 'Condition router' } as MCPTool);
  }, [handleAddTool]);

  const handleTemplateSkeleton = useCallback(
    (templateId: CanvasTemplateId) => {
      const skeleton = skeletonStepsFor(templateId);
      const platform = templateId === 'telegram_ordering' ? 'telegram' : 'whatsapp';
      setTriggerType('event');
      setTriggerConfig({
        platform,
        event_type: platform === 'whatsapp' ? 'whatsapp_message_received' : undefined,
        trigger: platform === 'telegram' ? 'telegram_message_received' : undefined,
      });
      if (!workflowName.trim()) {
        setWorkflowName(platform === 'whatsapp' ? 'WhatsApp Ordering' : 'Telegram Ordering');
      }

      const steps: WorkflowStep[] = skeleton.map((s, i) => ({
        id: `skel_${i}_${Date.now()}`,
        step_number: i + 1,
        tool_name: s.tool,
        tool_parameters: s.tool === CONDITION_TOOL ? { expression: '{{intent}} == confirmed' } : {},
        description: s.description,
        retry_config: { max_retries: 3, retry_delay: 30 },
        timeout: 60,
        condition:
          s.tool === CONDITION_TOOL
            ? { type: 'router', expression: '{{intent}} == confirmed', branches: {} }
            : undefined,
        branch_key: i === 2 ? 'true' : undefined,
      }));

      // Wire false branch as a second messaging stub when we have a router
      if (steps.length >= 2 && steps[1].tool_name === CONDITION_TOOL) {
        const falseId = `skel_false_${Date.now()}`;
        steps.push({
          id: falseId,
          step_number: 4,
          tool_name: platform === 'whatsapp' ? 'whatsapp_send_message' : 'telegram_send_message',
          tool_parameters: {},
          description: 'Send cancellation / fallback reply',
          retry_config: { max_retries: 3, retry_delay: 30 },
          timeout: 60,
          branch_key: 'false',
        });
        steps[1].condition = {
          type: 'router',
          expression: '{{intent}} == confirmed',
          branches: { true: steps[2].step_number, false: 4 },
        };
      }

      const { nodes: n, edges: e } = stepsToNodesAndEdges(steps, 'event');
      // Update trigger node type
      const withTrigger = n.map((node) =>
        node.id === 'trigger'
          ? { ...node, data: { ...node.data, triggerType: 'event', description: `${platform} event trigger` } }
          : node
      );
      applyGraph(withTrigger, withInsertHandlers(e));
      toast.success(`Loaded ${platform} ordering skeleton`);
      requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 400 }));
    },
    [applyGraph, rf, withInsertHandlers, workflowName]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      pushHistory(nodes, edges);
      setEdges((eds) =>
        withInsertHandlers(
          addEdge(
            {
              ...params,
              ...defaultEdgeOptions,
              data: {
                branchKey: params.sourceHandle || undefined,
              },
              label: params.sourceHandle || undefined,
            },
            eds
          )
        )
      );
    },
    [edges, nodes, pushHistory, setEdges, withInsertHandlers]
  );

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    const flushed = applyPanelFlush(nodes);
    if (flushed !== nodes) setNodes(flushed);
    if (node.id === 'trigger') {
      setShowMetaPanel(true);
      setSelectedNode(null);
    } else {
      setSelectedNode(node.id);
      setShowMetaPanel(false);
    }
  }, [applyPanelFlush, nodes, setNodes]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === 'trigger') return;
      applyGraph(
        nodes.filter((n) => n.id !== nodeId),
        edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      setSelectedNode(null);
      toast.success('Step removed');
    },
    [applyGraph, edges, nodes]
  );

  const handleUpdateParams = useCallback(
    (nodeId: string, params: Record<string, any>) => {
      pushHistory(nodes, edges);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  parameters: params,
                  isConfigured: Object.keys(params).length > 0 || (n.data as WorkflowNodeData).isCondition,
                },
              }
            : n
        )
      );
      toast.success('Parameters saved');
    },
    [edges, nodes, pushHistory, setNodes]
  );

  const handleUpdateDescription = useCallback(
    (nodeId: string, desc: string) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, description: desc } } : n))
      );
    },
    [setNodes]
  );

  const handleUpdateRetry = useCallback(
    (nodeId: string, config: { max_retries: number; retry_delay: number }) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, retry_config: config } } : n))
      );
    },
    [setNodes]
  );

  const handleUpdateTimeout = useCallback(
    (nodeId: string, timeout: number) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, timeout } } : n))
      );
    },
    [setNodes]
  );

  const handleUpdateCondition = useCallback(
    (nodeId: string, expression: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const data = n.data as WorkflowNodeData;
          return {
            ...n,
            data: {
              ...data,
              parameters: { ...data.parameters, expression },
              condition: { ...(data.condition || {}), type: 'router', expression },
            },
          };
        })
      );
    },
    [setNodes]
  );

  const handleAutoLayout = useCallback(() => {
    pushHistory(nodes, edges);
    const laid = layoutWithDagre(nodes, edges, 'TB');
    setNodes(decorateConnectionStatus(laid));
    toast.success('Layout organized');
    requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 400 }));
  }, [decorateConnectionStatus, edges, nodes, pushHistory, rf, setNodes]);

  const doUndo = useCallback(() => {
    const snap = undo({ nodes, edges });
    if (!snap) return;
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(withInsertHandlers(snap.edges));
    skipHistory.current = false;
  }, [edges, nodes, setEdges, setNodes, undo, withInsertHandlers]);

  const doRedo = useCallback(() => {
    const snap = redo({ nodes, edges });
    if (!snap) return;
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(withInsertHandlers(snap.edges));
    skipHistory.current = false;
  }, [edges, nodes, redo, setEdges, setNodes, withInsertHandlers]);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!workflowName.trim()) issues.push('Workflow name is required');
    if (triggerType === 'scheduled' && !triggerConfig.cron_expression) {
      issues.push('Scheduled trigger needs a cron expression');
    }
    if (triggerType === 'event' && !triggerConfig.event_type && !triggerConfig.trigger) {
      issues.push('Event trigger needs an event type');
    }
    nodes
      .filter((n) => n.id !== 'trigger')
      .forEach((n) => {
        const d = n.data as WorkflowNodeData;
        const tool = availableTools.find((t) => t.name === d.toolName);
        const schema = (tool as any)?.inputSchema;
        const props = schema?.properties || {};
        const required: string[] = schema?.required || [];
        const hasSchema = Object.keys(props).length > 0;
        const missingRequired = required.filter((key) => {
          const val = d.parameters?.[key];
          return val === undefined || val === null || val === '';
        });

        if (d.isCondition) {
          const outs = edges.filter((e) => e.source === n.id);
          if (outs.length < 2) issues.push(`Router step ${d.stepNumber} needs True and False branches`);
        } else if (hasSchema && missingRequired.length > 0) {
          issues.push(`Step ${d.stepNumber} (${d.toolName}): missing ${missingRequired.join(', ')}`);
        } else if (hasSchema && !d.isConfigured && required.length > 0) {
          issues.push(`Step ${d.stepNumber} (${d.toolName}) needs configuration`);
        }

        if (d.connectionStatus === 'needs_connect') {
          issues.push(`Step ${d.stepNumber}: connect ${requiredPlatformForTool(d.toolName)} first`);
        }
      });
    const steps = nodes.filter((n) => n.id !== 'trigger');
    if (steps.length === 0) issues.push('Add at least one step');
    return issues;
  }, [availableTools, edges, nodes, triggerConfig, triggerType, workflowName]);

  const onSave = useCallback(async () => {
    if (validationIssues.length) setShowValidation(true);
    const saveNodes = applyPanelFlush(nodes);
    if (saveNodes !== nodes) setNodes(saveNodes);
    const result = await handleSave({
      nodes: saveNodes,
      edges,
      workflowName,
      workflowDescription,
      triggerType,
      triggerConfig,
      category,
      tags,
      variables,
      isEditing,
      initialData,
      onWorkflowCreated,
      onClose,
      validationErrors: validationIssues.filter(
        (i) => !i.toLowerCase().includes('connect ')
      ),
    });
    if (result?.needMeta) setShowMetaPanel(true);
  }, [
    validationIssues, handleSave, nodes, edges, workflowName, workflowDescription,
    triggerType, triggerConfig, category, tags, variables, isEditing, initialData,
    onWorkflowCreated, onClose, applyPanelFlush, setNodes,
  ]);

  const switchToForm = useCallback(() => {
    if (!onSwitchToForm) return;
    const saveNodes = applyPanelFlush(nodes);
    if (saveNodes !== nodes) setNodes(saveNodes);
    onSwitchToForm(
      getCanvasState({
        nodes: saveNodes,
        edges,
        workflowName,
        workflowDescription,
        triggerType,
        triggerConfig,
        category,
        tags,
        variables,
        workflowId: initialData?.id ? String(initialData.id) : undefined,
      })
    );
  }, [
    onSwitchToForm, applyPanelFlush, nodes, edges, workflowName, workflowDescription,
    triggerType, triggerConfig, category, tags, variables, initialData, getCanvasState, setNodes,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        const flushed = applyPanelFlush(nodes);
        if (flushed !== nodes) setNodes(flushed);
        setSelectedNode(null);
        setShowMetaPanel(false);
        setShowAssist(false);
        setMobileLibraryOpen(false);
        return;
      }
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
        return;
      }
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        doUndo();
        return;
      }
      if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        doRedo();
        return;
      }
      if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectedNode, onSave, doUndo, doRedo, handleDeleteNode, applyPanelFlush, nodes, setNodes]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const toolName = e.dataTransfer.getData(PALETTE_DND_MIME) || e.dataTransfer.getData('text/plain');
      if (!toolName) return;
      const tool =
        availableTools.find((t) => t.name === toolName) ||
        ({ name: toolName, description: '' } as MCPTool);
      const bounds = (e.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      const position = rf.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      handleAddTool(tool, position);
      void bounds;
    },
    [availableTools, handleAddTool, rf]
  );

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null;
    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return null;
    const data = node.data as unknown as WorkflowNodeData;
    const tool = availableTools.find((t) => t.name === data.toolName) || null;
    return { node, data, tool };
  }, [selectedNode, nodes, availableTools]);

  const displayEdges = useMemo(() => withInsertHandlers(edges), [edges, withInsertHandlers]);

  const stepCount = nodes.filter((n) => n.id !== 'trigger').length;
  const showEmptyCoach = stepCount === 0;

  // Keep Start trigger in the upper half when the empty coach is visible
  useEffect(() => {
    if (!open || loadingTools || !showEmptyCoach) return;
    const t = window.setTimeout(() => {
      try {
        rf.fitView({ padding: 0.35, maxZoom: 1, duration: 280 });
        // Nudge viewport up so Start sits clearly above the bottom coach
        const { x, y, zoom } = rf.getViewport();
        rf.setViewport({ x, y: y + 40, zoom }, { duration: 200 });
      } catch {
        /* react-flow may not be ready */
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [open, loadingTools, showEmptyCoach, rf]);

  if (!open) return null;

  const library = (
    <CanvasToolbar
      tools={availableTools}
      onAddTool={handleAddTool}
      onAddCondition={handleAddCondition}
      isCollapsed={toolbarCollapsed}
      onToggleCollapse={() => setToolbarCollapsed(!toolbarCollapsed)}
      isDark={isDark}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-secondary-950" role="dialog" aria-label="Automation canvas builder">
      {/* Header */}
      <div className="z-10 flex items-center justify-between gap-3 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 sm:px-4">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={onClose} aria-label="Close canvas" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10">
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            type="button"
            className="rounded-xl p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10"
            aria-label="Open tool library"
            onClick={() => setMobileLibraryOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Untitled automation"
              aria-label="Workflow name"
              className="w-36 bg-transparent text-lg font-bold text-secondary-900 outline-none placeholder:text-slate-300 sm:w-64 dark:text-white"
            />
            <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Canvas</span>
              <span>•</span>
              <span>{stepCount} steps</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pr-1 sm:gap-2">
          {error && (
            <div className="flex max-w-[180px] items-center gap-1 truncate rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
          <button type="button" onClick={doUndo} disabled={!canUndo} aria-label="Undo" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={doRedo} disabled={!canRedo} aria-label="Redo" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10">
            <Redo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleAutoLayout} aria-label="Auto layout" className="hidden items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 sm:flex dark:bg-secondary-800 dark:text-slate-300">
            <Layout className="h-3.5 w-3.5" />
            Organize
          </button>
          <button type="button" onClick={() => setShowAssist((v) => !v)} aria-label="AI assist" className="rounded-xl p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10">
            <Sparkles className="h-4 w-4" />
          </button>
          {onSwitchToForm && (
            <button
              type="button"
              onClick={switchToForm}
              className="hidden rounded-xl border border-secondary-200 bg-secondary-50 px-3 py-2 text-xs font-bold text-secondary-800 hover:bg-secondary-100 sm:inline dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100"
            >
              Form
            </button>
          )}
          <button type="button" onClick={() => setShowMetaPanel(!showMetaPanel)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-secondary-800 dark:text-slate-300">
            Details
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-500/25 hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isEditing ? 'Update' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop library */}
        <div className="relative z-10 hidden h-full shrink-0 border-r border-slate-200 dark:border-secondary-800 lg:block">
          {library}
        </div>

        {/* Canvas */}
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,70,150,0.06),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(30,16,51,0.08),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,70,150,0.12),_transparent_45%)]" />

          {loadingTools && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-secondary-950/70">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          )}

          {showEmptyCoach && !loadingTools && (
            <CanvasEmptyState
              onOpenLibrary={() => {
                setToolbarCollapsed(false);
                setMobileLibraryOpen(true);
              }}
              onSelectTemplate={handleTemplateSkeleton}
            />
          )}

          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => {
              const flushed = applyPanelFlush(nodes);
              if (flushed !== nodes) setNodes(flushed);
              setSelectedNode(null);
              setShowMetaPanel(false);
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={EDGE_STYLE}
            fitView
            minZoom={0.25}
            maxZoom={2}
            colorMode={isDark ? 'dark' : 'light'}
            proOptions={{ hideAttribution: true }}
            className="workflow-canvas"
            deleteKeyCode={null}
          >
            <CanvasChrome isDark={isDark} />
          </ReactFlow>

          {showValidation && validationIssues.length > 0 && (
            <ValidationStrip issues={validationIssues} onClose={() => setShowValidation(false)} />
          )}

          {showAssist && (
            <CanvasAssistStrip
              tools={availableTools}
              onSuggest={(tool) => {
                handleAddTool(tool);
                setShowAssist(false);
              }}
              onClose={() => setShowAssist(false)}
            />
          )}

          {/* Mobile library FAB */}
          <button
            type="button"
            onClick={() => setMobileLibraryOpen(true)}
            className="absolute bottom-20 left-4 z-20 flex items-center gap-2 rounded-full bg-secondary-900 px-4 py-3 text-xs font-bold text-white shadow-lg lg:hidden"
            aria-label="Open tools"
          >
            <PanelLeft className="h-4 w-4" />
            Tools
          </button>
        </div>

        {/* Inspector — nowheel so React Flow does not steal scroll */}
        <div
          className={`pointer-events-none absolute z-20 ${
            selectedNode || showMetaPanel
              ? 'inset-x-0 bottom-0 max-h-[75vh] sm:inset-x-auto sm:inset-y-4 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[340px]'
              : 'hidden'
          }`}
        >
          {selectedNode && selectedNodeData && (
            <div className="pointer-events-auto nowheel nopan flex h-full max-h-[75vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-none sm:rounded-2xl dark:bg-secondary-950 dark:ring-white/10">
              <NodeConfigPanel
                ref={panelRef}
                nodeId={selectedNode}
                toolName={selectedNodeData.data.toolName}
                tool={selectedNodeData.tool}
                parameters={selectedNodeData.data.parameters || {}}
                description={selectedNodeData.data.description}
                retryConfig={selectedNodeData.data.retry_config}
                timeout={selectedNodeData.data.timeout}
                conditionExpression={(selectedNodeData.data.condition as any)?.expression || selectedNodeData.data.parameters?.expression}
                onUpdateParams={handleUpdateParams}
                onUpdateDescription={handleUpdateDescription}
                onUpdateRetry={handleUpdateRetry}
                onUpdateTimeout={handleUpdateTimeout}
                onUpdateCondition={handleUpdateCondition}
                onDelete={handleDeleteNode}
                onClose={() => setSelectedNode(null)}
                onTestComplete={(id, ok) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === id
                        ? { ...n, data: { ...n.data, executionStatus: ok ? 'success' : 'failed' } }
                        : n
                    )
                  );
                }}
                isDark={isDark}
              />
            </div>
          )}

          {showMetaPanel && !selectedNode && (
            <div className="pointer-events-auto nowheel nopan flex h-full max-h-[75vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-none sm:rounded-2xl dark:bg-secondary-950 dark:ring-white/10">
              <div className="flex h-full min-h-0 flex-col">
                <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-white/5">
                  <h3 className="text-sm font-bold text-secondary-900 dark:text-white">Workflow Details</h3>
                  <p className="text-[10px] text-slate-400">Trigger and metadata</p>
                </div>
                <div className="canvas-inspector-scroll min-h-0 flex-1 space-y-4 overflow-y-scroll overscroll-contain px-5 py-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Name *</label>
                    <input
                      type="text"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                      placeholder="My automation"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                    <textarea
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Trigger</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'manual', label: 'Manual', icon: MousePointer },
                        { value: 'scheduled', label: 'Scheduled', icon: Clock },
                        { value: 'webhook', label: 'Webhook', icon: Webhook },
                        { value: 'event', label: 'Event', icon: Play },
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            setTriggerType(t.value as TriggerType);
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === 'trigger' ? { ...n, data: { ...n.data, triggerType: t.value } } : n
                              )
                            );
                          }}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            triggerType === t.value
                              ? 'border-2 border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                              : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-secondary-900 dark:text-slate-300'
                          }`}
                        >
                          <t.icon className="h-3.5 w-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {triggerType === 'scheduled' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Cron *</label>
                      <input
                        type="text"
                        value={triggerConfig.cron_expression || ''}
                        onChange={(e) => updateTriggerConfig('cron_expression', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                        placeholder="0 9 * * 1-5"
                      />
                    </div>
                  )}

                  {triggerType === 'event' && (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Platform *</label>
                        <select
                          value={triggerConfig.platform || ''}
                          onChange={(e) => setTriggerConfig({ ...triggerConfig, platform: e.target.value, trigger: '', event_type: '' })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                        >
                          <option value="">Select Platform</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="telegram">Telegram</option>
                          <option value="slack">Slack</option>
                          <option value="instagram">Instagram</option>
                          <option value="zoho">Zoho Desk</option>
                          <option value="google_drive">Google Drive</option>
                        </select>
                      </div>
                      {triggerConfig.platform === 'whatsapp' && (
                        <select
                          value={triggerConfig.event_type || ''}
                          onChange={(e) => updateTriggerConfig('event_type', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                        >
                          <option value="">Select Event</option>
                          <option value="whatsapp_message_received">Message Received</option>
                          <option value="whatsapp_new_contact">New Contact</option>
                          <option value="whatsapp_keyword_detected">Keyword Detected</option>
                        </select>
                      )}
                      {triggerConfig.platform && triggerConfig.platform !== 'whatsapp' && (
                        <select
                          value={triggerConfig.trigger || ''}
                          onChange={(e) => updateTriggerConfig('trigger', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                        >
                          <option value="">Select Event</option>
                          {triggerConfig.platform === 'telegram' && (
                            <option value="telegram_message_received">Message Received</option>
                          )}
                          {triggerConfig.platform === 'slack' && (
                            <>
                              <option value="slack_message_received">Message Received</option>
                              <option value="slack_app_mention">App Mention</option>
                            </>
                          )}
                          {triggerConfig.platform === 'instagram' && (
                            <option value="instagram_dm_received">DM Received</option>
                          )}
                          {triggerConfig.platform === 'zoho' && (
                            <>
                              <option value="Ticket Created">Ticket Created</option>
                              <option value="Ticket Status Updated">Ticket Status Updated</option>
                            </>
                          )}
                          {triggerConfig.platform === 'google_drive' && (
                            <option value="google_drive_folder_changed">Folder Changed</option>
                          )}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                      <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Tags</label>
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-secondary-900 dark:text-white"
                        placeholder="whatsapp, orders"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile bottom sheet library */}
        <CanvasMobileSheets
          open={mobileLibraryOpen}
          onClose={() => setMobileLibraryOpen(false)}
          tools={availableTools}
          onAddTool={handleAddTool}
          onAddCondition={handleAddCondition}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvasInner {...props} />
  </ReactFlowProvider>
);

export default WorkflowCanvas;
