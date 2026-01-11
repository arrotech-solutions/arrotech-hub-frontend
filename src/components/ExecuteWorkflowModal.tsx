import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Code,
  FormInput,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Workflow } from '../types';

interface ExecuteWorkflowModalProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (inputData: Record<string, any>) => Promise<void>;
}

type InputMode = 'simple' | 'advanced';

const ExecuteWorkflowModal: React.FC<ExecuteWorkflowModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onExecute,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('simple');
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [jsonInput, setJsonInput] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [availableTools, setAvailableTools] = useState<any[]>([]);

  // Extract input fields from workflow step parameters
  const inputFields = useMemo(() => {
    const fields: Array<{
      name: string;
      type: string;
      required: boolean;
      default: any;
      description?: string;
      stepNumber?: number;
      toolName?: string;
      options?: string[] | null;
    }> = [];

    const findToolSchema = (toolName: string) => {
      return availableTools.find(t => t.name === toolName || t.id === toolName);
    };

    // Get fields from workflow variables (for parameterized workflows)
    if (workflow.variables) {
      Object.entries(workflow.variables).forEach(([key, config]: [string, any]) => {
        fields.push({
          name: key,
          type: config?.type || 'string',
          required: config?.required || false,
          default: config?.default || '',
          description: config?.description,
          options: config?.enum || null,
        });
      });
    }

    // Extract from step parameters directly
    if (workflow.steps) {
      workflow.steps.forEach((step, index) => {
        if (step.tool_parameters && Object.keys(step.tool_parameters).length > 0) {
          Object.entries(step.tool_parameters).forEach(([paramName, paramValue]) => {
            // Skip if it's using a variable reference {{input.xxx}}
            if (typeof paramValue === 'string' && paramValue.includes('{{input.')) {
              return;
            }

            // Create a unique field name that includes step info
            const fieldName = `step_${step.step_number || index + 1}_${paramName}`;
            const displayName = paramName.replace(/_/g, ' ');

            // Determine type from value
            let fieldType = 'string';
            if (typeof paramValue === 'boolean') fieldType = 'boolean';
            else if (typeof paramValue === 'number') fieldType = 'number';

            // Find schema info if available
            const toolSchema = findToolSchema(step.tool_name);
            const paramSchema = toolSchema?.inputSchema?.properties?.[paramName];

            fields.push({
              name: fieldName,
              type: fieldType,
              required: false,
              default: paramValue,
              description: `${step.tool_name} - ${displayName}`,
              stepNumber: step.step_number || index + 1,
              toolName: step.tool_name,
              options: paramSchema?.enum || null,
            });
          });
        }
      });
    }

    // If still no fields, check for {{input.xxx}} patterns
    if (fields.length === 0 && workflow.steps) {
      const inputParams = new Set<string>();
      workflow.steps.forEach(step => {
        if (step.tool_parameters) {
          Object.values(step.tool_parameters).forEach(value => {
            if (typeof value === 'string' && value.includes('{{input.')) {
              const match = value.match(/\{\{input\.(\w+)\}\}/g);
              if (match) {
                match.forEach(m => {
                  const paramName = m.replace('{{input.', '').replace('}}', '');
                  inputParams.add(paramName);
                });
              }
            }
          });
        }
      });
      inputParams.forEach(param => {
        fields.push({
          name: param,
          type: 'string',
          required: true,
          default: '',
        });
      });
    }

    return fields;
  }, [workflow, availableTools]);

  // Initialize input data with defaults
  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputFields.length > 0) {
      // Initialize with defaults if not already set or if workflow changed
      const defaults: Record<string, any> = { ...inputData };
      let updated = false;

      inputFields.forEach(field => {
        if (defaults[field.name] === undefined) {
          defaults[field.name] = field.default || '';
          updated = true;
        }
      });

      if (updated || Object.keys(inputData).length === 0) {
        setInputData(defaults);
        setJsonInput(JSON.stringify(defaults, null, 2));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inputFields]);

  const loadTools = async () => {
    try {
      const { default: apiService } = await import('../services/api');
      const response = await apiService.getMCPTools();
      if (response.success) {
        setAvailableTools(response.data || []);
      }
    } catch (err) {
      console.error('Error loading tools:', err);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    const updated = { ...inputData, [name]: value };
    setInputData(updated);
    setJsonInput(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      setInputData(parsed);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  const handleExecute = async () => {
    if (inputMode === 'advanced' && jsonError) {
      return;
    }
    setLoading(true);
    try {
      await onExecute(inputData);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Execute Workflow</h2>
              <p className="text-sm text-white/80">{workflow.name}</p>
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
          {/* Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>
                {inputFields.length > 0
                  ? `${inputFields.length} input parameter${inputFields.length !== 1 ? 's' : ''} required`
                  : 'No input parameters required'}
              </span>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInputMode('simple')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'simple'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <FormInput className="w-4 h-4" />
                <span>Simple</span>
              </button>
              <button
                onClick={() => setInputMode('advanced')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'advanced'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Code className="w-4 h-4" />
                <span>Advanced</span>
              </button>
            </div>
          </div>

          {/* Simple Mode - Form Fields */}
          {inputMode === 'simple' && (
            <div className="space-y-4">
              {inputFields.length > 0 ? (
                inputFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!inputData[field.name]}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm text-gray-600">
                          {inputData[field.name] ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (field.options && Array.isArray(field.options)) ? (
                      <div className="relative">
                        <select
                          value={inputData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white font-medium"
                        >
                          <option value="">Select {field.name.replace(/_/g, ' ')}...</option>
                          {field.options.map((option: string) => (
                            <option key={option} value={option}>
                              {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="text"
                        value={inputData[field.name] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes('{{') || val === '') {
                            handleFieldChange(field.name, val);
                          } else {
                            const num = parseFloat(val);
                            handleFieldChange(field.name, isNaN(num) ? val : num);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${field.name.replace(/_/g, ' ')} or {{variable}}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={inputData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                      />
                    )}
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">No input required</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This workflow will run with its default configuration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Advanced Mode - JSON Editor */}
          {inputMode === 'advanced' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Input Data (JSON)
                </label>
                {jsonError && (
                  <span className="text-xs text-red-600">{jsonError}</span>
                )}
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent font-mono text-sm ${jsonError
                  ? 'border-red-300 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                  }`}
                rows={8}
                placeholder="{}"
                spellCheck={false}
              />
              <p className="text-xs text-gray-500">
                💡 Tip: Use <code className="bg-gray-100 px-1 rounded">{'{{input.field_name}}'}</code> in workflow steps to reference these values.
              </p>
            </div>
          )}

          {/* Workflow Steps Preview */}
          <div className="mt-6 border-t pt-4">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  Workflow Steps ({workflow.steps?.length || 0})
                </span>
              </div>
              {showSteps ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showSteps && workflow.steps && (
              <div className="mt-3 space-y-2">
                {workflow.steps.map((step, index) => (
                  <div
                    key={step.id || index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                      {step.step_number || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {step.tool_name}
                      </p>
                      {step.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading || (inputMode === 'advanced' && !!jsonError)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecuteWorkflowModal;

