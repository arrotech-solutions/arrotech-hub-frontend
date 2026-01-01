import { BarChart3, CheckCircle, FileText, Globe, Palette, Play, Plus, RefreshCw, Search, Settings, Shield, Sparkles, Users, XCircle, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { MCPTool, ToolInfo } from '../types';

const MCPTools: React.FC = () => {
  useAuth();
  const [tools, setTools] = useState<(MCPTool | ToolInfo)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<MCPTool | ToolInfo | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [, setStreamingResult] = useState<any>(null);

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMCPTools();
      const all = response.data || [];
      setTools(all);
      // Compute categories client-side from available tools
      const derived = Array.from(new Set(['all', ...all.map((t: any) => getToolCategory(t.name))]));
      setCategories(derived);
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      toast.error('Failed to load MCP tools');
      setTools([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTool = async () => {
    if (!selectedTool || executing || isStreaming) return;

    try {
      setExecuting(true);
      setIsStreaming(true);
      setStreamingStatus('');
      setStreamingResult(null);
      setExecutionResult(null);

      await apiService.executeToolStream(
        selectedTool.name,
        toolParams,
        // onStatus
        (status: string) => {
          setStreamingStatus(status);
          console.log('Tool execution status:', status);
        },
        // onError
        (error: string) => {
          console.error('Tool execution error:', error);
          toast.error(`Tool execution failed: ${error}`);
          setExecutionResult({ error: error });
        },
        // onComplete
        (result: any) => {
          console.log('Tool execution completed:', result);
          setExecutionResult(result);
          setStreamingResult(result);
          toast.success('Tool executed successfully');
        }
      );
      
    } catch (error) {
      console.error('Error executing tool:', error);
      toast.error('Failed to execute tool');
      setExecutionResult({ error: 'Execution failed' });
    } finally {
      setExecuting(false);
      setIsStreaming(false);
      setStreamingStatus('');
    }
  };

  const openExecuteModal = (tool: MCPTool | ToolInfo) => {
    setSelectedTool(tool);
    setToolParams({});
    setExecutionResult(null);
    setShowExecuteModal(true);
  };

  const getToolIcon = (toolName: string) => {
    const iconMap: Record<string, string> = {
      // Marketing Tools
      hubspot_contact_operations: '👥',
      hubspot_deal_management: '💰',
      hubspot_company_management: '🏢',
      hubspot_analytics: '📊',
      ga4_analytics_dashboard: '📊',
      ga4_user_behavior: '👤',
      ga4_conversion_tracking: '🎯',
      ga4_traffic_analysis: '🚦',
      ga4_ecommerce_data: '🛒',
      slack_team_communication: '💬',
      slack_team_management: '👥',
      slack_report_generator: '📋',
      slack_notification_manager: '🔔',
      marketing_campaign_automation: '📈',
      campaign_performance_tracking: '📊',
      
      // File Management Tools
      file_management: '📁',
      generate_pdf: '📄',
      generate_qr: '📱',
      convert_document: '🔄',
      
      // Web Tools
      web_tools: '🌐',
      scrape_website: '🔍',
      generate_short_link: '🔗',
      generate_tracking_link: '📊',
      check_status: '✅',
      extract_emails: '📧',
      
      // Content Creation Tools
      content_creation: '✍️',
      generate_image: '🖼️',
      create_from_template: '📝',
      generate_bulk_content: '📚',
      optimize_for_seo: '🔍',
      generate_calendar: '📅',
      
      // Advanced Features
      lead_scoring_engine: '🎯',
      customer_journey_mapping: '🗺️',
      predictive_analytics_engine: '🔮',
      ab_testing_platform: '🧪',
      social_media_management: '📱',
      
      // Enterprise Features
      white_label_management: '🏷️',
      workflow_builder: '⚙️',
      api_management: '🔧',
      enterprise_security: '🔒',
      multi_tenant_management: '🏢',
      
      // Default
      default: '🔧'
    };
    
    return iconMap[toolName] || iconMap.default;
  };

  const getToolDescription = (toolName: string) => {
    const descriptionMap: Record<string, string> = {
      // Marketing Tools
      hubspot_contact_operations: 'Manage HubSpot contacts with full CRUD operations',
      hubspot_deal_management: 'Manage HubSpot deals - create, update, track, and analyze deal pipeline',
      hubspot_company_management: 'Manage HubSpot companies and organizations',
      hubspot_analytics: 'Get HubSpot analytics and performance metrics',
      ga4_analytics_dashboard: 'Comprehensive GA4 analytics dashboard with real-time data',
      ga4_user_behavior: 'Analyze user behavior and engagement patterns',
      ga4_conversion_tracking: 'Track conversions and goal completions',
      ga4_traffic_analysis: 'Analyze traffic sources and user acquisition',
      ga4_ecommerce_data: 'Track ecommerce performance and revenue',
      slack_team_communication: 'Send messages and manage team communication',
      slack_team_management: 'Manage Slack teams, channels, and members',
      slack_report_generator: 'Generate automated reports and summaries',
      slack_notification_manager: 'Manage notifications and alerts',
      marketing_campaign_automation: 'Automate marketing campaigns across multiple platforms',
      campaign_performance_tracking: 'Track and analyze campaign performance',
      
      // File Management Tools
      file_management: 'Upload, download, and manage files with various formats',
      generate_pdf: 'Generate PDF documents from content and templates',
      generate_qr: 'Generate QR codes for various purposes',
      convert_document: 'Convert documents between different formats',
      
      // Web Tools
      web_tools: 'Web scraping, link generation, and website analysis tools',
      scrape_website: 'Extract data from websites using selectors',
      generate_short_link: 'Create short URLs for tracking and sharing',
      generate_tracking_link: 'Generate tracking links with analytics',
      check_status: 'Check website status and availability',
      extract_emails: 'Extract email addresses from websites',
      
      // Content Creation Tools
      content_creation: 'Generate images, content, and creative assets',
      generate_image: 'Generate images from text descriptions',
      create_from_template: 'Create content from predefined templates',
      generate_bulk_content: 'Generate multiple content variations',
      optimize_for_seo: 'Optimize content for search engines',
      generate_calendar: 'Generate content calendars and schedules',
      
      // Advanced Features
      lead_scoring_engine: 'Score and qualify leads using AI algorithms',
      customer_journey_mapping: 'Map and analyze customer journeys',
      predictive_analytics_engine: 'Predict customer behavior and outcomes',
      ab_testing_platform: 'Run A/B tests and analyze results',
      social_media_management: 'Manage social media campaigns and content',
      
      // Enterprise Features
      white_label_management: 'Manage white-label branding and deployments',
      workflow_builder: 'Build and manage automated workflows',
      api_management: 'Manage API keys, rate limits, and developer portals',
      enterprise_security: 'Enterprise security policies and encryption',
      multi_tenant_management: 'Manage multi-tenant environments',
      
      // Default
      default: 'Tool for various operations and integrations'
    };
    
    return descriptionMap[toolName] || descriptionMap.default;
  };

  const toolCategories: Record<string, string> = {
    // Slack tools
    slack_team_communication: 'communication',
    slack_team_management: 'communication',
    slack_file_management: 'communication',
    slack_reactions: 'communication',
    slack_search: 'communication',
    slack_user_management: 'communication',
    slack_pins: 'communication',
    slack_ai_agents: 'communication',
    slack_file_operations: 'communication',
    slack_link_management: 'communication',
    slack_workflows: 'communication',
    slack_webhooks: 'communication',
    slack_user_context: 'communication',
    slack_advanced_features: 'communication',
    slack_admin_tools: 'communication',
    slack_channel_analytics: 'communication',
    slack_search_discovery: 'communication',
    slack_workspace_management: 'communication',
    // Other tools
    hubspot_contact_operations: 'crm',
    hubspot_deal_management: 'crm',
    hubspot_analytics: 'analytics',
    ga4_analytics_dashboard: 'analytics',
    whatsapp_messaging: 'communication',
    file_management: 'utilities',
    web_tools: 'utilities',
    content_creation: 'content',
    payment_processing: 'finance',
    social_media_tools: 'social'
  };

  const getToolCategory = (toolName: string) => {
    return toolCategories[toolName] || 'general';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      marketing: <BarChart3 className="w-4 h-4" />,
      communication: <Users className="w-4 h-4" />,
      file_management: <FileText className="w-4 h-4" />,
      web_tools: <Globe className="w-4 h-4" />,
      content_creation: <Palette className="w-4 h-4" />,
      advanced: <Zap className="w-4 h-4" />,
      enterprise: <Shield className="w-4 h-4" />,
      general: <Settings className="w-4 h-4" />
    };
    return iconMap[category] || iconMap.general;
  };

  const getToolStatus = (tool: MCPTool | ToolInfo) => {
    return tool.status || 'unavailable';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'unavailable':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryMap: Record<string, string> = {
      marketing: 'bg-blue-100 text-blue-800',
      communication: 'bg-green-100 text-green-800',
      file_management: 'bg-purple-100 text-purple-800',
      web_tools: 'bg-orange-100 text-orange-800',
      content_creation: 'bg-pink-100 text-pink-800',
      advanced: 'bg-indigo-100 text-indigo-800',
      enterprise: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return categoryMap[category] || categoryMap.general;
  };

  const renderInputField = (name: string, schema: any) => {
    const fieldType = schema.type || 'string';
    const isRequired = schema.required?.includes(name) || false;
    const enumValues = schema.enum || [];
    const defaultValue = schema.default;

    switch (fieldType) {
      case 'string':
        if (enumValues.length > 0) {
          return (
            <select
              key={name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={toolParams[name] || defaultValue || ''}
              onChange={(e) => setToolParams({ ...toolParams, [name]: e.target.value })}
              required={isRequired}
            >
              <option value="">Select {name}</option>
              {enumValues.map((value: string) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          );
        }
        return (
          <input
            key={name}
            type="text"
            placeholder={`Enter ${name}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={toolParams[name] || defaultValue || ''}
            onChange={(e) => setToolParams({ ...toolParams, [name]: e.target.value })}
            required={isRequired}
          />
        );
      
      case 'integer':
        return (
          <input
            key={name}
            type="number"
            placeholder={`Enter ${name}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={toolParams[name] || defaultValue || ''}
            onChange={(e) => setToolParams({ ...toolParams, [name]: parseInt(e.target.value) || 0 })}
            required={isRequired}
          />
        );
      
      case 'boolean':
        return (
          <select
            key={name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={toolParams[name]?.toString() || defaultValue?.toString() || 'false'}
            onChange={(e) => setToolParams({ ...toolParams, [name]: e.target.value === 'true' })}
            required={isRequired}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case 'array':
        // User-friendly list/tag input for non-technical users
        const arrayValue = Array.isArray(toolParams[name]) ? toolParams[name] : [];
        
        return (
          <div key={name} className="space-y-2">
            {/* Display current items as tags */}
            {arrayValue.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {arrayValue.map((item: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => {
                        const newArr = [...arrayValue];
                        newArr.splice(idx, 1);
                        setToolParams({ ...toolParams, [name]: newArr });
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Add new item input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Add ${schema.items?.title || 'item'}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      setToolParams({ ...toolParams, [name]: [...arrayValue, input.value.trim()] });
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  if (input.value.trim()) {
                    setToolParams({ ...toolParams, [name]: [...arrayValue, input.value.trim()] });
                    input.value = '';
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">💡 Press Enter or click + to add items</p>
          </div>
        );
      
      case 'object':
        // User-friendly key-value editor for non-technical users
        const objectValue = typeof toolParams[name] === 'object' ? toolParams[name] : {};
        const objectEntries = Object.entries(objectValue);
        
        return (
          <div key={name} className="space-y-2">
            {/* Simple Mode: Key-Value Pairs */}
            <div className="space-y-2">
              {objectEntries.length > 0 ? (
                objectEntries.map(([key, val], idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Key"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={key}
                      onChange={(e) => {
                        const newObj = { ...objectValue };
                        delete newObj[key];
                        newObj[e.target.value] = val;
                        setToolParams({ ...toolParams, [name]: newObj });
                      }}
                    />
                    <span className="text-gray-400">=</span>
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={String(val)}
                      onChange={(e) => {
                        setToolParams({ ...toolParams, [name]: { ...objectValue, [key]: e.target.value } });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newObj = { ...objectValue };
                        delete newObj[key];
                        setToolParams({ ...toolParams, [name]: newObj });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No entries yet. Add key-value pairs below.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  const newKey = `key${objectEntries.length + 1}`;
                  setToolParams({ ...toolParams, [name]: { ...objectValue, [newKey]: '' } });
                }}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
            </div>
            
            {/* Advanced Mode Toggle */}
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Advanced: Edit as JSON
              </summary>
              <textarea
                placeholder={`Enter ${name} (JSON format)`}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                value={typeof toolParams[name] === 'object' ? JSON.stringify(toolParams[name], null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setToolParams({ ...toolParams, [name]: parsed });
                  } catch {
                    // Keep current value if JSON is invalid
                  }
                }}
                rows={4}
              />
            </details>
          </div>
        );
      
      default:
        return (
          <input
            key={name}
            type="text"
            placeholder={`Enter ${name}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={toolParams[name] || ''}
            onChange={(e) => setToolParams({ ...toolParams, [name]: e.target.value })}
            required={isRequired}
          />
        );
    }
  };

  const renderToolParameters = () => {
    if (!selectedTool) return null;

    const inputSchema = selectedTool.inputSchema;
    if (!inputSchema || !inputSchema.properties) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Parameters</h3>
        <div className="space-y-3">
          {Object.entries(inputSchema.properties).map(([name, schema]: [string, any]) => (
            <div key={name} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
                {inputSchema.required?.includes(name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderInputField(name, schema)}
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getFilteredTools = () => {
    const allTools: (MCPTool | ToolInfo)[] = tools;
    return allTools.filter(tool => {
      const matchesCategory = filterCategory === 'all' || 
        (tool.category && tool.category === filterCategory) ||
        getToolCategory(tool.name) === filterCategory;
      
      const matchesSearch = searchTerm === '' || 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  };

  const filteredTools = getFilteredTools();

  // Calculate stats
  const stats = [
    {
      label: 'Total Tools',
      value: tools.length,
      change: 0,
      icon: Sparkles,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Available',
      value: tools.filter(tool => getToolStatus(tool) === 'available').length,
      change: 0,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      label: 'Categories',
      value: categories.length - 1, // Exclude 'all'
      change: 0,
      icon: BarChart3,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      label: 'Executions',
      value: 0,
      change: 0,
      icon: Play,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mcptools-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MCP Tools</h1>
              <p className="mt-2 text-gray-600">
                Execute AI-powered tools and integrations. Tools are dynamically generated based on your connections.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTools}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mcptools-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mcptools-filters bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                      filterCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Tools' : category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mcptools-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.name}
              className="tool-card bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getToolIcon(tool.name)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tool.name.replace(/_/g, ' ')}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(getToolStatus(tool))}
                      <span className={`text-sm ${getStatusColor(getToolStatus(tool))}`}>
                        {getToolStatus(tool)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(getToolCategory(tool.name))}`}>
                  {getToolCategory(tool.name).replace(/_/g, ' ')}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {getToolDescription(tool.name)}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {getCategoryIcon(getToolCategory(tool.name))}
                  <span>{getToolCategory(tool.name).replace(/_/g, ' ')}</span>
                </div>
                <button
                  onClick={() => openExecuteModal(tool)}
                  disabled={getToolStatus(tool) !== 'available'}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">🔧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
            <p className="text-gray-600">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No tools are currently available. Check your connections to see available tools.'
              }
            </p>
          </div>
        )}

        {/* Execute Tool Modal */}
        {showExecuteModal && selectedTool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Execute: {selectedTool.name.replace(/_/g, ' ')}
                  </h2>
                  <button
                    onClick={() => setShowExecuteModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">{getToolDescription(selectedTool.name)}</p>
              </div>

              <div className="p-6">
                {renderToolParameters()}

                {/* Streaming Status */}
                {isStreaming && streamingStatus && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-blue-700 font-medium">{streamingStatus}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleExecuteTool}
                    disabled={executing || isStreaming}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {executing || isStreaming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{executing ? 'Executing...' : 'Streaming...'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Execute Tool</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowExecuteModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {executionResult && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-2">Result</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify(executionResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPTools; 