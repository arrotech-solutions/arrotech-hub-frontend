import {
  Bot,
  Eye,
  Grid,
  List,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from '../lib/notify';
import { useConfirm } from '../components/ui';
import WorkflowTemplates from '../components/WorkflowTemplates';
import { useTutorial } from '../hooks/useTutorial';
import apiService from '../services/api';
import { AgentCreate, AgentResponse, AgentStatusResponse, Workflow } from '../types';

const Agents: React.FC = () => {
  const { confirm } = useConfirm();
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResponse | null>(null);
  const [newAgent, setNewAgent] = useState<AgentCreate>({
    workflow_id: '',
    agent_config: {},
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentStep, isActive: isTutorialActive } = useTutorial();

  const tabFromUrl = searchParams.get('tab') === 'deploy' ? 'deploy' : 'managed';
  const [activeTab, setActiveTab] = useState<'managed' | 'deploy'>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const setTab = (tab: 'managed' | 'deploy') => {
    setActiveTab(tab);
    if (tab === 'deploy') {
      setSearchParams({ tab: 'deploy' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (isTutorialActive && currentStep) {
      if (['agents-stats', 'agents-filters', 'agents-actions'].includes(currentStep.id)) {
        setTab('managed');
      } else if (['agents-intro', 'agents-create'].includes(currentStep.id)) {
        setTab('deploy');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isTutorialActive]);

  useEffect(() => {
    loadAgents();
    loadWorkflows();
  }, []);

  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter((a) => a.status === 'active').length;
    const paused = agents.filter((a) => a.status === 'paused' || a.status === 'inactive').length;
    return { total, active, paused };
  }, [agents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAgents();
      if (response.success) {
        setAgents(response.data || []);
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
        setWorkflows(response.data || []);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const loadAgentStatus = async (agentId: string) => {
    try {
      const response = await apiService.getAgentStatus(agentId);
      if (response.success === false) {
        setAgentStatus(response as unknown as AgentStatusResponse);
        return;
      }
      // status endpoint returns AgentStatusResponse directly or wrapped
      const payload = (response as any).data || response;
      setAgentStatus(payload);
    } catch (error) {
      console.error('Error loading agent status:', error);
    }
  };

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.workflow_id) {
        toast.error('Please select an automation');
        return;
      }
      const response = await apiService.createAgent(newAgent);
      if (response.success) {
        toast.success('Agent created successfully');
        setShowCreateModal(false);
        setNewAgent({ workflow_id: '', agent_config: {} });
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
        toast.success('Agent paused');
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
        toast.success('Agent resumed');
        loadAgents();
      }
    } catch (error) {
      console.error('Error resuming agent:', error);
      toast.error('Failed to resume agent');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    const ok = await confirm({
      title: 'Remove agent?',
      description:
        'This deactivates the agent so it stops responding. The underlying automation remains available under Automations.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await apiService.deleteAgent(agentId);
      toast.success('Agent removed');
      setSelectedAgent(null);
      setAgents((prev) => prev.filter((a) => a.agent_id !== agentId));
      loadAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to remove agent');
    }
  };

  const isEventDriven = (agent: AgentResponse) => {
    const t = (agent.trigger_type || '').toLowerCase();
    return (
      agent.agent_kind === 'conversational' ||
      t.includes('event') ||
      !!agent.channel
    );
  };

  const filteredAgents = agents.filter((agent) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      agent.workflow_name?.toLowerCase().includes(q) ||
      agent.channel?.toLowerCase().includes(q) ||
      agent.job_type?.toLowerCase().includes(q) ||
      agent.agent_id?.toLowerCase().includes(q)
    );
  });

  const channelLabel = (channel?: string | null) => {
    if (!channel) return null;
    return channel.charAt(0).toUpperCase() + channel.slice(1);
  };

  const renderAgentCard = (agent: AgentResponse) => (
    <div
      key={agent.agent_id}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all agent-actions-container"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                agent.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}
            >
            {agent.status}
            </span>
            {agent.channel && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                {channelLabel(agent.channel)}
              </span>
            )}
            {agent.job_type && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                {agent.job_type}
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">
            {agent.workflow_name || `Agent ${agent.agent_id}`}
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">
            {isEventDriven(agent) ? 'Responds to messages' : 'Manual / scheduled'}
            {' · '}
            {(agent.performance_metrics?.execution_count ??
              agent.monitoring?.execution_count ??
              0)}{' '}
            runs
          </p>
        </div>
        <Bot className="w-8 h-8 text-indigo-500 dark:text-indigo-400 shrink-0" />
            </div>

      <div className="flex items-center gap-2 flex-wrap">
            {agent.status === 'active' ? (
          <button
            onClick={() => handlePauseAgent(agent.agent_id)}
            className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors agent-pause-btn"
            title="Pause"
          >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
          <button
            onClick={() => handleResumeAgent(agent.agent_id)}
            className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors agent-resume-btn"
            title="Resume"
          >
                <Play className="w-4 h-4" />
              </button>
            )}
        <button
          onClick={() => navigate(`/workflows?id=${agent.workflow_id}`)}
          className="px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Edit automation"
        >
          <Settings className="w-4 h-4" />
          <span>Edit automation</span>
            </button>
        <button
          onClick={() => {
            setSelectedAgent(agent);
            loadAgentStatus(agent.agent_id);
          }}
          className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 agent-view-btn"
          title="Details"
        >
              <Eye className="w-5 h-5" />
            </button>
        <button
          onClick={() => handleDeleteAgent(agent.agent_id)}
          className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 agent-delete-btn"
          title="Remove"
        >
              <Trash2 className="w-5 h-5" />
            </button>
      </div>
    </div>
  );

  const renderAgentList = (agent: AgentResponse) => (
    <div
      key={agent.agent_id}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 agent-actions-container"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-black text-gray-900 dark:text-white truncate">
                {agent.workflow_name || `Agent ${agent.agent_id}`}
              </h3>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
              agent.status === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}
          >
                {agent.status}
              </span>
          {agent.channel && (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {channelLabel(agent.channel)}
              {agent.job_type ? ` · ${agent.job_type}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
            {agent.status === 'active' ? (
          <button
            onClick={() => handlePauseAgent(agent.agent_id)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-amber-600 flex items-center justify-center border border-gray-100 dark:border-slate-700 agent-pause-btn"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleResumeAgent(agent.agent_id)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-green-600 flex items-center justify-center border border-gray-100 dark:border-slate-700 agent-resume-btn"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => navigate(`/workflows?id=${agent.workflow_id}`)}
          className="px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200"
        >
          Edit automation
        </button>
        <button
          onClick={() => {
            setSelectedAgent(agent);
            loadAgentStatus(agent.agent_id);
          }}
          className="p-2.5 text-gray-400 hover:text-indigo-600 agent-view-btn"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDeleteAgent(agent.agent_id)}
          className="p-2.5 text-gray-400 hover:text-red-600 agent-delete-btn"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Deployed workers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight agents-header">
              Agents
            </h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 font-medium max-w-xl">
              Deploy messaging agents for ordering, support, and rent. Automations power them under the hood.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/workflows')}
              className="flex items-center space-x-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-5 py-3.5 rounded-2xl font-bold border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>Automations</span>
            </button>
            <button
              onClick={() => setTab('deploy')}
              className="flex items-center space-x-2 bg-slate-900 dark:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:opacity-95 transition-all create-agent-btn"
            >
              <Rocket className="w-5 h-5" />
              <span>Deploy agent</span>
            </button>
          </div>
        </div>

        <div className="flex p-1.5 bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl w-fit mb-8 border border-gray-200/50 dark:border-slate-700/50 agent-hub-tabs">
          <button
            onClick={() => setTab('managed')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === 'managed'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span className="uppercase tracking-widest">My Agents</span>
          </button>
          <button
            onClick={() => setTab('deploy')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === 'deploy'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span className="uppercase tracking-widest">Deploy</span>
          </button>
        </div>

        {activeTab === 'deploy' ? (
          <div className="discover-hub-section space-y-4">
            <div className="mb-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Deploy an agent</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
                Start from a WhatsApp or Telegram template. After deploy, manage it under My Agents.
              </p>
            </div>
            <WorkflowTemplates
              agentTemplatesOnly
              onWorkflowCreated={() => {
                loadAgents();
                setTab('managed');
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 agents-stats">
              {[
                { label: 'Total', value: stats.total },
                { label: 'Active', value: stats.active },
                { label: 'Paused', value: stats.paused },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    {s.label}
                  </p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-gray-100 dark:border-slate-700 p-4 flex flex-col md:flex-row gap-3 items-center agents-filters">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none outline-none text-gray-900 dark:text-white font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadAgents}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl border ${
                    viewMode === 'grid'
                      ? 'border-indigo-300 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-gray-200 dark:border-slate-600 text-gray-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl border ${
                    viewMode === 'list'
                      ? 'border-indigo-300 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
                      : 'border-gray-200 dark:border-slate-600 text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  title="Wrap an existing automation"
                >
                  <Plus className="w-4 h-4" />
                  From automation
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-500 font-medium">
                Loading agents...
                    </div>
            ) : filteredAgents.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <Bot className="w-12 h-12 mx-auto text-indigo-400" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white">No agents yet</h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  Deploy a WhatsApp or Telegram ordering/support agent from a template.
                </p>
                <button
                  onClick={() => setTab('deploy')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-indigo-500 text-white font-bold"
                >
                  <Rocket className="w-4 h-4" />
                  Deploy your first agent
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'space-y-3'
                }
              >
                {filteredAgents.map(viewMode === 'grid' ? renderAgentCard : renderAgentList)}
              </div>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700 w-full max-w-lg p-8 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Wrap an automation
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Advanced: turn an existing automation into a managed agent. Prefer Deploy for messaging bots.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Automation
              </label>
              <select
                value={newAgent.workflow_id}
                onChange={(e) => setNewAgent({ ...newAgent, workflow_id: e.target.value })}
                className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="">Select automation...</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={String(wf.id)}>
                    {wf.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCreateAgent}
                className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-indigo-500 text-white font-bold"
              >
                Create agent
              </button>
            </div>
          </div>
        )}

        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-700 w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                  <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    {selectedAgent.workflow_name || 'Agent detail'}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {selectedAgent.agent_id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                  <p className="font-black text-indigo-600 dark:text-indigo-400">
                    {selectedAgent.status}
                  </p>
                    </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Channel</p>
                  <p className="font-black text-gray-900 dark:text-white">
                    {channelLabel(selectedAgent.channel) || '—'}
                  </p>
                  </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Job</p>
                  <p className="font-black text-gray-900 dark:text-white">
                    {selectedAgent.job_type || '—'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Runs</p>
                  <p className="font-black text-gray-900 dark:text-white">
                    {selectedAgent.performance_metrics?.execution_count ??
                      selectedAgent.monitoring?.execution_count ??
                      agentStatus?.monitoring?.execution_count ??
                      0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/workflows?id=${selectedAgent.workflow_id}`)}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-indigo-500 text-white font-bold flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Edit automation
                </button>
                {selectedAgent.status === 'active' ? (
                  <button
                    onClick={() => handlePauseAgent(selectedAgent.agent_id)}
                    className="px-5 py-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleResumeAgent(selectedAgent.agent_id)}
                    className="px-5 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAgent(selectedAgent.agent_id)}
                  className="px-5 py-3 rounded-2xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;
