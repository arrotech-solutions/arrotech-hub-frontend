import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MessageCircle, Search, RefreshCw, Star, Trash, MoreHorizontal, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import { OutlookLogo } from '../BrandIcons';

interface Message {
  id: string;
  source: 'gmail' | 'slack' | 'teams' | 'outlook';
  sender: string;
  avatar?: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
}

const InboxWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'gmail' | 'slack' | 'teams' | 'outlook'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Execute all requests in parallel
      const [gmailResponse, slackResponse, teamsResponse, outlookResponse] = await Promise.all([
        apiService.executeMCPTool('google_workspace_gmail', {
          operation: 'read_emails',
          max_results: 10
        }),
        apiService.executeMCPTool('slack_search', {
          action: 'get_channel_history',
          channel: 'general',
          limit: 10
        }),
        apiService.executeMCPTool('teams_message_search', {
          action: 'get_recent_chats',
          limit: 10
        }),
        apiService.executeMCPTool('outlook_email_management', {
          action: 'read_emails',
          limit: 10
        })
      ]);

      let allMessages: Message[] = [];

      // Process Gmail Response
      if (gmailResponse.success && (gmailResponse.data?.emails || gmailResponse.result?.emails)) {
        const rawEmails = gmailResponse.data?.emails || gmailResponse.result?.emails;
        const gmailMessages: Message[] = rawEmails.map((email: any) => ({
          id: email.id,
          source: 'gmail',
          sender: email.from || 'Unknown',
          subject: email.subject || 'No Subject',
          preview: email.snippet || '',
          time: new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: !email.label_ids?.includes('UNREAD'),
          starred: email.label_ids?.includes('STARRED'),
        }));
        allMessages = [...allMessages, ...gmailMessages];
      }

      // Process Slack Response
      const slackData = slackResponse.result?.data || slackResponse.data?.data || slackResponse.result || slackResponse.data;
      if (slackResponse.success && slackData?.messages) {
        const rawMessages = slackData.messages;
        const slackMessages: Message[] = rawMessages.map((msg: any) => ({
          id: msg.timestamp || Math.random().toString(),
          source: 'slack',
          sender: msg.user || 'Unknown User',
          subject: msg.channel ? `#${msg.channel}` : '#general',
          preview: msg.text || '',
          time: msg.timestamp ? new Date(parseFloat(msg.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: true,
          starred: false,
        }));
        allMessages = [...allMessages, ...slackMessages];
      }

      // Process Teams Response
      console.log('Teams Response:', teamsResponse);
      const teamsData = teamsResponse.result?.data || teamsResponse.data?.data || teamsResponse.result || teamsResponse.data;
      if (teamsResponse.success && teamsData?.messages) {
        const rawTeamsMessages = teamsData.messages;
        const teamsMessages: Message[] = rawTeamsMessages.map((msg: any) => ({
          id: msg.id,
          source: 'teams',
          sender: msg.from || 'Unknown',
          subject: msg.subject || 'Chat',
          preview: msg.preview || '',
          time: msg.created_date ? new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: !msg.is_read, // API returns is_read=True usually, but let's assume read if not present
          starred: false,
        }));
        allMessages = [...allMessages, ...teamsMessages];
      } else {
        console.warn('Teams response missing messages or unsuccessful:', teamsResponse);
        if (teamsData?.error) {
          // Extract meaningful error message
          let errorMsg = typeof teamsData.error === 'string' ? teamsData.error : JSON.stringify(teamsData.error);
          if (errorMsg.includes('license')) {
            errorMsg = "Office 365 License Required. Please check your subscription.";
          } else if (errorMsg.length > 60) {
            errorMsg = errorMsg.substring(0, 60) + "...";
          }

          allMessages.push({
            id: 'teams-error-' + Date.now(),
            source: 'teams',
            sender: 'System',
            subject: 'Connection Error',
            preview: errorMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            starred: false,
          });
        }
      }

      // Process Outlook Response
      if (outlookResponse.success && (outlookResponse.data?.messages || outlookResponse.result?.messages)) {
        const rawOutlook = outlookResponse.data?.messages || outlookResponse.result?.messages;
        const outlookMessages: Message[] = rawOutlook.map((email: any) => ({
          id: email.id,
          source: 'outlook',
          sender: email.from || 'Unknown',
          subject: email.subject || 'No Subject',
          preview: email.preview || '',
          time: new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: email.is_read,
          starred: false,
        }));
        allMessages = [...allMessages, ...outlookMessages];
      }

      setMessages(prev => {
        // Filter out old mocked data for all reliable sources we are fetching
        const others = prev.filter(m => m.source !== 'gmail' && m.source !== 'slack' && m.source !== 'teams' && m.source !== 'outlook');
        return [...others, ...allMessages];
      });

    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't set global error to avoid blocking the whole widget if one source fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load with mock data for other services
    const initialMock: Message[] = [
      {
        id: 'mock-2',
        source: 'slack',
        sender: 'DevOps Channel',
        subject: '#deployments',
        preview: 'Deployment to staging successful. Please verify the new API endpoints.',
        time: '10:15 AM',
        read: true,
        starred: false,
      },
      {
        id: 'mock-3',
        source: 'teams',
        sender: 'Alex Chen',
        subject: 'Project Sync',
        preview: 'Can we reschedule our 1:1 to tomorrow? I have a conflict.',
        time: '09:45 AM',
        read: false,
        starred: false,
      },
      {
        id: 'mock-5',
        source: 'slack',
        sender: 'Design Team',
        subject: '#ui-ux',
        preview: 'New mockups for the dashboard are ready for review on Figma.',
        time: 'Yesterday',
        read: true,
        starred: true,
      },
    ];
    setMessages(initialMock);

    // Fetch real data
    fetchMessages();
  }, []);



  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[600px] transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Inbox</h2>
          <span className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {messages.filter(m => !m.read).length} new
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative group">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all w-48 dark:text-white"
            />
          </div>
          <button
            onClick={fetchMessages}
            className="p-2 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all duration-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex space-x-1 bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${activeTab === 'all'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center space-x-2 ${activeTab === 'gmail'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
              }`}
          >
            <Mail className="w-3 h-3" />
            <span>Gmail</span>
          </button>
          <button
            onClick={() => setActiveTab('slack')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center space-x-2 ${activeTab === 'slack'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
              }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>Slack</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center space-x-2 ${activeTab === 'teams'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
              }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('outlook')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center space-x-2 ${activeTab === 'outlook'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
              }`}
          >
            <OutlookLogo className="w-3 h-3" />
            <span>Outlook</span>
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Inbox...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-600">
            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl mb-4">
              <Mail className="w-8 h-8 opacity-40" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Quiet in here...</span>
          </div>
        ) : (
          messages
            .filter(m => {
              const matchesTab = activeTab === 'all' || m.source === activeTab;
              const matchesSearch =
                m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.preview.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesTab && matchesSearch;
            })
            .map((message) => (
              <div
                key={message.id}
                className={`group p-4 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all cursor-pointer relative ${!message.read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''
                  }`}
              >
                {!message.read && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`p-2 rounded-xl shadow-sm ${message.source === 'gmail' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                      message.source === 'slack' ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                        message.source === 'teams' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                          'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                      {message.source === 'gmail' ? <Mail className="w-3.5 h-3.5" /> :
                        message.source === 'slack' ? <MessageCircle className="w-3.5 h-3.5" /> :
                          message.source === 'teams' ? <MessageSquare className="w-3.5 h-3.5" /> :
                            <OutlookLogo className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`font-bold text-sm tracking-tight ${!message.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                      {message.sender}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tighter">{message.time}</span>
                </div>

                <h3 className={`text-sm mb-1.5 line-clamp-1 ${!message.read ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-slate-200'}`}>
                  {message.subject}
                </h3>

                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 leading-relaxed capitalize">
                  {message.preview}
                </p>

                {/* Hover Actions */}
                <div className="mt-3 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-yellow-500 dark:hover:text-amber-400 hover:bg-yellow-50 dark:hover:bg-amber-500/10 rounded-xl transition-all active:scale-90">
                    <Star className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-90">
                    <Trash className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default InboxWidget;
