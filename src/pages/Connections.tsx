import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Edit,
  FileText,
  Globe,
  Grid,
  List,
  MessageCircle,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  TestTube,
  Trash2,
  Users,
  X,
  Zap,
  ShoppingBag,
  Truck,
  Leaf,
  Activity,
  Droplets,
  CreditCard,
  TrendingUp,
  Wallet
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import apiService from '../services/api';
import { Connection, ConnectionCreate, ConnectionPlatform, PlatformCapability } from '../types';

const Connections: React.FC = () => {
  const { user } = useAuth();
  const { hasConnectionAccess, tier } = useSubscription();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platforms, setPlatforms] = useState<ConnectionPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ConnectionPlatform | null>(null);
  const [formData, setFormData] = useState<ConnectionCreate>({
    platform: '',
    name: '',
    config: {}
  });
  const [jsonErrors, setJsonErrors] = useState<{ [key: string]: string }>({});
  const processedCallback = useRef(false);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [syncingConnection, setSyncingConnection] = useState<number | null>(null);
  const [oauthInProgress, setOauthInProgress] = useState<number | null>(null);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0
  });
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  const fetchConnections = useCallback(async () => {
    try {
      const response = await apiService.getConnections();
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    try {
      const response = await apiService.getAvailablePlatforms();
      console.log('[DEBUG] Raw platform response:', response);

      // The API service already handles the data extraction
      const platformsData = response.data || [];
      console.log('[DEBUG] Extracted platforms data:', platformsData);
      console.log('[DEBUG] Loaded platforms:', platformsData.map(p => p.id));

      setPlatforms(platformsData);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast.error('Failed to load available platforms');
      setPlatforms([]); // Set empty array to prevent undefined errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback from Google Workspace
  const handleOAuthCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Check if this is an OAuth callback
    if (code && state) {
      // Prevent double execution
      if (processedCallback.current) return;
      processedCallback.current = true;

      try {
        toast.loading('Completing Google Workspace connection...', { id: 'oauth-callback' });

        // Send the authorization code to backend
        const response = await apiService.getGoogleWorkspaceCallback(code, state);

        if (response.success) {
          toast.success(`Google Workspace connected successfully!`, { id: 'oauth-callback' });
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          // Refresh connections
          fetchConnections();
        } else {
          toast.error(response.error || 'Failed to complete connection', { id: 'oauth-callback' });
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        toast.error(err?.response?.data?.detail || 'Failed to connect Google Workspace', { id: 'oauth-callback' });
      }
    } else if (error) {
      toast.error(`Google authorization failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchConnections]);

  useEffect(() => {
    fetchConnections();
    fetchPlatforms();
    handleOAuthCallback();
  }, [fetchConnections, fetchPlatforms, handleOAuthCallback]);

  useEffect(() => {
    // Calculate stats when connections change
    const total = connections.length;
    const active = connections.filter(c => c.status === 'active').length;
    const inactive = connections.filter(c => c.status === 'inactive').length;
    const error = connections.filter(c => c.status === 'error').length;

    setStats({ total, active, inactive, error });
  }, [connections]);

  // Stats data for display
  const statsData = [
    {
      label: 'Total Connections',
      value: stats.total,
      change: 12,
      icon: Globe,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      label: 'Active',
      value: stats.active,
      change: 8,
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      change: -5,
      icon: Pause,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    {
      label: 'Errors',
      value: stats.error,
      change: -2,
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-red-500 to-red-600'
    }
  ];



  const handleCreateConnection = async () => {
    // Check if there are any JSON errors
    const hasJsonErrors = Object.values(jsonErrors).some(error => error !== '');
    if (hasJsonErrors) {
      toast.error('Please fix JSON formatting errors before preserving the connection');
      return;
    }

    try {
      if (editingConnection) {
        await apiService.updateConnection(editingConnection.id, {
          name: formData.name,
          config: formData.config,
          status: editingConnection.status
        });
        toast.success('Connection updated successfully');
      } else {
        await apiService.createConnection(formData);
        toast.success('Connection created successfully');
      }

      setShowCreateModal(false);
      setEditingConnection(null);
      setFormData({ platform: '', name: '', config: {} });
      setJsonErrors({});
      fetchConnections();
    } catch (error: any) {
      console.error('Error preserving connection:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = detail.message || detail.error || JSON.stringify(detail);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(`Failed to preserve connection: ${errorMessage}`);
    }
  };

  const handleEditConnection = (connection: Connection) => {
    const platform = platforms.find(p => p.id === connection.platform);
    if (!platform) {
      toast.error('Platform details not found');
      return;
    }

    setEditingConnection(connection);
    setSelectedPlatform(platform);
    setFormData({
      platform: connection.platform,
      name: connection.name,
      config: connection.config || {}
    });
    setJsonErrors({});
    setShowCreateModal(true);
  };

  const handleDeleteConnection = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await apiService.deleteConnection(id);
        toast.success('Connection deleted successfully');
        fetchConnections();
      } catch (error) {
        console.error('Error deleting connection:', error);
        toast.error('Failed to delete connection');
      }
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      setTestingConnection(id);

      const response = await apiService.testConnection(id);
      console.log('[DEBUG] Test connection response:', response);

      const responseData = response.data as any;

      // Standard connection test handling
      if (response.data.status === 'active' || responseData?.test_result?.success) {
        toast.success('Connection test successful');
      } else {
        const errorMsg = responseData?.test_result?.error || response.data?.message || 'Connection test failed';
        toast.error(`Connection test failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      toast.error(`Failed to test connection: ${errorMessage}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const clearOauthState = (connectionId: number) => {
    setOauthInProgress(prev => prev === connectionId ? null : prev);
    toast('OAuth state cleared');
  };

  const handleSyncConnection = async (id: number) => {
    try {
      setSyncingConnection(id);

      const connection = connections.find(c => c.id === id);
      if (!connection) {
        toast.error('Connection not found');
        return;
      }

      // Use updateConnection to mark as syncing, then refresh
      await apiService.updateConnection(id, {
        name: connection.name,
        config: connection.config,
        status: 'syncing'
      });
      toast.success('Connection sync initiated');
      fetchConnections();
    } catch (error) {
      console.error('Error syncing connection:', error);
      toast.error('Failed to sync connection');
    } finally {
      setSyncingConnection(null);
    }
  };

  // getStatusIcon is defined but never used in this component scope, removing to satisfy ESLint
  /* 
  const getStatusIcon = (status: string) => {
    ...
  };
  */

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'pending':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      hubspot: <Globe className="w-5 h-5" />,
      ga4: <BarChart3 className="w-5 h-5" />,
      slack: <MessageCircle className="w-5 h-5" />,
      mcp_remote: <Settings className="w-5 h-5" />,
      whatsapp: <MessageCircle className="w-5 h-5" />,
      facebook: <Users className="w-5 h-5" />,
      twitter: <MessageCircle className="w-5 h-5" />,
      linkedin: <Users className="w-5 h-5" />,
      instagram: <Users className="w-5 h-5" />,
      powerbi: <BarChart3 className="w-5 h-5" />,
      asana: <FileText className="w-5 h-5" />,
      zoom: <MessageCircle className="w-5 h-5" />,
      teams: <Users className="w-5 h-5" />,
      salesforce: <Database className="w-5 h-5" />,
      google_workspace: <Globe className="w-5 h-5" />,
      hr_hub: <Users className="w-5 h-5" />,
      logistics_hub: <Globe className="w-5 h-5" />,
      lead_intelligence: <Zap className="w-5 h-5" />,
      context_intelligence: <Shield className="w-5 h-5" />,
      mpesa: <Wallet className="w-5 h-5" />,
      // New Kenyan Platforms
      airtel_money: <Wallet className="w-5 h-5" />,
      t_kash: <Wallet className="w-5 h-5" />,
      equity_jenga: <CreditCard className="w-5 h-5" />,
      flutterwave: <CreditCard className="w-5 h-5" />,
      paystack: <CreditCard className="w-5 h-5" />,
      kopokopo: <CreditCard className="w-5 h-5" />,
      cellulant: <CreditCard className="w-5 h-5" />,
      pesapal: <CreditCard className="w-5 h-5" />,
      ipay: <CreditCard className="w-5 h-5" />,
      little_pay: <Truck className="w-5 h-5" />,
      jumia: <ShoppingBag className="w-5 h-5" />,
      kilimall: <ShoppingBag className="w-5 h-5" />,
      jiji: <ShoppingBag className="w-5 h-5" />,
      masoko: <ShoppingBag className="w-5 h-5" />,
      copia: <ShoppingBag className="w-5 h-5" />,
      twiga_foods: <ShoppingBag className="w-5 h-5" />,
      wasoko: <ShoppingBag className="w-5 h-5" />,
      sky_garden: <ShoppingBag className="w-5 h-5" />,
      kra_itax: <TrendingUp className="w-5 h-5" />,
      quickbooks_ke: <TrendingUp className="w-5 h-5" />,
      xero_ke: <TrendingUp className="w-5 h-5" />,
      zoho_books_ke: <TrendingUp className="w-5 h-5" />,
      lipabiz: <TrendingUp className="w-5 h-5" />,
      sasapay: <Wallet className="w-5 h-5" />,
      vyapar: <TrendingUp className="w-5 h-5" />,
      amitruck: <Truck className="w-5 h-5" />,
      lori_systems: <Truck className="w-5 h-5" />,
      sendy: <Truck className="w-5 h-5" />,
      boda: <Truck className="w-5 h-5" />,
      pick_up: <Truck className="w-5 h-5" />,
      m_post: <Truck className="w-5 h-5" />,
      workpay: <Users className="w-5 h-5" />,
      seamless_hr: <Users className="w-5 h-5" />,
      charlie_hr: <Users className="w-5 h-5" />,
      bamboo_hr_ke: <Users className="w-5 h-5" />,
      shamba_smart: <Leaf className="w-5 h-5" />,
      digifarm: <Leaf className="w-5 h-5" />,
      twiga_agri: <Leaf className="w-5 h-5" />,
      m_farm: <Leaf className="w-5 h-5" />,
      hello_tractor: <Leaf className="w-5 h-5" />,
      isoko: <Leaf className="w-5 h-5" />,
      mydawa: <Activity className="w-5 h-5" />,
      penda_health: <Activity className="w-5 h-5" />,
      tibu_health: <Activity className="w-5 h-5" />,
      m_tiba: <Activity className="w-5 h-5" />,
      sasadoctor: <Activity className="w-5 h-5" />,
      kplc: <Zap className="w-5 h-5" />,
      nairobi_water: <Droplets className="w-5 h-5" />,
      dstv_ke: <Zap className="w-5 h-5" />,
      zuku: <Zap className="w-5 h-5" />,
      default: <Settings className="w-5 h-5" />
    };
    return iconMap[platformId] || iconMap.default;
  };

  const getPlatformColor = (platformId: string) => {
    const colorMap: { [key: string]: string } = {
      hubspot: 'bg-orange-100 text-orange-800',
      ga4: 'bg-blue-100 text-blue-800',
      slack: 'bg-purple-100 text-purple-800',
      mcp_remote: 'bg-gray-100 text-gray-800',
      whatsapp: 'bg-green-100 text-green-800',
      facebook: 'bg-blue-100 text-blue-800',
      twitter: 'bg-blue-100 text-blue-800',
      linkedin: 'bg-blue-100 text-blue-800',
      instagram: 'bg-pink-100 text-pink-800',
      powerbi: 'bg-yellow-100 text-yellow-800',
      asana: 'bg-orange-100 text-orange-800',
      zoom: 'bg-blue-100 text-blue-800',
      teams: 'bg-purple-100 text-purple-800',
      salesforce: 'bg-blue-100 text-blue-800',
      google_workspace: 'bg-blue-100 text-blue-800',
      hr_hub: 'bg-indigo-100 text-indigo-800',
      logistics_hub: 'bg-emerald-100 text-emerald-800',
      lead_intelligence: 'bg-amber-100 text-amber-800',
      context_intelligence: 'bg-cyan-100 text-cyan-800',
      mpesa: 'bg-green-100 text-green-800',
      // New Kenyan Platforms
      airtel_money: 'bg-red-100 text-red-800',
      t_kash: 'bg-blue-100 text-blue-800',
      equity_jenga: 'bg-brown-100 text-brown-800',
      flutterwave: 'bg-orange-100 text-orange-800',
      paystack: 'bg-teal-100 text-teal-800',
      kopokopo: 'bg-purple-100 text-purple-800',
      cellulant: 'bg-indigo-100 text-indigo-800',
      pesapal: 'bg-red-100 text-red-800',
      ipay: 'bg-blue-100 text-blue-800',
      little_pay: 'bg-yellow-100 text-yellow-800',
      jumia: 'bg-orange-100 text-orange-800',
      kilimall: 'bg-blue-100 text-blue-800',
      jiji: 'bg-green-100 text-green-800',
      masoko: 'bg-blue-100 text-blue-800',
      copia: 'bg-red-100 text-red-800',
      twiga_foods: 'bg-orange-100 text-orange-800',
      wasoko: 'bg-blue-100 text-blue-800',
      sky_garden: 'bg-purple-100 text-purple-800',
      kra_itax: 'bg-red-100 text-red-800',
      quickbooks_ke: 'bg-green-100 text-green-800',
      xero_ke: 'bg-blue-100 text-blue-800',
      zoho_books_ke: 'bg-red-100 text-red-800',
      lipabiz: 'bg-blue-100 text-blue-800',
      sasapay: 'bg-indigo-100 text-indigo-800',
      vyapar: 'bg-red-100 text-red-800',
      amitruck: 'bg-orange-100 text-orange-800',
      lori_systems: 'bg-blue-100 text-blue-800',
      sendy: 'bg-blue-100 text-blue-800',
      boda: 'bg-yellow-100 text-yellow-800',
      pick_up: 'bg-green-100 text-green-800',
      m_post: 'bg-blue-100 text-blue-800',
      workpay: 'bg-indigo-100 text-indigo-800',
      seamless_hr: 'bg-blue-100 text-blue-800',
      charlie_hr: 'bg-orange-100 text-orange-800',
      bamboo_hr_ke: 'bg-green-100 text-green-800',
      shamba_smart: 'bg-green-100 text-green-800',
      digifarm: 'bg-blue-100 text-blue-800',
      twiga_agri: 'bg-orange-100 text-orange-800',
      m_farm: 'bg-green-100 text-green-800',
      hello_tractor: 'bg-orange-100 text-orange-800',
      isoko: 'bg-blue-100 text-blue-800',
      mydawa: 'bg-red-100 text-red-800',
      penda_health: 'bg-blue-100 text-blue-800',
      tibu_health: 'bg-indigo-100 text-indigo-800',
      m_tiba: 'bg-blue-100 text-blue-800',
      sasadoctor: 'bg-green-100 text-green-800',
      kplc: 'bg-yellow-100 text-yellow-800',
      nairobi_water: 'bg-blue-100 text-blue-800',
      dstv_ke: 'bg-blue-100 text-blue-800',
      zuku: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colorMap[platformId] || colorMap.default;
  };

  const togglePlatformExpansion = (platformId: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platformId)) {
      newExpanded.delete(platformId);
    } else {
      newExpanded.add(platformId);
    }
    setExpandedPlatforms(newExpanded);
  };

  const renderPlatformCapabilities = (capabilities: PlatformCapability[], platformId: string, isExpanded: boolean) => {
    const maxCapabilities = 3;
    const displayCapabilities = isExpanded ? capabilities : capabilities.slice(0, maxCapabilities);
    const hasMore = capabilities.length > maxCapabilities;

    return (
      <div className="space-y-2">
        {displayCapabilities.map((capability, index) => (
          <div key={index} className="flex items-start space-x-2 text-sm">
            <Zap className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium">{capability.name}:</span>
              <span className="text-gray-600 ml-1">{capability.description}</span>
            </div>
          </div>
        ))}
        {hasMore && !isExpanded && (
          <div className="text-xs text-gray-500">
            +{capabilities.length - maxCapabilities} more capabilities
          </div>
        )}
      </div>
    );
  };

  const renderPlatformFeatures = (features: string[], platformId: string, isExpanded: boolean) => {
    const maxFeatures = 6;
    const displayFeatures = isExpanded ? features : features.slice(0, maxFeatures);
    const hasMore = features.length > maxFeatures;

    return (
      <div className="flex flex-wrap gap-1">
        {displayFeatures.map((feature, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {feature}
          </span>
        ))}
        {hasMore && !isExpanded && (
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200">
            +{features.length - maxFeatures} more
          </span>
        )}
      </div>
    );
  };

  const renderConfigFields = (platform: ConnectionPlatform) => {
    // Dynamic form for all platforms
    const configSchema = platform.config_schema?.properties || {};

    const renderField = (name: string, schema: any) => {
      const fieldType = schema.type || 'text';
      const isRequired = platform.config_schema?.required?.includes(name) || false;
      const colSpanClass = (fieldType === 'object' || name.toLowerCase().includes('headers')) ? 'md:col-span-2' : '';

      // Transport-aware rendering for mcp_remote
      const isMcpRemote = platform.id === 'mcp_remote';
      // Note: transport value is accessed via formData.config['transport'] in render
      void isMcpRemote; // Mark as intentionally unused here

      switch (fieldType) {
        case 'string':
          if (schema.enum && Array.isArray(schema.enum)) {
            return (
              <div key={name} className={`space-y-2 ${colSpanClass}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {schema.title || name}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={formData.config[name] ?? (schema.default ?? '')}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select {schema.title || name}</option>
                  {schema.enum.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {schema.description && (
                  <p className="text-xs text-gray-500">{schema.description}</p>
                )}
              </div>
            );
          }
          if (schema.format === 'password') {
            return (
              <div key={name} className={`space-y-2 ${colSpanClass}`}>
                <label className="block text-sm font-medium text-gray-700">
                  {schema.title || name}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="password"
                  placeholder={schema.description || `Enter ${schema.title || name}`}
                  value={formData.config[name] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {schema.description && (
                  <p className="text-xs text-gray-500">{schema.description}</p>
                )}
              </div>
            );
          }
          return (
            <div key={name} className={`space-y-2 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({
                    ...formData,
                    config: { ...formData.config, [name]: newValue }
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );

        case 'number':
        case 'integer':
          return (
            <div key={name} className={`space-y-2 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="number"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );

        case 'boolean':
          return (
            <div key={name} className={`flex items-center space-x-3 ${colSpanClass}`}>
              <input
                type="checkbox"
                id={name}
                checked={formData.config[name] || false}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={name} className="text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {schema.description && (
                <p className="text-xs text-gray-500 ml-7">{schema.description}</p>
              )}
            </div>
          );

        case 'object':
          // User-friendly key-value editor for non-technical users
          const jsonError = jsonErrors[name] || '';
          const objectValue = formData.config[name] && typeof formData.config[name] === 'object' ? formData.config[name] : {};
          const objectEntries = Object.entries(objectValue);

          return (
            <div key={name} className={`space-y-3 ${colSpanClass}`}>
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>

              {/* Simple Mode: Key-Value Pairs */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {isMcpRemote && name === 'headers' ? 'HTTP Headers' :
                      isMcpRemote && name === 'env' ? 'Environment Variables' :
                        'Configuration Entries'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {objectEntries.length} {objectEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {objectEntries.length > 0 ? (
                  <div className="space-y-2">
                    {objectEntries.map(([key, val], idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-200">
                        <input
                          type="text"
                          placeholder={isMcpRemote && name === 'headers' ? 'Header Name' : 'Key'}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={key}
                          onChange={(e) => {
                            const newObj = { ...objectValue };
                            delete newObj[key];
                            newObj[e.target.value] = val;
                            setFormData({ ...formData, config: { ...formData.config, [name]: newObj } });
                          }}
                        />
                        <span className="text-gray-400 font-mono">=</span>
                        <input
                          type={name === 'env' || name === 'headers' ? 'text' : 'text'}
                          placeholder={isMcpRemote && name === 'headers' ? 'Header Value' : 'Value'}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={String(val)}
                          onChange={(e) => {
                            setFormData({ ...formData, config: { ...formData.config, [name]: { ...objectValue, [key]: e.target.value } } });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newObj = { ...objectValue };
                            delete newObj[key];
                            setFormData({ ...formData, config: { ...formData.config, [name]: newObj } });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-all"
                          title="Remove entry"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No entries yet</p>
                    <p className="text-xs mt-1">Click "Add Entry" to add key-value pairs</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const newKey = isMcpRemote && name === 'headers' ? 'X-Custom-Header' :
                      isMcpRemote && name === 'env' ? 'MY_VARIABLE' :
                        `key${objectEntries.length + 1}`;
                    setFormData({ ...formData, config: { ...formData.config, [name]: { ...objectValue, [newKey]: '' } } });
                  }}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </button>
              </div>

              {/* Hints for specific fields */}
              {isMcpRemote && name === 'headers' && (
                <p className="text-xs text-gray-500">💡 Common headers: Authorization, Content-Type, X-API-Key</p>
              )}
              {isMcpRemote && name === 'env' && (
                <p className="text-xs text-gray-500">💡 Environment variables for the connection process</p>
              )}
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}

              {/* Advanced Mode Toggle for developers */}
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  🔧 Advanced: Edit as JSON (for developers)
                </summary>
                <div className="mt-2">
                  <textarea
                    placeholder={schema.description || `Enter ${schema.title || name} as JSON`}
                    value={formData.config[name] ? JSON.stringify(formData.config[name], null, 2) : '{}'}
                    onChange={(e) => {
                      const value = e.target.value || '{}';
                      try {
                        const parsed = JSON.parse(value);
                        setFormData({ ...formData, config: { ...formData.config, [name]: parsed } });
                        setJsonErrors({ ...jsonErrors, [name]: '' });
                      } catch (error) {
                        setJsonErrors({ ...jsonErrors, [name]: 'Invalid JSON format' });
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y min-h-[100px] max-h-[300px] overflow-auto whitespace-pre-wrap ${jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    rows={4}
                  />
                  {jsonError && (
                    <p className="text-xs text-red-600 mt-1">{jsonError}</p>
                  )}
                </div>
              </details>
            </div>
          );

        default:
          return (
            <div key={name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {schema.title || name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={schema.description || `Enter ${schema.title || name}`}
                value={formData.config[name] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [name]: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {schema.description && (
                <p className="text-xs text-gray-500">{schema.description}</p>
              )}
            </div>
          );
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Name
          </label>
          <input
            type="text"
            placeholder="Enter a name for this connection"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Transport-aware field grouping for mcp_remote */}
        {platform.id === 'mcp_remote' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('transport', configSchema['transport'])}
              {renderField('namespace', configSchema['namespace'])}
              {/* HTTP/WS fields */}
              {(formData.config['transport'] ?? 'http') !== 'stdio' && (
                <>
                  {renderField('url', configSchema['url'])}
                  {renderField('apiKey', configSchema['apiKey'])}
                  {renderField('headers', configSchema['headers'])}
                  {renderField('timeoutMs', configSchema['timeoutMs'])}
                  {renderField('maxRetries', configSchema['maxRetries'])}
                </>
              )}
              {/* STDIO fields */}
              {(formData.config['transport'] ?? 'http') === 'stdio' && (
                <>
                  {renderField('command', configSchema['command'])}
                  {renderField('cwd', configSchema['cwd'])}
                  {renderField('env', configSchema['env'])}
                </>
              )}
            </div>
          </>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
            {Object.entries(configSchema).map(([name, schema]) => renderField(name, schema))}
          </div>
        )}
      </div>
    );
  };

  const openCreateModal = async (platform: ConnectionPlatform) => {
    if (!hasConnectionAccess(platform.id)) {
      toast.error(`${platform.name} connection is not available on the ${tier} plan. Please upgrade to use this integration.`);
      navigate('/pricing');
      return;
    }

    // Special handling for Google Workspace OAuth flow
    if (platform.id === 'google_workspace') {
      try {
        toast.loading('Redirecting to Google...', { id: 'google-oauth' });
        const response = await apiService.getGoogleWorkspaceAuthUrl();
        if (response.auth_url) {
          // Redirect to Google's OAuth page
          window.location.href = response.auth_url;
        } else {
          toast.error('Failed to initiate Google Workspace connection', { id: 'google-oauth' });
        }
      } catch (error) {
        console.error('Error initiating Google Workspace OAuth:', error);
        toast.error('Failed to connect to Google Workspace', { id: 'google-oauth' });
      }
      return;
    }

    setSelectedPlatform(platform);
    setFormData({ platform: platform.id, name: '', config: {} });
    setJsonErrors({}); // Clear any previous JSON errors
    setShowCreateModal(true);
  };

  const getFilteredConnections = () => {
    return connections.filter(connection => {
      const matchesStatus = filterStatus === 'all' || connection.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.platform.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  const filteredConnections = getFilteredConnections();

  const renderConnectionCard = (connection: Connection) => (
    <div key={connection.id} className="group relative bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl border border-blue-100 group-hover:border-blue-200 transition-colors">
                <div className="text-blue-600">
                  {getPlatformIcon(connection.platform)}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                {connection.name}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform</span>
                <span className="text-xs font-bold text-gray-900 capitalize">{connection.platform.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border ${getStatusColor(connection.status)}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connection.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-current opacity-50'}`}></div>
            <span>{connection.status}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Sync</p>
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-bold text-gray-900">{connection.last_sync ? new Date(connection.last_sync).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-purple-500" />
              <span className="text-xs font-bold text-gray-900">{new Date(connection.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {connection.error_message && (
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-medium text-red-600 line-clamp-1">{connection.error_message}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={() => handleTestConnection(connection.id)}
            disabled={testingConnection === connection.id || oauthInProgress === connection.id}
            className="flex items-center justify-center space-x-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-black hover:shadow-lg transition-all duration-300 font-bold text-xs disabled:opacity-50"
          >
            {testingConnection === connection.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <TestTube className="w-3.5 h-3.5" />
            )}
            <span>{testingConnection === connection.id ? 'Testing...' : 'Test'}</span>
          </button>

          <div className="flex space-x-1">
            <button
              onClick={() => handleSyncConnection(connection.id)}
              disabled={syncingConnection === connection.id}
              className="flex-1 flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Sync Now"
            >
              <RefreshCw className={`w-4 h-4 ${syncingConnection === connection.id ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleEditConnection(connection)}
              className="flex-1 flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="Edit Connection"
            >
              <Edit className="w-4 h-4" />
            </button>
            <div className="relative group/more flex-1">
              <button
                className="w-full h-full flex items-center justify-center p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 hidden group-hover/more:block z-10">
                <button onClick={() => handleDeleteConnection(connection.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                {oauthInProgress === connection.id && (
                  <button onClick={() => clearOauthState(connection.id)} className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50">Clear OAuth</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConnectionList = (connection: Connection) => (
    <div key={connection.id} className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200 flex items-center p-5 space-x-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl border border-blue-100 text-blue-600">
        {getPlatformIcon(connection.platform)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {connection.name}
          </h3>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-black uppercase">{connection.platform}</span>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(connection.status)}`}>
            {connection.status}
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span className="flex items-center space-x-1">
            <RefreshCw className="w-3 h-3 text-blue-500" />
            <span>Last sync: {connection.last_sync ? new Date(connection.last_sync).toLocaleDateString() : 'Never'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-purple-500" />
            <span>Created {new Date(connection.created_at).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => handleTestConnection(connection.id)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all duration-300 font-bold text-xs"
        >
          <TestTube className="w-3 h-3" />
          <span className="hidden sm:inline">Test</span>
        </button>
        <button
          onClick={() => handleEditConnection(connection)}
          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDeleteConnection(connection.id)}
          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading connections...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm mb-8 connections-header">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Integration Hub</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
                  Connect your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ecosystem</span>
                </h1>
                <p className="text-gray-500 max-w-md font-medium">
                  {user?.name?.split(' ')[0] || 'User'}, manage your third-party integrations and supercharge your workflows.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden add-connection-btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="relative w-5 h-5 transition-transform group-hover:rotate-90" />
                <span className="relative font-bold">Add Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview - Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 connections-stats">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group relative p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-baseline space-x-2">
                    <h4 className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {stat.change >= 0 ? '↑' : '↓'}{Math.abs(stat.change)}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl shadow-lg shadow-current/10 ${stat.color} text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search - Integrated Design */}
        <div className="mb-10 p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 flex-1 w-full">
              <div className="relative flex-1 w-full max-w-none lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search connections by name or platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400 font-medium"
                />
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm appearance-none cursor-pointer hover:border-blue-200 transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
                >
                  <option value="all">Everywhere</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="error">With Errors</option>
                </select>
              </div>
            </div>
            <div className="flex items-center p-1 bg-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {filteredConnections.length > 0 ? (
          <div className={`connection-cards ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {filteredConnections.map(viewMode === 'grid' ? renderConnectionCard : renderConnectionList)}
          </div>
        ) : (
          <div className="text-center py-16 connections-list-empty">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Globe className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No connections found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Connect your marketing tools to start using AI-powered automation.'
              }
            </p>
          </div>
        )}

        {/* Available Platforms - App Store Style */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Available Platforms</h2>
              <p className="text-gray-500 font-medium">Explore and connect new services to your workspace</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
              {platforms.length} Platforms available
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 available-platforms">
            {platforms.map((platform) => {
              const isExpanded = expandedPlatforms.has(platform.id);
              const hasExpandableContent =
                platform.features.length > 6 ||
                (platform.capabilities && platform.capabilities.length > 3);

              return (
                <div key={platform.id} className="group flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="p-8 flex-1">
                    {/* Platform Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative p-4 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-500 group-hover:to-purple-600 rounded-2xl border border-gray-200 group-hover:border-transparent transition-all duration-500">
                          <div className="text-gray-700 group-hover:text-white transition-colors">
                            {getPlatformIcon(platform.id)}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPlatformColor(platform.id)}`}>
                        {platform.id}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 tracking-tight">
                      {platform.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2 font-medium italic">
                      "{platform.description}"
                    </p>

                    <div className="space-y-6">
                      {/* Features */}
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Core Features</p>
                        {renderPlatformFeatures(platform.features, platform.id, isExpanded)}
                      </div>

                      {/* Capabilities */}
                      {platform.capabilities && platform.capabilities.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Enterprise Capabilities</p>
                          {renderPlatformCapabilities(platform.capabilities, platform.id, isExpanded)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Footer */}
                  <div className="p-8 pt-0 mt-auto">
                    <div className="flex flex-col space-y-3">
                      {hasExpandableContent && (
                        <button
                          onClick={() => togglePlatformExpansion(platform.id)}
                          className="w-full py-3 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>{isExpanded ? 'Show Less' : 'Explore Details'}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}

                      <button
                        onClick={() => openCreateModal(platform)}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black hover:shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Connect {platform.name}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create/Edit Connection Modal - Premium Glassmorphism */}
      {showCreateModal && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-500"
            onClick={() => {
              setShowCreateModal(false);
              setEditingConnection(null);
              setJsonErrors({});
            }}
          ></div>

          <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className={`relative px-8 py-10 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100`}>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-start justify-between relative">
                <div className="flex items-center space-x-5">
                  <div className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-900/20">
                    {editingConnection ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {editingConnection ? 'Edit Connection' : 'New Integration'}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform</span>
                      <span className="text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-lg">{selectedPlatform.name}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingConnection(null);
                    setJsonErrors({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                {renderConfigFields(selectedPlatform)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-8 bg-gray-50/50 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingConnection(null);
                    setJsonErrors({});
                  }}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleCreateConnection}
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black hover:shadow-xl transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
                >
                  {editingConnection ? 'Update Connection' : 'Launch Connection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections; 