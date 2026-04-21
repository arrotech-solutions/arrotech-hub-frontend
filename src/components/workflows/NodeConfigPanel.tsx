import React, { useState, useEffect } from 'react';
import {
    X, Settings, Trash2, ChevronDown, Save,
    RotateCcw, Clock, AlertCircle, Loader2, Search
} from 'lucide-react';
import { MCPTool, ToolInfo } from '../../types';
import { apiService } from '../../services/api';

interface NodeConfigPanelProps {
    nodeId: string;
    toolName: string;
    tool: MCPTool | ToolInfo | null;
    parameters: Record<string, any>;
    retryConfig?: { max_retries: number; retry_delay: number };
    timeout?: number;
    description: string;
    onUpdateParams: (nodeId: string, params: Record<string, any>) => void;
    onUpdateDescription: (nodeId: string, description: string) => void;
    onUpdateRetry: (nodeId: string, config: { max_retries: number; retry_delay: number }) => void;
    onUpdateTimeout: (nodeId: string, timeout: number) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
    isDark?: boolean;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    nodeId, toolName, tool, parameters, retryConfig, timeout, description,
    onUpdateParams, onUpdateDescription, onUpdateRetry, onUpdateTimeout,
    onDelete, onClose, isDark
}) => {
    const [localParams, setLocalParams] = useState<Record<string, any>>(parameters || {});
    const [localDescription, setLocalDescription] = useState(description || '');
    const [localRetry, setLocalRetry] = useState(retryConfig || { max_retries: 3, retry_delay: 30 });
    const [localTimeout, setLocalTimeout] = useState(timeout || 60);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    // Dynamic Options State
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, { label: string, value: any }[]>>({});
    const [loadingDynamic, setLoadingDynamic] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setLocalParams(parameters || {});
        setLocalDescription(description || '');
        setLocalRetry(retryConfig || { max_retries: 3, retry_delay: 30 });
        setLocalTimeout(timeout || 60);
        setIsDirty(false);
    }, [nodeId, parameters, description, retryConfig, timeout]);

    const handleParamChange = (name: string, value: any) => {
        setLocalParams(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdateParams(nodeId, localParams);
        onUpdateDescription(nodeId, localDescription);
        onUpdateRetry(nodeId, localRetry);
        onUpdateTimeout(nodeId, localTimeout);
        setIsDirty(false);
    };

    const fetchDynamicOptions = async (fieldKey: string, toolOperation: string) => {
        if (dynamicOptions[fieldKey] || loadingDynamic[fieldKey]) return;

        try {
            setLoadingDynamic(prev => ({ ...prev, [fieldKey]: true }));
            const [toolNameFetch, operation] = toolOperation.split('.');
            
            const response = await apiService.executeTool(toolNameFetch, { operation }) as any;
            
            // Robust parsing same as in EnhancedWorkflowCreator
            let options = null;
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
            }
        } catch (err) {
            console.error(`Error fetching dynamic options for ${fieldKey}:`, err);
        } finally {
            setLoadingDynamic(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    // Get input schema from tool
    const inputSchema = tool ? (tool as any).inputSchema : null;
    const properties = inputSchema?.properties || {};
    const requiredFields: string[] = inputSchema?.required || [];

    const renderField = (name: string, schema: any) => {
        const isLongText = ['system_prompt', 'prompt', 'context', 'message', 'description', 'base_content', 'text'].includes(name.toLowerCase());
        const inputBaseStyles = `w-full px-3.5 py-2.5 text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none transition-all duration-200`;
        const darkModeStyles = `bg-black/20 border border-white/10 text-white placeholder:text-gray-500 focus:bg-black/40`;
        const lightModeStyles = `bg-white border border-gray-200 focus:bg-white placeholder:text-gray-400 focus:border-purple-400`;

        // Handle dynamic options
        let dynamicSource = 
            schema['x-dynamic-options'] || 
            schema.x_dynamic_options || 
            schema.xDynamicOptions;

        // Custom handling for Google Drive folder selection
        if (toolName === 'rag_ingest_source' && name === 'url_or_id') {
            if (localParams['source_type'] === 'google_drive') {
                dynamicSource = 'google_workspace_drive.list_folders';
            }
        }

        if (dynamicSource) {
            const fieldKey = `${toolName}.${name}`;
            
            // Trigger fetch
            if (!dynamicOptions[fieldKey] && !loadingDynamic[fieldKey]) {
                fetchDynamicOptions(fieldKey, dynamicSource);
            }

            const currentOptions = dynamicOptions[fieldKey] || [];
            const isLoading = loadingDynamic[fieldKey];

            return (
                <div className="relative">
                    <select
                        className={`${inputBaseStyles} appearance-none ${isDark ? darkModeStyles : lightModeStyles}`}
                        value={localParams[name] || ''}
                        onChange={e => handleParamChange(name, e.target.value)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <option>Loading options...</option>
                        ) : (
                            <>
                                <option value="">Select {name.replace(/_/g, ' ')}...</option>
                                {currentOptions.map((opt: any) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                    {isLoading ? (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
                    ) : (
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    )}
                </div>
            );
        }

        if (schema.enum && Array.isArray(schema.enum)) {
            return (
                <div className="relative">
                    <select
                        className={`${inputBaseStyles} appearance-none ${isDark ? darkModeStyles : lightModeStyles}`}
                        value={localParams[name] || ''}
                        onChange={e => handleParamChange(name, e.target.value)}
                    >
                        <option value="">Select {name}...</option>
                        {schema.enum.map((opt: string) => (
                            <option key={opt} value={opt}>
                                {opt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            );
        }

        switch (schema.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-3 pt-1 pb-2">
                        <button
                            onClick={() => handleParamChange(name, !localParams[name])}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${localParams[name] ? 'bg-purple-600' : (isDark ? 'bg-gray-700' : 'bg-gray-200')}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${localParams[name] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-xs font-medium ${localParams[name] ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-gray-500' : 'text-gray-500')}`}>
                            {localParams[name] ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                );
            case 'integer':
            case 'number':
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name.replace(/_/g, ' ')} or {{variable}}`}
                        className={`${inputBaseStyles} ${isDark ? darkModeStyles : lightModeStyles}`}
                        value={localParams[name] ?? ''}
                        onChange={e => {
                            const val = e.target.value;
                            if (val.includes('{{') || val === '') {
                                handleParamChange(name, val);
                            } else {
                                const num = schema.type === 'integer' ? parseInt(val) : parseFloat(val);
                                handleParamChange(name, isNaN(num) ? val : num);
                            }
                        }}
                    />
                );
            default:
                if (isLongText) {
                    return (
                        <textarea
                            placeholder={`Enter ${name.replace(/_/g, ' ')}...`}
                            rows={4}
                            className={`${inputBaseStyles} resize-y min-h-[100px] leading-relaxed ${isDark ? darkModeStyles : lightModeStyles}`}
                            value={localParams[name] || ''}
                            onChange={e => handleParamChange(name, e.target.value)}
                        />
                    );
                }
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name.replace(/_/g, ' ')}`}
                        className={`${inputBaseStyles} ${isDark ? darkModeStyles : lightModeStyles}`}
                        value={localParams[name] || ''}
                        onChange={e => handleParamChange(name, e.target.value)}
                    />
                );
        }
    };

    return (
        <div className={`w-[340px] flex flex-col h-full ${isDark ? 'bg-gray-900/60 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-2xl'}`}>
            {/* Header */}
            <div className={`px-5 py-5 border-b ${isDark ? 'border-white/5 bg-gray-900/40' : 'border-black/5 bg-white/40'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Configure Node</h3>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                        <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                </div>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: 'thin' }}>
                {/* Description */}
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Step Description
                    </label>
                    <textarea
                        value={localDescription}
                        onChange={e => { setLocalDescription(e.target.value); setIsDirty(true); }}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none transition-all duration-200 resize-y min-h-[80px] leading-relaxed ${isDark ? 'bg-black/20 border border-white/10 text-white placeholder:text-gray-500 focus:bg-black/40' : 'bg-white border border-gray-200 focus:bg-white placeholder:text-gray-400 focus:border-purple-400'}`}
                        placeholder="What does this step do?"
                    />
                </div>

                {/* Parameters */}
                {Object.keys(properties).length > 0 && (
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Parameters
                        </label>
                        <div className="space-y-3">
                            {Object.entries(properties).map(([name, schema]: [string, any]) => {
                                const isSessionKey = name === 'session_key';
                                return (
                                <div key={name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            {requiredFields.includes(name) && <span className="text-red-500 ml-0.5">*</span>}
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            {isSessionKey && (
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide ${isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                                                    💬 Context Memory
                                                </span>
                                            )}
                                            <span className={`text-[9px] uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{schema.type}</span>
                                        </div>
                                    </div>
                                    {schema.description && (
                                        <p className="text-[10px] text-gray-400 mb-1.5">{schema.description}</p>
                                    )}
                                    {isSessionKey && !localParams[name] && (
                                        <button
                                            onClick={() => handleParamChange(name, '{{session_key}}')}
                                            className={`mb-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${isDark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}
                                        >
                                            ⚡ Auto-fill with {'{{session_key}}'}
                                        </button>
                                    )}
                                    {renderField(name, schema)}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {Object.keys(properties).length === 0 && (
                    <div className="text-center py-6 px-3">
                        <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No configurable parameters</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>This tool runs with default settings</p>
                    </div>
                )}

                {/* Advanced Settings */}
                <div>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center space-x-2 text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 -rotate-90" />}
                        <span>Advanced Settings</span>
                    </button>

                    {showAdvanced && (
                        <div className={`mt-3 space-y-3 p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-transparent'}`}>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <RotateCcw className="w-3 h-3 inline mr-1" />
                                        Max Retries
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={localRetry.max_retries}
                                        onChange={e => { setLocalRetry({ ...localRetry, max_retries: parseInt(e.target.value) || 0 }); setIsDirty(true); }}
                                        className={`w-full px-2 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none ${isDark ? 'bg-black/20 border border-white/10 text-white focus:bg-black/40' : 'bg-white border border-black/5'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Retry Delay (s)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={localRetry.retry_delay}
                                        onChange={e => { setLocalRetry({ ...localRetry, retry_delay: parseInt(e.target.value) || 0 }); setIsDirty(true); }}
                                        className={`w-full px-2 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none ${isDark ? 'bg-black/20 border border-white/10 text-white focus:bg-black/40' : 'bg-white border border-black/5'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    Timeout (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={localTimeout}
                                    onChange={e => { setLocalTimeout(parseInt(e.target.value) || 60); setIsDirty(true); }}
                                    className={`w-full px-2 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none ${isDark ? 'bg-black/20 border border-white/10 text-white focus:bg-black/40' : 'bg-white border border-black/5'}`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className={`px-5 py-5 border-t space-y-2.5 ${isDark ? 'border-white/5 bg-gray-900/40' : 'border-black/5 bg-white/40'}`}>
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDirty
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50'
                        : (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        }`}
                >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                </button>
                <button
                    onClick={() => onDelete(nodeId)}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'text-red-400 bg-red-900/10 hover:bg-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Step</span>
                </button>
            </div>
        </div>
    );
};

export default NodeConfigPanel;
