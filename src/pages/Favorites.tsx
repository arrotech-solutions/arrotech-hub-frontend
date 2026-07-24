import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Download,
  ExternalLink,
  Heart,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import toast from '../lib/notify';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { WorkflowFavorite } from '../types';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<WorkflowFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyFavorites(50, 0);
      if (response.success) {
        setFavorites(response.data?.favorites || []);
        setTotal(response.data?.total || 0);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (workflowId: number) => {
    try {
      const response = await apiService.removeFromFavorites(workflowId);
      if (response.success) {
        setFavorites(prev => prev.filter(f => f.workflow_id !== workflowId));
        setTotal(prev => prev - 1);
        toast.success('Removed from favorites');
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/20 transition-colors duration-500">
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] border border-gray-200 dark:border-slate-800 shadow-sm mb-10 group favorites-header transition-colors">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse group-hover:bg-pink-400/30 dark:group-hover:bg-pink-500/20 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-rose-400/20 dark:bg-rose-500/10 rounded-full blur-3xl animate-pulse group-hover:bg-rose-400/30 dark:group-hover:bg-rose-500/20 transition-colors duration-1000" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-12 md:px-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="p-5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-lg shadow-pink-200 dark:shadow-pink-900/30 group-hover:scale-110 transition-transform duration-500">
                  <Heart className="w-8 h-8 text-white fill-white/20" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                    Saved <span className="bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">Assets</span>
                  </h1>
                  <p className="text-gray-500 dark:text-slate-400 font-medium tracking-wide uppercase text-xs">
                    {total} optimized workflow{total !== 1 ? 's' : ''} in your library
                  </p>
                </div>
              </div>
              <button
                onClick={loadFavorites}
                className="p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-pink-600 dark:hover:text-pink-400 transition-all active:rotate-180 duration-500 shadow-sm"
                title="Refresh library"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/60 dark:bg-slate-900/60 rounded-[32px] border border-white dark:border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="favorites-empty-state relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[48px] border border-white dark:border-slate-800 p-16 text-center shadow-xl transition-colors">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100/50 dark:bg-pink-900/20 rounded-full blur-3xl -z-10"></div>
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-slate-700 shadow-inner">
                <Bookmark className="w-10 h-10 text-gray-300 dark:text-slate-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Library is empty</h3>
              <p className="text-gray-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                Your future automations are a click away. Explore the marketplace to find high-performance workflows tailored for you.
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="group relative inline-flex items-center px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-pink-600 dark:hover:bg-pink-500 transition-all duration-300 active:scale-95 overflow-hidden shadow-lg shadow-pink-500/20"
              >
                <span className="relative z-10 flex items-center">
                  <Zap className="w-4 h-4 mr-3 fill-white" />
                  Explore Marketplace
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 favorites-list">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[32px] border border-white dark:border-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                {fav.workflow ? (
                  <>
                    <div className="p-8">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-black text-gray-900 dark:text-white truncate tracking-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                            {fav.workflow.name}
                          </h3>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Node Cluster:</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">
                              {fav.workflow.category || 'Standard'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(fav.workflow_id)}
                          className="p-3 text-gray-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all duration-300 active:scale-75 shadow-sm"
                          title="Remove from library"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-slate-300 font-medium line-clamp-2 mb-8 leading-relaxed h-10 transition-colors">
                        {fav.workflow.description || 'No specialized metadata provided for this cluster.'}
                      </p>

                      {/* Stats & Metadata */}
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{fav.workflow.downloads_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{fav.workflow.rating_count || 0}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {fav.workflow.tags && fav.workflow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8 h-6 overflow-hidden">
                          {fav.workflow.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm transition-colors"
                            >
                              <Tag className="w-3 h-3 mr-1.5 opacity-50" />
                              {tag}
                            </span>
                          ))}
                          {fav.workflow.tags.length > 2 && (
                            <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest pt-1 transition-colors">+{fav.workflow.tags.length - 2} More</span>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => navigate(`/marketplace?workflow=${fav.workflow_id}`)}
                        className="w-full py-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-900 dark:hover:bg-white text-gray-900 dark:text-white hover:text-white dark:hover:text-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-gray-900 dark:hover:border-white transition-all duration-300 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-2 shadow-sm hover:shadow-lg"
                      >
                        <span>Initiate Node</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Footer Info */}
                    <div className="px-8 py-4 bg-gray-50/50 dark:bg-slate-950/30 border-t border-white/50 dark:border-slate-800/50 flex items-center justify-between transition-colors">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-widest">Linked by hub</span>
                      <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">
                        {new Date(fav.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                    </div>
                    <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Node Unavailable</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">This workflow cluster has been decommissioned from the hub.</p>
                    <button
                      onClick={() => handleRemoveFavorite(fav.workflow_id)}
                      className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:underline"
                    >
                      Purge Reference
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;

