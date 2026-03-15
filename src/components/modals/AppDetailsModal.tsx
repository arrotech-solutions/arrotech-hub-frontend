import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Settings, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Shield, 
  AlertCircle,
  Check,
  Info,
  ExternalLink,
  ChevronRight,
  Code
} from 'lucide-react';
import api from '../../services/api';
import { DeveloperApp } from '../../types';

interface AppDetailsModalProps {
  app: DeveloperApp;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: DeveloperApp) => void;
  onDelete: (id: number) => void;
}


const AppDetailsModal: React.FC<AppDetailsModalProps> = ({ app, isOpen, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Settings form state
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description || '');
  const [callbackUrls, setCallbackUrls] = useState(app.callback_urls.join('\n'));

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.updateDeveloperApp(app.id, {
        name,
        description,
        callback_urls: callbackUrls.split('\n').filter(url => url.trim() !== '')
      });
      if (response.success) {
        onUpdate(response.data);
        setActiveTab('overview');
      } else {
        setError(response.error || 'Failed to update app');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateSecret = async () => {
    if (!confirm('Are you sure you want to rotate the client secret? The old secret will stop working immediately.')) return;
    
    setLoading(true);
    try {
      const response = await api.rotateDeveloperAppSecret(app.id);
      if (response.success) {
        setNewSecret(response.data.client_secret);
      } else {
        setError(response.error || 'Failed to rotate secret');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const response = await api.deleteDeveloperApp(app.id);
      if (response.success) {
        onDelete(app.id);
        onClose();
      } else {
        setError(response.error || 'Failed to delete app');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{app.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">{app.client_id}</span>
                <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider ${app.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {app.is_active ? 'Active' : 'Revoked'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-bold transition-all relative ${activeTab === 'settings' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Settings
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-full" />}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {activeTab === 'overview' ? (
            <div className="space-y-8 animate-in slide-in-from-left-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Application Credentials</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium">Client ID</label>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                        <code className="text-xs font-mono text-slate-600 flex-1 truncate">{app.client_id}</code>
                        <button onClick={() => copyToClipboard(app.client_id, 'id')} className="text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all">
                          {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium">Client Secret</label>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                        <code className="text-xs font-mono text-slate-600 flex-1 truncate">********************************</code>
                        <button onClick={handleRotateSecret} title="Rotate Secret" className="text-slate-400 hover:text-primary-600 transition-all">
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Scopes</h3>
                  <div className="flex flex-wrap gap-2">
                    {app.scopes.map(scope => (
                      <span key={scope} className="px-2 py-1 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-md">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {newSecret && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-start gap-3 text-green-800">
                    <Shield className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">New Client Secret Generated</p>
                      <p className="text-xs opacity-80">Copy this now. It will not be shown again.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white border border-green-200 rounded-lg">
                    <code className="text-sm font-mono text-green-700 flex-1">{newSecret}</code>
                    <button onClick={() => copyToClipboard(newSecret, 'newSecret')} className="text-green-600 hover:text-green-700 transition-colors">
                      {copiedField === 'newSecret' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integration Guides</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a href="#" className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-200 hover:bg-primary-50/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Code className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Authentication Flow</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-200 hover:bg-primary-50/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">API Reference</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">App Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                  Callback URLs
                  <span className="text-[10px] text-slate-400 font-normal">One per line</span>
                </label>
                <textarea
                  value={callbackUrls}
                  onChange={(e) => setCallbackUrls(e.target.value)}
                  rows={4}
                  placeholder="https://example.com/callback"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none font-mono text-xs"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-500 font-bold text-xs hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Application
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-200"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppDetailsModal;
