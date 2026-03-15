import React, { useState } from 'react';
import { X, Globe, Lock, Shield, Check, Info, AlertCircle, Loader2, Copy } from 'lucide-react';
import api from '../../services/api';
import { DeveloperApp, DeveloperAppCredentials } from '../../types';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (app: DeveloperApp, credentials: DeveloperAppCredentials) => void;
}


const AVAILABLE_SCOPES = [
  { id: 'data:read', name: 'Read Data', description: 'Read access to your conversations, messages, and files.' },
  { id: 'data:write', name: 'Write Data', description: 'Permission to send messages and update data.' },
  { id: 'workflow:execute', name: 'Execute Workflows', description: 'Trigger and run automated workflows.' },
  { id: 'connection:manage', name: 'Manage Connections', description: 'Create and configure tool connections.' },
  { id: 'user:profile', name: 'Profile Access', description: 'Read your basic profile information.' },
];

const CreateAppModal: React.FC<CreateAppModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['data:read']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<DeveloperAppCredentials | null>(null);
  const [newApp, setNewApp] = useState<DeveloperApp | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.createDeveloperApp({
        name,
        description,
        callback_urls: callbackUrl ? [callbackUrl] : [],
        scopes: selectedScopes
      });

      if (response.success) {
        setNewApp(response.data.app);
        setCredentials(response.data.credentials);
        onCreated(response.data.app, response.data.credentials);
      } else {
        setError(response.error || 'Failed to create app');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleScope = (scopeId: string) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(id => id !== scopeId) 
        : [...prev, scopeId]
    );
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (credentials && newApp) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">App Credentials Generated</h2>
              <p className="text-slate-500">
                Please store these securely. You will not be able to see the client secret again.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client ID</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <code className="text-sm font-mono text-slate-700 flex-1">{credentials.client_id}</code>
                  <button onClick={() => copyToClipboard(credentials.client_id, 'id')} className="text-slate-400 hover:text-primary-600 transition-colors">
                    {copiedField === 'id' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Secret</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl ring-2 ring-primary-500/10">
                  <code className="text-sm font-mono text-slate-700 flex-1">{credentials.client_secret}</code>
                  <button onClick={() => copyToClipboard(credentials.client_secret, 'secret')} className="text-slate-400 hover:text-primary-600 transition-colors">
                    {copiedField === 'secret' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Warning: If you lose your client secret, you will need to rotate it manually in the app settings.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
            >
              Done, I've saved them
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Developer Application</h2>
              <p className="text-xs text-slate-500">Register a new app to access Arrotech Hub APIs.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">App Name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Custom Integration"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Callback URL</label>
                <input
                  type="url"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder="https://your-app.com/callback"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Required for 3-legged (Authorization Code) flow.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your application do?"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Approved Scopes</label>
              <div className="space-y-2">
                {AVAILABLE_SCOPES.map(scope => (
                  <div 
                    key={scope.id}
                    onClick={() => toggleScope(scope.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      selectedScopes.includes(scope.id) 
                        ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/10' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedScopes.includes(scope.id) ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'
                    }`}>
                      {selectedScopes.includes(scope.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${selectedScopes.includes(scope.id) ? 'text-primary-900' : 'text-slate-700'}`}>
                        {scope.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{scope.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name}
            className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create App'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAppModal;
