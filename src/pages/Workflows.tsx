import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  Filter,
  Globe,
  Grid,
  Link2,
  List,
  Lock,
  Pause,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  Workflow,
  X,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import EnhancedWorkflowCreator from '../components/EnhancedWorkflowCreator';
import ExecuteWorkflowModal from '../components/ExecuteWorkflowModal';
import WorkflowTemplates from '../components/WorkflowTemplates';
import apiService from '../services/api';
import {
  WorkflowExecution,
  WorkflowStepExecution,
  WorkflowVisibility,
  Workflow as WorkflowType
} from '../types';

const Workflows: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnhancedCreator, setShowEnhancedCreator] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [executingWorkflow, setExecutingWorkflow] = useState<WorkflowType | null>(null);

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingWorkflow, setSharingWorkflow] = useState<WorkflowType | null>(null);
  const [shareVisibility, setShareVisibility] = useState<WorkflowVisibility>('private');
  const [shareCategory, setShareCategory] = useState('');
  const [shareTags, setShareTags] = useState('');
  const [shareAuthorName, setShareAuthorName] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const [exportedJson, setExportedJson] = useState<string | null>(null);
  const [stepExecutions, setStepExecutions] = useState<WorkflowStepExecution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'templates'>('workflows');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    completed: 0,
    executions: 0,
    running: 0,
    failed: 0
  });

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, []);

  useEffect(() => {
    // Calculate stats when workflows or executions change
    const total = workflows.length;
    const active = workflows.filter(w => w.status === 'active').length;
    const draft = workflows.filter(w => w.status === 'draft').length;
    const inactive = workflows.filter(w => w.status === 'inactive').length;
    const executionsTotal = executions.length;
    const running = executions.filter(e => e.status === 'running').length;
    const failed = executions.filter(e => e.status === 'failed').length;

    setStats({ total, active, draft, completed: inactive, executions: executionsTotal, running, failed });
  }, [workflows, executions]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      console.log('Loading workflows...');
      console.log('Auth token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
      const response = await apiService.getWorkflows();
      console.log('Workflows response:', response);

      if (response.success) {
        console.log('Workflows data:', response.data);
        const workflowsData = Array.isArray(response.data) ? response.data : [];
        setWorkflows(workflowsData);
      } else {
        console.error('Failed to load workflows:', response);
        toast.error('Failed to load workflows: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };


  const loadExecutions = async () => {
    try {
      const response = await apiService.getAllWorkflowExecutions();
      if (response.success) {
        setExecutions(response.data);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  /* Removed loadWorkflowExecutions to satisfy ESLint as it is unused */

  const loadStepExecutions = async (executionId: number) => {
    try {
      const response = await apiService.getWorkflowStepExecutions(executionId);
      if (response.success) {
        setStepExecutions(response.data);
      }
    } catch (error) {
      console.error('Error loading step executions:', error);
    }
  };



  const handleViewExecution = async (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    await loadStepExecutions(execution.id);
    setShowExecutionModal(true);
  };

  const handleCancelExecution = async (executionId: number) => {
    try {
      await apiService.cancelWorkflowExecution(executionId);
      toast.success('Execution cancelled');
      loadExecutions();
    } catch (error) {
      console.error('Error cancelling execution:', error);
      toast.error('Failed to cancel execution');
    }
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await apiService.deleteWorkflow(workflowId);
      toast.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const openShareModal = (workflow: WorkflowType) => {
    setSharingWorkflow(workflow);
    setShareVisibility(workflow.visibility || 'private');
    setShareCategory(workflow.category || '');
    setShareTags(workflow.tags?.join(', ') || '');
    setShareAuthorName(workflow.author_name || '');
    setExportedJson(null);
    setShowShareModal(true);
  };

  const handleUpdateVisibility = async () => {
    if (!sharingWorkflow) return;
    setSharingLoading(true);
    try {
      const response = await apiService.updateWorkflowVisibility(sharingWorkflow.id, {
        visibility: shareVisibility,
        category: shareCategory || undefined,
        tags: shareTags ? shareTags.split(',').map(t => t.trim()) : undefined,
        author_name: shareAuthorName || undefined,
      });
      if (response.success) {
        toast.success(`Workflow visibility updated to ${shareVisibility}`);
        if (response.data?.share_code) {
          const shareUrl = `${window.location.origin}/marketplace/workflow/${response.data.share_code}`;
          navigator.clipboard.writeText(shareUrl);
          toast.success('Share link copied to clipboard!');
        }
        loadWorkflows();
        setShowShareModal(false);
      } else {
        toast.error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update workflow visibility');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleExportWorkflow = async () => {
    if (!sharingWorkflow) return;
    setSharingLoading(true);
    try {
      const response = await apiService.exportWorkflow(sharingWorkflow.id);
      if (response.success) {
        setExportedJson(JSON.stringify(response.data, null, 2));
        toast.success('Workflow exported! Copy the JSON below.');
      } else {
        toast.error('Failed to export workflow');
      }
    } catch (error) {
      console.error('Error exporting workflow:', error);
      toast.error('Failed to export workflow');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyExportedJson = () => {
    if (exportedJson) {
      navigator.clipboard.writeText(exportedJson);
      toast.success('JSON copied to clipboard!');
    }
  };

  const handleDownloadJson = () => {
    if (exportedJson && sharingWorkflow) {
      const blob = new Blob([exportedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sharingWorkflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'paused':
      case 'inactive':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'completed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'running':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'paused':
      case 'inactive':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'draft':
        return 'bg-yellow-50 border-yellow-200';
      case 'paused':
      case 'inactive':
        return 'bg-orange-50 border-orange-200';
      case 'completed':
        return 'bg-blue-50 border-blue-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'cancelled':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Debug logging
  console.log('Workflows state:', workflows);
  console.log('Filtered workflows:', filteredWorkflows);
  console.log('Search term:', searchTerm);
  console.log('Status filter:', statusFilter);
  console.log('Active tab:', activeTab);
  console.log('Loading:', loading);

  const filteredExecutions = executions.filter(execution => {
    const workflow = workflows.find(w => w.id === execution.workflow_id);
    const workflowName = workflow?.name || '';
    const matchesSearch = workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderExecutionCard = (execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === execution.workflow_id);
    const duration = execution.started_at && execution.completed_at
      ? Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)
      : null;

    return (
      <div key={execution.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <PlayCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {workflow?.name || `Workflow ${execution.workflow_id}`}
                </h3>
                <p className="text-sm text-gray-500">Execution #{execution.id}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)}
              <span className="capitalize">{execution.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(execution.created_at).toLocaleDateString()}</span>
              </span>
              {duration && (
                <span className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{duration}s</span>
                </span>
              )}
            </div>
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>{execution.trigger_type}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewExecution(execution)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
              >
                <Eye className="w-3 h-3" />
                <span>View Details</span>
              </button>
              {execution.status === 'running' && (
                <button
                  onClick={() => handleCancelExecution(execution.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowCard = (workflow: WorkflowType) => (
    <div key={workflow.id} className="group relative bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl border border-blue-100 group-hover:border-blue-200 transition-colors">
                <Workflow className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                {workflow.name}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Version</span>
                <span className="text-xs font-bold text-gray-900">{workflow.version}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border ${getStatusColor(workflow.status)}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${workflow.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-current opacity-50'}`}></div>
            <span>{workflow.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2 font-medium italic">
          "{workflow.description}"
        </p>

        {/* Dynamic Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-lg border border-gray-100 uppercase tracking-tighter">
            {workflow.trigger_type}
          </span>
          {workflow.steps?.slice(0, 2).map((step, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-lg border border-blue-100 uppercase tracking-tighter">
              {step.tool_name.split('_')[0]}
            </span>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Complexity</p>
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-bold text-gray-900">{workflow.steps?.length || 0} Steps</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Sync</p>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-purple-500" />
              <span className="text-xs font-bold text-gray-900">{new Date(workflow.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Main Action */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={() => {
              setExecutingWorkflow(workflow);
              setShowExecuteModal(true);
            }}
            className="flex items-center justify-center space-x-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 font-bold text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch</span>
          </button>
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedWorkflow(workflow)}
              className="flex-1 flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openShareModal(workflow)}
              className="flex-1 flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="relative group/more flex-1">
              <button
                className="w-full h-full flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 hidden group-hover/more:block">
                <button onClick={() => handleDeleteWorkflow(workflow.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Duplicate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkflowList = (workflow: WorkflowType) => (
    <div key={workflow.id} className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200 flex items-center p-5 space-x-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl border border-blue-100 text-blue-600">
        <Workflow className="w-7 h-7" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {workflow.name}
          </h3>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-black uppercase">v{workflow.version}</span>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(workflow.status)}`}>
            {workflow.status}
          </div>
        </div>
        <p className="text-sm text-gray-500 line-clamp-1 mb-2 font-medium">"{workflow.description}"</p>
        <div className="flex items-center flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>{workflow.steps?.length || 0} Steps</span>
          </span>
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{workflow.trigger_type}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-purple-500" />
            <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            setExecutingWorkflow(workflow);
            setShowExecuteModal(true);
          }}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all duration-300 font-bold text-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          <span className="hidden sm:inline">Launch</span>
        </button>
        <button
          onClick={() => setSelectedWorkflow(workflow)}
          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => openShareModal(workflow)}
          className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDeleteWorkflow(workflow.id)}
          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm mb-8">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Workspace Management</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Builder'}</span>!
                </h1>
                <p className="text-gray-500 max-w-md font-medium">
                  Supercharge your productivity with intelligent automated workflows.
                </p>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={() => {
                    console.log('Manual reload triggered');
                    loadWorkflows();
                  }}
                  className="p-3 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm group"
                  title="Reload workflows"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <button
                  onClick={() => setShowEnhancedCreator(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transform hover:-translate-y-1 transition-all duration-300 font-bold"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Workflow</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {/* Tab Navigation - Pill Style */}
        <div className="bg-gray-100/50 p-1.5 rounded-2xl mb-8 flex items-center w-full sm:w-fit backdrop-blur-sm border border-gray-200/50">
          {[
            { id: 'workflows', label: 'Workflows', icon: Workflow, count: stats.total, color: 'blue' },
            { id: 'executions', label: 'Executions', icon: PlayCircle, count: stats.executions, color: 'blue' },
            { id: 'templates', label: 'Library', icon: BookOpen, count: 'New', color: 'purple' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${isActive
                  ? tab.color === 'blue' ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'bg-white text-purple-600 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="font-bold text-sm">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isActive
                  ? tab.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  : 'bg-gray-200 text-gray-500'
                  }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats Overview */}
        {/* Stats Overview - Glassmorphism */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 ${activeTab === 'templates' ? 'hidden' : ''}`}>
          {[
            { label: activeTab === 'workflows' ? 'Total Workflows' : 'Total Executions', value: activeTab === 'workflows' ? stats.total : stats.executions, icon: activeTab === 'workflows' ? Workflow : PlayCircle, color: 'blue', bgColor: 'bg-blue-500' },
            { label: activeTab === 'workflows' ? 'Active Workflows' : 'Running Jobs', value: activeTab === 'workflows' ? stats.active : stats.running, icon: activeTab === 'workflows' ? CheckCircle : RefreshCw, color: 'emerald', bgColor: 'bg-emerald-500' },
            { label: activeTab === 'workflows' ? 'Draft Mode' : 'Failed Tasks', value: activeTab === 'workflows' ? stats.draft : stats.failed, icon: activeTab === 'workflows' ? Edit : AlertCircle, color: 'amber', bgColor: 'bg-amber-500' },
            { label: activeTab === 'workflows' ? 'Archive/Done' : 'Successful', value: activeTab === 'workflows' ? stats.completed : (executions.filter(e => e.status === 'completed').length), icon: activeTab === 'workflows' ? Activity : CheckCircle, color: 'indigo', bgColor: 'bg-indigo-500' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="relative group overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor}/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-md ${stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'emerald' ? 'text-emerald-600' :
                      stat.color === 'amber' ? 'text-amber-600' :
                        'text-indigo-600'
                    }`}>
                    <Icon className={`w-6 h-6 ${stat.icon === RefreshCw ? 'animate-spin-slow' : ''}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] font-bold text-gray-400">
                  <Activity className="w-3 h-3 mr-1" />
                  <span>Real-time platform metrics</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search - Integrated Design */}
        <div className={`mb-10 p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm ${activeTab === 'templates' ? 'hidden' : ''}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 flex-1 w-full">
              <div className="relative flex-1 w-full max-w-none lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search workflows by name or tool..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400 font-medium"
                />
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-6 py-3.5 border rounded-2xl transition-all font-bold text-sm ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Refine</span>
                  {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {showFilters && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">Everywhere</option>
                    <option value="active">Active Only</option>
                    <option value="draft">Drafts Only</option>
                    <option value="paused">Paused</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {activeTab}...</p>
            </div>
          </div>
        ) : activeTab === 'workflows' ? (
          filteredWorkflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative p-8 bg-white border border-blue-100 shadow-2xl rounded-[2.5rem] transform hover:rotate-6 transition-transform duration-500">
                  <Workflow className="w-16 h-16 text-blue-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Ready to build something great?</h3>
              <p className="text-gray-500 mb-10 max-w-md font-medium leading-relaxed">
                You haven't created any workflows yet. Use our visual builder to automate your repetitive tasks in minutes.
              </p>
              <button
                onClick={() => setShowEnhancedCreator(true)}
                className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-gray-900 text-white rounded-[2rem] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="relative w-5 h-5 transition-transform group-hover:rotate-90" />
                <span className="relative font-bold">Launch First Workflow</span>
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredWorkflows.map(viewMode === 'grid' ? renderWorkflowCard : renderWorkflowList)}
            </div>
          )
        ) : activeTab === 'executions' ? (
          filteredExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative p-8 bg-white border border-purple-100 shadow-2xl rounded-[2.5rem] transform hover:-rotate-6 transition-transform duration-500">
                  <PlayCircle className="w-16 h-16 text-purple-600" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No execution history</h3>
              <p className="text-gray-500 mb-10 max-w-md font-medium leading-relaxed">
                Executions will appear here once you start running your workflows. Ready to test one?
              </p>
              <button
                onClick={() => setActiveTab('workflows')}
                className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-[2rem] hover:bg-gray-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <Workflow className="w-5 h-5 text-blue-600" />
                <span className="font-bold">View My Workflows</span>
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredExecutions.map(renderExecutionCard)}
            </div>
          )
        ) : (
          <WorkflowTemplates
            onWorkflowCreated={() => {
              loadWorkflows();
              setActiveTab('workflows');
            }}
          />
        )}


        {/* Enhanced Workflow Creator */}
        <EnhancedWorkflowCreator
          open={showEnhancedCreator}
          onClose={() => setShowEnhancedCreator(false)}
          onWorkflowCreated={() => {
            loadWorkflows();
            setShowEnhancedCreator(false);
          }}
        />


        {/* Execute Workflow Modal - Improved UX */}
        {showExecuteModal && executingWorkflow && (
          <ExecuteWorkflowModal
            workflow={executingWorkflow}
            isOpen={showExecuteModal}
            onClose={() => {
              setShowExecuteModal(false);
              setExecutingWorkflow(null);
            }}
            onExecute={async (inputData) => {
              try {
                const response = await apiService.executeWorkflow(executingWorkflow.id, {
                  workflow_id: executingWorkflow.id,
                  input_data: inputData
                });
                if (response.success) {
                  toast.success('Workflow executed successfully');
                  setShowExecuteModal(false);
                  setExecutingWorkflow(null);
                  loadWorkflows();
                  loadExecutions();
                }
              } catch (error) {
                console.error('Error executing workflow:', error);
                toast.error('Failed to execute workflow');
              }
            }}
          />
        )}

        {/* Workflow Details Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
              <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white leading-tight">{selectedWorkflow.name}</h2>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Version {selectedWorkflow.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>Workflow Details</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Description</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedWorkflow.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedWorkflow.status)}`}>
                            {selectedWorkflow.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Trigger Type</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedWorkflow.trigger_type}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedWorkflow.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Workflow Steps</span>
                  </h3>
                  <div className="space-y-3">
                    {selectedWorkflow.steps?.map((step: any, index: number) => (
                      <div key={step.id} className={`bg-white border rounded-lg p-4 ${getStatusBgColor(step.status || 'draft')}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{step.step_number}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{step.tool_name}</p>
                              <p className="text-xs text-gray-600">{step.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    )) || (
                        <div className="text-center py-8">
                          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500">No steps defined</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Details Modal */}
        {showExecutionModal && selectedExecution && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
              <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white leading-tight">Execution Report</h2>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">ID #{selectedExecution.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>Execution Overview</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedExecution.status)}`}>
                          {getStatusIcon(selectedExecution.status)}
                          <span className="ml-2 capitalize">{selectedExecution.status}</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Started</span>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedExecution.started_at
                            ? new Date(selectedExecution.started_at).toLocaleString()
                            : 'Not started'
                          }
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-medium text-gray-500">Completed</span>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedExecution.completed_at
                            ? new Date(selectedExecution.completed_at).toLocaleString()
                            : 'Not completed'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-500">Trigger Type</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedExecution.trigger_type}</p>
                    </div>
                    {selectedExecution.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <span className="text-sm font-medium text-red-700">Error Message</span>
                        <p className="text-sm text-red-600 mt-1">{selectedExecution.error_message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Step Executions</span>
                  </h3>
                  <div className="space-y-3">
                    {stepExecutions.length > 0 ? (
                      stepExecutions.map((stepExecution: WorkflowStepExecution, index: number) => (
                        <div key={stepExecution.id} className={`bg-white border rounded-lg p-4 ${getStatusBgColor(stepExecution.status)}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Step #{stepExecution.step_id}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(stepExecution.status)}`}>
                                    {getStatusIcon(stepExecution.status)}
                                    <span className="ml-1 capitalize">{stepExecution.status}</span>
                                  </span>
                                  {stepExecution.retry_count > 0 && (
                                    <span className="text-xs text-orange-600">
                                      Retries: {stepExecution.retry_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                          {stepExecution.error_message && (
                            <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                              {stepExecution.error_message}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No step executions found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedExecution.input_data && Object.keys(selectedExecution.input_data).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Input Data</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 overflow-x-auto">
                      {JSON.stringify(selectedExecution.input_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedExecution.output_data && Object.keys(selectedExecution.output_data).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Output Data</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-800 overflow-x-auto">
                      {JSON.stringify(selectedExecution.output_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && sharingWorkflow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Share Workflow</h2>
                    <p className="text-sm text-white/80">{sharingWorkflow.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Visibility Options */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can see' },
                      { value: 'unlisted', label: 'Unlisted', icon: Link2, desc: 'Anyone with link' },
                      { value: 'public', label: 'Public', icon: Globe, desc: 'Visible in gallery' },
                      { value: 'marketplace', label: 'Marketplace', icon: Users, desc: 'Listed for others' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setShareVisibility(option.value as WorkflowVisibility)}
                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-all text-left ${shareVisibility === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className={`p-2 rounded-lg ${shareVisibility === option.value ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                          <option.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional settings for public/marketplace */}
                {(shareVisibility === 'public' || shareVisibility === 'marketplace') && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author Display Name
                      </label>
                      <input
                        type="text"
                        value={shareAuthorName}
                        onChange={(e) => setShareAuthorName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Your name or username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={shareCategory}
                        onChange={(e) => setShareCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Analytics">Analytics</option>
                        <option value="Communication">Communication</option>
                        <option value="Automation">Automation</option>
                        <option value="Data">Data</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={shareTags}
                        onChange={(e) => setShareTags(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="marketing, slack, reports"
                      />
                    </div>
                  </div>
                )}

                {/* Export Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Export as JSON</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Export this workflow as a JSON file that can be imported by others.
                    Sensitive data will be automatically removed.
                  </p>

                  {exportedJson ? (
                    <div className="space-y-3">
                      <textarea
                        readOnly
                        value={exportedJson}
                        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCopyExportedJson}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={handleDownloadJson}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleExportWorkflow}
                      disabled={sharingLoading}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {sharingLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Export Workflow</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateVisibility}
                  disabled={sharingLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {sharingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>Update Sharing</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default Workflows;