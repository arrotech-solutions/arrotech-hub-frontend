import React, { useState } from 'react';
import { X, Sparkles, Send, Megaphone, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface CreateBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateBroadcastModal: React.FC<CreateBroadcastModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [targetType, setTargetType] = useState('all');
    const [targetTag, setTargetTag] = useState('');
    const [textContent, setTextContent] = useState('');
    
    // AI Copy Gen State
    const [campaignGoal, setCampaignGoal] = useState('');
    const [tone, setTone] = useState('professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [variations, setVariations] = useState<string[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleGenerateCopy = async () => {
        if (!campaignGoal) {
            toast.error("Please enter a campaign goal first");
            return;
        }
        setIsGenerating(true);
        try {
            const resp = await apiService.generateBroadcastCopy({
                campaign_goal: campaignGoal,
                tone
            });
            if (resp.success) {
                setVariations(resp.variations || []);
                toast.success("AI generated copy successfully!");
            }
        } catch (error) {
            toast.error("Failed to generate copy");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!name || !textContent) {
            toast.error("Name and message content are required");
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                name,
                description: "AI Assisted Campaign",
                message_type: "text",
                text_content: textContent,
                target_type: targetType,
                target_tag: targetType === 'tag' ? targetTag : null
            };
            const resp = await apiService.createWhatsAppBroadcast(payload);
            if (resp.success) {
                toast.success("Broadcast created successfully");
                onSuccess();
                onClose();
            }
        } catch (error) {
            toast.error("Failed to create broadcast");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-xl shadow-md">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Broadcast Campaign</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Reach your customers with targeted, AI-powered messaging</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Campaign Name</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                placeholder="e.g. Summer Sale 2026"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
                            <select 
                                value={targetType}
                                onChange={e => setTargetType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            >
                                <option value="all">All Contacts</option>
                                <option value="tag">Specific Tag</option>
                            </select>
                            
                            {targetType === 'tag' && (
                                <input 
                                    type="text"
                                    value={targetTag}
                                    onChange={e => setTargetTag(e.target.value)}
                                    className="w-full mt-3 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="Enter tag (e.g. vip, leads)"
                                />
                            )}
                        </div>

                        {/* AI Generator Box */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24 text-indigo-500" />
                            </div>
                            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2 relative z-10">
                                <Sparkles className="w-4 h-4" /> AI Magic Copywriter
                            </h3>
                            <div className="space-y-3 relative z-10">
                                <input 
                                    type="text"
                                    value={campaignGoal}
                                    onChange={e => setCampaignGoal(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white/80 dark:bg-slate-800/80 text-sm focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm"
                                    placeholder="Goal (e.g. Announce a 20% discount on shoes)"
                                />
                                <select 
                                    value={tone}
                                    onChange={e => setTone(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white/80 dark:bg-slate-800/80 text-sm focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm"
                                >
                                    <option value="professional">Professional</option>
                                    <option value="friendly">Friendly & Casual</option>
                                    <option value="urgent">Urgent & Exciting</option>
                                </select>
                                <button 
                                    onClick={handleGenerateCopy}
                                    disabled={isGenerating}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isGenerating ? 'Generating...' : 'Generate Copy'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Message Content */}
                    <div className="flex flex-col h-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Message Content</label>
                        <textarea
                            value={textContent}
                            onChange={e => setTextContent(e.target.value)}
                            className="w-full flex-1 min-h-[150px] p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                            placeholder="Type your message here or use AI generator..."
                        />
                        
                        {/* Variations */}
                        {variations.length > 0 && (
                            <div className="mt-4">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">AI Suggestions</label>
                                <div className="space-y-2">
                                    {variations.map((v, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setTextContent(v)}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                                        >
                                            {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Create Campaign
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateBroadcastModal;
