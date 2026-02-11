import {
  Database,
  Search,
  Settings,
  Zap
} from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Connection, ConnectionPlatform } from '../types';
import {
  GoogleLogo,
  MicrosoftTeamsLogo,
  ZoomLogo,
  AsanaLogo,
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
  ClickUpLogo,
  OutlookLogo,
  NotionLogo,
  TrelloLogo,
  JiraLogo,
  TikTokLogo
} from '../components/BrandIcons';
import KraPinModal from '../components/KraPinModal';

const Integrations: React.FC = () => {
  const navigate = useNavigate();


  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platforms, setPlatforms] = useState<ConnectionPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '', currentTier: '' });
  const [selectedPlatform, setSelectedPlatform] = useState<ConnectionPlatform | null>(null);
  const [formData, setFormData] = useState({ platform: '', name: '', config: {} as any });
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const processedCallback = useRef(false);

  const getPlatformLogo = (id: string) => {
    const props = { className: "w-full h-full object-contain" };
    switch (id) {
      case 'google_workspace':
      case 'google': return <GoogleLogo {...props} />;
      case 'microsoft_teams': return <MicrosoftTeamsLogo {...props} />;
      case 'zoom': return <ZoomLogo {...props} />;
      case 'asana': return <AsanaLogo {...props} />;
      case 'power_bi':
      case 'powerbi': return <PowerBILogo {...props} />;
      case 'equity_bank':
      case 'equity': return <EquityLogo {...props} />;
      case 'kenya_power': return <KenyaPowerLogo {...props} />;
      case 'kilimall': return <KilimallLogo {...props} />;
      case 'pesapal': return <PesapalLogo {...props} />;
      case 'quick_books':
      case 'quickbooks': return <QuickBooksLogo {...props} />;
      case 'sendy': return <SendyLogo {...props} />;
      case 't_kash':
      case 'tkash': return <TKashLogo {...props} />;
      case 'twiga_foods':
      case 'twiga': return <TwigaFoodsLogo {...props} />;
      case 'zoho':
      case 'zoho_crm': return <ZohoLogo {...props} />;
      case 'clickup': return <ClickUpLogo {...props} />;
      case 'outlook':
      case 'microsoft_outlook': return <OutlookLogo {...props} />;
      case 'notion': return <NotionLogo {...props} />;
      case 'trello': return <TrelloLogo {...props} />;
      case 'jira': return <JiraLogo {...props} />;
      case 'tiktok': return <TikTokLogo {...props} />;
      default: return <Database {...props} className="text-gray-400 p-2" />;
    }
  };

  const getPlatformCategory = (id: string): string => {
    if (id.includes('slack') || id.includes('whatsapp') || id.includes('google') || id.includes('teams') || id.includes('outlook')) return 'Communication';
    if (id.includes('hubspot') || id.includes('salesforce')) return 'CRM';
    if (id.includes('facebook') || id.includes('instagram') || id.includes('twitter') || id.includes('linkedin')) return 'Social';
    if (id.includes('ga4') || id.includes('analytics')) return 'Analytics';
    if (id.includes('shopify') || id.includes('jumia')) return 'E-commerce';
    if (id.includes('shopify') || id.includes('jumia')) return 'E-commerce';
    if (id.includes('mpesa') || id.includes('airtel') || id.includes('stripe')) return 'Payment';
    if (id.includes('clickup') || id.includes('asana') || id.includes('trello') || id.includes('notion') || id.includes('jira')) return 'Productivity';
    return 'Other';
  };

  const fetchData = useCallback(async () => {
    try {
      const [connsRes, platsRes] = await Promise.all([
        apiService.getConnections(),
        apiService.getAvailablePlatforms()
      ]);
      setConnections(connsRes.data || []);

      const excludedApps = [
        'KRA Portal', 'Zuku', 'Safaricom Biz', 'Nairobi Water', 'Kenya Power',
        'Ilara Health', 'Penda', 'Penda Health', 'MyDawa', 'Farmdrive', 'M Farm', 'Iprocure',
        'Apollo Agriculture', 'Sunculture', 'DigiFarm', 'ShambaSmart', 'Rescue',
        'BambooHR', 'Bitrix24', 'SeamlessHR', 'WorkPay', 'G4S', 'Fargo Courier',
        'Busybee', 'Sendy', 'Lori Systems', 'Amitruck', 'Vyapar', 'Sasapay',
        'Lipabiz', 'Zoho Books', 'Xero', 'Quickbooks', 'KRA iTax', 'Sky Garden',
        'Wasoko', 'Twiga Foods', 'Copia', 'Masoko', 'Jiji', 'Kilimall', 'Jumia',
        'Little Pay', 'Ipay', 'Pesapal', 'Cellulant', 'Kopo Kopo', 'Paystack',
        'Flutterwave', 'Equity Jenga', 'Logistics Hub', 'Business Intelligence',
        'Lead Intelligence', 'HR Hub', 'M-Pesa Business', 'T-Kash', 'Airtel Money', 'System'
      ];

      const filteredPlatforms = (platsRes.data || []).filter((p: ConnectionPlatform) =>
        !excludedApps.includes(p.name)
      );

      setPlatforms(filteredPlatforms);
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

    const success = params.get('success');
    if (success) {
      if (success === 'whatsapp_connected') {
        toast.success('WhatsApp Business connected successfully!');
      } else if (success === 'facebook_connected') {
        toast.success('Facebook Pages connected successfully!');
      } else if (success === 'instagram_connected') {
        toast.success('Instagram Business connected successfully!');
      } else if (success === 'twitter_connected') {
        toast.success('Twitter connected successfully!');
      } else if (success === 'clickup_connected') {
        toast.success('ClickUp connected successfully!');
      } else if (success === 'notion_connected') {
        toast.success('Notion connected successfully!');
      } else if (success === 'trello_connected') {
        toast.success('Trello connected successfully!');
      } else if (success === 'jira_connected') {
        toast.success('Jira connected successfully!');
      } else if (success === 'teams_connected') {
        toast.success('Microsoft Teams connected successfully!');
      } else if (success === 'zoom_connected') {
        toast.success('Zoom connected successfully!');
      } else if (success === 'outlook_connected') {
        toast.success('Outlook connected successfully!');
      } else if (success === 'tiktok_connected') {
        toast.success('TikTok connected successfully!');
      } else {
        toast.success('Connection successful!');
      }
      navigate('/connections', { replace: true });
      processedCallback.current = true;
      fetchData(); // Refresh list to show new connection
      return;
    }

    if (code && state) {
      processedCallback.current = true;
      const handleCallback = async () => {
        console.log('OAuth Callback Debug:', { code, state });
        const toastId = toast.loading('Finalizing connection...');
        try {
          if (state.startsWith('user_')) {
            // Try to determine if it's Google or Slack 
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

          } else if (state === 'asana_connection' || state.includes('asana_connection')) {
            await apiService.getAsanaCallback(code, state);
            toast.success('Asana connected successfully!', { id: toastId });
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
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        console.log('OAuth Error:', error);
        console.log('Error response:', error.response);
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);

        // Check for 402 Payment Required error (tier restriction)
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Google Workspace integration',
            requiredTier: details.required_tier || 'Biashara Lite',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
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
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402) {
          const details = error.response.data;
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || `${platform.name} integration`,
            requiredTier: details.required_tier || 'Biashara Lite',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to WhatsApp Auth if it's WhatsApp AND NOT already connected
    if (platform.id === 'whatsapp' && !existing) {
      try {
        toast.loading('Redirecting to Facebook...', { id: 'oauth-redirect' });
        const { url } = await apiService.getWhatsAppAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402) {
          const details = error.response.data;
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'WhatsApp Business integration',
            requiredTier: details.required_tier || 'Biashara Lite',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Facebook Auth if it's Facebook AND NOT already connected
    if (platform.id === 'facebook' && !existing) {
      try {
        toast.loading('Redirecting to Facebook...', { id: 'oauth-redirect' });
        const { url } = await apiService.getFacebookAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402) {
          const details = error.response.data;
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Facebook integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Instagram Auth if it's Instagram AND NOT already connected
    if (platform.id === 'instagram' && !existing) {
      try {
        toast.loading('Redirecting to Instagram...', { id: 'oauth-redirect' });
        const { url } = await apiService.getInstagramAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402) {
          const details = error.response.data;
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Instagram integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Twitter Auth if it's Twitter AND NOT already connected
    if (platform.id === 'twitter' && !existing) {
      try {
        toast.loading('Redirecting to Twitter...', { id: 'oauth-redirect' });
        const { url } = await apiService.getTwitterAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402) {
          const details = error.response.data;
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Twitter integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to ClickUp Auth if it's ClickUp AND NOT already connected
    if (platform.id === 'clickup' && !existing) {
      try {
        toast.loading('Redirecting to ClickUp...', { id: 'oauth-redirect' });
        const { url } = await apiService.getClickUpAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'ClickUp integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Microsoft Teams Auth
    if ((platform.id === 'teams' || platform.id === 'microsoft_teams') && !existing) {
      try {
        toast.loading('Redirecting to Microsoft Teams...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getTeamsAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Microsoft Teams integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Zoom Auth
    if (platform.id === 'zoom' && !existing) {
      try {
        toast.loading('Redirecting to Zoom...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getZoomAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Zoom integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Asana Auth
    if (platform.id === 'asana' && !existing) {
      try {
        toast.loading('Redirecting to Asana...', { id: 'oauth-redirect' });
        const { url } = await apiService.getAsanaAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        toast.error('Failed to initiate connection');
        return;
      }
    }

    // Redirect to Outlook Auth
    if ((platform.id === 'outlook' || platform.id === 'microsoft_outlook') && !existing) {
      try {
        toast.loading('Redirecting to Outlook...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getOutlookAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Microsoft Outlook integration',
            requiredTier: details.required_tier || 'Biashara Lite',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Notion Auth
    if (platform.id === 'notion' && !existing) {
      try {
        toast.loading('Redirecting to Notion...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getNotionAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Notion integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Trello Auth
    if (platform.id === 'trello' && !existing) {
      try {
        toast.loading('Redirecting to Trello...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getTrelloAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Trello integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to Jira Auth
    if (platform.id === 'jira' && !existing) {
      try {
        toast.loading('Redirecting to Jira...', { id: 'oauth-redirect' });
        const { auth_url } = await apiService.getJiraAuthUrl();
        window.location.href = auth_url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'Jira integration',
            requiredTier: details.required_tier || 'Business Pro',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate connection');
        }
        return;
      }
    }

    // Redirect to TikTok Auth
    if (platform.id === 'tiktok' && !existing) {
      try {
        toast.loading('Redirecting to TikTok...', { id: 'oauth-redirect' });
        // Assuming apiService.getTikTokAuthUrl exists, otherwise fetch directly or add to service
        const { url } = await apiService.getTikTokAuthUrl();
        window.location.href = url;
        return;
      } catch (error: any) {
        toast.dismiss('oauth-redirect');
        if (error.response?.status === 402 || error.response?.data?.error === 'upgrade_required') {
          const details = error.response?.data?.detail || error.response?.data || {};
          setUpgradeModal({
            isOpen: true,
            feature: details.feature || 'TikTok integration',
            requiredTier: details.required_tier || 'Biashara Lite',
            currentTier: details.current_tier || 'Free'
          });
        } else {
          toast.error('Failed to initiate TikTok connection');
        }
        return;
      }
    }


    // Handle KRA Portal connection (PIN Entry Modal) - REMOVED

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
    }
  };

  const handleKraVerify = async (pin: string) => {
    try {
      // Create a temporary connection config for testing
      const result = await apiService.testPlatformConnection('kra_portal', { pin });
      return {
        success: result.success,
        message: result.message || result.error || (result.success ? 'PIN verified' : 'Verification failed'),
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || 'PIN verification failed.'
      };
    }
  };

  const handleKraSuccess = async (pin: string, data: any) => {
    try {
      await apiService.createConnection({
        platform: 'kra_portal',
        name: `KRA: ${data.taxpayer_name || pin}`,
        config: { pin }
      });
      setIsKraModalOpen(false);
      toast.success('KRA Portal connected successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to save KRA connection');
    }
  };

  const filteredPlatforms = platforms.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = activeCategory === 'All' || getPlatformCategory(p.id) === activeCategory;
    return searchMatch && catMatch;
  });

  // --- Render ---

  // Helper to get connected account info
  const getConnectedAccount = (platformId: string) => {
    return connections.find(c => c.platform.toLowerCase() === platformId.toLowerCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading secure integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. HERO SECTION - Lighter Variant */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200 pb-12">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-50/50 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-4 shadow-sm">
                Integration Marketplace
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
                Connect your tools
              </h1>
              <p className="text-base text-slate-500 max-w-xl leading-relaxed">
                Supercharge your workflow by syncing data across apps. Secure, reliable, and setup in seconds.
              </p>
            </div>

            {/* Stats - Compact */}
            <div className="flex gap-8 border-l border-slate-100 pl-8">
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">{connections.filter(c => c.status === 'active').length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-0.5">{platforms.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</div>
              </div>
            </div>
          </div>

          {/* Search Bar - Compact */}
          <div className="mt-8 relative max-w-xl">
            <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center p-1.5 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search apps..."
                className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 px-3 py-2 focus:ring-0 text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="hidden md:flex items-center gap-2 px-3 text-[10px] text-slate-400 font-bold border-l border-slate-100 ml-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-sans">⌘K</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONNECTED APPS BANNER - Overlapping */}
      {connections.length > 0 && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap px-2">Your Stack</span>
            <div className="w-px h-6 bg-slate-100 shrink-0"></div>
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2">
              {connections.filter(c => c.status === 'active').map(conn => (
                <div key={conn.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg pl-1 pr-3 py-1 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer group" onClick={() => handleConnect({ id: conn.platform, name: conn.name } as any)}>
                  <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                    {getPlatformLogo(conn.platform)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">{conn.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CATEGORY NAVIGATION - Sticky */}
      <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'All', icon: Zap },
              { id: 'Communication', icon: Zap },
              { id: 'CRM', icon: Zap },
              { id: 'Marketing', icon: Zap },
              { id: 'Analytics', icon: Zap },
              { id: 'E-commerce', icon: Zap },
              { id: 'Payment', icon: Zap },
              { id: 'Social', icon: Zap },
              { id: 'Productivity', icon: Zap }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border
                  ${activeCategory === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                {cat.id}
                {cat.id !== 'All' && (
                  <span className={`text-[10px] px-1 py-px rounded ml-1.5 ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {platforms.filter(p => getPlatformCategory(p.id) === cat.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MAIN GRID CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPlatforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No integrations found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory('All'); }} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlatforms.map(platform => {
              const connectedAccount = getConnectedAccount(platform.id);
              const isConnected = !!connectedAccount;

              // Mock capabilities for UI demo
              const capabilities = ['Sync'];
              if (platform.id.includes('mail') || platform.id.includes('outlook') || platform.id.includes('google')) capabilities.push('Email');
              if (platform.id.includes('crm') || platform.id.includes('salesforce') || platform.id.includes('hubspot')) capabilities.push('CRM');

              return (
                <div
                  key={platform.id}
                  className={`group relative bg-white rounded-xl border transition-all duration-200 flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-0.5
                    ${isConnected
                      ? 'border-emerald-200 shadow-sm shadow-emerald-50/50'
                      : 'border-slate-200 shadow-sm hover:border-indigo-200'
                    }`}
                >
                  {isConnected && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                    </div>
                  )}

                  <div className="p-4 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center p-1.5 transition-all group-hover:scale-105 border shadow-sm shrink-0
                         ${isConnected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                        {getPlatformLogo(platform.id)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {platform.name}
                        </h3>
                        <div className="flex gap-1 mt-0.5">
                          {capabilities.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 px-1 rounded border border-slate-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 mb-4">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {platform.description}
                      </p>
                    </div>

                    {/* Footer / CTA */}
                    <div className="mt-auto">
                      <button
                        onClick={() => handleConnect(platform)}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                          ${isConnected
                            ? 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                            : 'bg-slate-900 text-white border border-transparent hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20'
                          }`}
                      >
                        {isConnected ? (
                          <>Configure</>
                        ) : (
                          <>Connect</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KRA Portal Modal */}
      <KraPinModal
        isOpen={isKraModalOpen}
        onClose={() => setIsKraModalOpen(false)}
        onVerify={handleKraVerify}
        onSuccess={handleKraSuccess}
      />

      {/* CONFIG DRAWER (Replaces Modal) */}
      {showCreateModal && selectedPlatform && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <div className="w-screen max-w-md pointer-events-auto">
              <div className="h-full flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">

                {/* Drawer Header */}
                <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm p-2 flex items-center justify-center">
                      {getPlatformLogo(selectedPlatform.id)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedPlatform.name}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${editingConnection ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium text-slate-500">
                          {editingConnection ? 'Connected' : 'Setup Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drawer Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Connection Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        placeholder="My Workspace"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">Give this connection a friendly name to identify it later.</p>
                    </div>

                    {/* Dynamic Fields */}
                    {Object.keys(selectedPlatform.config_schema || {}).map(key => (
                      <div key={key} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
                        <div className="p-1 bg-indigo-100 rounded text-indigo-600 mt-0.5">
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-0.5">Requirement</h4>
                          <p className="text-sm text-indigo-700">This integration needs <span className="font-semibold">{key}</span> configuration.</p>
                        </div>
                      </div>
                    ))}

                    {!selectedPlatform.id.includes('oauth') && (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                        <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Manual Configuration</h4>
                        <p className="text-xs text-slate-500 mb-4 px-4">
                          We are rolling out secure credential forms for {selectedPlatform.name} soon.
                        </p>
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm" disabled>
                          Unavailable
                        </button>
                      </div>
                    )}

                    {/* Info Box */}
                    {editingConnection && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          System Status
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="block text-emerald-600/70 mb-0.5">Last Synced</span>
                            <span className="font-mono text-emerald-900">Just now</span>
                          </div>
                          <div>
                            <span className="block text-emerald-600/70 mb-0.5">Health</span>
                            <span className="font-mono text-emerald-900">100% Operational</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
                  <button
                    onClick={handleSaveConnection}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-[0.98]"
                  >
                    {editingConnection ? 'Save Changes' : 'Connect Integration'}
                  </button>

                  {editingConnection && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to disconnect? This will stop all related automations.')) return;
                        try {
                          await apiService.deleteConnection(editingConnection.id);
                          toast.success('Disconnected successfully');
                          setShowCreateModal(false);
                          fetchData();
                        } catch (e) {
                          toast.error('Failed to disconnect');
                        }
                      }}
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-rose-200 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 focus:outline-none transition-colors"
                    >
                      Disconnect Service
                    </button>
                  )}

                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600 text-center"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '', requiredTier: '', currentTier: '' })}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
        currentTier={upgradeModal.currentTier}
      />
    </div>

  );
};

export default Integrations;