import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
    Node,
    Edge,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Save, Loader2, AlertCircle,
    MousePointer, Clock, Webhook, Play,
    ArrowLeft,
    Layout
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { MCPTool, ToolInfo } from '../../types';
import WorkflowNodeComponent, { WorkflowNodeData } from './WorkflowNode';
import CanvasToolbar from './CanvasToolbar';
import NodeConfigPanel from './NodeConfigPanel';

// Define types for the canvas step exactly matching the form's WorkflowStep
interface WorkflowStep {
    id: string;
    step_number: number;
    tool_name: string;
    tool_parameters: Record<string, any>;
    description: string;
    condition?: any;
    retry_config?: { max_retries: number; retry_delay: number };
    timeout?: number;
}

type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event';

interface WorkflowCanvasProps {
    open: boolean;
    onClose: () => void;
    onWorkflowCreated?: (workflow: any) => void;
    onSwitchToForm?: (data: CanvasState) => void;
    initialData?: any; // Existing workflow data for editing
    initialCanvasState?: CanvasState | null;
}

export interface CanvasState {
    workflowName: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, any>;
    category: string;
    tags: string;
    steps: WorkflowStep[];
}

// Node types registration
const nodeTypes = {
    workflowNode: WorkflowNodeComponent,
};

// Edge default style
const EDGE_STYLE = { stroke: '#6366f1', strokeWidth: 2 };
const EDGE_MARKER = { type: MarkerType.ArrowClosed as const, color: '#6366f1' };

// Category detection (matches EnhancedWorkflowCreator logic)
function getToolCategory(toolName: string): string {
    const lowerName = toolName.toLowerCase();
    const categories: Record<string, { prefix?: string; keywords?: string[] }> = {
        'Fintech': { keywords: ['payment', 'mpesa', 'airtel', 't_kash', 'equity_jenga', 'flutterwave', 'paystack'] },
        'E-commerce': { keywords: ['ecommerce', 'jumia', 'kilimall', 'jiji'] },
        'Accounting': { keywords: ['accounting', 'kra', 'itax', 'quickbooks', 'xero'] },
        'Logistics': { keywords: ['logistics', 'amitruck', 'lori', 'sendy'] },
        'Slack': { prefix: 'slack_' },
        'HubSpot': { prefix: 'hubspot_' },
        'Analytics': { prefix: 'ga4_' },
        'Communication': { prefix: 'whatsapp_' },
        'File Management': { prefix: 'file_' },
        'Web Tools': { prefix: 'web_' },
        'Content Creation': { prefix: 'content_' },
        'Advanced': { prefix: 'advanced_' },
        'Enterprise': { prefix: 'enterprise_' },
    };
    for (const [cat, cfg] of Object.entries(categories)) {
        if (cfg.prefix && lowerName.startsWith(cfg.prefix)) return cat;
        if (cfg.keywords) {
            for (const kw of cfg.keywords) {
                if (lowerName.includes(kw)) return cat;
            }
        }
    }
    return 'General';
}

// Convert WorkflowStep[] → React Flow nodes + edges
function stepsToNodesAndEdges(
    steps: WorkflowStep[],
    triggerType: string,
    _tools: (MCPTool | ToolInfo)[]
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add trigger node at top
    const triggerNode: Node = {
        id: 'trigger',
        type: 'workflowNode',
        position: { x: 250, y: 40 },
        data: {
            label: 'Start',
            toolName: 'trigger',
            category: 'Trigger',
            description: `${triggerType} trigger`,
            stepNumber: 0,
            isConfigured: true,
            isTrigger: true,
            triggerType: triggerType,
        } as WorkflowNodeData,
    };
    nodes.push(triggerNode);

    // Add step nodes
    steps.forEach((step, index) => {
        const nodeId = `step-${step.id}`;
        const hasParams = Object.keys(step.tool_parameters).length > 0;

        nodes.push({
            id: nodeId,
            type: 'workflowNode',
            position: { x: 250, y: 180 + index * 160 },
            data: {
                label: step.tool_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                toolName: step.tool_name,
                category: getToolCategory(step.tool_name),
                description: step.description,
                stepNumber: index + 1,
                isConfigured: hasParams,
                parameters: step.tool_parameters,
            } as WorkflowNodeData,
        });

        // Edge from previous node
        const sourceId = index === 0 ? 'trigger' : `step-${steps[index - 1].id}`;
        edges.push({
            id: `e-${sourceId}-${nodeId}`,
            source: sourceId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            style: EDGE_STYLE,
            markerEnd: EDGE_MARKER,
        });
    });

    return { nodes, edges };
}

// Convert nodes + edges back to WorkflowStep[]
function nodesToSteps(nodes: Node[], edges: Edge[]): WorkflowStep[] {
    // Topological sort from trigger node
    const stepNodes = nodes.filter(n => n.id !== 'trigger');
    const adjacency = new Map<string, string[]>();
    edges.forEach(e => {
        if (!adjacency.has(e.source)) adjacency.set(e.source, []);
        adjacency.get(e.source)!.push(e.target);
    });

    const visited = new Set<string>();
    const sorted: string[] = [];

    function visit(id: string) {
        if (visited.has(id)) return;
        visited.add(id);
        (adjacency.get(id) || []).forEach(visit);
        sorted.unshift(id);
    }

    // Start from trigger
    visit('trigger');

    // Add any disconnected nodes at the end
    stepNodes.forEach(n => {
        if (!visited.has(n.id)) sorted.push(n.id);
    });

    const orderedNodeIds = sorted.filter(id => id !== 'trigger');

    return orderedNodeIds.map((nodeId, index) => {
        const node = stepNodes.find(n => n.id === nodeId);
        if (!node) return null;
        const data = node.data as unknown as WorkflowNodeData;
        const stepId = nodeId.replace('step-', '');
        return {
            id: stepId,
            step_number: index + 1,
            tool_name: data.toolName,
            tool_parameters: data.parameters || {},
            description: data.description,
            retry_config: { max_retries: 3, retry_delay: 30 },
            timeout: 60,
        };
    }).filter(Boolean) as WorkflowStep[];
}


const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
    open, onClose, onWorkflowCreated, onSwitchToForm, initialData, initialCanvasState
}) => {
    // Workflow metadata
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('manual');
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');

    // Canvas state — provide initial typed arrays to avoid `never[]` inference
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

    // Tools
    const [availableTools, setAvailableTools] = useState<(MCPTool | ToolInfo)[]>([]);
    const [loadingTools, setLoadingTools] = useState(false);

    // UI state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMetaPanel, setShowMetaPanel] = useState(false);
    const isEditing = !!initialData;
    const reactFlowRef = useRef<any>(null);

    // Load tools on open
    useEffect(() => {
        if (open) {
            loadTools();
            initState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const initState = () => {
        if (initialCanvasState) {
            // Restore from form mode switch
            setWorkflowName(initialCanvasState.workflowName);
            setWorkflowDescription(initialCanvasState.description);
            setTriggerType((initialCanvasState.triggerType as TriggerType) || 'manual');
            setTriggerConfig(initialCanvasState.triggerConfig || {});
            setCategory(initialCanvasState.category);
            setTags(initialCanvasState.tags);
            const { nodes: initNodes, edges: initEdges } = stepsToNodesAndEdges(
                initialCanvasState.steps, initialCanvasState.triggerType, availableTools
            );
            setNodes(initNodes);
            setEdges(initEdges);
        } else if (initialData) {
            // Editing existing workflow
            setWorkflowName(initialData.name || '');
            setWorkflowDescription(initialData.description || '');
            setTriggerType((initialData.trigger_type?.toLowerCase() as TriggerType) || 'manual');
            setTriggerConfig(initialData.trigger_config || {});
            setCategory(initialData.workflow_metadata?.category || '');
            setTags(initialData.workflow_metadata?.tags?.join(', ') || '');

            if (initialData.steps) {
                const mappedSteps: WorkflowStep[] = initialData.steps.map((s: any) => ({
                    id: s.id || Math.random().toString(36).substr(2, 9),
                    step_number: s.step_number,
                    tool_name: s.tool_name,
                    tool_parameters: s.tool_parameters || {},
                    description: s.description || '',
                    retry_config: s.retry_config,
                    timeout: s.timeout,
                })).sort((a: any, b: any) => a.step_number - b.step_number);

                const { nodes: initNodes, edges: initEdges } = stepsToNodesAndEdges(
                    mappedSteps, (initialData.trigger_type?.toLowerCase() as TriggerType) || 'manual', availableTools
                );
                setNodes(initNodes);
                setEdges(initEdges);
            }
        } else {
            // New workflow — start with just a trigger node
            setWorkflowName('');
            setWorkflowDescription('');
            setTriggerType('manual');
            setTriggerConfig({});
            setCategory('');
            setTags('');
            const { nodes: initNodes, edges: initEdges } = stepsToNodesAndEdges([], 'manual', []);
            setNodes(initNodes);
            setEdges(initEdges);
        }
        setSelectedNode(null);
        setError(null);
    };

    const loadTools = async () => {
        try {
            setLoadingTools(true);
            const response = await apiService.getMCPTools(true);
            if (response.success) {
                setAvailableTools(response.data || []);
            }
        } catch (err) {
            console.error('Error loading tools:', err);
        } finally {
            setLoadingTools(false);
        }
    };

    // Handle new connection between nodes
    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges]);

    // Add a new tool node from the toolbar
    const handleAddTool = useCallback((tool: MCPTool | ToolInfo) => {
        const stepId = `s_${Date.now()}`;
        const existingStepNodes = nodes.filter(n => n.id !== 'trigger');
        const yOffset = 180 + existingStepNodes.length * 160;
        const newNodeId = `step-${stepId}`;

        const newNode: Node = {
            id: newNodeId,
            type: 'workflowNode',
            position: { x: 250, y: yOffset },
            data: {
                label: tool.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                toolName: tool.name,
                category: getToolCategory(tool.name),
                description: `Execute ${tool.name}`,
                stepNumber: existingStepNodes.length + 1,
                isConfigured: false,
                parameters: {},
            } as WorkflowNodeData,
        };

        // Auto-connect to last node
        const lastNode = existingStepNodes.length > 0
            ? existingStepNodes[existingStepNodes.length - 1]
            : nodes.find(n => n.id === 'trigger');

        const newEdge: Edge = {
            id: `e-${lastNode?.id}-${newNodeId}`,
            source: lastNode?.id || 'trigger',
            target: newNodeId,
            type: 'smoothstep',
            animated: true,
            style: EDGE_STYLE,
            markerEnd: EDGE_MARKER,
        };

        setNodes((nds: Node[]) => [...nds, newNode]);
        setEdges((eds: Edge[]) => [...eds, newEdge]);
        setSelectedNode(newNodeId);
        toast.success(`Added ${tool.name}`);
    }, [nodes, setNodes, setEdges]);

    // Handle node click — open config panel
    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        if (node.id === 'trigger') {
            setShowMetaPanel(true);
            setSelectedNode(null);
        } else {
            setSelectedNode(node.id);
            setShowMetaPanel(false);
        }
    }, []);

    // Handle node delete
    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes((nds: Node[]) => nds.filter(n => n.id !== nodeId));
        setEdges((eds: Edge[]) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        setSelectedNode(null);

        // Re-number remaining step nodes
        setNodes((nds: Node[]) => {
            let stepCount = 0;
            return nds.map(n => {
                if (n.id === 'trigger') return n;
                stepCount++;
                return { ...n, data: { ...n.data, stepNumber: stepCount } };
            });
        });
        toast.success('Step removed');
    }, [setNodes, setEdges]);

    // Handle node param update
    const handleUpdateParams = useCallback((nodeId: string, params: Record<string, any>) => {
        setNodes((nds: Node[]) => nds.map(n => {
            if (n.id !== nodeId) return n;
            return {
                ...n,
                data: {
                    ...n.data,
                    parameters: params,
                    isConfigured: Object.keys(params).length > 0,
                },
            };
        }));
        toast.success('Parameters saved');
    }, [setNodes]);

    const handleUpdateDescription = useCallback((nodeId: string, desc: string) => {
        setNodes((nds: Node[]) => nds.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, description: desc } } : n
        ));
    }, [setNodes]);

    const handleUpdateRetry = useCallback((_nodeId: string, _config: { max_retries: number; retry_delay: number }) => {
        // Retry config is embedded in step conversion, not in node data visualization
    }, []);

    const handleUpdateTimeout = useCallback((_nodeId: string, _timeout: number) => {
        // Same — stored during step conversion
    }, []);

    // Auto-layout nodes vertically
    const handleAutoLayout = useCallback(() => {
        setNodes((nds: Node[]) => {
            const sorted = [...nds].sort((a, b) => {
                if (a.id === 'trigger') return -1;
                if (b.id === 'trigger') return 1;
                return a.position.y - b.position.y;
            });
            return sorted.map((n, i) => ({
                ...n,
                position: { x: 250, y: i === 0 ? 40 : 40 + i * 160 },
            }));
        });
        toast.success('Layout reorganized');
    }, [setNodes]);

    // Get the current canvas state for form mode switching
    const getCanvasState = useCallback((): CanvasState => {
        const steps = nodesToSteps(nodes, edges);
        return {
            workflowName,
            description: workflowDescription,
            triggerType,
            triggerConfig,
            category,
            tags,
            steps,
        };
    }, [nodes, edges, workflowName, workflowDescription, triggerType, triggerConfig, category, tags]);

    // Save workflow
    const handleSave = async () => {
        if (!workflowName.trim()) {
            setError('Please enter a workflow name');
            setShowMetaPanel(true);
            return;
        }

        const steps = nodesToSteps(nodes, edges);
        if (steps.length === 0) {
            setError('Please add at least one step');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const stepsPayload = steps.map((step, index) => ({
                step_number: index + 1,
                tool_name: step.tool_name,
                tool_parameters: step.tool_parameters,
                description: step.description,
                retry_config: step.retry_config,
                timeout: step.timeout,
            }));

            if (isEditing) {
                const response = await apiService.updateWorkflow(initialData.id, {
                    name: workflowName,
                    description: workflowDescription || `Updated with ${steps.length} steps`,
                    steps: stepsPayload,
                    trigger_type: triggerType,
                    trigger_config: triggerConfig,
                    variables: {},
                    workflow_metadata: {
                        category,
                        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    },
                });
                if (response.success && response.data) {
                    toast.success(`Workflow "${workflowName}" updated!`);
                    onWorkflowCreated?.(response.data);
                    onClose();
                } else {
                    setError('Failed to update workflow');
                }
            } else {
                const response = await apiService.createWorkflowFromSteps({
                    workflow_name: workflowName,
                    description: workflowDescription || `Created with ${steps.length} steps`,
                    steps: stepsPayload,
                    trigger_type: triggerType,
                    trigger_config: triggerConfig,
                    variables: {},
                });
                if (response.success && response.data) {
                    toast.success(`Workflow "${workflowName}" created!`);
                    onWorkflowCreated?.(response.data);
                    onClose();
                } else {
                    setError('Failed to create workflow');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    // Selected node data
    const selectedNodeData = useMemo(() => {
        if (!selectedNode) return null;
        const node = nodes.find(n => n.id === selectedNode);
        if (!node) return null;
        const data = node.data as unknown as WorkflowNodeData;
        const tool = availableTools.find(t => t.name === data.toolName) || null;
        return { node, data, tool };
    }, [selectedNode, nodes, availableTools]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
            {/* Top Bar */}
            {/* Top Bar - Scrollable Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10 overflow-x-auto gap-4">
                <div className="flex items-center space-x-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="shrink-0">
                        <input
                            type="text"
                            value={workflowName}
                            onChange={e => setWorkflowName(e.target.value)}
                            placeholder="Untitled Workflow"
                            className="text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 w-40 sm:w-64 transition-all"
                        />
                        <div className="flex items-center space-x-2 mt-0.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Canvas Mode
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] font-bold text-gray-400">
                                {nodes.filter(n => n.id !== 'trigger').length} steps
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pr-4">
                    {error && (
                        <div className="flex items-center space-x-1 text-red-600 text-xs font-medium bg-red-50 px-3 py-1.5 rounded-lg shrink-0 overflow-hidden">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleAutoLayout}
                        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shrink-0 whitespace-nowrap"
                        title="Auto-layout"
                    >
                        <Layout className="w-3.5 h-3.5" />
                        <span>Organize</span>
                    </button>

                    {onSwitchToForm && (
                        <button
                            onClick={() => onSwitchToForm(getCanvasState())}
                            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200 shrink-0 whitespace-nowrap"
                        >
                            <span>Switch to Form</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowMetaPanel(!showMetaPanel)}
                        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shrink-0 whitespace-nowrap"
                    >
                        <span>Details</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200/50 transition-all font-bold text-sm disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{isEditing ? 'Update' : 'Save'}</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Tool Toolbar */}
                <CanvasToolbar
                    tools={availableTools}
                    onAddTool={handleAddTool}
                    isCollapsed={toolbarCollapsed}
                    onToggleCollapse={() => setToolbarCollapsed(!toolbarCollapsed)}
                />

                {/* Center: Canvas */}
                <div className="flex-1 relative">
                    {loadingTools && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-500 font-medium">Loading tools...</p>
                            </div>
                        </div>
                    )}

                    <ReactFlow
                        ref={reactFlowRef}
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={() => { setSelectedNode(null); setShowMetaPanel(false); }}
                        nodeTypes={nodeTypes}
                        fitView
                        minZoom={0.3}
                        maxZoom={2}
                        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
                        proOptions={{ hideAttribution: true }}
                        className="workflow-canvas"
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
                        <Controls
                            showZoom={true}
                            showFitView={true}
                            showInteractive={false}
                            className="!bg-white !rounded-xl !border !border-gray-200 !shadow-lg"
                        />
                    </ReactFlow>
                </div>

                {/* Right: Config Panel or Meta Panel */}
                {selectedNode && selectedNodeData && (
                    <NodeConfigPanel
                        nodeId={selectedNode}
                        toolName={selectedNodeData.data.toolName}
                        tool={selectedNodeData.tool}
                        parameters={selectedNodeData.data.parameters || {}}
                        description={selectedNodeData.data.description}
                        onUpdateParams={handleUpdateParams}
                        onUpdateDescription={handleUpdateDescription}
                        onUpdateRetry={handleUpdateRetry}
                        onUpdateTimeout={handleUpdateTimeout}
                        onDelete={handleDeleteNode}
                        onClose={() => setSelectedNode(null)}
                    />
                )}

                {/* Workflow Details meta panel */}
                {showMetaPanel && !selectedNode && (
                    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl shadow-gray-200/20">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="text-sm font-bold text-gray-900">Workflow Details</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Configure workflow metadata</p>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
                                <input
                                    type="text"
                                    value={workflowName}
                                    onChange={e => setWorkflowName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    placeholder="My Workflow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea
                                    value={workflowDescription}
                                    onChange={e => setWorkflowDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    placeholder="What does this workflow do?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trigger</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'manual', label: 'Manual', icon: MousePointer },
                                        { value: 'scheduled', label: 'Scheduled', icon: Clock },
                                        { value: 'webhook', label: 'Webhook', icon: Webhook },
                                        { value: 'event', label: 'Event', icon: Play },
                                    ].map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setTriggerType(t.value as TriggerType)}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${triggerType === t.value
                                                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <t.icon className="w-3.5 h-3.5" />
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {triggerType === 'scheduled' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cron Expression *</label>
                                    <input
                                        type="text"
                                        value={triggerConfig.cron_expression || ''}
                                        onChange={e => setTriggerConfig({ ...triggerConfig, cron_expression: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        placeholder="0 9 * * 1-5"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        placeholder="Marketing"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tags</label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        placeholder="slack, reports"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowCanvas;
