import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    FileText,
    Globe,
    Loader2,
    MousePointer,
    Palette,
    Play,
    Plus,
    Save,
    Search,
    Settings,
    Shield,
    Sparkles,
    Trash2,
    Users,
    Webhook,
    X,
    Zap,
    Activity,
    CreditCard,
    Droplets,
    Leaf,
    ShoppingBag,
    Truck,
    Database,
    BrainCircuit
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { MCPTool, ToolInfo } from '../types';

interface EnhancedWorkflowCreatorProps {
    open: boolean;
    onClose: () => void;
    onWorkflowCreated?: (workflow: any) => void;
    initialData?: any; // Workflow to edit
    initialCanvasState?: {
        workflowName: string;
        description: string;
        triggerType: string;
        triggerConfig: Record<string, any>;
        category: string;
        tags: string;
        steps: WorkflowStep[];
    } | null;
    onSwitchToCanvas?: (state: {
        workflowName: string;
        description: string;
        triggerType: string;
        triggerConfig: Record<string, any>;
        category: string;
        tags: string;
        steps: WorkflowStep[];
    }) => void;
}

interface WorkflowStep {
    id: string;
    step_number: number;
    tool_name: string;
    tool_parameters: Record<string, any>;
    description: string;
    condition?: any;
    retry_config?: {
        max_retries: number;
        retry_delay: number;
    };
    timeout?: number;
}

type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event';

/** Infer Library template id when editing a deployed agent workflow. */
function inferAgentTemplateId(workflow: any): string | null {
    const steps = workflow?.steps || [];
    const hasAgent = steps.some((s: any) => s.tool_name === 'conversational_agent');
    if (!hasAgent) return null;

    const trigger = workflow.trigger_config || {};
    const name = (workflow.name || '').toLowerCase();
    const tags: string[] = workflow.tags || workflow.workflow_metadata?.tags || [];

    if (trigger.platform === 'whatsapp' && trigger.event_type === 'whatsapp_message_received') {
        if (tags.includes('rent') || name.includes('rent collection')) {
            return 'whatsapp_rent_collection_agent';
        }
        return 'whatsapp_ordering_agent';
    }
    if (trigger.platform === 'telegram' && trigger.event_type === 'telegram_message_received') {
        return 'telegram_ordering_agent';
    }
    return null;
}

/** Merge saved workflow.variables with the latest Library template schema (shows new fields on edit). */
async function buildWorkflowVariableState(workflow: any): Promise<{
    schema: Record<string, any>;
    values: Record<string, any>;
}> {
    const vars = workflow.variables || {};
    const schema: Record<string, any> = {};
    const values: Record<string, any> = {};

    Object.entries(vars).forEach(([key, val]) => {
        if (
            typeof val === 'object'
            && val !== null
            && !Array.isArray(val)
            && ('type' in (val as object) || 'description' in (val as object) || 'enum' in (val as object) || 'default' in (val as object))
        ) {
            schema[key] = val;
            values[key] = (val as any).default ?? '';
        } else {
            values[key] = val;
        }
    });

    const templateId = inferAgentTemplateId(workflow);
    if (templateId) {
        try {
            const response = await apiService.getTemplate(templateId);
            const templateVars = response?.data?.variables;
            if (response?.success && templateVars && typeof templateVars === 'object') {
                Object.entries(templateVars).forEach(([key, varSchema]) => {
                    schema[key] = varSchema;
                    if (!(key in values) && (varSchema as any).default != null) {
                        values[key] = (varSchema as any).default;
                    }
                });
            }
        } catch (err) {
            console.warn('[WorkflowCreator] Could not merge template schema on edit:', err);
        }
    }

    Object.keys(values).forEach((key) => {
        if (!schema[key]) {
            const val = values[key];
            schema[key] = {
                type: typeof val === 'boolean'
                    ? 'boolean'
                    : typeof val === 'number'
                        ? 'number'
                        : Array.isArray(val)
                            ? 'array'
                            : 'string',
                description: key.replace(/_/g, ' '),
            };
        }
    });

    return { schema, values };
}

const TOOL_CATEGORIES = {
    'Fintech': {
        icon: CreditCard,
        color: 'emerald',
        keywords: ['payment', 'mpesa', 'airtel', 't_kash', 'equity_jenga', 'flutterwave', 'paystack', 'kopo_kopo', 'cellulant', 'pesapal', 'ipay', 'little_pay']
    },
    'E-commerce': {
        icon: ShoppingBag,
        color: 'blue',
        keywords: ['ecommerce', 'jumia', 'kilimall', 'jiji', 'masoko', 'copia', 'twiga', 'wasoko', 'sky_garden']
    },
    'Accounting': {
        icon: FileText,
        color: 'indigo',
        keywords: ['accounting', 'kra', 'itax', 'quickbooks', 'xero', 'zoho', 'lipabiz', 'sasapay']
    },
    'Logistics': {
        icon: Truck,
        color: 'amber',
        keywords: ['logistics', 'amitruck', 'lori', 'sendy', 'busybee', 'fargo', 'g4s']
    },
    'Human Resources': {
        icon: Users,
        color: 'rose',
        keywords: ['hr', 'workpay', 'seamlesshr', 'bitrix', 'bamboo']
    },
    'Agritech': {
        icon: Leaf,
        color: 'green',
        keywords: ['agri', 'shamba', 'digifarm', 'apollo', 'iprocure', 'farmdrive']
    },
    'Healthtech': {
        icon: Activity,
        color: 'red',
        keywords: ['health', 'mydawa', 'penda', 'ilara', 'tibu']
    },
    'Utilities': {
        icon: Droplets,
        color: 'cyan',
        keywords: ['utility', 'kenya_power', 'nairobi_water', 'safaricom_biz', 'zuku']
    },
    'Slack': {
        icon: Users,
        color: 'purple',
        prefix: 'slack_'
    },
    'HubSpot': {
        icon: BarChart3,
        color: 'orange',
        prefix: 'hubspot_'
    },
    'Analytics': {
        icon: BarChart3,
        color: 'blue',
        prefix: 'ga4_'
    },
    'Communication': {
        icon: Users,
        color: 'green',
        keywords: ['whatsapp_', 'telegram_', 'instagram_']
    },
    'File Management': {
        icon: FileText,
        color: 'purple',
        prefix: 'file_'
    },
    'Web Tools': {
        icon: Globe,
        color: 'orange',
        prefix: 'web_'
    },
    'Content Creation': {
        icon: Palette,
        color: 'pink',
        prefix: 'content_'
    },
    'Advanced': {
        icon: Zap,
        color: 'indigo',
        prefix: 'advanced_'
    },
    'Enterprise': {
        icon: Shield,
        color: 'red',
        prefix: 'enterprise_'
    },
    'Knowledge Base': {
        icon: Database,
        color: 'violet',
        keywords: ['rag_', 'pinecone_', 'qdrant_', 'weaviate_', 'llamaparse_', 'unstructured_', 'firecrawl_']
    },
    'AI & LLM': {
        icon: BrainCircuit,
        color: 'fuchsia',
        keywords: ['ai_text_generation', 'ai_embeddings', 'ai_']
    },
    'General': {
        icon: Settings,
        color: 'gray',
        prefix: ''
    }
};

const EnhancedWorkflowCreator: React.FC<EnhancedWorkflowCreatorProps> = ({
    open,
    onClose,
    onWorkflowCreated,
    initialData,
    initialCanvasState,
    onSwitchToCanvas
}) => {
    // Step management
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ['Details', 'Add Tools', 'Configure', 'Review'];

    // Workflow details
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('manual');
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');

    // Tool selection
    const [availableTools, setAvailableTools] = useState<(MCPTool | ToolInfo)[]>([]);
    const [loadingTools, setLoadingTools] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');


    // Workflow steps
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [editingStep, setEditingStep] = useState<string | null>(null);
    const [stepParams, setStepParams] = useState<Record<string, any>>({});
    
    // Workflow Variables
    const [workflowVariablesSchema, setWorkflowVariablesSchema] = useState<Record<string, any>>({});
    const [workflowVariableValues, setWorkflowVariableValues] = useState<Record<string, any>>({});

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, { label: string, value: any }[]>>({});
    const [loadingDynamic, setLoadingDynamic] = useState<Record<string, boolean>>({});
    const isEditing = !!initialData;

    useEffect(() => {
        if (open) {
            loadTools();
            // Restore from canvas state if switching from canvas mode
            if (initialCanvasState) {
                setCurrentStep(1); // Go to tools step since we already have data
                setWorkflowName(initialCanvasState.workflowName || '');
                setDescription(initialCanvasState.description || '');
                setTriggerType((initialCanvasState.triggerType as TriggerType) || 'manual');
                setTriggerConfig(initialCanvasState.triggerConfig || {});
                setCategory(initialCanvasState.category || '');
                setTags(initialCanvasState.tags || '');
                setWorkflowSteps(initialCanvasState.steps || []);
            } else if (initialData) {
                setCurrentStep(0);
                setWorkflowName(initialData.name || '');
                setDescription(initialData.description || '');
                setTriggerType((initialData.trigger_type?.toLowerCase() as TriggerType) || 'manual');
                setTriggerConfig(initialData.trigger_config || {});
                // Extract category/tags if stored in metadata or infer
                setCategory(initialData.workflow_metadata?.category || '');
                setTags(initialData.workflow_metadata?.tags?.join(', ') || '');

                // Load variables: merge saved values with latest Library template schema
                buildWorkflowVariableState(initialData).then(({ schema, values }) => {
                    setWorkflowVariablesSchema(schema);
                    setWorkflowVariableValues(values);
                });

                // Map steps
                if (initialData.steps) {
                    const mappedSteps = initialData.steps.map((s: any) => ({
                        id: s.id || Math.random().toString(36).substr(2, 9),
                        step_number: s.step_number,
                        tool_name: s.tool_name,
                        tool_parameters: s.tool_parameters || {},
                        description: s.description || '',
                        condition: s.condition,
                        retry_config: s.retry_config,
                        timeout: s.timeout
                    })).sort((a: any, b: any) => a.step_number - b.step_number);
                    setWorkflowSteps(mappedSteps);
                } else {
                    setWorkflowSteps([]);
                }
            } else {
                setCurrentStep(0);
                setWorkflowName('');
                setDescription('');
                setTriggerType('manual');
                setTriggerConfig({});
                setCategory('');
                setTags('');
                setWorkflowSteps([]);
                setWorkflowVariablesSchema({});
                setWorkflowVariableValues({});
            }
            setSearchQuery('');
            setSelectedCategory('All');
            setError(null);
        }
    }, [open, initialData, initialCanvasState]);

    const loadTools = async () => {
        try {
            setLoadingTools(true);
            // Fetch all tools (including non-connected for discovery)
            // Passing true for includeAll
            const response = await apiService.getMCPTools(true);
            if (response.success) {
                setAvailableTools(response.data || []);
            }
        } catch (err) {
            console.error('Error loading tools:', err);
            toast.error('Failed to load available tools');
        } finally {
            setLoadingTools(false);
        }
    };

    const getToolCategory = (toolName: string): string => {
        const lowerName = toolName.toLowerCase();
        for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
            const cfg = config as any;
            if (cfg.prefix && lowerName.startsWith(cfg.prefix)) {
                return category;
            }
            if (cfg.keywords) {
                for (const keyword of cfg.keywords) {
                    if (lowerName.includes(keyword)) {
                        return category;
                    }
                }
            }
        }
        return 'General';
    };

    const getCategoryColor = (category: string): string => {
        const config = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES];
        return config?.color || 'gray';
    };

    const getCategoryIcon = (category: string) => {
        const config = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES];
        const Icon = config?.icon || Settings;
        return <Icon className="w-4 h-4" />;
    };

    const categorizedTools = React.useMemo(() => {
        const categories: Record<string, (MCPTool | ToolInfo)[]> = { 'All': [] };

        availableTools.forEach(tool => {
            const category = getToolCategory(tool.name);
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(tool);
            categories['All'].push(tool);
        });

        return categories;
    }, [availableTools]);

    const filteredTools = React.useMemo(() => {
        const toolsInCategory = selectedCategory === 'All'
            ? availableTools
            : categorizedTools[selectedCategory] || [];

        if (!searchQuery.trim()) {
            return toolsInCategory;
        }

        const query = searchQuery.toLowerCase();
        return toolsInCategory.filter(tool =>
            tool.name.toLowerCase().includes(query) ||
            tool.description?.toLowerCase().includes(query)
        );
    }, [availableTools, categorizedTools, selectedCategory, searchQuery]);

    const handleAddTool = (tool: MCPTool | ToolInfo) => {
        const newStep: WorkflowStep = {
            id: `step_${Date.now()}`,
            step_number: workflowSteps.length + 1,
            tool_name: tool.name,
            tool_parameters: {},
            description: `Execute ${tool.name}`,
            retry_config: {
                max_retries: 3,
                retry_delay: 30
            },
            timeout: 60
        };

        setWorkflowSteps([...workflowSteps, newStep]);
        setEditingStep(newStep.id);
        setStepParams({});
        toast.success(`Added ${tool.name} to workflow`);
    };

    const handleRemoveStep = (stepId: string) => {
        setWorkflowSteps(workflowSteps.filter(s => s.id !== stepId));
        if (editingStep === stepId) {
            setEditingStep(null);
        }
        toast.success('Step removed');
    };

    const handleUpdateStepParams = (stepId: string) => {
        setWorkflowSteps(workflowSteps.map(step =>
            step.id === stepId
                ? { ...step, tool_parameters: stepParams }
                : step
        ));
        setEditingStep(null);
        setStepParams({});
        toast.success('Step configured');
    };

    const getTriggerIcon = (type: TriggerType) => {
        switch (type) {
            case 'manual': return <MousePointer className="w-4 h-4" />;
            case 'scheduled': return <Clock className="w-4 h-4" />;
            case 'webhook': return <Webhook className="w-4 h-4" />;
            case 'event': return <Play className="w-4 h-4" />;
            default: return <Settings className="w-4 h-4" />;
        }
    };

    const handleCreateWorkflow = async () => {
        if (!workflowName.trim()) {
            setError('Workflow name is required');
            return;
        }

        if (workflowSteps.length === 0) {
            setError('Please add at least one step');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const steps = workflowSteps.map((step, index) => ({
                step_number: index + 1,
                tool_name: step.tool_name,
                tool_parameters: step.tool_parameters,
                description: step.description,
                retry_config: step.retry_config,
                timeout: step.timeout
            }));

            if (isEditing) {
                const response = await apiService.updateWorkflow(initialData.id, {
                    name: workflowName,
                    description: description || `Updated with ${workflowSteps.length} steps`,
                    steps: steps,
                    trigger_type: triggerType,
                    trigger_config: triggerConfig,
                    variables: workflowVariableValues,
                    workflow_metadata: {
                        category: category,
                        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
                    }
                });

                if (response.success && response.data) {
                    toast.success(`Workflow "${workflowName}" updated successfully!`);
                    onWorkflowCreated?.(response.data);
                    onClose();
                } else {
                    setError('Failed to update workflow');
                }
            } else {
                const response = await apiService.createWorkflowFromSteps({
                    workflow_name: workflowName,
                    description: description || `Created with ${workflowSteps.length} steps`,
                    steps: steps,
                    trigger_type: triggerType,
                    trigger_config: triggerConfig,
                    variables: workflowVariableValues
                });

                if (response.success && response.data) {
                    toast.success(`Workflow "${workflowName}" created successfully!`);
                    onWorkflowCreated?.(response.data);
                    onClose();
                } else {
                    setError('Failed to create workflow');
                }
            }
        } catch (err: any) {
            console.error('Error saving workflow:', err);
            setError(err.message || 'An error occurred while saving the workflow');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                if (workflowName.trim() === '') return false;
                if (triggerType === 'scheduled' && !triggerConfig.cron_expression) return false;
                if (triggerType === 'event' && !triggerConfig.event_type) return false;
                return true;
            case 1:
                return workflowSteps.length > 0;
            case 2:
                return workflowSteps.every(step => Object.keys(step.tool_parameters).length > 0 || true);
            default:
                return true;
        }
    };



    const fetchDynamicOptions = async (fieldKey: string, toolOperation: string) => {
        if (dynamicOptions[fieldKey] || loadingDynamic[fieldKey]) return;

        try {
            setLoadingDynamic(prev => ({ ...prev, [fieldKey]: true }));
            const [toolName, operation] = toolOperation.split('.');
            
            const response = await apiService.executeTool(toolName, { operation }) as any;
            
            // Mega-robust option parsing
            let options = null;
            
            // Check for options in various common response locations
            if (response.result?.options && Array.isArray(response.result.options)) {
                options = response.result.options;
            } else if (response.data?.options && Array.isArray(response.data.options)) {
                options = response.data.options;
            } else if (response.options && Array.isArray(response.options)) {
                options = response.options;
            } else if (Array.isArray(response.result)) {
                options = response.result;
            } else if (Array.isArray(response.data)) {
                options = response.data;
            } else if (Array.isArray(response)) {
                options = response;
            }

            if (options) {
                setDynamicOptions(prev => ({ ...prev, [fieldKey]: options }));
            } else {
                console.warn(`No options found for ${fieldKey} in response:`, response);
            }
        } catch (err) {
            console.error(`Error fetching dynamic options for ${fieldKey}:`, err);
        } finally {
            setLoadingDynamic(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const renderInputField = (name: string, schema: any, tool: MCPTool | ToolInfo) => {
        const fieldType = schema.type || 'string';
        const isRequired = schema.required || false;
        const isLongText = ['system_prompt', 'prompt', 'context', 'message', 'description', 'base_content', 'text'].includes(name.toLowerCase());
        const premiumClasses = "w-full px-4 py-3 text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-all duration-200 border border-gray-200 bg-white dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500";
        
        let dynamicSource = 
            schema['x-dynamic-options'] || 
            schema.x_dynamic_options || 
            schema.xDynamicOptions ||
            schema['x-dynamic-ui'];

        if (tool?.name === 'rag_ingest_source' && name === 'url_or_id') {
            if (stepParams['source_type'] === 'google_drive') {
                dynamicSource = 'google_workspace_drive.list_folders';
            }
        }

        if (dynamicSource) {
            const toolId = (tool as any).id || tool.name;
            const fieldKey = `${toolId}.${name}`;
            
            if (!dynamicOptions[fieldKey] && !loadingDynamic[fieldKey]) {
                fetchDynamicOptions(fieldKey, dynamicSource);
            }

            return (
                <div className="relative">
                    <select
                        className={`${premiumClasses} appearance-none`}
                        value={stepParams[name] || ''}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                        disabled={loadingDynamic[fieldKey]}
                        required={isRequired}
                    >
                        <option value="">{loadingDynamic[fieldKey] ? 'Loading options...' : `Select ${name.replace(/_/g, ' ')}...`}</option>
                        {dynamicOptions[fieldKey]?.map((option: any) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        {loadingDynamic[fieldKey] ? (
                            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                </div>
            );
        }

        if (schema.enum && Array.isArray(schema.enum)) {
            return (
                <div className="relative">
                    <select
                        className={`${premiumClasses} appearance-none`}
                        value={stepParams[name] || ''}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                        required={isRequired}
                    >
                        <option value="">Select {name.replace(/_/g, ' ')}...</option>
                        {schema.enum.map((option: string) => (
                            <option key={option} value={option}>
                                {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            );
        }

        switch (fieldType) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-3 pt-2 pb-1">
                        <button
                            type="button"
                            onClick={() => setStepParams({ ...stepParams, [name]: !stepParams[name] })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${stepParams[name] ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${stepParams[name] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            {stepParams[name] ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                );

            case 'integer':
            case 'number':
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name.replace(/_/g, ' ')} or {{variable}}`}
                        className={premiumClasses}
                        value={stepParams[name] || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes('{{') || val === '') {
                                setStepParams({ ...stepParams, [name]: val });
                            } else {
                                const num = fieldType === 'integer' ? parseInt(val) : parseFloat(val);
                                setStepParams({ ...stepParams, [name]: isNaN(num) ? val : num });
                            }
                        }}
                        required={isRequired}
                    />
                );

            default:
                if (isLongText) {
                    return (
                        <textarea
                            placeholder={`Enter ${name.replace(/_/g, ' ')}...`}
                            rows={4}
                            className={`${premiumClasses} resize-y min-h-[100px] leading-relaxed`}
                            value={stepParams[name] || ''}
                            onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                            required={isRequired}
                        />
                    );
                }
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name.replace(/_/g, ' ')}`}
                        className={premiumClasses}
                        value={stepParams[name] || ''}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                        required={isRequired}
                    />
                );
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-slate-900/50 border border-transparent dark:border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'Update Workflow' : 'Create Workflow'}</h2>
                            <p className="text-sm text-white/80">
                                Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {onSwitchToCanvas && (
                            <button
                                onClick={() => onSwitchToCanvas({
                                    workflowName,
                                    description,
                                    triggerType,
                                    triggerConfig,
                                    category,
                                    tags,
                                    steps: workflowSteps,
                                })}
                                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-bold"
                            >
                                Switch to Canvas
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-center space-x-4">
                        {steps.map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center space-x-2 ${index <= currentStep ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep
                                        ? 'bg-purple-600 text-white'
                                        : index === currentStep
                                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-500'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                        }`}>
                                        {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                    </div>
                                    <span className="text-sm font-medium hidden sm:block">{step}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                    {error && (
                        <div className="mb-4 flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Step 0: Details */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Workflow Name *
                                </label>
                                <input
                                    type="text"
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="My Awesome Workflow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Describe what this workflow does..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                                    Trigger Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'manual', label: 'Manual', desc: 'Run on demand' },
                                        { value: 'scheduled', label: 'Scheduled', desc: 'Run on a schedule' },
                                        { value: 'webhook', label: 'Webhook', desc: 'Trigger via API' },
                                        { value: 'event', label: 'Event', desc: 'Trigger on events' },
                                    ].map((trigger) => (
                                        <button
                                            key={trigger.value}
                                            onClick={() => setTriggerType(trigger.value as TriggerType)}
                                            className={`flex items-center space-x-3 p-4 border rounded-lg transition-all ${triggerType === trigger.value
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${triggerType === trigger.value ? 'bg-purple-100 dark:bg-purple-500/20' : 'bg-gray-100 dark:bg-slate-800'
                                                }`}>
                                                {getTriggerIcon(trigger.value as TriggerType)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-gray-900 dark:text-white">{trigger.label}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{trigger.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trigger Configuration */}
                            {triggerType !== 'manual' && (
                                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 mb-2">
                                        {triggerType.charAt(0).toUpperCase() + triggerType.slice(1)} Configuration
                                    </h4>

                                    {triggerType === 'scheduled' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Cron Expression *
                                            </label>
                                            <input
                                                type="text"
                                                value={triggerConfig.cron_expression || ''}
                                                onChange={(e) => setTriggerConfig({ ...triggerConfig, cron_expression: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                                                placeholder="0 9 * * 1-5 (At 09:00 on every day-of-week from Monday through Friday)"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                Use standard cron syntax. <a href="https://crontab.guru/" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Need help?</a>
                                            </p>
                                        </div>
                                    )}

                                    {triggerType === 'event' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                    Platform *
                                                </label>
                                                <select
                                                    value={triggerConfig.platform || ''}
                                                    onChange={(e) => setTriggerConfig({ ...triggerConfig, platform: e.target.value, event_type: '' })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                >
                                                    <option value="">Select Platform</option>
                                                    <option value="zoho">Zoho Desk</option>
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="slack">Slack</option>
                                                    <option value="instagram">Instagram</option>
                                                    <option value="telegram">Telegram</option>
                                                    <option value="google_drive">Google Drive</option>
                                                </select>
                                            </div>
                                            {triggerConfig.platform === 'zoho' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        Zoho Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="Ticket Created">Ticket Created (Auto-resolve start)</option>
                                                        <option value="Ticket Status Updated">Ticket Status Updated (KB Draft trigger)</option>
                                                        <option value="New Contact">New Contact Created</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Zoho will automatically send an HTTP POST to Arrotech's Webhook URL whenever this event occurs.
                                                    </p>
                                                </div>
                                            )}
                                            {triggerConfig.platform === 'slack' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        Slack Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="slack_message_received">Message Received (All channel & DM chatter)</option>
                                                        <option value="slack_app_mention">App Mention (When @bot is tagged)</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Whenever this Slack event occurs, the workflow will be automatically triggered.
                                                    </p>
                                                </div>
                                            )}
                                            {triggerConfig.platform === 'instagram' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        Instagram Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="instagram_dm_received">DM Received (Incoming direct messages)</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Whenever this Instagram event occurs, the workflow will be automatically triggered.
                                                    </p>
                                                </div>
                                            )}
                                            {triggerConfig.platform === 'whatsapp' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        WhatsApp Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                        required
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="whatsapp_message_received">Message Received (Incoming WhatsApp messages)</option>
                                                        <option value="whatsapp_new_contact">New Contact</option>
                                                        <option value="whatsapp_keyword_detected">Keyword Detected</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Whenever this WhatsApp event occurs, the workflow will be automatically triggered.
                                                    </p>
                                                </div>
                                            )}

                                            {triggerConfig.platform === 'telegram' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        Telegram Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="telegram_message_received">Message Received (Incoming telegram messages)</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Whenever this Telegram event occurs, the workflow will be automatically triggered.
                                                    </p>
                                                </div>
                                            )}
                                            {triggerConfig.platform === 'google_drive' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        Google Drive Event *
                                                    </label>
                                                    <select
                                                        value={triggerConfig.event_type || ''}
                                                        onChange={(e) => setTriggerConfig({ ...triggerConfig, event_type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                    >
                                                        <option value="">Select Event</option>
                                                        <option value="google_drive_folder_changed">Drive Folder Changed (Auto-sync trigger)</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Whenever a file is added, updated, or removed in the specified folder, this workflow will trigger.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {triggerType === 'webhook' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                Webhook Secret (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={triggerConfig.webhook_secret || ''}
                                                onChange={(e) => setTriggerConfig({ ...triggerConfig, webhook_secret: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                placeholder="Enter a secret token to verify requests"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                If provided, the webhook must include this secret in the headers for verification.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {Object.keys(workflowVariablesSchema).length > 0 && (
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-200 dark:border-purple-500/30 space-y-4 mt-6">
                                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 border-b border-purple-200 dark:border-purple-500/30 pb-2 mb-2 flex items-center">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Agent Configuration Variables
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(workflowVariablesSchema).map(([key, schema]: [string, any]) => {
                                            const showIf = schema.show_if;
                                            if (showIf && workflowVariableValues[showIf.field] !== showIf.value) {
                                                return null;
                                            }

                                            const isRequired = schema.required;
                                            const hasOptions = schema.enum && Array.isArray(schema.enum);
                                            
                                            let dynamicSource = 
                                                schema['x-dynamic-options'] || 
                                                schema.x_dynamic_options || 
                                                schema.xDynamicOptions ||
                                                schema['x-dynamic-ui'];

                                            if (dynamicSource) {
                                                const fieldKey = `agent_var_${key}`;
                                                if (!dynamicOptions[fieldKey] && !loadingDynamic[fieldKey]) {
                                                    fetchDynamicOptions(fieldKey, dynamicSource);
                                                }
                                                
                                                return (
                                                    <div key={key}>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                            {key.replace(/_/g, ' ')}
                                                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={workflowVariableValues[key] || ''}
                                                                onChange={(e) => setWorkflowVariableValues({ ...workflowVariableValues, [key]: e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm appearance-none"
                                                                disabled={loadingDynamic[fieldKey]}
                                                                required={isRequired}
                                                            >
                                                                <option value="">{loadingDynamic[fieldKey] ? 'Loading options...' : `Select ${key.replace(/_/g, ' ')}...`}</option>
                                                                {dynamicOptions[fieldKey]?.map((option: any) => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                                {loadingDynamic[fieldKey] ? (
                                                                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {schema.description && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                                {schema.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            const arrayOptions: string[] = (schema.items?.enum || []).filter(
                                                (opt: string) => opt !== 'dine_in' || workflowVariableValues.order_type === 'food'
                                            );
                                            const isMultiSelectArray = schema.type === 'array' && Array.isArray(arrayOptions) && arrayOptions.length > 0;

                                            if (schema.type === 'boolean') {
                                                const checked = workflowVariableValues[key] ?? schema.default ?? false;
                                                return (
                                                    <div key={key}>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                            {key.replace(/_/g, ' ')}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setWorkflowVariableValues({ ...workflowVariableValues, [key]: !checked })}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                        {schema.description && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{schema.description}</p>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (isMultiSelectArray) {
                                                const selected: string[] = Array.isArray(workflowVariableValues[key])
                                                    ? workflowVariableValues[key]
                                                    : (schema.default || []);
                                                return (
                                                    <div key={key} className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                                            {key.replace(/_/g, ' ')}
                                                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                        </label>
                                                        <div className="flex flex-wrap gap-3">
                                                            {arrayOptions.map((opt: string) => {
                                                                const active = selected.includes(opt);
                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = active
                                                                                ? selected.filter((v) => v !== opt)
                                                                                : [...selected, opt];
                                                                            setWorkflowVariableValues({ ...workflowVariableValues, [key]: next });
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600'}`}
                                                                    >
                                                                        {opt.replace(/_/g, ' ')}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {schema.description && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{schema.description}</p>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                                        {key.replace(/_/g, ' ')}
                                                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    {hasOptions ? (
                                                        <select
                                                            value={workflowVariableValues[key] || ''}
                                                            onChange={(e) => setWorkflowVariableValues({ ...workflowVariableValues, [key]: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                            required={isRequired}
                                                        >
                                                            <option value="">Select an option</option>
                                                            {schema.enum.map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={schema.type === 'number' ? 'number' : 'text'}
                                                            value={Array.isArray(workflowVariableValues[key])
                                                                ? workflowVariableValues[key].join(', ')
                                                                : (workflowVariableValues[key] ?? '')}
                                                            onChange={(e) => setWorkflowVariableValues({ ...workflowVariableValues, [key]: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                                            required={isRequired}
                                                        />
                                                    )}
                                                    {schema.description && (
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            {schema.description}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Marketing, Sales"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="automation, slack, reporting"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Add Tools */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left: Tool Browser */}
                            <div className="col-span-2 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search tools..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Category Pills */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(categorizedTools).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {cat !== 'All' && getCategoryIcon(cat)}
                                            <span>{cat}</span>
                                            <span className="text-xs opacity-75">
                                                ({categorizedTools[cat]?.length || 0})
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tool Grid */}
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {loadingTools ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Loading tools...</p>
                                        </div>
                                    ) : filteredTools.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                            <p className="text-sm">No tools found matching "{searchQuery}"</p>
                                            <p className="text-xs mt-1">Try a different search term</p>
                                        </div>
                                    ) : (
                                        filteredTools.map(tool => (
                                            <div
                                                key={tool.name}
                                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className={`p-2 rounded-lg bg-${getCategoryColor(getToolCategory(tool.name))}-100`}>
                                                        {getCategoryIcon(getToolCategory(tool.name))}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {tool.name.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(getToolCategory(tool.name))}-100 text-${getCategoryColor(getToolCategory(tool.name))}-700`}>
                                                                {getToolCategory(tool.name)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                            {tool.description || 'No description available'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddTool(tool)}
                                                    className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm opacity-0 group-hover:opacity-100"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add</span>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right: Selected Steps */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Workflow Steps ({workflowSteps.length})
                                </h3>
                                {workflowSteps.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">No steps added yet</p>
                                        <p className="text-xs mt-1">Add tools from the left</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {workflowSteps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                        {step.tool_name.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveStep(step.id)}
                                                    className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configure Steps */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Configure Workflow Steps
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Configure parameters for each step in your workflow
                            </p>

                            {workflowSteps.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No steps to configure</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {workflowSteps.map((step, index) => {
                                        const tool = availableTools.find(t => t.name === step.tool_name);
                                        const isEditing = editingStep === step.id;
                                        const hasParams = Object.keys(step.tool_parameters).length > 0;

                                        return (
                                            <div
                                                key={step.id}
                                                className={`border rounded-lg transition-all ${isEditing ? 'border-purple-300 dark:border-purple-500/50 bg-purple-50 dark:bg-purple-900/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                    }`}
                                            >
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer"
                                                    onClick={() => {
                                                        if (isEditing) {
                                                            setEditingStep(null);
                                                        } else {
                                                            setEditingStep(step.id);
                                                            setStepParams(step.tool_parameters);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                                {step.tool_name.replace(/_/g, ' ')}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                {hasParams ? (
                                                                    <span className="flex items-center space-x-1 text-green-600">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        <span>Configured</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center space-x-1 text-gray-400 dark:text-slate-500">
                                                                        <Settings className="w-3 h-3" />
                                                                        <span>Not configured</span>
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isEditing ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                    )}
                                                </div>

                                                {isEditing && tool && tool.inputSchema?.properties && (
                                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-slate-700 space-y-3">
                                                        {Object.entries(tool.inputSchema.properties).map(([name, schema]: [string, any]) => {
                                                            const isSessionKey = name === 'session_key';
                                                            return (
                                                            <div key={name}>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                                                        {name.replace(/_/g, ' ')}
                                                                        {schema.required && <span className="text-red-500 ml-1">*</span>}
                                                                    </label>
                                                                    {isSessionKey && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                                                            💬 Context Memory
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isSessionKey && !stepParams[name] && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStepParams(prev => ({ ...prev, [name]: '{{session_key}}' }));
                                                                        }}
                                                                        className="mb-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 dark:border-purple-500/20"
                                                                    >
                                                                        ⚡ Auto-fill with {'{{session_key}}'}
                                                                    </button>
                                                                )}
                                                                {renderInputField(name, schema, tool)}
                                                                {schema.description && (
                                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{schema.description}</p>
                                                                )}
                                                            </div>
                                                            );
                                                        })}
                                                        <div className="flex space-x-2 pt-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateStepParams(step.id);
                                                                }}
                                                                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                                            >
                                                                <Save className="w-3 h-3" />
                                                                <span>Save Configuration</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingStep(null);
                                                                    setStepParams({});
                                                                }}
                                                                className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg p-6 border border-purple-200 dark:border-purple-500/30">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workflow Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 dark:text-slate-400">Name:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{workflowName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-slate-400">Trigger:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">{triggerType}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-slate-400">Steps:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{workflowSteps.length}</span>
                                    </div>
                                    {category && (
                                        <div>
                                            <span className="text-gray-600 dark:text-slate-400">Category:</span>
                                            <span className="ml-2 font-medium text-gray-900 dark:text-white">{category}</span>
                                        </div>
                                    )}
                                </div>
                                {description && (
                                    <div className="mt-4">
                                        <span className="text-gray-600 dark:text-slate-400 text-sm">Description:</span>
                                        <p className="mt-1 text-gray-900 dark:text-white">{description}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Workflow Steps</h4>
                                <div className="space-y-2">
                                    {workflowSteps.map((step, index) => (
                                        <div key={step.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {step.tool_name.replace(/_/g, ' ')}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    {Object.keys(step.tool_parameters).length} parameter(s) configured
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <button
                        onClick={() => {
                            if (currentStep === 0) {
                                onClose();
                            } else {
                                setCurrentStep(currentStep - 1);
                            }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{currentStep === 0 ? 'Cancel' : 'Back'}</span>
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => {
                                if (editingStep) {
                                    handleUpdateStepParams(editingStep);
                                }
                                setCurrentStep(currentStep + 1);
                            }}
                            disabled={!canProceed()}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Next</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateWorkflow}
                            disabled={loading || !canProceed()}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>{isEditing ? 'Update Workflow' : 'Create Workflow'}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default EnhancedWorkflowCreator;
