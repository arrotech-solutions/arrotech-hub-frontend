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
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { MCPTool, ToolInfo } from '../types';

interface EnhancedWorkflowCreatorProps {
    open: boolean;
    onClose: () => void;
    onWorkflowCreated?: (workflow: any) => void;
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

const TOOL_CATEGORIES = {
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
        prefix: 'whatsapp_'
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
    'General': {
        icon: Settings,
        color: 'gray',
        prefix: ''
    }
};

const EnhancedWorkflowCreator: React.FC<EnhancedWorkflowCreatorProps> = ({
    open,
    onClose,
    onWorkflowCreated
}) => {
    // Step management
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ['Details', 'Add Tools', 'Configure', 'Review'];

    // Workflow details
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('manual');
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

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadTools();
            // Reset state
            setCurrentStep(0);
            setWorkflowName('');
            setDescription('');
            setTriggerType('manual');
            setCategory('');
            setTags('');
            setWorkflowSteps([]);
            setSearchQuery('');
            setSelectedCategory('All');
            setError(null);
        }
    }, [open]);

    const loadTools = async () => {
        try {
            setLoadingTools(true);
            const response = await apiService.getMCPTools();
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
        for (const [category, config] of Object.entries(TOOL_CATEGORIES)) {
            if (config.prefix && toolName.startsWith(config.prefix)) {
                return category;
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

            const response = await apiService.createWorkflowFromSteps({
                workflow_name: workflowName,
                description: description || `Created with ${workflowSteps.length} steps`,
                steps: steps,
                trigger_type: triggerType,
                variables: {}
            });

            if (response.success && response.data) {
                toast.success(`Workflow "${workflowName}" created successfully!`);
                onWorkflowCreated?.(response.data);
                onClose();
            } else {
                setError(response.error || 'Failed to create workflow');
            }
        } catch (err: any) {
            console.error('Error creating workflow:', err);
            setError(err.message || 'An error occurred while creating the workflow');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return workflowName.trim() !== '';
            case 1:
                return workflowSteps.length > 0;
            case 2:
                return workflowSteps.every(step => Object.keys(step.tool_parameters).length > 0 || true);
            default:
                return true;
        }
    };



    const renderInputField = (name: string, schema: any, tool: MCPTool | ToolInfo) => {
        const fieldType = schema.type || 'string';
        const isRequired = schema.required || false;

        // Render select dropdown if enum is provided
        if (schema.enum && Array.isArray(schema.enum)) {
            return (
                <div className="relative">
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm appearance-none bg-white"
                        value={stepParams[name] || ''}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                        required={isRequired}
                    >
                        <option value="">Select {name}...</option>
                        {schema.enum.map((option: string) => (
                            <option key={option} value={option}>
                                {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            );
        }

        switch (fieldType) {
            case 'string':
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        value={stepParams[name] || ''}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value })}
                        required={isRequired}
                    />
                );

            case 'integer':
            case 'number':
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name} or {{variable}}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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

            case 'boolean':
                return (
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        value={stepParams[name]?.toString() || 'false'}
                        onChange={(e) => setStepParams({ ...stepParams, [name]: e.target.value === 'true' })}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );

            default:
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Create Workflow</h2>
                            <p className="text-sm text-white/80">
                                Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-center space-x-4">
                        {steps.map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center space-x-2 ${index <= currentStep ? 'text-purple-600' : 'text-gray-400'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep
                                        ? 'bg-purple-600 text-white'
                                        : index === currentStep
                                            ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                    </div>
                                    <span className="text-sm font-medium hidden sm:block">{step}</span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-purple-600' : 'bg-gray-200'
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Workflow Name *
                                </label>
                                <input
                                    type="text"
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="My Awesome Workflow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${triggerType === trigger.value ? 'bg-purple-100' : 'bg-gray-100'
                                                }`}>
                                                {getTriggerIcon(trigger.value as TriggerType)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-gray-900">{trigger.label}</p>
                                                <p className="text-xs text-gray-500">{trigger.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Marketing, Sales"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search tools..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                            <p className="text-sm text-gray-500">Loading tools...</p>
                                        </div>
                                    ) : filteredTools.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <p className="text-sm">No tools found matching "{searchQuery}"</p>
                                            <p className="text-xs mt-1">Try a different search term</p>
                                        </div>
                                    ) : (
                                        filteredTools.map(tool => (
                                            <div
                                                key={tool.name}
                                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div className={`p-2 rounded-lg bg-${getCategoryColor(getToolCategory(tool.name))}-100`}>
                                                        {getCategoryIcon(getToolCategory(tool.name))}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-gray-900 text-sm">
                                                                {tool.name.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(getToolCategory(tool.name))}-100 text-${getCategoryColor(getToolCategory(tool.name))}-700`}>
                                                                {getToolCategory(tool.name)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
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
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Workflow Steps ({workflowSteps.length})
                                </h3>
                                {workflowSteps.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">No steps added yet</p>
                                        <p className="text-xs mt-1">Add tools from the left</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {workflowSteps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-900 truncate">
                                                        {step.tool_name.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveStep(step.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                            <h3 className="text-lg font-semibold text-gray-900">
                                Configure Workflow Steps
                            </h3>
                            <p className="text-sm text-gray-600">
                                Configure parameters for each step in your workflow
                            </p>

                            {workflowSteps.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
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
                                                className={`border rounded-lg transition-all ${isEditing ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
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
                                                            <h4 className="font-medium text-gray-900">
                                                                {step.tool_name.replace(/_/g, ' ')}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                {hasParams ? (
                                                                    <span className="flex items-center space-x-1 text-green-600">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        <span>Configured</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center space-x-1 text-gray-400">
                                                                        <Settings className="w-3 h-3" />
                                                                        <span>Not configured</span>
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isEditing ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>

                                                {isEditing && tool && tool.inputSchema?.properties && (
                                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                                                        {Object.entries(tool.inputSchema.properties).map(([name, schema]: [string, any]) => (
                                                            <div key={name}>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    {name.replace(/_/g, ' ')}
                                                                    {schema.required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {renderInputField(name, schema, tool)}
                                                                {schema.description && (
                                                                    <p className="text-xs text-gray-500 mt-1">{schema.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
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
                                                                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <span className="ml-2 font-medium text-gray-900">{workflowName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Trigger:</span>
                                        <span className="ml-2 font-medium text-gray-900 capitalize">{triggerType}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Steps:</span>
                                        <span className="ml-2 font-medium text-gray-900">{workflowSteps.length}</span>
                                    </div>
                                    {category && (
                                        <div>
                                            <span className="text-gray-600">Category:</span>
                                            <span className="ml-2 font-medium text-gray-900">{category}</span>
                                        </div>
                                    )}
                                </div>
                                {description && (
                                    <div className="mt-4">
                                        <span className="text-gray-600 text-sm">Description:</span>
                                        <p className="mt-1 text-gray-900">{description}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Workflow Steps</h4>
                                <div className="space-y-2">
                                    {workflowSteps.map((step, index) => (
                                        <div key={step.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {step.tool_name.replace(/_/g, ' ')}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {Object.keys(step.tool_parameters).length} parameter(s) configured
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={() => {
                            if (currentStep === 0) {
                                onClose();
                            } else {
                                setCurrentStep(currentStep - 1);
                            }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{currentStep === 0 ? 'Cancel' : 'Back'}</span>
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
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
                                    <span>Create Workflow</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedWorkflowCreator;
