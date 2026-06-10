import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Phone, MoreVertical, Send, User, Shield, Info, Image as ImageIcon,
    Paperclip, CheckCheck, Check, Clock, Plus, Bot, Tag, Filter, UserCircle, Star, ArrowLeft, Loader2
} from 'lucide-react';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

export interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_name: string | null;
    tags: string[];
    notes: string | null;
    message_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
    is_blocked: boolean;
    assigned_to_id?: string | null;
    created_at: string;
}

export interface Message {
    id: number;
    direction: 'incoming' | 'outgoing';
    message_type: string;
    content: string | null;
    media_url: string | null;
    status: string;
    is_auto_reply: boolean;
    is_internal_note?: boolean;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

interface ConversationsTabProps {
    contacts: Contact[];
    selectedContact: Contact | null;
    setSelectedContact: (contact: Contact | null) => void;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    fetchContacts: () => void;
    fetchMessages: (contactId: number) => void;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
    contacts,
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    fetchContacts,
    fetchMessages
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [teamMembers, setTeamMembers] = useState<any[]>([]); // Stub for team members
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load team members stub (ideally fetch from API)
    useEffect(() => {
        setTeamMembers([
            { id: '1', name: 'Alice Smith', role: 'Support Agent' },
            { id: '2', name: 'Bob Jones', role: 'Sales Rep' },
            { id: '3', name: 'Charlie Brown', role: 'Manager' }
        ]);
    }, []);

    const handleSendMessage = async () => {
        if (!selectedContact || !newMessage.trim()) return;

        setSendingMessage(true);
        try {
            const response = await apiService.sendWhatsAppMessage(
                selectedContact.id,
                { 
                    content: newMessage.trim(), 
                    message_type: 'text',
                    is_internal_note: isInternalNote
                }
            );
            if (response.success) {
                setMessages([...messages, response.data]);
                setNewMessage('');
                // If it was an internal note, stay in internal note mode, else reset
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleAssignAgent = async (agentId: string) => {
        if (!selectedContact) return;
        try {
            const response = await apiService.updateWhatsAppContact(selectedContact.id, {
                assigned_to_id: agentId
            });
            if (response.success) {
                toast.success('Agent assigned successfully');
                fetchContacts();
                setSelectedContact({ ...selectedContact, assigned_to_id: agentId });
            }
        } catch (error) {
            toast.error('Failed to assign agent');
        }
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const MessageStatus = ({ status, isInternal }: { status: string, isInternal?: boolean }) => {
        if (isInternal) return <Shield className="w-3 h-3 ml-1" />;
        switch (status) {
            case 'sent': return <Check className="w-3 h-3 ml-1" />;
            case 'delivered': return <CheckCheck className="w-3 h-3 ml-1 text-slate-400" />;
            case 'read': return <CheckCheck className="w-3 h-3 ml-1 text-blue-400" />;
            case 'failed': return <Info className="w-3 h-3 ml-1 text-red-400" />;
            default: return <Clock className="w-3 h-3 ml-1" />;
        }
    };

    const filteredContacts = contacts.filter(c => 
        (c.name || c.profile_name || c.phone_number).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Left Pane: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r dark:border-slate-800 flex flex-col transition-transform duration-300 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inbox</h2>
                        <div className="flex gap-2">
                            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Filter className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-slate-800/50">
                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${selectedContact?.id === contact.id ? 'bg-green-50 dark:bg-slate-800 border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {(contact.name || contact.profile_name || contact.phone_number).charAt(0).toUpperCase()}
                                        </div>
                                        {contact.assigned_to_id && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white">
                                                <User className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                                                {contact.name || contact.profile_name || contact.phone_number}
                                            </span>
                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                {formatTime(contact.last_message_at)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {contact.phone_number}
                                            </span>
                                            {contact.message_count > 0 && (
                                                <span className="flex items-center justify-center w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full ml-2">
                                                    {contact.message_count > 99 ? '99+' : contact.message_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Pane: Chat Area */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col relative z-10 bg-slate-50 dark:bg-slate-900/50">
                    {/* Chat Header */}
                    <div className="h-16 border-b dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {(selectedContact.name || selectedContact.profile_name || selectedContact.phone_number).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">+{selectedContact.phone_number}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <Phone className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setShowRightSidebar(!showRightSidebar)}
                                className={`p-2 rounded-full transition-colors ${showRightSidebar ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Bot className="w-16 h-16 mb-4 opacity-20" />
                                <p>Start the conversation</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isFirst = idx === 0 || messages[idx - 1].direction !== msg.direction;
                                const isInternal = msg.is_internal_note;
                                
                                return (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] lg:max-w-[65%] flex flex-col ${msg.direction === 'outgoing' ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                px-4 py-2.5 shadow-sm relative group
                                                ${msg.direction === 'outgoing' 
                                                    ? isInternal 
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 rounded-2xl rounded-tr-sm border border-amber-200 dark:border-amber-800/50' 
                                                        : 'bg-green-600 text-white rounded-2xl rounded-tr-sm' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}
                                            `}>
                                                {msg.is_auto_reply && (
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70`}>
                                                        <Bot className="w-3 h-3" /> Auto-reply
                                                    </div>
                                                )}
                                                {isInternal && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 text-amber-700 dark:text-amber-400">
                                                        <Shield className="w-3 h-3" /> Internal Note (Hidden from customer)
                                                    </div>
                                                )}
                                                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${msg.direction === 'outgoing' ? (isInternal ? 'opacity-60' : 'text-green-100') : 'text-slate-400'}`}>
                                                    {formatTime(msg.created_at)}
                                                    {msg.direction === 'outgoing' && <MessageStatus status={msg.status} isInternal={isInternal} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Composer Area */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 z-20">
                        <div className={`flex flex-col border-2 rounded-2xl overflow-hidden transition-colors duration-200 ${isInternalNote ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-green-500'}`}>
                            {/* Internal Note Toggle Banner */}
                            {isInternalNote && (
                                <div className="px-4 py-1.5 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-amber-50 text-xs font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>Internal Note Mode</span>
                                    </div>
                                    <span className="opacity-80">Visible only to team members</span>
                                </div>
                            )}
                            
                            <div className="flex items-end gap-2 p-2">
                                <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors flex-shrink-0">
                                    <Plus className="w-5 h-5" />
                                </button>
                                
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder={isInternalNote ? "Type an internal note..." : "Type a message..."}
                                    className="flex-1 max-h-32 bg-transparent outline-none py-3 resize-none scrollbar-hide"
                                    rows={1}
                                    style={{ minHeight: '44px' }}
                                />
                                
                                <div className="flex items-center gap-1 flex-shrink-0 mb-1 mr-1">
                                    <button 
                                        onClick={() => setIsInternalNote(!isInternalNote)}
                                        className={`p-2 rounded-full transition-colors ${isInternalNote ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-amber-500'}`}
                                        title="Toggle Internal Note"
                                    >
                                        <Shield className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sendingMessage}
                                        className={`p-2.5 rounded-full flex items-center justify-center transition-all ${!newMessage.trim() ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : isInternalNote ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20'}`}
                                    >
                                        {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-slate-400">Press <span className="font-bold">Enter</span> to send, <span className="font-bold">Shift + Enter</span> for new line</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border dark:border-slate-700">
                            <Bot className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">WhatsApp Shared Inbox</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a conversation from the left to start messaging, assigning agents, or adding internal notes.</p>
                    </div>
                </div>
            )}

            {/* Right Pane: Contact Details & Context */}
            {selectedContact && showRightSidebar && (
                <div className="w-72 lg:w-80 flex-shrink-0 border-l dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto absolute right-0 top-0 bottom-0 z-30 shadow-2xl md:shadow-none md:relative animate-in slide-in-from-right-8 duration-300">
                    <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                        <h3 className="font-bold text-slate-900 dark:text-white">Contact Info</h3>
                        <button onClick={() => setShowRightSidebar(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="p-6 text-center border-b dark:border-slate-800">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4 ring-4 ring-green-50 dark:ring-slate-800">
                            {(selectedContact.name || selectedContact.profile_name || selectedContact.phone_number).charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {selectedContact.name || selectedContact.profile_name || selectedContact.phone_number}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> +{selectedContact.phone_number}
                        </p>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Assignment Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assignment</h4>
                            <div className="relative group">
                                <select 
                                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    value={selectedContact.assigned_to_id || ''}
                                    onChange={(e) => handleAssignAgent(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {teamMembers.map(member => (
                                        <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                    <UserCircle className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium text-xs">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">First contact</span>
                                    <span className="text-slate-900 dark:text-slate-200">{formatTime(selectedContact.first_message_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</h4>
                                <button className="text-green-600 hover:text-green-700 dark:text-green-400 p-1"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedContact.tags?.length ? selectedContact.tags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-slate-400" />
                                        {tag}
                                    </span>
                                )) : (
                                    <span className="text-sm text-slate-500 italic">No tags</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationsTab;
