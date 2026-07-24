import React, { useEffect, useState } from 'react';
import { X, Sparkles, Send, Megaphone, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import toast from '../../lib/notify';

interface CreateBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    whatsappConnected: boolean;
    contacts?: { id: string | number; name: string | null; profile_name: string | null; phone_number: string }[];
}

interface WaTemplate {
    id: string;
    name: string;
    language: string;
    status?: string;
    category?: string;
}

const CreateBroadcastModal: React.FC<CreateBroadcastModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    whatsappConnected,
    contacts = [],
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [messageType, setMessageType] = useState<'template' | 'text'>('template');
    const [targetType, setTargetType] = useState('all');
    const [targetTag, setTargetTag] = useState('');
    const [textContent, setTextContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
    const [campaignGoal, setCampaignGoal] = useState('');
    const [tone, setTone] = useState('professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [variations, setVariations] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [templateVariablesJson, setTemplateVariablesJson] = useState('{}');

    const resetForm = () => {
        setName('');
        setDescription('');
        setMessageType('template');
        setTargetType('all');
        setTargetTag('');
        setTextContent('');
        setScheduledAt('');
        setSelectedTemplateId('');
        setVariations([]);
        setCampaignGoal('');
        setSelectedContactIds([]);
        setTemplateVariablesJson('{}');
    };

    useEffect(() => {
        if (!isOpen) return;
        const loadTemplates = async () => {
            try {
                const resp = await apiService.getWhatsAppTemplates();
                if (resp.success && Array.isArray(resp.data)) {
                    setTemplates(resp.data);
                }
            } catch {
                /* non-fatal */
            }
        };
        loadTemplates();
    }, [isOpen]);

    const handleSyncTemplates = async () => {
        setIsSyncingTemplates(true);
        try {
            const resp = await apiService.syncWhatsAppTemplates();
            if (resp.success) {
                toast.success(resp.message || 'Templates synced');
                const list = await apiService.getWhatsAppTemplates();
                if (list.success && Array.isArray(list.data)) setTemplates(list.data);
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : 'Failed to sync templates');
        } finally {
            setIsSyncingTemplates(false);
        }
    };

    const handleGenerateCopy = async () => {
        if (!campaignGoal) {
            toast.error('Please enter a campaign goal first');
            return;
        }
        setIsGenerating(true);
        try {
            const resp = await apiService.generateBroadcastCopy({ campaign_goal: campaignGoal, tone });
            if (resp.success) {
                setVariations(resp.variations || []);
                toast.success('AI generated copy successfully!');
            }
        } catch {
            toast.error('Failed to generate copy');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!whatsappConnected) {
            toast.error('Connect WhatsApp before creating a broadcast');
            return;
        }
        if (!name) {
            toast.error('Campaign name is required');
            return;
        }
        if (messageType === 'template' && !selectedTemplateId) {
            toast.error('Select an approved template');
            return;
        }
        if (messageType === 'text' && !textContent.trim()) {
            toast.error('Message content is required');
            return;
        }

        setIsSaving(true);
        try {
            let template_variables: Record<string, unknown> | undefined;
            if (messageType === 'template' && templateVariablesJson.trim() !== '{}') {
                try {
                    template_variables = JSON.parse(templateVariablesJson);
                } catch {
                    toast.error('Template variables must be valid JSON');
                    setIsSaving(false);
                    return;
                }
            }
            const payload: Record<string, unknown> = {
                name,
                description: description || undefined,
                message_type: messageType,
                target_type: targetType,
                target_tag: targetType === 'tag' ? targetTag : undefined,
                target_contact_ids: targetType === 'selected' ? selectedContactIds : undefined,
                template_variables,
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
            };
            if (messageType === 'template') {
                payload.template_id = selectedTemplateId;
            } else {
                payload.text_content = textContent;
            }

            const resp = await apiService.createWhatsAppBroadcast(payload as any);
            if (resp.success) {
                toast.success(scheduledAt ? 'Campaign scheduled' : 'Broadcast created');
                resetForm();
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail?.error === 'upgrade_required') {
                toast.error(detail.message || 'Upgrade required for broadcasts');
            } else {
                toast.error(typeof detail === 'string' ? detail : 'Failed to create broadcast');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const approvedTemplates = templates.filter(
        (t) => (t.status || '').toUpperCase() === 'APPROVED' || (t.status || '').toUpperCase() === 'ACTIVE'
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-xl">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Broadcast Campaign</h2>
                            <p className="text-sm text-slate-500">Use approved templates for marketing broadcasts</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!whatsappConnected && (
                    <div className="mx-6 mt-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex gap-2 text-sm text-orange-800 dark:text-orange-300">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        Connect WhatsApp in Settings before sending broadcasts.
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Campaign Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                                placeholder="e.g. Summer Sale 2026"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Message Type</label>
                            <select
                                value={messageType}
                                onChange={(e) => setMessageType(e.target.value as 'template' | 'text')}
                                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                            >
                                <option value="template">Approved Template (recommended)</option>
                                <option value="text">Text (24h session window only)</option>
                            </select>
                            {messageType === 'text' && (
                                <p className="text-xs text-amber-600 mt-2">
                                    Text broadcasts only work for contacts who messaged you in the last 24 hours.
                                </p>
                            )}
                        </div>

                        {messageType === 'template' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold">Template</label>
                                    <button
                                        type="button"
                                        onClick={handleSyncTemplates}
                                        disabled={isSyncingTemplates}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                        {isSyncingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sync from Meta
                                    </button>
                                </div>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Select template...</option>
                                    {approvedTemplates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.language}) — {t.category || 'GENERAL'}
                                        </option>
                                    ))}
                                </select>
                                {approvedTemplates.length === 0 && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        No approved templates cached. Sync from Meta or create templates in WhatsApp Manager.
                                    </p>
                                )}
                                <label className="block text-xs font-semibold mt-3 mb-1 text-slate-500">Template variables (JSON)</label>
                                <textarea
                                    value={templateVariablesJson}
                                    onChange={(e) => setTemplateVariablesJson(e.target.value)}
                                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                                    rows={3}
                                    placeholder='{"1": "John", "2": "20% off"}'
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold mb-2">Target Audience</label>
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                            >
                                <option value="all">All Contacts</option>
                                <option value="tag">Specific Tag</option>
                                <option value="selected">Selected Contacts</option>
                            </select>
                            {targetType === 'tag' && (
                                <input
                                    type="text"
                                    value={targetTag}
                                    onChange={(e) => setTargetTag(e.target.value)}
                                    className="w-full mt-3 px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                                    placeholder="e.g. vip, leads"
                                />
                            )}
                            {targetType === 'selected' && (
                                <div className="mt-3 max-h-48 overflow-y-auto border dark:border-slate-700 rounded-xl p-3 space-y-1">
                                    {contacts.length === 0 ? (
                                        <p className="text-xs text-slate-500">No contacts available</p>
                                    ) : (
                                        contacts.map((c) => {
                                            const id = String(c.id);
                                            const label = c.name || c.profile_name || c.phone_number;
                                            return (
                                                <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContactIds.includes(id)}
                                                        onChange={(e) => {
                                                            setSelectedContactIds((prev) =>
                                                                e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                                                            );
                                                        }}
                                                    />
                                                    {label}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Schedule (optional)</label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                        {messageType === 'text' && (
                            <>
                                <label className="block text-sm font-semibold">Message Content</label>
                                <textarea
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    className="w-full min-h-[150px] p-4 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                                    placeholder="Type your message..."
                                />
                            </>
                        )}

                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 p-5">
                            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> AI Copywriter (text mode)
                            </h3>
                            <input
                                type="text"
                                value={campaignGoal}
                                onChange={(e) => setCampaignGoal(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border text-sm mb-2 dark:border-slate-700 dark:bg-slate-800"
                                placeholder="Campaign goal..."
                            />
                            <button
                                onClick={handleGenerateCopy}
                                disabled={isGenerating}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate Copy
                            </button>
                            {variations.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {variations.map((v, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setTextContent(v);
                                                setMessageType('text');
                                            }}
                                            className="p-2 bg-white dark:bg-slate-800 rounded-lg text-sm cursor-pointer hover:border-indigo-300 border border-transparent"
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-500">
                            Broadcasts require an active subscription.{' '}
                            <Link to="/pricing" className="text-blue-600 hover:underline">View plans</Link>
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !whatsappConnected}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {scheduledAt ? 'Schedule Campaign' : 'Create Campaign'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateBroadcastModal;
