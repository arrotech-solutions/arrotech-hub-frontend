import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Clock,
  Webhook,
  MousePointer,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Settings,
  Save,
  Bot,
  Loader2,
  AlertCircle,
  Search,
} from 'lucide-react';
import apiService from '../services/api';
import { ExtractedToolCall, Workflow } from '../types';

interface WorkflowBuilderModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  toolCalls: ExtractedToolCall[];
  onWorkflowCreated?: (workflow: Workflow) => void;
  onCreateAgent?: (workflowId: number) => void;
}

const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({
  open,
  onClose,
  conversationId,
  toolCalls,
  onWorkflowCreated,
  onCreateAgent,
}) => {
  // Form state
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'manual' | 'scheduled' | 'webhook' | 'event'>('manual');
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [parameterizeFields, setParameterizeFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdWorkflow, setCreatedWorkflow] = useState<Workflow | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize on open
  useEffect(() => {
    if (open && toolCalls.length > 0) {
      // Select all successful tool calls by default
      const successfulCalls = toolCalls
        .filter(tc => tc.success !== false)
        .map(tc => tc.id);
      setSelectedSteps(successfulCalls);

      // Extract all available fields from arguments
      const fields = new Set<string>();
      toolCalls.forEach(tc => {
        Object.keys(tc.arguments || {}).forEach(key => fields.add(key));
      });
      setAvailableFields(Array.from(fields));

      // Generate default workflow name
      const toolNames = Array.from(new Set(toolCalls.map(tc => tc.tool_name)));
      setWorkflowName(`${toolNames.slice(0, 2).join(' + ')} Workflow`);

      // Reset state
      setActiveStep(0);
      setError(null);
      setSuccess(false);
      setCreatedWorkflow(null);
      setSearchQuery(''); // Reset search query on open
    }
  }, [open, toolCalls]);

  const handleStepToggle = (stepId: string) => {
    setSelectedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const handleFieldToggle = (field: string) => {
    setParameterizeFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleExpandToggle = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const buildWorkflowSteps = () => {
    return toolCalls
      .filter(tc => selectedSteps.includes(tc.id))
      .map((tc, index) => {
        // Parameterize selected fields
        const processedArgs: Record<string, any> = {};
        Object.entries(tc.arguments || {}).forEach(([key, value]) => {
          if (parameterizeFields.includes(key)) {
            processedArgs[key] = `{{input.${key}}}`;
          } else {
            processedArgs[key] = value;
          }
        });

        return {
          step_number: index + 1,
          tool_name: tc.tool_name,
          tool_parameters: processedArgs,
          description: `Execute ${tc.tool_name}`,
          retry_config: {
            max_retries: 3,
            retry_delay: 30,
          },
          timeout: 60,
        };
      });
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      setError('Workflow name is required');
      return;
    }

    if (selectedSteps.length === 0) {
      setError('Please select at least one step');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const steps = buildWorkflowSteps();

      console.log('[WorkflowBuilder] Creating workflow with steps:', steps);

      const response = await apiService.createWorkflowFromSteps({
        workflow_name: workflowName,
        description: description || `Created from conversation #${conversationId}`,
        steps: steps,
        trigger_type: triggerType,
        variables: parameterizeFields.reduce((acc, field) => {
          acc[field] = { type: 'string', required: true, default: '' };
          return acc;
        }, {} as Record<string, any>),
      });

      console.log('[WorkflowBuilder] Response received:', response);
      console.log('[WorkflowBuilder] response.success:', response.success);
      console.log('[WorkflowBuilder] response.data:', response.data);

      if (response.success && response.data) {
        setSuccess(true);
        setCreatedWorkflow(response.data);
        onWorkflowCreated?.(response.data);
      } else {
        console.error('[WorkflowBuilder] Response failed check:', {
          success: response.success,
          hasData: !!response.data,
          error: response.error
        });
        setError(response.error || 'Failed to create workflow');
      }
    } catch (err: any) {
      console.error('[WorkflowBuilder] Exception caught:', err);
      setError(err.message || 'An error occurred while creating the workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    if (createdWorkflow) {
      onCreateAgent?.(createdWorkflow.id);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'manual': return <MousePointer className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'event': return <Play className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  // Filter tool calls based on search query
  const filteredToolCalls = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // If no search query, return all tools
    if (!query) {
      return toolCalls;
    }

    // Filter tools that match the search query
    return toolCalls.filter(tc => {
      const toolNameMatch = tc.tool_name.toLowerCase().includes(query);
      const argsMatch = JSON.stringify(tc.arguments || {}).toLowerCase().includes(query);
      return toolNameMatch || argsMatch;
    });
  }, [toolCalls, searchQuery]);

  const handleSelectAllFiltered = () => {
    setSelectedSteps(filteredToolCalls.map(tc => tc.id));
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Save as Workflow</h2>
              <p className="text-sm text-white/80">
                {toolCalls.length} tool execution{toolCalls.length !== 1 ? 's' : ''} available
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Workflow Created Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your workflow "{createdWorkflow?.name}" has been saved with {selectedSteps.length} steps.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCreateAgent}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  <span>Create Agent</span>
                </button>
              </div>
            </div>
          ) : (
            // Form
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Step Indicators */}
              <div className="flex items-center justify-center space-x-4">
                {['Select Steps', 'Configure', 'Review'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center space-x-2 ${index <= activeStep ? 'text-purple-600' : 'text-gray-400'
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < activeStep
                        ? 'bg-purple-600 text-white'
                        : index === activeStep
                          ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
                          : 'bg-gray-100 text-gray-400'
                        }`}>
                        {index < activeStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                    {index < 2 && (
                      <div className={`w-12 h-0.5 mx-2 ${index < activeStep ? 'bg-purple-600' : 'bg-gray-200'
                        }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 0: Select Steps */}
              {activeStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Tool Executions to Include
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose which tool executions should be part of your workflow.
                  </p>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tool executions..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Select All / Deselect All Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedSteps([])}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      Deselect All
                    </button>
                    <span className="text-sm text-gray-500 ml-auto">
                      {selectedSteps.length} of {filteredToolCalls.length} selected
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredToolCalls.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No tools match "{searchQuery}"</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                      </div>
                    ) : (
                      filteredToolCalls.map((tc) => (
                        <div
                          key={tc.id}
                          className={`border rounded-lg transition-all ${selectedSteps.includes(tc.id)
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedSteps.includes(tc.id)}
                                onChange={() => handleStepToggle(tc.id)}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">
                                    {tc.tool_name}
                                  </span>
                                  {tc.success ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {Object.keys(tc.arguments || {}).length} argument(s)
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleExpandToggle(tc.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedSteps.includes(tc.id)
                                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                : <ChevronDown className="w-4 h-4 text-gray-500" />
                              }
                            </button>
                          </div>

                          {expandedSteps.includes(tc.id) && (
                            <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(tc.arguments, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Configure */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Configure Workflow
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workflow Name *
                    </label>
                    <input
                      type="text"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="My Awesome Workflow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe what this workflow does..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          onClick={() => setTriggerType(trigger.value as typeof triggerType)}
                          className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${triggerType === trigger.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${triggerType === trigger.value ? 'bg-purple-100' : 'bg-gray-100'
                            }`}>
                            {getTriggerIcon(trigger.value)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{trigger.label}</p>
                            <p className="text-xs text-gray-500">{trigger.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableFields.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900">
                            Make These Values Customizable
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Select which values you want to change each time you run this workflow.
                            For example, if you select "email", you can send to different emails each time.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableFields.map((field) => (
                          <button
                            key={field}
                            onClick={() => handleFieldToggle(field)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm rounded-full transition-all ${parameterizeFields.includes(field)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                          >
                            <span>{parameterizeFields.includes(field) ? '✓' : '○'}</span>
                            <span>{field.replace(/_/g, ' ')}</span>
                          </button>
                        ))}
                      </div>
                      {parameterizeFields.length > 0 && (
                        <p className="text-xs text-blue-700 mt-3">
                          ✓ {parameterizeFields.length} field{parameterizeFields.length !== 1 ? 's' : ''} will be customizable when running this workflow
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Review */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Review Workflow
                  </h3>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{workflowName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Steps</span>
                      <span className="font-medium">{selectedSteps.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trigger</span>
                      <span className="font-medium capitalize">{triggerType}</span>
                    </div>
                    {parameterizeFields.length > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Input Parameters</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                          {parameterizeFields.map(f => (
                            <span key={f} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Steps Preview</h4>
                    <div className="space-y-2">
                      {toolCalls
                        .filter(tc => selectedSteps.includes(tc.id))
                        .map((tc, index) => (
                          <div key={tc.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">{tc.tool_name}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={activeStep === 0 ? onClose : () => setActiveStep(activeStep - 1)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </button>

            {activeStep < 2 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                disabled={activeStep === 0 && selectedSteps.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateWorkflow}
                disabled={loading}
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
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilderModal;
