import React, { useState } from 'react';
import { X, Send, Paperclip, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { OutlookLogo } from '../BrandIcons';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

interface ComposeMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({ isOpen, onClose }) => {
    const [channel, setChannel] = useState<'gmail' | 'outlook' | 'slack' | 'teams'>('gmail');
    const [recipient, setRecipient] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCcBcc, setShowCcBcc] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let result;
            if (channel === 'gmail') {
                result = await apiService.executeMCPTool('google_workspace_gmail', {
                    operation: 'send_email',
                    to: recipient,
                    subject: subject,
                    body: message,
                    cc: cc,
                    bcc: bcc
                });
            } else if (channel === 'outlook') {
                result = await apiService.executeMCPTool('outlook_email_management', {
                    action: 'send_email',
                    to_email: recipient,
                    subject: subject,
                    content: message,
                    cc: cc,
                    bcc: bcc
                });
            } else if (channel === 'slack') {
                result = await apiService.executeMCPTool('slack_team_communication', {
                    action: 'send_message',
                    channel: recipient, // Assuming recipient is channel name or ID
                    message: message
                });
            } else if (channel === 'teams') {
                result = await apiService.executeMCPTool('teams_team_communication', {
                    action: 'send_message',
                    channel: recipient,
                    message: message
                });
            }

            if (result && result.success) {
                toast.success('Message sent successfully!');
                onClose();
                setRecipient('');
                setSubject('');
                setMessage('');
            } else {
                toast.error('Failed to send message: ' + (result?.error || 'Unknown error'));
            }
        } catch (err: any) {
            toast.error('Error sending message');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Compose Message</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex">
                    {/* Sidebar / Channel Selector */}
                    <div className="w-48 bg-gray-50 border-r border-gray-100 p-2 space-y-1">
                        <button
                            onClick={() => setChannel('gmail')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${channel === 'gmail' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                        >
                            <Mail className="w-4 h-4" />
                            Gmail
                        </button>
                        <button
                            onClick={() => setChannel('outlook')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${channel === 'outlook' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                        >
                            <OutlookLogo className="w-4 h-4" />
                            Outlook
                        </button>
                        <button
                            onClick={() => setChannel('slack')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${channel === 'slack' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Slack
                        </button>
                        <button
                            onClick={() => setChannel('teams')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${channel === 'teams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Microsoft Teams
                        </button>
                    </div>

                    {/* Form Area */}
                    <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col h-[500px]">
                        <div className="space-y-4 flex-1">
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {channel === 'slack' || channel === 'teams' ? 'Channel / Recipient' : 'To'}
                                    </label>
                                    {(channel === 'gmail' || channel === 'outlook') && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCcBcc(!showCcBcc)}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            Cc/Bcc
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder={channel === 'slack' ? '#general or @user' : 'recipient@example.com'}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    required
                                />
                            </div>

                            {showCcBcc && (channel === 'gmail' || channel === 'outlook') && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cc</label>
                                        <input
                                            type="text"
                                            value={cc}
                                            onChange={(e) => setCc(e.target.value)}
                                            placeholder="cc@example.com"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bcc</label>
                                        <input
                                            type="text"
                                            value={bcc}
                                            onChange={(e) => setBcc(e.target.value)}
                                            placeholder="bcc@example.com"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {(channel === 'gmail' || channel === 'outlook') && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter subject..."
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                            <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : (
                                        <>
                                            <span>Send</span>
                                            <Send className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ComposeMessageModal;
