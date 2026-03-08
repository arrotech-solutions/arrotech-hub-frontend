import React, { useState, useEffect } from 'react';
import {
    X, Settings, Trash2, ChevronDown, Save,
    RotateCcw, Clock, AlertCircle
} from 'lucide-react';
import { MCPTool, ToolInfo } from '../../types';

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

    // Get input schema from tool
    const inputSchema = tool ? (tool as any).inputSchema : null;
    const properties = inputSchema?.properties || {};
    const requiredFields: string[] = inputSchema?.required || [];

    const renderField = (name: string, schema: any) => {

        if (schema.enum && Array.isArray(schema.enum)) {
            return (
                <div className="relative">
                    <select
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
            );
        }

        switch (schema.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => handleParamChange(name, !localParams[name])}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localParams[name] ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localParams[name] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-xs text-gray-500">{localParams[name] ? 'True' : 'False'}</span>
                    </div>
                );
            case 'integer':
            case 'number':
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name} or {{variable}}`}
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'border-gray-200'}`}
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
                return (
                    <input
                        type="text"
                        placeholder={`Enter ${name}`}
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'border-gray-200'}`}
                        value={localParams[name] || ''}
                        onChange={e => handleParamChange(name, e.target.value)}
                    />
                );
        }
    };

    return (
        <div className={`w-80 border-l flex flex-col h-full shadow-xl animate-slide-in-right ${isDark ? 'bg-gray-800 border-gray-700 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/20'}`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Configure Node</h3>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                        <X className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
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
                    <input
                        type="text"
                        value={localDescription}
                        onChange={e => { setLocalDescription(e.target.value); setIsDirty(true); }}
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'border-gray-200'}`}
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
                            {Object.entries(properties).map(([name, schema]: [string, any]) => (
                                <div key={name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            {requiredFields.includes(name) && <span className="text-red-500 ml-0.5">*</span>}
                                        </label>
                                        <span className={`text-[9px] uppercase font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{schema.type}</span>
                                    </div>
                                    {schema.description && (
                                        <p className="text-[10px] text-gray-400 mb-1.5">{schema.description}</p>
                                    )}
                                    {renderField(name, schema)}
                                </div>
                            ))}
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
                        <div className={`mt-3 space-y-3 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
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
                                        className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
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
                                        className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
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
                                    className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className={`px-5 py-4 border-t space-y-2 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
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
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'text-red-400 hover:bg-red-900/30 border border-red-800' : 'text-red-600 hover:bg-red-50 border border-red-200'}`}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Step</span>
                </button>
            </div>
        </div>
    );
};

export default NodeConfigPanel;
