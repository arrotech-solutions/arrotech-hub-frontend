import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Grid,
  Languages,
  LayoutDashboard,
  List,
  Pause,
  Play,
  Plus,
  Rocket,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  Zap,
  ArrowRight,
  CreditCard,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { AgentCreate, AgentResponse, AgentStatusResponse, Workflow } from '../types';

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [newAgent, setNewAgent] = useState<AgentCreate>({
    workflow_id: 0,
    agent_config: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    completed: 0
  });
  const [activeTab, setActiveTab] = useState<'discover' | 'managed'>('discover');
  const [hubSearch, setHubSearch] = useState('');
  const navigate = useNavigate();

  const FEATURED_AGENTS = [
    {
      id: 'mpesa-recon',
      name: 'M-Pesa Reconciliation',
      description: 'Automated payment matching and real-time ledger updates for Daraja API.',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
      category: 'Finance',
      route: '/agents/mpesa'
    },
    {
      id: 'hr-advisor',
      name: 'HR Policy Advisor',
      description: 'Bilingual (Swahili/English) expert for leave management and labor law compliance.',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'from-indigo-500 to-blue-600',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      category: 'Operations',
      templateId: 'hr-onboarding-advisor'
    },
    {
      id: 'lead-intel',
      name: 'Lead Intelligence',
      description: 'AI-driven qualification and follow-up orchestration for regional sales teams.',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      category: 'Sales',
      templateId: 'marketing-email-campaign'
    },
    {
      id: 'support-triage',
      name: 'Smart Support',
      description: 'Instant bilingual triage with sentiment analysis for WhatsApp and Slack support.',
      icon: <Languages className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
      lightColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      category: 'Support',
      templateId: 'bilingual-support-triage'
    },
    {
      id: 'logistics-track',
      name: 'Logistics Tracker',
      description: 'Unified tracking for Sendy, G4S, and Wells Fargo shipments with automated alerts.',
      icon: <Truck className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      category: 'Logistics',
      templateId: 'operations-standup-hub'
    },
    {
      id: 'ops-standup',
      name: 'Operations Hub',
      description: 'Centralized task accountability and morning stand-up automation for Kenyan teams.',
      icon: <LayoutDashboard className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      category: 'Management',
      templateId: 'operations-standup-hub'
    }
  ];

  useEffect(() => {
    loadAgents();
    loadWorkflows();
  }, []);

  useEffect(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'active').length;
    const paused = agents.filter(a => a.status === 'paused').length;
    const completed = agents.filter(a => a.status === 'completed').length;
    setStats({ total, active, paused, completed });
  }, [agents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAgents();
      if (response.success) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await apiService.getWorkflows();
      if (response.success) {
        setWorkflows(response.data);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleShareAgent = async (agent: AgentResponse) => {
    try {
      const response = await apiService.exportWorkflow(agent.workflow_id);
      if (response.success) {
        const jsonStr = JSON.stringify(response.data, null, 2);
        await navigator.clipboard.writeText(jsonStr);
        toast.success('Agent configuration copied to clipboard!');
      } else {
        toast.error('Failed to export agent configuration');
      }
    } catch (error) {
      console.error('Error sharing agent:', error);
      toast.error('Failed to share agent');
    }
  };

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.workflow_id) {
        toast.error('Please select a workflow');
        return;
      }
      const response = await apiService.createAgent(newAgent);
      if (response.success) {
        toast.success('Agent created successfully');
        setShowCreateModal(false);
        setNewAgent({ workflow_id: 0, agent_config: {} });
        loadAgents();
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    }
  };

  const handlePauseAgent = async (agentId: string) => {
    try {
      const response = await apiService.pauseAgent(agentId);
      if (response.success) {
        toast.success('Agent paused successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error pausing agent:', error);
      toast.error('Failed to pause agent');
    }
  };

  const handleResumeAgent = async (agentId: string) => {
    try {
      const response = await apiService.resumeAgent(agentId);
      if (response.success) {
        toast.success('Agent resumed successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error resuming agent:', error);
      toast.error('Failed to resume agent');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      await apiService.deleteAgent(agentId);
      toast.success('Agent deleted successfully');
      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    try {
      const response = await apiService.executeAgent(agentId);
      if (response.success) {
        toast.success('Agent executed successfully');
        loadAgents();
      }
    } catch (error) {
      console.error('Error executing agent:', error);
      toast.error('Failed to execute agent');
    }
  };

  const loadAgentStatus = async (agentId: string) => {
    try {
      const response = await apiService.getAgentStatus(agentId);
      if (response.success) {
        setAgentStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading agent status:', error);
    }
  };

  const handleLaunchAgent = (agent: any) => {
    if (agent.route) {
      navigate(agent.route);
    } else if (agent.templateId) {
      toast.success(`Launching ${agent.name}...`);
      navigate(`/workflows?template=${agent.templateId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200';
      case 'paused': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'completed': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agent_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.workflow_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredHubAgents = FEATURED_AGENTS.filter(agent =>
    agent.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
    agent.category.toLowerCase().includes(hubSearch.toLowerCase())
  );

  const renderAgentCard = (agent: AgentResponse) => (
    <div key={agent.agent_id} className="group relative bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-500">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {agent.workflow_name || `Agent ${agent.agent_id}`}
              </h3>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">ID: {agent.agent_id}</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${getStatusColor(agent.status)}`}>
            {agent.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
            <div className="flex items-center space-x-2 text-gray-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Executions</span>
            </div>
            <p className="text-lg font-black text-gray-900 leading-none">{agent.performance_metrics?.execution_count || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
            <div className="flex items-center space-x-2 text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Active Since</span>
            </div>
            <p className="text-lg font-black text-gray-900 leading-none">{new Date(agent.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {agent.status === 'active' ? (
              <button onClick={() => handlePauseAgent(agent.agent_id)} className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors shadow-sm">
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => handleResumeAgent(agent.agent_id)} className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm">
                <Play className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => handleExecuteAgent(agent.agent_id)} className="px-4 h-10 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center space-x-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">
              <Zap className="w-4 h-4" />
              <span>Execute</span>
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => { setSelectedAgent(agent); loadAgentStatus(agent.agent_id); }} className="p-2.5 text-gray-400 hover:text-purple-600 transition-colors rounded-xl hover:bg-purple-50">
              <Eye className="w-5 h-5" />
            </button>
            <button onClick={() => handleShareAgent(agent)} className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => handleDeleteAgent(agent.agent_id)} className="p-2.5 text-gray-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentList = (agent: AgentResponse) => (
    <div key={agent.agent_id} className="group relative bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-lg">
                {agent.workflow_name || `Agent ${agent.agent_id}`}
              </h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            <div className="flex items-center space-x-6 text-xs font-semibold text-gray-400">
              <span className="flex items-center space-x-2"><Activity className="w-3.5 h-3.5" /><span>{agent.performance_metrics?.execution_count || 0} execs</span></span>
              <span className="flex items-center space-x-2"><Clock className="w-3.5 h-3.5" /><span>{new Date(agent.created_at).toLocaleDateString()}</span></span>
              <span className="flex items-center space-x-2 text-purple-400"><Zap className="w-3.5 h-3.5" /><span>WF #{agent.workflow_id}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
            {agent.status === 'active' ? (
              <button onClick={() => handlePauseAgent(agent.agent_id)} className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm border border-gray-100"><Pause className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => handleResumeAgent(agent.agent_id)} className="w-10 h-10 rounded-xl bg-white text-green-600 flex items-center justify-center shadow-sm border border-gray-100"><Play className="w-4 h-4" /></button>
            )}
            <button onClick={() => handleExecuteAgent(agent.agent_id)} className="px-5 h-10 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center space-x-2 ml-1.5 shadow-lg shadow-purple-200"><Zap className="w-4 h-4" /><span>Run</span></button>
          </div>
          <button onClick={() => { setSelectedAgent(agent); loadAgentStatus(agent.agent_id); }} className="p-2.5 text-gray-400 hover:text-purple-600 transition-colors rounded-xl"><Eye className="w-5 h-5" /></button>
          <button onClick={() => handleDeleteAgent(agent.agent_id)} className="p-2.5 text-gray-400 hover:text-red-600 transition-colors rounded-xl"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Regional Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-none">
              Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Hub</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-xl">
              Discover and manage specialized AI agents optimized for the Kenyan business landscape.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-4 rounded-[20px] font-bold border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Go to Chat</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-[20px] font-bold shadow-xl shadow-purple-200 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
              <span>Create Agent</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-[24px] w-fit mb-10 border border-gray-200/50">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center space-x-3 px-8 py-4 rounded-[18px] text-sm font-black transition-all duration-300 ${activeTab === 'discover'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
          >
            <Rocket className="w-5 h-5" />
            <span className="uppercase tracking-widest">Discover Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('managed')}
            className={`flex items-center space-x-3 px-8 py-4 rounded-[18px] text-sm font-black transition-all duration-300 ${activeTab === 'managed'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
          >
            <Bot className="w-5 h-5" />
            <span className="uppercase tracking-widest">Managed Agents</span>
          </button>
        </div>

        {activeTab === 'discover' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hub Tools */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-[24px] border border-gray-100">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search and find regional intelligence..."
                  value={hubSearch}
                  onChange={(e) => setHubSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder:text-gray-400 text-lg"
                />
              </div>
              <div className="flex items-center space-x-2">
                {['All', 'Finance', 'Operations', 'Sales'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setHubSearch(cat === 'All' ? '' : cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${(cat === 'All' && !hubSearch) || hubSearch === cat
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {filteredHubAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="group relative bg-white rounded-[40px] p-8 border border-gray-100/80 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${agent.color} opacity-[0.03] rounded-bl-[100px] group-hover:scale-110 transition-transform duration-700`} />

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform duration-500`}>
                        {agent.icon}
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${agent.textColor} ${agent.lightColor}`}>
                        {agent.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLaunchAgent(agent)}
                      className="w-full flex items-center justify-between group/btn bg-gray-50 hover:bg-purple-600 hover:text-white p-5 rounded-2xl transition-all duration-300 transform active:scale-[0.98]"
                    >
                      <span className="font-bold tracking-tight">Launch Intelligence</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Fleet', value: stats.total, color: 'text-purple-600', icon: <Bot className="w-5 h-5" /> },
                { label: 'Active Now', value: stats.active, color: 'text-green-600', icon: <CheckCircle className="w-5 h-5" /> },
                { label: 'Resting', value: stats.paused, color: 'text-amber-600', icon: <Pause className="w-5 h-5" /> },
                { label: 'Efficiency', value: '98%', color: 'text-blue-600', icon: <Zap className="w-5 h-5" /> },
              ].map((stat, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-[28px] p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</span>
                    <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                  </div>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Management Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your autonomous fleet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-transparent border-none focus:ring-0 text-gray-900 font-bold placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all border ${showFilters ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-100 text-gray-700'}`}>
                  <Filter className="w-4 h-4" />
                  <span>Tools</span>
                </button>
                <div className="bg-gray-100 p-1.5 rounded-2xl flex space-x-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}><Grid className="w-5 h-5" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}><List className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {/* Agents Display */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20' : 'space-y-4 pb-20'}>
              {filteredAgents.map(viewMode === 'grid' ? renderAgentCard : renderAgentList)}
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-2xl"><Plus className="w-8 h-8 text-purple-600" /></div>
                  <h2 className="text-3xl font-black text-gray-900">Deploy Agent</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-8 h-8 text-gray-400" /></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-gray-400 ml-1">Protocol Selection</label>
                  <select
                    value={newAgent.workflow_id}
                    onChange={(e) => setNewAgent({ ...newAgent, workflow_id: parseInt(e.target.value) })}
                    className="w-full px-6 py-5 bg-gray-50 border-none rounded-[20px] focus:ring-2 focus:ring-purple-500 font-bold text-lg"
                  >
                    <option value={0}>Select a core workflow...</option>
                    {workflows.map(workflow => (<option key={workflow.id} value={workflow.id}>{workflow.name} (v{workflow.version})</option>))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-gray-400 ml-1">Logic Configuration (JSON)</label>
                  <textarea
                    value={JSON.stringify(newAgent.agent_config, null, 2)}
                    onChange={(e) => { try { const parsed = JSON.parse(e.target.value); setNewAgent({ ...newAgent, agent_config: parsed }); } catch (e) { } }}
                    className="w-full px-6 py-5 bg-gray-50 border-none rounded-[20px] focus:ring-2 focus:ring-purple-500 font-mono text-sm leading-relaxed"
                    rows={8}
                    placeholder="{}"
                  />
                </div>
                <button
                  onClick={handleCreateAgent}
                  className="w-full py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[24px] font-black text-xl shadow-xl shadow-purple-200 hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  Initiate Deployment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Details Modal (Simplified for brevity but fixed) */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-[24px] bg-purple-600 flex items-center justify-center text-white"><Bot className="w-10 h-10" /></div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">{selectedAgent.workflow_name || 'Agent Detail'}</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">System ID: {selectedAgent.agent_id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="p-3 hover:bg-gray-100 rounded-full"><XCircle className="w-8 h-8 text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="bg-gray-50 rounded-[32px] p-8 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center space-x-2"><Settings className="w-5 h-5 text-purple-600" /><span>Environment</span></h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase">Status</p><p className="font-black text-purple-600">{selectedAgent.status}</p></div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase">Workflow</p><p className="font-black">{selectedAgent.workflow_id}</p></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-[32px] p-8">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center space-x-2 mb-6"><BarChart3 className="w-5 h-5 text-purple-600" /><span>Performance</span></h3>
                  {agentStatus ? (
                    <div className="space-y-4">
                      <div className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3"><Activity className="w-5 h-5 text-purple-500" /> <span className="font-bold">Execution History</span></div>
                        <span className="text-2xl font-black">{selectedAgent.performance_metrics?.execution_count || 0}</span>
                      </div>
                    </div>
                  ) : <p className="text-gray-400 font-bold italic">Gathering telemetry...</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;