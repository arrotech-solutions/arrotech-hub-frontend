import React, { useState } from 'react';
import { X, Loader2, Calendar, CheckSquare, Mail, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';

export type ActionType = 'email' | 'slack' | 'calendar' | 'task' | null;

interface QuickActionModalProps {
    isOpen: boolean;
    type: ActionType;
    onClose: () => void;
    onSuccess: () => void;
}

const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, type, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    if (!isOpen || !type) return null;

    const onSubmit = async (data: any) => {
        setLoading(true);
        let promise: Promise<any> = Promise.resolve(null);

        try {
            if (type === 'email') {
                promise = apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'send_email',
                    to: data.to,
                    cc: data.cc ? data.cc.split(',').map((e: string) => e.trim()).filter(Boolean).join(',') : undefined,
                    bcc: data.bcc ? data.bcc.split(',').map((e: string) => e.trim()).filter(Boolean).join(',') : undefined,
                    subject: data.subject,
                    body: data.body
                });
            } else if (type === 'slack') {
                // Use registered slack_team_communication tool
                promise = apiService.executeMCPTool('slack_team_communication', {
                    action: 'send_message',
                    channel: data.channel,
                    message: data.message
                });
            } else if (type === 'calendar') {
                // Construct ISO strings for start/end
                const start = new Date(`${data.date}T${data.startTime}`).toISOString();
                const end = new Date(`${data.date}T${data.endTime}`).toISOString();

                promise = apiService.executeMCPTool('google_workspace_calendar', {
                    operation: 'create_event',
                    summary: data.summary,
                    start_time: start,
                    end_time: end,
                    description: data.description
                });
            } else if (type === 'task') {
                // Simulator for Task
                promise = new Promise(resolve => setTimeout(() => resolve({ success: true, result: 'Task created (Simulated)' }), 1000));
            }

            const response = await promise;

            // Check response success (handle both 'success' boolean and error fields)
            if (response && (response.success || response.result?.success)) {
                if (type === 'task') toast.success('Task created successfully!');
                else toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} action completed!`);
                onSuccess();
                onClose();
                reset();
            } else {
                throw new Error(response?.error || response?.result?.error || 'Action failed');
            }

        } catch (error: any) {
            console.error('Action failed:', error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'email': return 'Compose Email';
            case 'slack': return 'Send Slack Message';
            case 'calendar': return 'Schedule Event';
            case 'task': return 'Create Task';
            default: return '';
        }
    };

    const getActionTheme = () => {
        switch (type) {
            case 'email': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: Mail, gradient: 'from-blue-600 to-blue-700' };
            case 'slack': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: MessageSquare, gradient: 'from-purple-600 to-purple-700' };
            case 'calendar': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Calendar, gradient: 'from-emerald-600 to-emerald-700' };
            case 'task': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: CheckSquare, gradient: 'from-orange-600 to-orange-700' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: Mail, gradient: 'from-gray-700 to-gray-800' };
        }
    };

    const theme = getActionTheme();
    const Icon = theme.icon;

    const renderFields = () => {
        const inputClasses = "w-full rounded-xl border-gray-200 border bg-gray-50/50 p-2.5 focus:ring-2 focus:ring-opacity-50 focus:bg-white transition-all outline-none text-sm";
        const labelClasses = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";

        switch (type) {
            case 'email':
                return (
                    <>
                        <div>
                            <label className={labelClasses}>Recipient</label>
                            <input {...register('to', { required: true })} className={`${inputClasses} focus:ring-blue-500`} placeholder="recipient@example.com" />
                            {errors.to && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Cc</label>
                                <input {...register('cc')} className={`${inputClasses} focus:ring-blue-500`} placeholder="Optional" />
                            </div>
                            <div>
                                <label className={labelClasses}>Bcc</label>
                                <input {...register('bcc')} className={`${inputClasses} focus:ring-blue-500`} placeholder="Optional" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Subject</label>
                            <input {...register('subject', { required: true })} className={`${inputClasses} focus:ring-blue-500`} placeholder="Meeting Request" />
                            {errors.subject && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                        <div>
                            <label className={labelClasses}>Message Body</label>
                            <textarea {...register('body', { required: true })} rows={4} className={`${inputClasses} focus:ring-blue-500 resize-none`} placeholder="Type your email content here..." />
                            {errors.body && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                    </>
                );
            case 'slack':
                return (
                    <>
                        <div>
                            <label className={labelClasses}>Top-level Channel</label>
                            <input {...register('channel', { required: true })} className={`${inputClasses} focus:ring-purple-500`} placeholder="#general" defaultValue="#general" />
                            {errors.channel && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                        <div>
                            <label className={labelClasses}>Message</label>
                            <textarea {...register('message', { required: true })} rows={4} className={`${inputClasses} focus:ring-purple-500 resize-none`} placeholder="Hello team..." />
                            {errors.message && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                    </>
                );
            case 'calendar':
                return (
                    <>
                        <div>
                            <label className={labelClasses}>Event Title</label>
                            <input {...register('summary', { required: true })} className={`${inputClasses} focus:ring-emerald-500`} placeholder="Team Sync" />
                            {errors.summary && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className={labelClasses}>Date</label>
                                <input type="date" {...register('date', { required: true })} className={`${inputClasses} focus:ring-emerald-500`} defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="col-span-1">
                                <label className={labelClasses}>Start</label>
                                <input type="time" {...register('startTime', { required: true })} className={`${inputClasses} focus:ring-emerald-500`} defaultValue="09:00" />
                            </div>
                            <div className="col-span-1">
                                <label className={labelClasses}>End</label>
                                <input type="time" {...register('endTime', { required: true })} className={`${inputClasses} focus:ring-emerald-500`} defaultValue="10:00" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Description</label>
                            <textarea {...register('description')} rows={3} className={`${inputClasses} focus:ring-emerald-500 resize-none`} placeholder="Optional details..." />
                        </div>
                    </>
                );
            case 'task':
                return (
                    <>
                        <div>
                            <label className={labelClasses}>Task Title</label>
                            <input {...register('title', { required: true })} className={`${inputClasses} focus:ring-orange-500`} placeholder="Review PR" />
                            {errors.title && <span className="text-red-500 text-xs mt-1 block">Required</span>}
                        </div>
                        <div>
                            <label className={labelClasses}>Details</label>
                            <textarea {...register('description')} rows={4} className={`${inputClasses} focus:ring-orange-500 resize-none`} placeholder="Task description..." />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100/50">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white relative">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${theme.bg}`}>
                            <Icon className={`w-5 h-5 ${theme.text}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{getTitle()}</h3>
                            <p className="text-xs text-gray-500 font-medium">Complete the form below to proceed</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`}></div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {renderFields()}

                    <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${theme.gradient} rounded-xl hover:shadow-lg hover:opacity-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {type === 'email' ? 'Send Email' : type === 'slack' ? 'Send Message' : type === 'calendar' ? 'Schedule Event' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickActionModal;
