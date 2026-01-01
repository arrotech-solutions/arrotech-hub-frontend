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
} from 'lucide-react';
import toast from 'react-hot-toast';
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
            <p className="text-gray-600">
              {total} workflow{total !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-6">
            Browse the marketplace and save workflows you find interesting
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            <Zap className="w-5 h-5 mr-2" />
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {fav.workflow ? (
                <>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {fav.workflow.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          by {fav.workflow.author_name || 'Unknown'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(fav.workflow_id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {fav.workflow.description || 'No description'}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center space-x-1">
                        <Download className="w-4 h-4" />
                        <span>{fav.workflow.downloads_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{fav.workflow.rating_count || 0} reviews</span>
                      </span>
                    </div>

                    {fav.workflow.tags && fav.workflow.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {fav.workflow.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {fav.workflow.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {fav.workflow.category}
                        </span>
                      )}
                      <button
                        onClick={() => navigate(`/marketplace?workflow=${fav.workflow_id}`)}
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    Saved {new Date(fav.created_at).toLocaleDateString()}
                  </div>
                </>
              ) : (
                <div className="p-5 text-center text-gray-500">
                  <p>This workflow is no longer available</p>
                  <button
                    onClick={() => handleRemoveFavorite(fav.workflow_id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

