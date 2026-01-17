import {
  Database,
  Search,
  Settings,
  Zap
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import apiService from '../services/api';
import { Connection, ConnectionCreate, ConnectionPlatform } from '../types';
import {
  GoogleLogo,
  SlackLogo,
  HubSpotLogo,
  WhatsAppLogo,
  AnalyticsLogo,
  ShopifyLogo,
  MPesaLogo,
  AirtelLogo,
  JumiaLogo,
  SalesforceLogo,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  LinkedInLogo,
  StripeLogo,
  MicrosoftTeamsLogo,
  ZoomLogo,
  AsanaLogo,
  PowerBILogo
} from '../components/BrandLogos';

const Integrations: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platforms, setPlatforms] = useState<ConnectionPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ConnectionPlatform | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Form State
  const [formData, setFormData] = useState<ConnectionCreate>({
    platform: '',
    name: '',
    config: {}
  });
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);

  // Computed State
  const categories = ['All', 'Communication', 'CRM', 'Marketing', 'Analytics', 'E-commerce', 'Payment', 'Social'];

  const processedCallback = useRef(false);

  // Logo Mapping
  const getPlatformLogo = (platformId: string) => {
    const props = { className: "w-full h-full" };
    switch (platformId) {
      case 'google_workspace': return <GoogleLogo {...props} />;
      case 'slack': return <SlackLogo {...props} />;
      case 'hubspot': return <HubSpotLogo {...props} />;
      case 'whatsapp':
      case 'whatsapp_business': return <WhatsAppLogo {...props} />;
      case 'google_analytics':
      case 'ga4': return <AnalyticsLogo {...props} />;
      case 'shopify': return <ShopifyLogo {...props} />;
      case 'mpesa': return <MPesaLogo {...props} />;
      case 'airtel':
      case 'airtel_money': return <AirtelLogo {...props} />;
      case 'jumia': return <JumiaLogo {...props} />;
      case 'salesforce': return <SalesforceLogo {...props} />;
      case 'facebook':
      case 'facebook_marketing': return <FacebookLogo {...props} />;
      case 'instagram':
      case 'instagram_graph': return <InstagramLogo {...props} />;
      case 'twitter':
      case 'twitter_ads': return <TwitterLogo {...props} />;
      case 'linkedin':
      case 'linkedin_ads': return <LinkedInLogo {...props} />;
      case 'stripe': return <StripeLogo {...props} />;
      case 'teams':
      case 'microsoft_teams': return <MicrosoftTeamsLogo {...props} />;
      case 'zoom': return <ZoomLogo {...props} />;
      case 'asana': return <AsanaLogo {...props} />;
      case 'power_bi': return <PowerBILogo {...props} />;
      default: return <Database {...props} className="text-gray-400 p-2" />;
    }
  };

  const getPlatformCategory = (id: string): string => {
    if (id.includes('slack') || id.includes('whatsapp') || id.includes('google')) return 'Communication';
    if (id.includes('hubspot') || id.includes('salesforce')) return 'CRM';
    if (id.includes('facebook') || id.includes('instagram') || id.includes('twitter') || id.includes('linkedin')) return 'Social';
    if (id.includes('ga4') || id.includes('analytics')) return 'Analytics';
    if (id.includes('shopify') || id.includes('jumia')) return 'E-commerce';
    if (id.includes('mpesa') || id.includes('airtel') || id.includes('stripe')) return 'Payment';
    return 'Other';
  };

  const fetchData = useCallback(async () => {
    try {
      const [connsRes, platsRes] = await Promise.all([
        apiService.getConnections(),
        apiService.getAvailablePlatforms()
      ]);
      setConnections(connsRes.data || []);
      setPlatforms(platsRes.data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle OAuth Callback
  useEffect(() => {
    if (processedCallback.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error('Connection failed: ' + error);
      navigate('/connections', { replace: true });
      processedCallback.current = true;
      return;
    }

    if (code && state) {
      processedCallback.current = true;
      const handleCallback = async () => {
        const toastId = toast.loading('Finalizing connection...');
        try {
          if (state.startsWith('user_')) {
            // Try to determine if it's Google or Slack based on URL or just try both? 
            // Ideally the state or a param would indicate, but for now we can infer or try based on platform
            // Since state format is consistent, let's look at the URLSearchParams again or perhaps assume checking both is safe if valid
            // Actually, we should know based on where we came from, but we lost that context on redirect.
            // Let's try to detect based on how the callback was formed.
            // Google and Slack both use `code` and `state`.
            // Simple hack: Try Slack if Google fails, or differentiate earlier?
            // Better: Google uses `scope` in response often, Slack does too.
            // Let's just try to call the one that matches our last intention? No, that's lost.

            // Check if we are coming from Slack (check for something specific if possible, or just try catch)
            // Slack auth usually doesn't append extra params we can rely on universally except standard oauth.
            // Let's try to infer from the error message or just add a query param to our redirect URI if we could control it fully.
            // But simpler: Just try Google first (as it was there), if it fails with specific "invalid grant" maybe try Slack?
            // Actually, the `state` is identical.
            // IMPORTANT: The backend throws 400 if code is invalid for that provider.

            try {
              await apiService.getGoogleWorkspaceCallback(code, state);
              toast.success('Google Workspace connected successfully!', { id: toastId });
            } catch (googleError) {
              // If Google failed, try Slack
              try {
                await apiService.getSlackCallback(code, state);
                toast.success('Slack connected successfully!', { id: toastId });
              } catch (slackError) {
                throw new Error('Could not verify connection with either provider.');
              }
            }

          } else {
            // Handle other callbacks if any
            toast.error('Unknown connection type', { id: toastId });
          }
          fetchData();
          navigate('/connections', { replace: true });
        } catch (error) {
          console.error('Callback error:', error);
          toast.error('Connection failed. Please try again.', { id: toastId });
          navigate('/connections', { replace: true });
        }
      };
      handleCallback();
    }
  }, [navigate, fetchData]);


  const handleConnect = async (platform: ConnectionPlatform) => {
    // Check if already connected
    const existing = connections.find(c => c.platform === platform.id);

    // Only redirect to Google Auth if it's Google Workspace AND NOT already connected
    if (platform.id === 'google_workspace' && !existing) {
      try {
        toast.loading('Redirecting to Google...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getGoogleWorkspaceAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error) {
        toast.error('Failed to initiate connection', { id: 'oauth-redirect' });
        return;
      }
    }

    // Redirect to Slack Auth if it's Slack AND NOT already connected (or even if connected to re-auth/add scopes)
    if (platform.id === 'slack' && !existing) {
      try {
        toast.loading('Redirecting to Slack...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getSlackAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error) {
        toast.error('Failed to initiate connection', { id: 'oauth-redirect' });
        return;
      }
    }

    if (existing) {
      setEditingConnection(existing);
      setFormData({
        platform: existing.platform,
        name: existing.name,
        config: existing.config || {}
      });
    } else {
      setEditingConnection(null);
      setFormData({
        platform: platform.id,
        name: platform.name,
        config: {}
      });
    }
    setSelectedPlatform(platform);
    setShowCreateModal(true);
  };

  const handleSaveConnection = async () => {
    try {
      if (editingConnection) {
        await apiService.updateConnection(editingConnection.id, {
          name: formData.name,
          config: formData.config,
          status: editingConnection.status
        });
        toast.success(`Updated ${selectedPlatform?.name}`);
      } else {
        await apiService.createConnection(formData);
        toast.success(`Connected to ${selectedPlatform?.name}`);
      }
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save connection');
    }
  };

  const filteredPlatforms = platforms.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = activeCategory === 'All' || getPlatformCategory(p.id) === activeCategory;
    return searchMatch && catMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
              Integrations
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Supercharge your workflow by connecting your favorite tools.
              Seamlessly sync data, automate tasks, and extend your capabilities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

          {/* Categories */}
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                  ${activeCategory === cat
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search integrations..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlatforms.map(platform => {
            const isConnected = connections.some(c => c.platform === platform.id);
            const connection = connections.find(c => c.platform === platform.id);
            const hasError = connection?.status === 'error';

            return (
              <div
                key={platform.id}
                className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-lg p-0.5 overflow-hidden">
                    {getPlatformLogo(platform.id)}
                  </div>
                  {isConnected && (
                    <div className={`w-2 h-2 rounded-full ${hasError ? 'bg-red-500' : 'bg-green-500'}`} title={hasError ? 'Error' : 'Connected'} />
                  )}
                </div>

                <div className="flex-1 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {platform.description}
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => handleConnect(platform)}
                    className={`w-full flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${isConnected
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      : 'bg-black text-white border border-transparent hover:bg-gray-800'
                      }`}
                  >
                    {isConnected ? 'Manage' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPlatforms.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No integrations found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

      </div>

      {/* Configuration Modal */}
      {showCreateModal && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-500" />
                Configure {selectedPlatform.name}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="My Connection"
                />
              </div>

              {/* Dynamic Config Fields */}
              {Object.keys(selectedPlatform.config_schema || {}).map(key => (
                <div key={key} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  Requires: {key}
                </div>
              ))}

              {!selectedPlatform.id.includes('oauth') && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    This integration requires API keys or other credentials.
                  </p>
                  {/* Placeholder for complex config forms */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-center text-gray-500">
                    Configuration form coming soon for {selectedPlatform.name}
                  </div>
                </div>
              )}

              {/* Custom handling for manual integrations if needed */}
              {editingConnection && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to disconnect?')) return;
                      try {
                        await apiService.deleteConnection(editingConnection.id);
                        toast.success('Disconnected');
                        setShowCreateModal(false);
                        fetchData();
                      } catch (e) {
                        toast.error('Failed to disconnect');
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnection}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm hover:shadow transition-all"
              >
                {editingConnection ? 'Save Changes' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;