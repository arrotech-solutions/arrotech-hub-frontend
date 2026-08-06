import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import {
    X, Settings, Trash2, ChevronDown, Save,
    RotateCcw, Clock, AlertCircle, Loader2, Play, ExternalLink, Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MCPTool, ToolInfo } from '../../types';
import { apiService } from '../../services/api';
import { isAgentTool, isMessagingSendTool, CONDITION_TOOL } from './shared/toolCategories';
import toast from '../../lib/notify';

export interface NodeConfigPanelHandle {
    /** Apply dirty local edits into the graph; returns merged node patch for sync save. */
    flush: () => NodeConfigPendingUpdate | null;
    isDirty: () => boolean;
}

export type NodeConfigPendingUpdate = {
    nodeId: string;
    parameters: Record<string, any>;
    description: string;
    retry_config: { max_retries: number; retry_delay: number };
    timeout: number;
    conditionExpression: string;
};

interface NodeConfigPanelProps {
    nodeId: string;
    toolName: string;
    tool: MCPTool | ToolInfo | null;
    parameters: Record<string, any>;
    retryConfig?: { max_retries: number; retry_delay: number };
    timeout?: number;
    description: string;
    conditionExpression?: string;
    onUpdateParams: (nodeId: string, params: Record<string, any>) => void;
    onUpdateDescription: (nodeId: string, description: string) => void;
    onUpdateRetry: (nodeId: string, config: { max_retries: number; retry_delay: number }) => void;
    onUpdateTimeout: (nodeId: string, timeout: number) => void;
    onUpdateCondition?: (nodeId: string, expression: string) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
    onTestComplete?: (nodeId: string, ok: boolean) => void;
    isDark?: boolean;
}

const NodeConfigPanel = forwardRef<NodeConfigPanelHandle, NodeConfigPanelProps>(function NodeConfigPanel({
    nodeId, toolName, tool, parameters, retryConfig, timeout, description,
    conditionExpression,
    onUpdateParams, onUpdateDescription, onUpdateRetry, onUpdateTimeout,
    onUpdateCondition,
    onDelete, onClose, onTestComplete, isDark
}, ref) {
    const [localParams, setLocalParams] = useState<Record<string, any>>(parameters || {});
    const [localDescription, setLocalDescription] = useState(description || '');
    const [localRetry, setLocalRetry] = useState(retryConfig || { max_retries: 3, retry_delay: 30 });
    const [localTimeout, setLocalTimeout] = useState(timeout || 60);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [localCondition, setLocalCondition] = useState(conditionExpression || '');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    
    // Dynamic Options State
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, { label: string, value: any }[]>>({});
    const [loadingDynamic, setLoadingDynamic] = useState<Record<string, boolean>>({});

    const isCondition = toolName === CONDITION_TOOL || toolName === 'condition';
    const showAgentLink = isAgentTool(toolName) || isMessagingSendTool(toolName);

    useEffect(() => {
        setLocalParams(parameters || {});
        setLocalDescription(description || '');
        setLocalRetry(retryConfig || { max_retries: 3, retry_delay: 30 });
        setLocalTimeout(timeout || 60);
        setLocalCondition(conditionExpression || parameters?.expression || '');
        setIsDirty(false);
        setTestResult(null);
        setDynamicOptions({});
        setLoadingDynamic({});
    }, [nodeId, parameters, description, retryConfig, timeout, conditionExpression]);

    const handleParamChange = (name: string, value: any) => {
        setLocalParams(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const buildPending = useCallback((): NodeConfigPendingUpdate => {
        const params = isCondition
            ? { ...localParams, expression: localCondition }
            : localParams;
        return {
            nodeId,
            parameters: params,
            description: localDescription,
            retry_config: localRetry,
            timeout: localTimeout,
            conditionExpression: localCondition,
        };
    }, [isCondition, localParams, localCondition, nodeId, localDescription, localRetry, localTimeout]);

    const handleSave = useCallback(() => {
        const pending = buildPending();
        onUpdateParams(pending.nodeId, pending.parameters);
        onUpdateDescription(pending.nodeId, pending.description);
        onUpdateRetry(pending.nodeId, pending.retry_config);
        onUpdateTimeout(pending.nodeId, pending.timeout);
        onUpdateCondition?.(pending.nodeId, pending.conditionExpression);
        setIsDirty(false);
        return pending;
    }, [buildPending, onUpdateParams, onUpdateDescription, onUpdateRetry, onUpdateTimeout, onUpdateCondition]);

    useImperativeHandle(ref, () => ({
        flush: () => {
            if (!isDirty) return null;
            return handleSave();
        },
        isDirty: () => isDirty,
    }), [isDirty, handleSave]);

    const handleTestNode = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const response = await apiService.executeTool(toolName, { ...localParams }) as any;
            const ok = response?.success !== false && !response?.error;
            setTestResult(ok ? 'Test succeeded' : (response?.error || response?.message || 'Test failed'));
            onTestComplete?.(nodeId, ok);
            if (ok) toast.success('Node test succeeded');
            else toast.error('Node test failed');
        } catch (err: any) {
            setTestResult(err?.message || 'Test failed');
            onTestComplete?.(nodeId, false);
            toast.error(err?.message || 'Node test failed');
        } finally {
            setTesting(false);
        }
    };

    const fetchDynamicOptions = useCallback(async (fieldKey: string, toolOperation: string) => {
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
            }

            if (options) {
                const mapped = options.map((o: any) =>
                    typeof o === 'string'
                        ? { label: o, value: o }
                        : { label: o.label || o.name || String(o.value ?? o.id), value: o.value ?? o.id ?? o.name }
                );
                setDynamicOptions(prev => ({ ...prev, [fieldKey]: mapped }));
            }
        } catch (err) {
            console.warn('Failed to load dynamic options', fieldKey, err);
        } finally {
            setLoadingDynamic(prev => ({ ...prev, [fieldKey]: false }));
        }
    }, [dynamicOptions, loadingDynamic]);

    // Load dynamic option fields via effect (avoid setState during render)
    const dynamicFieldSpecs = useMemo(() => {
        const props = (tool as any)?.inputSchema?.properties || (tool as any)?.input_schema?.properties || {};
        const specs: { name: string; source: string }[] = [];
        Object.entries(props).forEach(([name, schema]: [string, any]) => {
            let dynamicSource =
                schema?.['x-dynamic-options'] ||
                schema?.x_dynamic_options ||
                schema?.xDynamicOptions;
            if (toolName === 'rag_ingest_source' && name === 'url_or_id' && localParams['source_type'] === 'google_drive') {
                dynamicSource = 'google_workspace_drive.list_folders';
            }
            if (dynamicSource) specs.push({ name, source: dynamicSource });
        });
        return specs;
    }, [tool, toolName, localParams]);

    useEffect(() => {
        dynamicFieldSpecs.forEach(({ name, source }) => {
            const fieldKey = `${toolName}.${name}`;
            if (!dynamicOptions[fieldKey] && !loadingDynamic[fieldKey]) {
                fetchDynamicOptions(fieldKey, source);
            }
        });
    }, [dynamicFieldSpecs, toolName, dynamicOptions, loadingDynamic, fetchDynamicOptions]);

    // Get input schema from tool
    const inputSchema = tool ? (tool as any).inputSchema : null;
    const properties = inputSchema?.properties || {};
    const requiredFields: string[] = inputSchema?.required || [];

    const renderField = (name: string, schema: any) => {
        const isLongText = ['system_prompt', 'prompt', 'context', 'message', 'description', 'base_content', 'text'].includes(name.toLowerCase());
        const inputBaseStyles = `w-full px-3.5 py-2.5 text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 outline-none transition-all duration-200`;
        const darkModeStyles = `bg-black/20 border border-white/10 text-white placeholder:text-gray-500 focus:bg-black/40`;
        const lightModeStyles = `bg-white border border-gray-200 focus:bg-white placeholder:text-gray-400 focus:border-primary-400`;

        // Handle dynamic options (fetched in useEffect above)
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
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
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
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${localParams[name] ? 'bg-primary-500' : (isDark ? 'bg-gray-700' : 'bg-gray-200')}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${localParams[name] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-xs font-medium ${localParams[name] ? (isDark ? 'text-primary-300' : 'text-primary-600') : (isDark ? 'text-gray-500' : 'text-gray-500')}`}>
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
        <div
          className={`nowheel nopan grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:w-[340px] ${
            isDark ? 'bg-secondary-950' : 'bg-white'
          }`}
        >
            {/* Header */}
            <div className={`shrink-0 px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-primary-500" />
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Configure Node</h3>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close configure panel" className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                        <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                </div>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
            </div>

            {/* Scrollable body — nowheel lets wheel events scroll this panel instead of the canvas */}
            <div
              className="canvas-inspector-scroll min-h-0 overflow-y-scroll overscroll-contain px-5 py-4 space-y-5"
              role="region"
              aria-label="Node configuration"
            >
                {showAgentLink && (
                    <Link
                        to="/agents?tab=deploy"
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${isDark ? 'border-primary-500/30 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20' : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
                    >
                        <Bot className="h-3.5 w-3.5" />
                        Open Agents Deploy
                        <ExternalLink className="ml-auto h-3 w-3" />
                    </Link>
                )}

                {/* Description */}
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Step Description
                    </label>
                    <textarea
                        value={localDescription}
                        onChange={e => { setLocalDescription(e.target.value); setIsDirty(true); }}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 outline-none transition-all duration-200 resize-y min-h-[80px] leading-relaxed ${isDark ? 'bg-black/20 border border-white/10 text-white placeholder:text-gray-500 focus:bg-black/40' : 'bg-white border border-gray-200 focus:bg-white placeholder:text-gray-400 focus:border-primary-400'}`}
                        placeholder="What does this step do?"
                    />
                </div>

                {isCondition && (
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Condition expression
                        </label>
                        <input
                            type="text"
                            value={localCondition}
                            onChange={(e) => { setLocalCondition(e.target.value); setIsDirty(true); }}
                            placeholder="e.g. {{amount}} > 1000"
                            className={`w-full px-3.5 py-2.5 text-sm rounded-xl font-mono outline-none focus:ring-2 focus:ring-primary-500/30 ${isDark ? 'bg-black/20 border border-white/10 text-white' : 'bg-white border border-gray-200'}`}
                        />
                        <p className={`mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Connect True / False handles to branch steps.
                        </p>
                    </div>
                )}

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
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide ${isDark ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-primary-50 text-primary-600 border border-primary-200'}`}>
                                                    Context Memory
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
                                            className={`mb-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${isDark ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20' : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'}`}
                                        >
                                            Auto-fill with {'{{session_key}}'}
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
            <div className={`shrink-0 border-t px-5 py-4 space-y-2.5 ${isDark ? 'border-white/5 bg-secondary-900/80' : 'border-slate-100 bg-slate-50/80'}`}>
                {!isCondition && (
                    <button
                        type="button"
                        onClick={handleTestNode}
                        disabled={testing}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-secondary-800 text-secondary-100 hover:bg-secondary-700' : 'bg-secondary-900 text-white hover:bg-secondary-800'}`}
                    >
                        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Test this node</span>
                    </button>
                )}
                {testResult && (
                    <p className={`text-[11px] font-medium ${testResult.includes('succeed') ? 'text-emerald-600' : 'text-red-500'}`}>{testResult}</p>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDirty
                        ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
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
});

export default NodeConfigPanel;
