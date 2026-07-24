import React, { useEffect, useState } from 'react';
import { X, Bot, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import toast from '../../lib/notify';

export interface AutoReplyRule {
    id: string;
    name: string;
    description: string | null;
    trigger_type: string;
    trigger_value: string | null;
    response_type: string;
    response_content: string | null;
    is_active: boolean;
    priority: number;
    times_triggered: number;
    last_triggered_at: string | null;
    created_at: string;
}

export interface AutoReplyRuleDraft {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_value?: string;
    response_type: string;
    response_content?: string;
    is_active?: boolean;
    priority?: number;
}

interface AutoReplyRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    whatsappConnected: boolean;
    editingRule?: AutoReplyRule | null;
    prefilled?: Partial<AutoReplyRuleDraft> | null;
}

const TRIGGER_OPTIONS = [
    { value: 'first_message', label: 'First Message' },
    { value: 'keyword', label: 'Keyword Match' },
    { value: 'business_hours', label: 'Outside Business Hours' },
    { value: 'all', label: 'AI Mode (All Messages)' },
];

const RESPONSE_OPTIONS = [
    { value: 'text', label: 'Static Text' },
    { value: 'ai', label: 'AI Generated' },
];

const AutoReplyRuleModal: React.FC<AutoReplyRuleModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    whatsappConnected,
    editingRule,
    prefilled,
}) => {
    const isEditing = Boolean(editingRule);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('first_message');
    const [triggerValue, setTriggerValue] = useState('');
    const [responseType, setResponseType] = useState('text');
    const [responseContent, setResponseContent] = useState('');
    const [priority, setPriority] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (editingRule) {
            setName(editingRule.name);
            setDescription(editingRule.description || '');
            setTriggerType(editingRule.trigger_type);
            setTriggerValue(editingRule.trigger_value || '');
            setResponseType(editingRule.response_type);
            setResponseContent(editingRule.response_content || '');
            setPriority(editingRule.priority);
            setIsActive(editingRule.is_active);
            return;
        }

        if (prefilled) {
            setName(prefilled.name || '');
            setDescription(prefilled.description || '');
            setTriggerType(prefilled.trigger_type || 'first_message');
            setTriggerValue(prefilled.trigger_value || '');
            setResponseType(prefilled.response_type || 'text');
            setResponseContent(prefilled.response_content || '');
            setPriority(prefilled.priority ?? 0);
            setIsActive(prefilled.is_active ?? true);
            return;
        }

        setName('');
        setDescription('');
        setTriggerType('first_message');
        setTriggerValue('');
        setResponseType('text');
        setResponseContent('');
        setPriority(0);
        setIsActive(true);
    }, [isOpen, editingRule, prefilled]);

    const handleSubmit = async () => {
        if (!whatsappConnected) {
            toast.error('Connect WhatsApp in Settings before creating rules');
            return;
        }
        if (!name.trim()) {
            toast.error('Rule name is required');
            return;
        }
        if (triggerType === 'keyword' && !triggerValue.trim()) {
            toast.error('Add at least one keyword (use | to separate)');
            return;
        }
        if (responseType === 'text' && !responseContent.trim()) {
            toast.error('Response message is required');
            return;
        }

        const payload = {
            name: name.trim(),
            description: description.trim() || undefined,
            trigger_type: triggerType,
            trigger_value: triggerType === 'keyword' ? triggerValue.trim() : undefined,
            response_type: responseType,
            response_content: responseContent.trim() || undefined,
            is_active: isActive,
            priority,
        };

        setIsSaving(true);
        try {
            const resp = isEditing && editingRule
                ? await apiService.updateWhatsAppAutoReply(editingRule.id, payload)
                : await apiService.createWhatsAppAutoReply(payload);

            if (resp.success) {
                toast.success(isEditing ? 'Rule updated' : 'Rule created');
                onSuccess();
                onClose();
            } else {
                toast.error(resp.message || 'Failed to save rule');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Failed to save rule');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border dark:border-slate-800 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!whatsappConnected && (
                    <div className="mb-5 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-300">
                        Connect your WhatsApp Business account in Settings to create rules.
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rule Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Welcome Message"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Description <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short note for your team"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trigger Type</label>
                            <select
                                value={triggerType}
                                onChange={(e) => setTriggerType(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                            >
                                {TRIGGER_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Response Type</label>
                            <select
                                value={responseType}
                                onChange={(e) => setResponseType(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                            >
                                {RESPONSE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {triggerType === 'keyword' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Keywords</label>
                            <input
                                type="text"
                                value={triggerValue}
                                onChange={(e) => setTriggerValue(e.target.value)}
                                placeholder="hi|hello|hey"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                            />
                            <p className="text-xs text-slate-500 mt-1">Separate keywords with | — matching is case-insensitive.</p>
                        </div>
                    )}

                    {triggerType === 'business_hours' && (
                        <p className="text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                            Configure your operating hours in Settings. This rule fires when a message arrives outside those hours.
                        </p>
                    )}

                    {triggerType === 'all' && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                            AI mode responds to every incoming message. Use a lower priority than keyword or welcome rules so specific triggers run first.
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {responseType === 'ai' ? 'AI Instructions / Fallback' : 'Response'}
                        </label>
                        <textarea
                            rows={4}
                            value={responseContent}
                            onChange={(e) => setResponseContent(e.target.value)}
                            placeholder={responseType === 'ai'
                                ? 'Optional context for the AI (e.g., always mention free delivery)...'
                                : 'Your auto-reply message...'}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                        />
                        {responseType === 'text' && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-2 transition-colors">
                                {['{{name}}', '{{greeting}}', '{{business_name}}', '{{phone}}'].map((v) => (
                                    <code
                                        key={v}
                                        className="text-[10px] font-bold px-1.5 py-0.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-green-600 dark:text-green-400 transition-colors"
                                    >
                                        {v}
                                    </code>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                            />
                            <p className="text-xs text-slate-500 mt-1">Higher runs first</p>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-slate-300 dark:border-slate-700 text-green-600 focus:ring-green-500 dark:bg-slate-800"
                                />
                                <span className="font-medium">Active</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving || !whatsappConnected}
                            className="flex-[2] py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Rule'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoReplyRuleModal;
