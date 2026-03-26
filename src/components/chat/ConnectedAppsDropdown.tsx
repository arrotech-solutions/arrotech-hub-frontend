import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database, Link2, ChevronRight } from 'lucide-react';
import apiService from '../../services/api';
import { Connection } from '../../types';
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
  TikTokLogo,
  HubSpotLogo,
  SlackLogo,
  WhatsAppLogo,
  FacebookLogo,
  TwitterLogo,
  LinkedInLogo,
  InstagramLogo,
  SalesforceLogo,
  AirtableLogo,
  XeroLogo
} from '../BrandIcons';

export const getPlatformLogo = (id: string) => {
  const props = { className: "w-full h-full object-contain" };
  switch (id) {
    case 'google_workspace':
    case 'google': return <GoogleLogo {...props} />;
    case 'microsoft_teams': 
    case 'teams': return <MicrosoftTeamsLogo {...props} />;
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
    case 'hubspot': return <HubSpotLogo {...props} />;
    case 'slack': return <SlackLogo {...props} />;
    case 'whatsapp': return <WhatsAppLogo {...props} />;
    case 'facebook': return <FacebookLogo {...props} />;
    case 'twitter': return <TwitterLogo {...props} />;
    case 'linkedin': return <LinkedInLogo {...props} />;
    case 'instagram': return <InstagramLogo {...props} />;
    case 'salesforce': return <SalesforceLogo {...props} />;
    case 'airtable': return <AirtableLogo {...props} />;
    case 'xero': return <XeroLogo {...props} />;
    default: return <Database {...props} className="text-gray-400 p-1" />;
  }
};

interface ConnectedAppsDropdownProps {
  isDarkMode: boolean;
}

const ConnectedAppsDropdown: React.FC<ConnectedAppsDropdownProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getConnections();
        if (res.data) setConnections(res.data);
      } catch (err) {
        console.error('Failed to load apps dropdown:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen && connections.length === 0) {
      fetchConnections();
    }
  }, [isOpen, connections.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors
          ${isDarkMode ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
          ${isOpen ? (isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50') : ''}
        `}
      >
        <div className="flex items-center space-x-3">
          <Link2 size={16} className="text-emerald-500" />
          <span className="font-medium">Connect Apps</span>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </button>

      {/* Hover Sub-Menu */}
      <div 
        className={`absolute left-full bottom-0 ml-1 w-72 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-200 origin-bottom-left z-[60] overflow-hidden
          ${isOpen ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-x-2 pointer-events-none'}
          ${isDarkMode ? 'bg-gray-950/95 border-gray-800 shadow-black' : 'bg-white/95 border-gray-200 shadow-gray-200'}
        `}
      >
        {/* Header */}
        <div className={`px-4 py-3 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Connected Workspaces</h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
            {connections.length} Active
          </span>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : connections.length > 0 ? (
            <div className="grid gap-1">
              {connections.map((conn) => (
                <div 
                  key={conn.id}
                  className={`flex items-center space-x-2.5 p-2 rounded-lg transition-colors duration-200 cursor-default group
                    ${isDarkMode ? 'hover:bg-gray-800/80' : 'hover:bg-gray-100/50'}
                  `}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm p-1.5 transition-transform duration-300 group-hover:scale-105
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}
                  `}>
                    {getPlatformLogo(conn.platform)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate leading-tight group-hover:text-emerald-500 transition-colors text-gray-800 dark:text-gray-200">{conn.name}</p>
                    <p className="text-[9px] text-gray-500 truncate capitalize tracking-wide">{conn.platform.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mb-3">
                <Database size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium mb-1">No apps connected</p>
              <p className="text-xs text-gray-500">Connect your favorite tools to supercharge the AI.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/connections');
            }}
            className={`w-full py-2 rounded-lg flex items-center justify-center space-x-2 text-xs font-semibold transition-all duration-200 border
              ${isDarkMode 
                ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              }
            `}
          >
            <Plus size={14} />
            <span>Manage Connections</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAppsDropdown;
