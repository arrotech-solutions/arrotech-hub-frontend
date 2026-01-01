import {
  Activity,
  AlertCircle,
  BarChart3,
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
  History,
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
  Target,
  Trash2,
  Upload,
  Users,
  Workflow,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ExecuteWorkflowModal from '../components/ExecuteWorkflowModal';
import apiService from '../services/api';
import {
  WorkflowCreateRequest,
  WorkflowExecuteRequest,
  WorkflowExecution,
  WorkflowStepExecution,
  WorkflowVisibility,
  Workflow as WorkflowType
} from '../types';

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [newWorkflow, setNewWorkflow] = useState<WorkflowCreateRequest>({
    description: '',
    name: ''
  });
  const [, setExecuteData] = useState<WorkflowExecuteRequest>({
    workflow_id: 0,
    input_data: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions'>('workflows');
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

  const loadWorkflowExecutions = async (workflowId: number) => {
    try {
      const response = await apiService.getWorkflowExecutions(workflowId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Error loading workflow executions:', error);
      return [];
    }
  };

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

  const handleCreateWorkflow = async () => {
    try {
      if (!newWorkflow.name?.trim()) {
        toast.error('Please provide a workflow name');
        return;
      }
      if (!newWorkflow.description?.trim()) {
        toast.error('Please provide a workflow description');
        return;
      }

      const response = await apiService.createWorkflow(newWorkflow);
      if (response.success) {
        toast.success('Workflow created successfully');
        setShowCreateModal(false);
        setNewWorkflow({ description: '', name: '' });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
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
        return <XCircle className="w-4 h-4" />;
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
                  <XCircle className="w-3 h-3" />
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
    <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-500">Version {workflow.version}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(workflow.status)}`}>
            {getStatusIcon(workflow.status)}
            <span className="capitalize">{workflow.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workflow.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>{workflow.steps?.length || 0} steps</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>{workflow.trigger_type}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setExecutingWorkflow(workflow);
                setExecuteData({ workflow_id: workflow.id, input_data: {} });
                setShowExecuteModal(true);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
            >
              <Play className="w-3 h-3" />
              <span>Execute</span>
            </button>
            <button
              onClick={() => setSelectedWorkflow(workflow)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
            <button
              onClick={async () => {
                const executions = await loadWorkflowExecutions(workflow.id);
                if (executions && executions.length > 0) {
                  setExecutions(executions);
                  setActiveTab('executions');
                } else {
                  toast('No executions found for this workflow', { icon: 'ℹ️' });
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <History className="w-3 h-3" />
              <span>History</span>
            </button>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => openShareModal(workflow)}
              className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors rounded"
              title="Share workflow"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {/* Handle edit */}}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteWorkflow(workflow.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkflowList = (workflow: WorkflowType) => (
    <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {workflow.name}
                </h3>
                <span className="text-sm text-gray-500">v{workflow.version}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{workflow.steps?.length || 0} steps</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>{workflow.trigger_type}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getStatusColor(workflow.status)}`}>
              {getStatusIcon(workflow.status)}
              <span className="capitalize">{workflow.status}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setExecutingWorkflow(workflow);
                  setExecuteData({ workflow_id: workflow.id, input_data: {} });
                  setShowExecuteModal(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
              >
                <Play className="w-3 h-3" />
                <span>Execute</span>
              </button>
              <button
                onClick={() => setSelectedWorkflow(workflow)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              <button
                onClick={async () => {
                  const executions = await loadWorkflowExecutions(workflow.id);
                  if (executions && executions.length > 0) {
                    setExecutions(executions);
                    setActiveTab('executions');
                  } else {
                    toast('No executions found for this workflow', { icon: 'ℹ️' });
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <History className="w-3 h-3" />
                <span>History</span>
              </button>
              <button
                onClick={() => handleDeleteWorkflow(workflow.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="workflows-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Workflows
              </h1>
              <p className="text-gray-600">
                Create and manage automated workflows
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('Manual reload triggered');
                  loadWorkflows();
                }}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reload</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="workflow-builder flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Create Workflow</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="workflows-tabs bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'workflows'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Workflow className="w-5 h-5" />
              <span className="font-medium">Workflows</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                activeTab === 'workflows'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'executions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              <span className="font-medium">Executions</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                activeTab === 'executions'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {stats.executions}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`workflows-stats grid grid-cols-1 md:grid-cols-4 gap-4 mb-8`}>
          {activeTab === 'workflows' ? (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Workflow className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Edit className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Executions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.executions}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <PlayCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Running</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{executions.filter(e => e.status === 'completed').length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters and Search */}
        <div className="workflows-filters bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showFilters && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
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
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Workflow className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Create your first workflow to automate your business processes and save time.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredWorkflows.map(viewMode === 'grid' ? renderWorkflowCard : renderWorkflowList)}
            </div>
          )
        ) : (
          filteredExecutions.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <PlayCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No executions found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Execute some workflows to see their execution history here.'
                }
              </p>
              <button
                onClick={() => setActiveTab('workflows')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
              >
                <Workflow className="w-5 h-5 inline mr-2" />
                View Workflows
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredExecutions.map(renderExecutionCard)}
            </div>
          )
        )}

        {/* Create Workflow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Create New Workflow</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
                  <input
                    type="text"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe what this workflow should do..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedWorkflow.name}</h2>
                    <p className="text-sm text-gray-600">Version {selectedWorkflow.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Execution Details</h2>
                    <p className="text-sm text-gray-600">Execution #{selectedExecution.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExecutionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
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
                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-all text-left ${
                          shareVisibility === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          shareVisibility === option.value ? 'bg-purple-100' : 'bg-gray-100'
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
    </div>
  );
};

export default Workflows;