import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    Filter,
    Plus,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Zap,
    Globe,
    MessageCircle,
    BarChart3,
    Database,
    Shield,
    ShoppingBag,
    Truck,
    Leaf,
    Activity,
    Droplets,
    CreditCard,
    Wallet,
    TrendingUp,
    Users,
    Cpu,
    Command,
    LayoutGrid,
    List as ListIcon,
    X,
    ChevronRight,
    Settings,
    MoreVertical,
    RefreshCw,
    Trash2,
    Pause,
    Server
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import apiService from '../services/api';
import { Connection, ConnectionCreate, ConnectionPlatform, PlatformCapability } from '../types';
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
    PowerBILogo,
    EquityLogo,
    KenyaPowerLogo,
    KilimallLogo,
    PesapalLogo,
    QuickBooksLogo,
    SendyLogo,
    TKashLogo,
    TwigaFoodsLogo,
    ZohoLogo,
    ZoomLogo,
    AsanaLogo
} from '../components/BrandIcons';

// --- Components ---

const CategoryPill = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
    >
        {label}
    </button>
);

const ConnectionStatusBadge = ({ status }: { status: string }) => {
    const styles = {
        active: 'bg-green-100 text-green-700 ring-green-600/20',
        inactive: 'bg-gray-100 text-gray-700 ring-gray-600/20',
        error: 'bg-red-100 text-red-700 ring-red-600/20',
        pending: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
        syncing: 'bg-blue-100 text-blue-700 ring-blue-600/20'
    };

    const labels = {
        active: 'Connected',
        inactive: 'Inactive',
        error: 'Error',
        pending: 'Pending',
        syncing: 'Syncing'
    };

    const currentStyle = styles[status as keyof typeof styles] || styles.inactive;
    const label = labels[status as keyof typeof labels] || status;

    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${currentStyle}`}>
            {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
            {status === 'error' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {status === 'syncing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
            {label}
        </span>
    );
};

// --- Main Component ---

const Integrations: React.FC = () => {
    const { user } = useAuth();
    const { hasConnectionAccess } = useSubscription();
    const navigate = useNavigate();

    // State
    const [connections, setConnections] = useState<Connection[]>([]);
    const [platforms, setPlatforms] = useState<ConnectionPlatform[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<ConnectionPlatform | null>(null);
    const [formData, setFormData] = useState<ConnectionCreate>({ platform: '', name: '', config: {} });
    const [jsonErrors, setJsonErrors] = useState<{ [key: string]: string }>({});
    const [editingConnection, setEditingConnection] = useState<Connection | null>(null);

    // Action State
    const [testingConnection, setTestingConnection] = useState<number | null>(null);
    const [syncingConnection, setSyncingConnection] = useState<number | null>(null);
    const processedCallback = useRef(false);

    // --- Handlers from Legacy Connections ---

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
            setPlatforms(response.data || []);
        } catch (error) {
            console.error('Error fetching platforms:', error);
            toast.error('Failed to load integration platforms');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOAuthCallback = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state && !processedCallback.current) {
            processedCallback.current = true;
            try {
                toast.loading('Completing secure handshake...', { id: 'oauth-callback' });
                const response = await apiService.getGoogleWorkspaceCallback(code, state);
                if (response.success) {
                    toast.success('Integration connected successfully!', { id: 'oauth-callback' });
                    window.history.replaceState({}, document.title, window.location.pathname);
                    fetchConnections();
                } else {
                    toast.error(response.error || 'Connection failed', { id: 'oauth-callback' });
                }
            } catch (err: any) {
                toast.error('Failed to complete integration', { id: 'oauth-callback' });
            }
        }
    }, [fetchConnections]);

    useEffect(() => {
        fetchConnections();
        fetchPlatforms();
        handleOAuthCallback();
    }, [fetchConnections, fetchPlatforms, handleOAuthCallback]);

    // --- Helpers ---

    const getPlatformIcon = (platformId: string) => {
        const iconMap: { [key: string]: React.ElementType } = {
            hubspot: HubSpotLogo,
            ga4: AnalyticsLogo,
            slack: SlackLogo,
            whatsapp: WhatsAppLogo,
            google_workspace: GoogleLogo,
            salesforce: SalesforceLogo,
            hr_hub: Users,
            logistics_hub: Truck,
            mpesa: MPesaLogo,
            airtel_money: AirtelLogo,
            stripe: StripeLogo,
            shopify: ShopifyLogo,
            jumia: JumiaLogo,
            facebook: FacebookLogo,
            instagram: InstagramLogo,
            twitter: TwitterLogo,
            linkedin: LinkedInLogo,
            mcp_remote: Server,
            teams: MicrosoftTeamsLogo,
            microsoft_teams: MicrosoftTeamsLogo,
            zoom: ZoomLogo,
            asana: AsanaLogo,
            power_bi: PowerBILogo,
            equity: EquityLogo,
            equity_bank: EquityLogo,
            kenya_power: KenyaPowerLogo,
            kilimall: KilimallLogo,
            pesapal: PesapalLogo,
            quick_books: QuickBooksLogo,
            quickbooks: QuickBooksLogo,
            sendy: SendyLogo,
            t_kash: TKashLogo,
            tkash: TKashLogo,
            twiga: TwigaFoodsLogo,
            twiga_foods: TwigaFoodsLogo,
            zoho: ZohoLogo,
            zoho_crm: ZohoLogo,
            // Add generic fallbacks
            marketing: Zap,
            crm: Users,
            finance: CreditCard,
            default: Command
        };

        // Improved mapping logic based on ID patterns
        if (iconMap[platformId]) return iconMap[platformId];
        // Handle variations
        if (platformId.includes('teams')) return MicrosoftTeamsLogo;
        if (platformId.includes('equity')) return EquityLogo;
        if (platformId.includes('kenya_power')) return KenyaPowerLogo;
        if (platformId.includes('power_bi')) return PowerBILogo;
        if (platformId.includes('pesapal')) return PesapalLogo;
        if (platformId.includes('zoho')) return ZohoLogo;

        if (platformId.includes('pay') || platformId.includes('finance') || platformId.includes('bank')) return CreditCard;
        if (platformId.includes('shop') || platformId.includes('store') || platformId.includes('commerce')) return ShoppingBag;
        if (platformId.includes('health')) return Activity;
        if (platformId.includes('farm') || platformId.includes('agri')) return Leaf;
        if (platformId.includes('logistics') || platformId.includes('delivery')) return Truck;

        return iconMap.default;
    };

    const getPlatformCategory = (platformId: string): string => {
        if (platformId.includes('crm') || platformId.includes('salesforce') || platformId.includes('hubspot')) return 'CRM';
        if (platformId.includes('pay') || platformId.includes('finance') || platformId.includes('mpesa')) return 'Finance';
        if (platformId.includes('shop') || platformId.includes('commerce') || platformId.includes('jumia')) return 'E-Commerce';
        if (platformId.includes('social') || platformId.includes('slack') || platformId.includes('whatsapp')) return 'Communication';
        if (platformId.includes('google') || platformId.includes('office')) return 'Productivity';
        if (platformId.includes('health')) return 'Health';
        if (platformId.includes('agri')) return 'Agriculture';
        if (platformId.includes('hr')) return 'HR';
        return 'Utilities';
    };

    const getPlatformColor = (platformId: string) => {
        // Return a tailored gradient or color for the icon background
        if (platformId.includes('google')) return 'bg-blue-50 text-blue-600';
        if (platformId.includes('slack')) return 'bg-purple-50 text-purple-600';
        if (platformId.includes('hubspot')) return 'bg-orange-50 text-orange-600';
        if (platformId.includes('mpesa')) return 'bg-red-50 text-red-600';
        if (platformId.includes('airtel')) return 'bg-red-50 text-red-600';
        if (platformId.includes('whatsapp')) return 'bg-green-50 text-green-600';
        return 'bg-gray-50 text-gray-700';
    };

    const getPlatformLogoStyle = (platformId: string) => {
        // Custom styling for non-square logos to prevent "small" or "stretched" look
        if (platformId.includes('hubspot')) return 'h-8 w-auto min-w-[2rem] max-w-full object-contain';
        if (platformId.includes('shopify')) return 'h-8 w-auto max-w-full object-contain';
        if (platformId.includes('mpesa')) return 'h-8 w-auto max-w-full object-contain';
        if (platformId.includes('airtel')) return 'h-8 w-auto max-w-full object-contain';
        if (platformId.includes('jumia')) return 'h-8 w-auto max-w-full object-contain';
        if (platformId.includes('stripe')) return 'h-8 w-auto max-w-full object-contain';
        // Default square constraint
        return 'w-8 h-8 object-contain';
    };

    // --- Filtering Logic ---

    const filteredPlatforms = useMemo(() => {
        return platforms.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const category = getPlatformCategory(p.id);
            const matchesCategory = activeCategory === 'All' || category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [platforms, searchQuery, activeCategory]);

    const existingConnectionsMap = useMemo(() => {
        const map = new Map<string, Connection>();
        connections.forEach(c => map.set(c.platform, c));
        return map;
    }, [connections]);

    // --- Actions ---

    const handleConnect = async (platform: ConnectionPlatform) => {
        // Special handling for OAuth platforms
        if (platform.id === 'google_workspace') {
            try {
                toast.loading('Redirecting to Google...', { id: 'oauth-redirect' });
                const { auth_url } = await apiService.getGoogleWorkspaceAuthUrl();
                window.location.href = auth_url;
                return;
            } catch (error) {
                console.error('Failed to initiate OAuth:', error);
                toast.error('Failed to connect to Google', { id: 'oauth-redirect' });
                return;
            }
        }

        const existing = existingConnectionsMap.get(platform.id);
        if (existing) {
            // Edit mode
            setEditingConnection(existing);
            setFormData({
                platform: existing.platform,
                name: existing.name,
                config: existing.config || {}
            });
        } else {
            // Create mode
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
                toast.success(`Updated ${selectedPlatform?.name} configuration`);
            } else {
                await apiService.createConnection(formData);
                toast.success(`Connected to ${selectedPlatform?.name}`);
            }
            setShowCreateModal(false);
            fetchConnections();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.detail || 'Failed to save connection');
        }
    };

    const handleDeleteConnection = async (id: number) => {
        if (window.confirm('Disconnecting this service will stop all related workflows. Continue?')) {
            try {
                await apiService.deleteConnection(id);
                toast.success('Service disconnected');
                fetchConnections();
            } catch (error) {
                toast.error('Failed to disconnect');
            }
        }
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Header */}
            <div className="bg-white border-b border-gray-200 integrations-header">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Integrations</h1>
                            <p className="mt-2 text-lg text-gray-600 max-w-2xl">
                                Supercharge your workflow by connecting your favorite tools.
                                Manage your data sources and destinations in one place.
                            </p>
                        </div>

                        {/* Stats Overview (Mini) */}
                        <div className="flex space-x-6 integrations-stats">
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-sm text-gray-500 font-medium">Active</span>
                                <span className="text-2xl font-bold text-gray-900">{connections.filter(c => c.status === 'active').length}</span>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-sm text-gray-500 font-medium">Available</span>
                                <span className="text-2xl font-bold text-gray-900">{platforms.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-8 flex flex-col md:flex-row gap-4 items-center integrations-filters">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 mr-2 flex-shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        {['All', 'Communication', 'CRM', 'Finance', 'Productivity', 'E-Commerce', 'HR', 'Health', 'Logistics', 'Agriculture'].map(cat => (
                            <CategoryPill
                                key={cat}
                                label={cat}
                                active={activeCategory === cat}
                                onClick={() => setActiveCategory(cat)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredPlatforms.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No integrations found</h3>
                        <p className="mt-2 text-gray-500">Try adjusting your search or category filters.</p>
                    </div>
                ) : (
                    <div className={`grid gap-6 integrations-grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                        {filteredPlatforms.map((platform) => {
                            const Icon = getPlatformIcon(platform.id);
                            const connection = existingConnectionsMap.get(platform.id);
                            const isConnected = !!connection;
                            const platformColorClass = getPlatformColor(platform.id);

                            return (
                                <div
                                    key={platform.id}
                                    className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 ${isConnected ? 'border-blue-200 shadow-blue-50/50' : 'border-gray-200 shadow-sm hover:border-gray-300'
                                        }`}
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${platformColorClass} ring-1 ring-black/5`}>
                                                <Icon className={getPlatformLogoStyle(platform.id)} strokeWidth={1.5} />
                                            </div>
                                            {isConnected && (
                                                <div className="flex flex-col items-end gap-2">
                                                    <ConnectionStatusBadge status={connection.status} />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                {platform.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                                                {platform.description}
                                            </p>
                                        </div>

                                        {/* Feature Tags or Metadata */}
                                        <div className="flex flex-wrap gap-1 mb-6">
                                            {platform.features?.slice(0, 2).map((feature, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] uppercase tracking-wide font-medium rounded-full border border-gray-100">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 mt-auto">
                                            {isConnected ? (
                                                <>
                                                    <button
                                                        onClick={() => handleConnect(platform)}
                                                        className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                                    >
                                                        Configure
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteConnection(connection.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        title="Disconnect"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(platform)}
                                                    className="flex-1 bg-gray-900 text-white hover:bg-gray-800 font-medium py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                                >
                                                    <span>Connect</span>
                                                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Configuration Modal */}
            {showCreateModal && selectedPlatform && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none bg-gray-50 p-2 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="sm:flex sm:items-start mb-6">
                                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl ${getPlatformColor(selectedPlatform.id)} sm:mx-0 sm:h-10 sm:w-10 ring-1 ring-black/5`}>
                                    {React.createElement(getPlatformIcon(selectedPlatform.id), { className: "h-6 w-6" })}
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-xl font-bold leading-6 text-gray-900">
                                        {editingConnection ? 'Configure Connection' : `Connect ${selectedPlatform.name}`}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {editingConnection
                                            ? 'Update your connection settings below.'
                                            : `Enter the required details to establish a secure connection with ${selectedPlatform.name}.`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={`My ${selectedPlatform.name} Account`}
                                    />
                                </div>

                                {/* Iterate over schema properties to render fields */}
                                {/* Simplified dynamic form rendering for brevity - reusing logic from previous version implicitly or simplified */}
                                {selectedPlatform.config_schema?.properties && Object.keys(selectedPlatform.config_schema.properties).map(key => {
                                    const field = selectedPlatform.config_schema.properties[key];
                                    if (field.type === 'string' && !field.enum) {
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
                                                <input
                                                    type={field.format === 'password' || key.includes('token') || key.includes('secret') ? "password" : "text"}
                                                    value={formData.config[key] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        config: { ...formData.config, [key]: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder={field.description || `Enter ${key}`}
                                                />
                                            </div>
                                        );
                                    }
                                    if (field.enum) {
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
                                                <select
                                                    value={formData.config[key] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        config: { ...formData.config, [key]: e.target.value }
                                                    })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Option</option>
                                                    {field.enum.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <div className="mt-8 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    onClick={handleSaveConnection}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm transition-all"
                                >
                                    {editingConnection ? 'Save Changes' : 'Connect Integration'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Integrations;
