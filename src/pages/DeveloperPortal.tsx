import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Search,
  Key,
  Shield,
  Code2,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Globe,
  Lock
} from 'lucide-react';
import api from '../services/api';
import { DeveloperApp, DeveloperAppCredentials } from '../types';
import CreateAppModal from '../components/modals/CreateAppModal';
import AppDetailsModal from '../components/modals/AppDetailsModal';

const DeveloperPortal: React.FC = () => {
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DeveloperApp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const response = await api.getDeveloperApps();
      if (response.success) {
        setApps(response.data);
      } else {
        setError(response.error || 'Failed to fetch apps');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    setIsCreateModalOpen(true);
  };

  const handleAppCreated = (newApp: DeveloperApp, credentials: DeveloperAppCredentials) => {
    setApps([...apps, newApp]);
    // Potentially show credentials modal here
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.client_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Code2 className="w-8 h-8 text-primary-600" />
            Developer Portal
          </h1>
          <p className="text-slate-500 max-w-2xl">
            Build and manage applications that integrate with Arrotech Hub.
          </p>
        </div>
        <button
          onClick={handleCreateApp}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:scale-95 transition-all shadow-sm shadow-primary-200"
        >
          <Plus className="w-5 h-5" />
          Create New App
        </button>
      </div>

      {/* Stats/Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Total Apps</h3>
            <p className="text-2xl font-bold text-slate-900">{apps.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Active Grants</h3>
            <p className="text-2xl font-bold text-slate-900">{apps.filter(a => a.is_active).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Documentation</h3>
            <a 
              href="https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              Auth Guide <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
        <input
          type="text"
          placeholder="Search by app name or client ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
        />
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700">
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No applications found</h3>
          <p className="text-slate-500 mb-6">Create your first app to start integrating with Arrotech Hub.</p>
          <button
            onClick={handleCreateApp}
            className="text-primary-600 font-medium hover:underline"
          >
            Create an App
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <div 
              key={app.id}
              className="bg-white group relative rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-200 transition-all cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${app.is_active ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Globe className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${app.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {app.is_active ? 'Active' : 'Revoked'}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-1 truncate">
                {app.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                {app.description || 'No description provided.'}
              </p>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-50 px-3 py-2 rounded-lg mb-4 group/cid relative">
                <Lock className="w-3.5 h-3.5" />
                <span className="flex-1 truncate">{app.client_id}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(app.client_id);
                    setCopiedId(app.client_id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="opacity-0 group-hover/cid:opacity-100 hover:text-primary-600 transition-all"
                  title="Copy Client ID"
                >
                  {copiedId === app.client_id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                  {app.scopes.slice(0, 3).map((scope, idx) => (
                    <div 
                      key={idx}
                      title={scope}
                      className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600"
                    >
                      {scope.split(':')[1]?.[0]?.toUpperCase() || 'S'}
                    </div>
                  ))}
                  {app.scopes.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                      +{app.scopes.length - 3}
                    </div>
                  )}
                </div>
                <button className="text-slate-400 hover:text-primary-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAppModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleAppCreated}
      />
      
      {selectedApp && (
        <AppDetailsModal 
          app={selectedApp} 
          isOpen={!!selectedApp} 
          onClose={() => setSelectedApp(null)}
          onUpdate={(updated) => setApps(apps.map(a => a.id === updated.id ? updated : a))}
          onDelete={(id) => setApps(apps.filter(a => a.id !== id))}
        />
      )}
    </div>
  );
};

export default DeveloperPortal;
