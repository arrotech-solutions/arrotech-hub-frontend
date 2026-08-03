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
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useWebSocket } from '../hooks/useWebSocket';
import toast from '../lib/notify';
import { Spinner, useConfirm } from '../components/ui';
import EnhancedWorkflowCreator from '../components/EnhancedWorkflowCreator';
import ExecuteWorkflowModal from '../components/ExecuteWorkflowModal';
import WorkflowTemplates from '../components/WorkflowTemplates';
import WorkflowCanvas, { CanvasState } from '../components/workflows/WorkflowCanvas';
import apiService from '../services/api';
import {
  WorkflowExecution,
  WorkflowStepExecution,
  WorkflowVisibility,
  Workflow as WorkflowType
} from '../types';

const Workflows: React.FC = () => {
  const { user } = useAuth();
  const { canUseFeature, tier } = useSubscription();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnhancedCreator, setShowEnhancedCreator] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [executingWorkflow, setExecutingWorkflow] = useState<WorkflowType | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowType | null>(null);

  // Canvas mode state
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasInitialData, setCanvasInitialData] = useState<any>(null);
  const [formToCanvasState, setFormToCanvasState] = useState<CanvasState | null>(null);
  const [canvasToFormState, setCanvasToFormState] = useState<CanvasState | null>(null);

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
    failed: 0
  });

  // Real-time updates
  const { isConnected, lastEvent } = useWebSocket();

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'workflow_execution_started') {
      const data = lastEvent.data;
      setExecutions(prev => {
        if (prev.some(e => e.id === data.execution_id)) return prev;

        // Find workflow to get some default info
        const wf = workflows.find(w => w.id === data.workflow_id);

        const newExecution: WorkflowExecution = {
          id: data.execution_id,
          workflow_id: data.workflow_id,
          status: 'running',
          trigger_type: wf?.trigger_type || 'event',
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          user_id: user?.id || 0,
        };
        return [newExecution, ...prev];
      });
    } else if (lastEvent.type === 'workflow_execution_completed') {
      const data = lastEvent.data;
      setExecutions(prev => prev.map(e =>
        e.id === data.execution_id
          ? { ...e, status: data.status, completed_at: data.completed_at }
          : e
      ));
    } else if (lastEvent.type === 'workflow_step_started' || lastEvent.type === 'workflow_step_completed') {
      const data = lastEvent.data;
      // If we are currently viewing this execution, reload the step executions
      if (selectedExecution && selectedExecution.id === data.execution_id) {
        loadStepExecutions(selectedExecution.id);
      }
    }
  }, [lastEvent, workflows, user]);

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
        if (response.data.length > 0) {
          setSelectedStepId(response.data[0].id);
        } else {
          setSelectedStepId(null);
        }
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
    const ok = await confirm({
      title: 'Delete this workflow?',
      description: 'This removes the workflow and its configuration. Past executions may remain in history.',
      tone: 'danger',
      confirmLabel: 'Delete workflow',
    });
    if (!ok) return;

    try {
      await apiService.deleteWorkflow(workflowId);
      toast.success('Workflow deleted successfully');
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const handleToggleStatus = async (workflow: WorkflowType) => {
    try {
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      const response = await apiService.updateWorkflow(workflow.id, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`Workflow ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`);
        loadWorkflows();
      } else {
        toast.error('Failed to update workflow status');
      }
    } catch (error) {
      console.error('Error updating workflow status:', error);
      toast.error('Failed to update workflow status');
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
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30';
      case 'draft':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30';
      case 'paused':
      case 'inactive':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30';
      case 'completed':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30';
      case 'running':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-500/30';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30';
      case 'cancelled':
        return 'text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
      default:
        return 'text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
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
        return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30';
      case 'draft':
        return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30';
      case 'paused':
      case 'inactive':
        return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30';
      case 'completed':
        return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
      case 'running':
        return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30';
      case 'failed':
        return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
      case 'cancelled':
        return 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
      default:
        return 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
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
      <div key={execution.id} className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col group">
        <div className={`absolute top-0 left-0 right-0 h-1 ${execution.status === 'running' ? 'bg-blue-500 animate-pulse' : execution.status === 'completed' ? 'bg-green-500' : execution.status === 'failed' ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-blue-600/10 dark:from-purple-500/20 dark:to-blue-600/20 rounded-xl shrink-0">
                <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {workflow?.name || `Workflow ${execution.workflow_id}`}
                </h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    ID: {execution.id}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                  <span className="flex items-center space-x-1 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="capitalize">{execution.trigger_type}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0 border ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)}
              <span>{execution.status}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              <div className="flex items-center space-x-1.5" title="Started At">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(execution.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              {duration !== null && (
                <div className="flex items-center space-x-1.5" title="Duration">
                  <Target className="w-3.5 h-3.5" />
                  <span>{duration}s</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {execution.status === 'running' && (
                <button
                  onClick={() => handleCancelExecution(execution.id)}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Cancel Execution"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleViewExecution(execution)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-gray-900 dark:bg-slate-700 text-white rounded-lg hover:bg-black dark:hover:bg-slate-600 hover:shadow-lg transition-all font-bold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExecutionList = (execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === execution.workflow_id);
    const duration = execution.started_at && execution.completed_at
      ? Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)
      : null;

    return (
      <div key={execution.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all duration-300 flex items-center p-4 relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${execution.status === 'running' ? 'bg-blue-500 animate-pulse' : execution.status === 'completed' ? 'bg-green-500' : execution.status === 'failed' ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>

        <div className="ml-2 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-center shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
          <PlayCircle className="w-5 h-5" />
        </div>

        <div className="ml-4 flex-1 min-w-0 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 sm:items-center">
          <div className="sm:col-span-4 pr-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {workflow?.name || `Workflow ${execution.workflow_id}`}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Execution #{execution.id}</p>
          </div>

          <div className="sm:col-span-3 flex flex-col space-y-1">
            <div title={`Trigger: ${execution.trigger_type}`} className="flex items-center space-x-1.5 w-fit px-1.5 py-0.5 rounded bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-[10px] text-gray-600 dark:text-slate-400 font-medium">
              <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="capitalize truncate">{execution.trigger_type}</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{new Date(execution.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center text-xs text-gray-500 dark:text-slate-400 font-medium">
            <Target className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">{duration !== null ? `${duration}s` : '-'}</span>
          </div>

          <div className="sm:col-span-2 min-w-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border max-w-full ${getStatusColor(execution.status)}`}>
              <span className="mr-1 shrink-0">{getStatusIcon(execution.status)}</span>
              <span className="truncate">{execution.status}</span>
            </span>
          </div>

          <div className="sm:col-span-1 flex items-center sm:justify-end space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
            {execution.status === 'running' && (
              <button onClick={() => handleCancelExecution(execution.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => handleViewExecution(execution)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowCard = (workflow: WorkflowType) => {
    // Get visible steps (max 4)
    const steps = workflow.steps || [];
    const visibleSteps = steps.slice(0, 4);
    const hasMoreSteps = steps.length > 4;

    return (
      <div key={workflow.id} className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
        {/* Gradient Border Top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${workflow.status === 'active' ? 'from-blue-500 via-purple-500 to-blue-500 animate-gradient-x' : 'from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600'}`}></div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`
                p-2.5 rounded-xl border transition-colors relative group-hover:scale-105 duration-300
                ${workflow.status === 'active'
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500'}
              `}>
                <div className={`absolute inset-0 rounded-xl opacity-20 ${workflow.status === 'active' ? 'bg-blue-400 dark:bg-blue-500 blur-md' : ''}`}></div>
                <Workflow className="w-5 h-5 relative z-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {workflow.name}
                </h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider ${workflow.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                    {workflow.status === 'active' && (
                      <span className="relative flex h-1.5 w-1.5 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                    )}
                    <span>{workflow.status}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[10px] font-medium text-gray-400">v{workflow.version}</span>
                </div>
              </div>
            </div>

            <div className="relative group/menu">
              <button className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-1 hidden group-hover/menu:block z-10">
                <button onClick={() => {
                  setEditingWorkflow(workflow);
                  setShowEnhancedCreator(true);
                }} className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-2">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button onClick={() => openShareModal(workflow)} className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-2">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                <button onClick={() => handleDeleteWorkflow(workflow.id)} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-6 min-h-[40px]">
            {workflow.description || "No description provided."}
          </p>

          {/* Visual Tool Chain */}
          <div className="mt-auto">
            <div className="flex items-center space-x-1 mb-4 overflow-hidden py-1">
              {/* Trigger Icon */}
              <div
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center shrink-0 relative group/icon"
                title={`Trigger: ${workflow.trigger_type}`}
              >
                <Zap className={`w-3.5 h-3.5 ${workflow.status === 'active' ? 'text-amber-500 fill-amber-500' : 'text-gray-400 dark:text-slate-500'}`} />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                  Trigger: {workflow.trigger_type}
                </div>
              </div>

              {/* Connector */}
              <div className="w-4 h-0.5 bg-gray-200 dark:bg-slate-700 shrink-0"></div>

              {/* Steps */}
              {visibleSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 relative group/icon cursor-default"
                  >
                    {step.tool_name.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                      {step.tool_name}
                    </div>
                  </div>
                  {idx < visibleSteps.length - 1 && (
                    <div className="w-4 h-0.5 bg-blue-100 dark:bg-blue-500/30 shrink-0"></div>
                  )}
                </React.Fragment>
              ))}

              {hasMoreSteps && (
                <>
                  <div className="w-4 h-0.5 bg-gray-200 dark:bg-slate-700 shrink-0"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                    +{steps.length - 4}
                  </div>
                </>
              )}
            </div>

            {/* Metrics Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800/50">
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center space-x-1" title="Runs">
                  <Activity className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                  <span className="font-semibold">{Math.floor(Math.random() * 50)}</span>
                </div>
                <div className="flex items-center space-x-1" title="Last Run">
                  <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                  <span>{new Date(workflow.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleStatus(workflow)}
                  className={`p-1.5 rounded-lg transition-colors ${workflow.status === 'active'
                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10'
                    : 'text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10'
                    }`}
                  title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                >
                  {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setExecutingWorkflow(workflow);
                    setShowExecuteModal(true);
                  }}
                  className="flex items-center space-x-1.5 pl-2 pr-3 py-1.5 bg-gray-900 dark:bg-slate-700 text-white rounded-lg hover:bg-black dark:hover:bg-slate-600 hover:shadow-lg transition-all text-xs font-bold"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowList = (workflow: WorkflowType) => {
    // List view also gets a premium upgrade
    const steps = workflow.steps || [];

    return (
      <div key={workflow.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all duration-300 flex items-center p-4 relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${workflow.status === 'active' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>

        {/* Icon */}
        <div className="ml-2 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-center shrink-0 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
          <Workflow className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="ml-4 flex-1 min-w-0 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 sm:items-center">
          <div className="sm:col-span-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{workflow.name}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{workflow.description || 'No description'}</p>
          </div>

          <div className="sm:col-span-3 flex items-center space-x-2">
            <div title={`Trigger: ${workflow.trigger_type}`} className="flex items-center space-x-1.5 px-2 py-1 rounded bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-400">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="capitalize">{workflow.trigger_type}</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500 font-medium">+ {steps.length} steps</div>
          </div>

          <div className="sm:col-span-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${workflow.status === 'active' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
              }`}>
              {workflow.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
              {workflow.status}
            </span>
          </div>

          <div className="sm:col-span-3 flex items-center sm:justify-end space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
            <button
              onClick={() => {
                setExecutingWorkflow(workflow);
                setShowExecuteModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Run"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingWorkflow(workflow);
                setShowEnhancedCreator(true);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteWorkflow(workflow.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm mb-8 transition-colors duration-300">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-100/80 dark:bg-blue-500/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Workspace Management</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight workflows-header-tut">
                  Welcome back, <span className="bg-gradient-to-r from-primary-500 to-secondary-900 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Builder'}</span>!
                </h1>
                <p className="text-gray-500 dark:text-slate-400 max-w-md font-medium">
                  Supercharge your productivity with intelligent automated workflows.
                </p>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end workflows-builders-tut">
                <button
                  onClick={() => {
                    console.log('Manual reload triggered');
                    loadWorkflows();
                  }}
                  className="p-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200 shadow-sm group"
                  title="Reload workflows"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
                      if (!canUseFeature('max_active_workflows', activeWorkflows)) {
                        toast.error(`You've reached the limit of active workflows for the ${tier} plan. Please upgrade to create more.`);
                        navigate('/pricing');
                        return;
                      }
                      setCanvasInitialData(null);
                      setFormToCanvasState(null);
                      setShowCanvas(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-900 text-white rounded-2xl hover:shadow-[0_0_20px_rgba(255,70,150,0.4)] transform hover:-translate-y-1 transition-all duration-300 font-bold workflow-builder"
                    title="Visual canvas builder"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Canvas Builder</span>
                  </button>
                  <button
                    onClick={() => {
                      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
                      if (!canUseFeature('max_active_workflows', activeWorkflows)) {
                        toast.error(`You've reached the limit of active workflows for the ${tier} plan. Please upgrade to create more.`);
                        navigate('/pricing');
                        return;
                      }
                      setEditingWorkflow(null);
                      setCanvasToFormState(null);
                      setShowEnhancedCreator(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-2 border-gray-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300 font-bold"
                    title="Step-by-step form builder"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Form Builder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {/* Tab Navigation - Pill Style */}
        <div className="overflow-x-auto custom-scrollbar-hide mb-8 workflows-tabs-tut">
          <div className="bg-gray-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl flex items-center w-max sm:w-fit backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300">
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
                    ? tab.color === 'blue' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-md transform scale-105'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="font-bold text-sm">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-colors duration-300 ${isActive
                    ? tab.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Overview */}
        {/* Stats Overview - Glassmorphism */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 workflows-stats-tut ${activeTab === 'templates' ? 'hidden' : ''}`}>
          {[
            { label: activeTab === 'workflows' ? 'Total Workflows' : 'Total Executions', value: activeTab === 'workflows' ? stats.total : stats.executions, icon: activeTab === 'workflows' ? Workflow : PlayCircle, color: 'blue', bgColor: 'bg-blue-500' },
            { label: activeTab === 'workflows' ? 'Active Workflows' : 'Running Jobs', value: activeTab === 'workflows' ? stats.active : stats.running, icon: activeTab === 'workflows' ? CheckCircle : RefreshCw, color: 'emerald', bgColor: 'bg-emerald-500' },
            { label: activeTab === 'workflows' ? 'Draft Mode' : 'Failed Tasks', value: activeTab === 'workflows' ? stats.draft : stats.failed, icon: activeTab === 'workflows' ? Edit : AlertCircle, color: 'amber', bgColor: 'bg-amber-500' },
            { label: activeTab === 'workflows' ? 'Archive/Done' : 'Successful', value: activeTab === 'workflows' ? stats.completed : (executions.filter(e => e.status === 'completed').length), icon: activeTab === 'workflows' ? Activity : CheckCircle, color: 'indigo', bgColor: 'bg-indigo-500' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="relative group overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor}/10 dark:${stat.bgColor}/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-md ${stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                        'text-indigo-600 dark:text-indigo-400'
                    }`}>
                    <Icon className={`w-6 h-6 ${stat.icon === RefreshCw ? 'animate-spin-slow' : ''}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] font-bold text-gray-400 dark:text-slate-500">
                  <Activity className="w-3 h-3 mr-1" />
                  <span>Real-time platform metrics</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search - Integrated Design */}
        <div className={`mb-10 p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-sm transition-colors duration-300 workflows-filters-tut ${activeTab === 'templates' ? 'hidden' : ''}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 flex-1 w-full">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 border rounded-2xl transition-all font-bold text-sm ${showFilters ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Refine</span>
                  {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {showFilters && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white transition-all font-bold text-sm appearance-none cursor-pointer outline-none"
                  >
                    <option value="all">Everywhere</option>
                    <option value="active">Active Only</option>
                    <option value="draft">Drafts Only</option>
                    <option value="paused">Paused</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl transition-colors duration-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
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
              <Spinner size="xl" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading {activeTab}...</p>
            </div>
          </div>
        ) : activeTab === 'workflows' ? (
          filteredWorkflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center workflows-empty-tut transition-colors duration-300">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative p-8 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-500/20 shadow-2xl rounded-[2.5rem] transform hover:rotate-6 transition-transform duration-500">
                  <Workflow className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Ready to build something great?</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-10 max-w-md font-medium leading-relaxed">
                You haven't created any workflows yet. Use our visual builder to automate your repetitive tasks in minutes.
              </p>
              <button
                onClick={() => {
                  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
                  if (!canUseFeature('max_active_workflows', activeWorkflows)) {
                    toast.error(`You've reached the limit of active workflows for the ${tier} plan. Please upgrade to create more.`);
                    navigate('/pricing');
                    return;
                  }
                  setShowEnhancedCreator(true);
                }}
                className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-gray-900 text-white rounded-[2rem] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-900 dark:from-primary-500 dark:to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="relative w-5 h-5 transition-transform group-hover:rotate-90" />
                <span className="relative font-bold">Launch First Workflow</span>
              </button>
            </div>
          ) : (
            <div className={`workflows-list-tut ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {filteredWorkflows.map(viewMode === 'grid' ? renderWorkflowCard : renderWorkflowList)}
            </div>
          )
        ) : activeTab === 'executions' ? (
          filteredExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center transition-colors duration-300">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative p-8 bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-500/20 shadow-2xl rounded-[2.5rem] transform hover:-rotate-6 transition-transform duration-500">
                  <PlayCircle className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">No execution history</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-10 max-w-md font-medium leading-relaxed">
                Executions will appear here once you start running your workflows. Ready to test one?
              </p>
              <button
                onClick={() => setActiveTab('workflows')}
                className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-[2rem] hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-900 dark:from-primary-500 dark:to-secondary-700"></div>
                <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold">View My Workflows</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Runs Section */}
              {filteredExecutions.some(e => e.status === 'running' || e.status === 'pending') && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </div>
                    <span>Currently Running</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {filteredExecutions.filter(e => e.status === 'running' || e.status === 'pending').length} Active
                    </span>
                  </h4>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {filteredExecutions.filter(e => e.status === 'running' || e.status === 'pending').map(viewMode === 'grid' ? renderExecutionCard : renderExecutionList)}
                  </div>
                </div>
              )}

              {/* Historical Runs Section */}
              <div className={filteredExecutions.some(e => e.status === 'running' || e.status === 'pending') ? 'pt-8 border-t border-gray-100 dark:border-slate-800' : ''}>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <span>Execution History</span>
                </h4>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredExecutions.filter(e => e.status !== 'running' && e.status !== 'pending').map(viewMode === 'grid' ? renderExecutionCard : renderExecutionList)}
                </div>
              </div>
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


        {/* Enhanced Workflow Creator (Form Mode) */}
        <EnhancedWorkflowCreator
          open={showEnhancedCreator}
          onClose={() => {
            setShowEnhancedCreator(false);
            setEditingWorkflow(null);
            setCanvasToFormState(null);
          }}
          initialData={editingWorkflow}
          initialCanvasState={canvasToFormState}
          onWorkflowCreated={(workflow) => {
            loadWorkflows();
            setShowEnhancedCreator(false);
            setEditingWorkflow(null);
            setCanvasToFormState(null);
          }}
          onSwitchToCanvas={(state: CanvasState) => {
            setShowEnhancedCreator(false);
            setEditingWorkflow(null);
            setFormToCanvasState(state);
            setShowCanvas(true);
          }}
        />

        {/* Canvas Workflow Builder */}
        <WorkflowCanvas
          open={showCanvas}
          onClose={() => {
            setShowCanvas(false);
            setCanvasInitialData(null);
            setFormToCanvasState(null);
          }}
          initialData={canvasInitialData}
          initialCanvasState={formToCanvasState}
          onWorkflowCreated={(workflow) => {
            loadWorkflows();
            setShowCanvas(false);
            setCanvasInitialData(null);
            setFormToCanvasState(null);
          }}
          onSwitchToForm={(state: CanvasState) => {
            setShowCanvas(false);
            setCanvasInitialData(null);
            setFormToCanvasState(null);
            setCanvasToFormState(state);
            setShowEnhancedCreator(true);
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
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-primary-500 to-secondary-900 dark:from-primary-700 dark:to-secondary-900">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md">
                    <Workflow className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate max-w-[200px] sm:max-w-none">{selectedWorkflow.name}</h2>
                    <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Version {selectedWorkflow.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Workflow Details</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-100 dark:border-slate-700/50">
                      <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Description</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedWorkflow.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-100 dark:border-slate-700/50">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Status</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedWorkflow.status)}`}>
                            {selectedWorkflow.status}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-100 dark:border-slate-700/50">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Trigger Type</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedWorkflow.trigger_type}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-100 dark:border-slate-700/50">
                      <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Created</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {new Date(selectedWorkflow.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Workflow Steps</span>
                  </h3>
                  <div className="space-y-3">
                    {selectedWorkflow.steps?.map((step: any, index: number) => (
                      <div key={step.id} className={`bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-4 ${getStatusBgColor(step.status || 'draft')}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{step.step_number}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{step.tool_name}</p>
                              <p className="text-xs text-gray-600 dark:text-slate-400">{step.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        </div>
                      </div>
                    )) || (
                        <div className="text-center py-8">
                          <BarChart3 className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 dark:text-slate-400">No steps defined</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Execution Details Modal */}
        {/* Execution Details Modal (Aesthetic Split-Pane Inspector) */}
        {showExecutionModal && selectedExecution && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 sm:p-6 transition-all duration-300">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800/80 ring-1 ring-black/5">

              {/* Top Header Bar */}
              <div className="flex-none flex items-center justify-between px-6 py-5 bg-white/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 backdrop-blur-md relative z-10">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl flex items-center justify-center ${selectedExecution.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-600' :
                      selectedExecution.status === 'failed' ? 'bg-red-100 dark:bg-red-500/20 text-red-600' :
                        selectedExecution.status === 'running' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 animate-pulse' :
                          'bg-gray-100 dark:bg-slate-800 text-gray-500'
                    }`}>
                    {getStatusIcon(selectedExecution.status)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center space-x-3">
                      <span>Execution Inspector</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${selectedExecution.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                          selectedExecution.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                            selectedExecution.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                              'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-400'
                        }`}>
                        {selectedExecution.status}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                      Execution #{selectedExecution.id} • Triggered by <span className="text-gray-700 dark:text-slate-300 capitalize">{selectedExecution.trigger_type}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Split Body */}
              <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">

                {/* Left Pane: Timeline Drawer */}
                <div className="w-full md:w-1/3 md:min-w-[300px] md:max-w-[400px] border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 shrink-0 md:overflow-y-auto px-6 py-6 md:py-8">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 px-2">Execution Timeline</h3>

                  <div className="relative">
                    {/* Vertical Connector Line */}
                    <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-slate-800 rounded-full" />

                    {/* Overall Overview Node */}
                    <button
                      onClick={() => setSelectedStepId(null)}
                      className={`relative z-10 w-full text-left mb-6 group transition-all duration-200 ${!selectedStepId ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
                    >
                      <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all shadow-sm ${!selectedStepId
                          ? 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-500/30 ring-4 ring-purple-500/10'
                          : 'bg-white/80 dark:bg-slate-800/80 border-gray-100 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-gray-50 dark:border-slate-900 ${selectedExecution.status === 'completed' ? 'bg-green-500 text-white' :
                              selectedExecution.status === 'failed' ? 'bg-red-500 text-white' :
                                selectedExecution.status === 'running' ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' :
                                  'bg-gray-400 text-white'
                            }`}>
                            <Activity className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-sm font-bold truncate ${!selectedStepId ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>Execution Overview</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                              {selectedExecution.started_at ? new Date(selectedExecution.started_at).toLocaleTimeString() : 'Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Step Nodes */}
                    <div className="space-y-4">
                      {stepExecutions.map((stepExecution, index) => {
                        const isSelected = selectedStepId === stepExecution.id;
                        return (
                          <button
                            key={stepExecution.id}
                            onClick={() => setSelectedStepId(stepExecution.id)}
                            className={`relative z-10 w-full text-left group transition-all duration-200 ${isSelected ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
                          >
                            <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all shadow-sm ${isSelected
                                ? 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-500/50 ring-4 ring-blue-500/10'
                                : 'bg-white/80 dark:bg-slate-800/80 border-gray-100 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600'
                              }`}>
                              <div className="flex items-start justify-between w-full min-w-0">
                                <div className="flex items-start space-x-4 flex-1 min-w-0">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-gray-50 dark:border-slate-900 mt-0.5 ${stepExecution.status === 'completed' ? 'bg-green-500 text-white' :
                                      stepExecution.status === 'failed' ? 'bg-red-500 text-white' :
                                        stepExecution.status === 'running' ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' :
                                          'bg-gray-200 dark:bg-slate-700 text-gray-500'
                                    }`}>
                                    {stepExecution.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                      stepExecution.status === 'failed' ? <AlertCircle className="w-3 h-3" /> :
                                        stepExecution.status === 'running' ? <PlayCircle className="w-3 h-3" /> :
                                          <span className="text-[10px] font-bold">{index + 1}</span>}
                                  </div>
                                  <div className="min-w-0 pr-2 flex-1">
                                    <div className="flex items-center space-x-2 w-full">
                                      <h4 
                                        className={`text-sm font-bold truncate flex-1 min-w-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
                                        title={`Step ${stepExecution.step_id}`}
                                      >
                                        Step {stepExecution.step_id}
                                      </h4>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(stepExecution.step_id.toString());
                                        }}
                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-slate-700 transition-colors shrink-0"
                                        title="Copy Step ID"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                                      {stepExecution.status === 'failed' && stepExecution.error_message ? stepExecution.error_message : 'View details...'}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      {stepExecution.started_at && (
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                          {new Date(stepExecution.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                      )}
                                      {stepExecution.retry_count > 0 && (
                                        <span className="text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">
                                          Retry {stepExecution.retry_count}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-300 dark:text-slate-600'}`} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {stepExecutions.length === 0 && (
                        <div className="text-center py-10 px-4 bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                          <Activity className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">No steps executed yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Details Inspector */}
                <div className="flex-1 md:overflow-y-auto bg-white dark:bg-secondary-950 relative min-h-[50vh] md:min-h-0">
                  {(() => {
                    const viewData = selectedStepId
                      ? stepExecutions.find(s => s.id === selectedStepId)
                      : selectedExecution;

                    if (!viewData) return null;

                    return (
                      <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
                        {/* Header Section for Inspector */}
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                            {selectedStepId && 'step_id' in viewData ? `Step ${viewData.step_id} Details` : 'Execution Metadata'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-slate-400">
                            {viewData.started_at && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Started: {new Date(viewData.started_at).toLocaleString()}</span>
                              </div>
                            )}
                            {viewData.completed_at && viewData.started_at && (
                              <div className="flex items-center space-x-1">
                                <Activity className="w-4 h-4" />
                                <span>Duration: {Math.max(0, new Date(viewData.completed_at).getTime() - new Date(viewData.started_at).getTime())}ms</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Error Banner */}
                        {viewData.error_message && (
                          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
                            <div className="flex items-start">
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                              <div className="ml-3">
                                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Execution Error</h3>
                                <p className="text-sm text-red-700 dark:text-red-400/90 mt-1 whitespace-pre-wrap font-mono relative bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50 block w-full overflow-x-auto">
                                  {viewData.error_message}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Input Data Block */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>Input Parameters</span>
                            </h4>
                          </div>
                          {viewData.input_data && Object.keys(viewData.input_data).length > 0 ? (
                            <div className="bg-[#0d1117] rounded-xl shadow-inner border border-gray-800 overflow-hidden relative group">
                              <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-gray-800 flex items-center px-4">
                                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">JSON • request</span>
                              </div>
                              <pre className="p-5 pt-12 text-[#c9d1d9] font-mono text-[13px] leading-relaxed overflow-x-auto">
                                <code>{JSON.stringify(viewData.input_data, null, 2)}</code>
                              </pre>
                            </div>
                          ) : (
                            <div className="p-6 bg-gray-50 dark:bg-slate-800/30 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center">
                              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No input data payload recorded.</p>
                            </div>
                          )}
                        </div>

                        {/* Output Data Block */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span>Output Result</span>
                            </h4>
                          </div>
                          {viewData.output_data && Object.keys(viewData.output_data).length > 0 ? (
                            <div className="bg-[#0d1117] rounded-xl shadow-inner border border-gray-800 overflow-hidden relative group">
                              <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-gray-800 flex items-center px-4">
                                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">JSON • response</span>
                              </div>
                              <pre className="p-5 pt-12 text-[#c9d1d9] font-mono text-[13px] leading-relaxed overflow-x-auto">
                                <code>{JSON.stringify(viewData.output_data, null, 2)}</code>
                              </pre>
                            </div>
                          ) : (
                            <div className="p-6 bg-gray-50 dark:bg-slate-800/30 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center">
                              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No valid output response yet.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && sharingWorkflow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-transparent dark:border-slate-800 transition-colors duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-secondary-800 to-primary-500 dark:from-secondary-800 dark:to-primary-600">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-bold text-white truncate max-w-[150px] sm:max-w-[300px]">{sharingWorkflow.name}</h2>
                    <p className="text-[10px] sm:text-sm text-white/80">Share Workflow</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Visibility Options */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
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
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/50'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div className={`p-2 rounded-lg ${shareVisibility === option.value ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                          }`}>
                          <option.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${shareVisibility === option.value ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>{option.label}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional settings for public/marketplace */}
                {(shareVisibility === 'public' || shareVisibility === 'marketplace') && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Author Display Name
                      </label>
                      <input
                        type="text"
                        value={shareAuthorName}
                        onChange={(e) => setShareAuthorName(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
                        placeholder="Your name or username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={shareCategory}
                        onChange={(e) => setShareCategory(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500 transition-all text-slate-900 dark:text-white outline-none"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={shareTags}
                        onChange={(e) => setShareTags(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
                        placeholder="marketing, slack, reports"
                      />
                    </div>
                  </div>
                )}

                {/* Export Section */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Export as JSON</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                    Export this workflow as a JSON file that can be imported by others.
                    Sensitive data will be automatically removed.
                  </p>

                  {exportedJson ? (
                    <div className="space-y-3">
                      <textarea
                        readOnly
                        value={exportedJson}
                        className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg font-mono text-xs bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-300 outline-none"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCopyExportedJson}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={handleDownloadJson}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
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
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors"
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
              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateVisibility}
                  disabled={sharingLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-secondary-800 to-primary-500 text-white rounded-lg hover:from-secondary-900 hover:to-primary-600 transition-all disabled:opacity-50"
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