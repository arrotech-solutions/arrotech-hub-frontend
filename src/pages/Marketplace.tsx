import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  Code,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Grid,
  List,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { MarketplaceWorkflow, WorkflowExportData, WorkflowReview } from '../types';

const Marketplace: React.FC = () => {
  useAuth();
  const [workflows, setWorkflows] = useState<MarketplaceWorkflow[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest'>('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'browse' | 'my-shared' | 'my-downloads'>('browse');
  const [myShared, setMyShared] = useState<any[]>([]);
  const [myDownloads, setMyDownloads] = useState<any[]>([]);
  
  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // Details modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsWorkflow, setDetailsWorkflow] = useState<MarketplaceWorkflow | null>(null);
  const [workflowReviews, setWorkflowReviews] = useState<WorkflowReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Trending workflows
  const [trendingWorkflows, setTrendingWorkflows] = useState<any[]>([]);
  const [, setTrendingLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchWorkflows();
      fetchCategories();
      fetchTrending();
    } else if (activeTab === 'my-shared') {
      fetchMyShared();
    } else if (activeTab === 'my-downloads') {
      fetchMyDownloads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCategory, sortBy]);
  
  const fetchTrending = async () => {
    setTrendingLoading(true);
    try {
      const response = await apiService.getTrendingWorkflows(7, 5);
      if (response.success) {
        setTrendingWorkflows(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await apiService.browseMarketplace({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        limit: 50,
      });
      if (response.success) {
        setWorkflows(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getMarketplaceCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMyShared = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMySharedWorkflows();
      if (response.success) {
        setMyShared(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch shared workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDownloads = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMyDownloads();
      if (response.success) {
        setMyDownloads(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkflows();
  };

  const handleImportWorkflow = async (workflow: MarketplaceWorkflow) => {
    try {
      // Export the workflow first to get full data
      const exportResponse = await apiService.exportWorkflow(workflow.id);
      if (exportResponse.success) {
        // Then import it
        const importResponse = await apiService.importWorkflow({
          workflow_data: exportResponse.data,
          source_workflow_id: workflow.id,
        });
        if (importResponse.success) {
          toast.success(`Imported "${workflow.name}" to your workflows!`);
          fetchWorkflows(); // Refresh to update download counts
        } else {
          toast.error('Failed to import workflow');
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import workflow');
    }
  };

  const handleImportFromJson = async () => {
    setImportLoading(true);
    try {
      const data = JSON.parse(importData) as WorkflowExportData;
      const response = await apiService.importWorkflow({ workflow_data: data });
      if (response.success) {
        toast.success(`Imported "${response.data?.name || 'workflow'}" successfully!`);
        setShowImportModal(false);
        setImportData('');
      } else {
        toast.error('Failed to import workflow');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Invalid JSON or import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCopyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/marketplace/workflow/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  const openWorkflowDetails = async (workflow: MarketplaceWorkflow) => {
    setDetailsWorkflow(workflow);
    setShowDetailsModal(true);
    setNewReview({ rating: 5, title: '', comment: '' });
    
    // Fetch reviews
    setReviewsLoading(true);
    try {
      const response = await apiService.getWorkflowReviews(workflow.id);
      if (response.success) {
        setWorkflowReviews(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!detailsWorkflow) return;
    
    setSubmittingReview(true);
    try {
      const response = await apiService.addWorkflowReview(detailsWorkflow.id, {
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
      });
      
      if (response.success) {
        toast.success('Review submitted successfully!');
        setNewReview({ rating: 5, title: '', comment: '' });
        // Refresh reviews
        const reviewsResponse = await apiService.getWorkflowReviews(detailsWorkflow.id);
        if (reviewsResponse.success) {
          setWorkflowReviews(reviewsResponse.data || []);
        }
        // Refresh workflows to update rating
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExportWorkflow = async (workflowId: number) => {
    try {
      const response = await apiService.exportWorkflow(workflowId);
      if (response.success) {
        const jsonStr = JSON.stringify(response.data, null, 2);
        navigator.clipboard.writeText(jsonStr);
        toast.success('Workflow JSON copied to clipboard!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export workflow');
    }
  };

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return <span className="text-gray-400 text-sm">No ratings</span>;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getCategoryIcon = (category: string | undefined | null) => {
    const icons: Record<string, React.ReactNode> = {
      marketing: <Zap className="w-5 h-5" />,
      sales: <ShoppingBag className="w-5 h-5" />,
      analytics: <Package className="w-5 h-5" />,
      communication: <Globe className="w-5 h-5" />,
    };
    return icons[category?.toLowerCase() || ''] || <Package className="w-5 h-5" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="marketplace-header flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <span>Workflow Marketplace</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Discover, share, and import community workflows
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => {
              if (activeTab === 'browse') fetchWorkflows();
              else if (activeTab === 'my-shared') fetchMyShared();
              else fetchMyDownloads();
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="marketplace-tabs flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'browse'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Browse</span>
        </button>
        <button
          onClick={() => setActiveTab('my-shared')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'my-shared'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>My Shared</span>
        </button>
        <button
          onClick={() => setActiveTab('my-downloads')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'my-downloads'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>My Downloads</span>
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <div className="marketplace-filters bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="downloads">Most Downloaded</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trending Section */}
          {trendingWorkflows.length > 0 && !searchQuery && !selectedCategory && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Trending This Week</h2>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">🔥 Hot</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {trendingWorkflows.map((wf, index) => (
                  <div
                    key={wf.id}
                    onClick={() => {
                      const marketplaceWf = workflows.find(w => w.id === wf.id);
                      if (marketplaceWf) {
                        setDetailsWorkflow(marketplaceWf);
                        setShowDetailsModal(true);
                      }
                    }}
                    className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">#{index + 1}</span>
                      <span className="flex-1 font-medium text-gray-900 truncate">{wf.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{wf.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{wf.downloads_count}</span>
                      </span>
                      {wf.rating && (
                        <span className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{wf.rating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Grid/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No workflows found</h3>
              <p className="text-gray-600 mt-2">
                Be the first to share a workflow with the community!
              </p>
            </div>
          ) : (
            <div className={`marketplace-list ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="marketplace-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg text-purple-600">
                          {getCategoryIcon(workflow.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                          <p className="text-sm text-gray-500">by {workflow.author_name}</p>
                        </div>
                      </div>
                      {workflow.license_type !== 'free' && workflow.price && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                          ${(workflow.price / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {workflow.description || 'No description provided'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <ArrowDownToLine className="w-4 h-4" />
                          <span>{workflow.downloads_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>{workflow.steps_count} steps</span>
                        </span>
                      </div>
                      {renderStars(workflow.rating)}
                    </div>

                    {/* Tags */}
                    {workflow.tags && workflow.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {workflow.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Required Connections */}
                    {workflow.required_connections && workflow.required_connections.length > 0 && (
                      <div className="text-xs text-gray-500 mb-4">
                        <span className="font-medium">Requires:</span>{' '}
                        {workflow.required_connections.join(', ')}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleImportWorkflow(workflow)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Import</span>
                      </button>
                      <button
                        onClick={() => openWorkflowDetails(workflow)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="View Details & Reviews"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Shared Tab */}
      {activeTab === 'my-shared' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : myShared.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No shared workflows</h3>
              <p className="text-gray-600 mt-2">
                Share your workflows from the Workflows page to see them here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myShared.map((wf) => (
                    <tr key={wf.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{wf.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wf.visibility === 'public' ? 'bg-green-100 text-green-700' :
                          wf.visibility === 'marketplace' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {wf.visibility}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{wf.downloads_count}</td>
                      <td className="px-6 py-4">{renderStars(wf.rating)}</td>
                      <td className="px-6 py-4">
                        {wf.share_code && (
                          <button
                            onClick={() => handleCopyShareLink(wf.share_code)}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Copy Link
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* My Downloads Tab */}
      {activeTab === 'my-downloads' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : myDownloads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No downloads yet</h3>
              <p className="text-gray-600 mt-2">
                Import workflows from the marketplace to see them here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imported As</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myDownloads.map((dl) => (
                    <tr key={dl.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{dl.workflow_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(dl.downloaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {dl.imported_workflow_id ? `Workflow #${dl.imported_workflow_id}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Import Workflow from JSON</h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste exported workflow JSON
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder='{"format_version": "1.0", "workflow": {...}}'
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportFromJson}
                  disabled={!importData.trim() || importLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {importLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Import</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Details Modal */}
      {showDetailsModal && detailsWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowDetailsModal(false)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
                    {getCategoryIcon(detailsWorkflow.category)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{detailsWorkflow.name}</h2>
                    <p className="text-gray-600 flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4" />
                      <span>by {detailsWorkflow.author_name || 'Anonymous'}</span>
                      {detailsWorkflow.category && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {detailsWorkflow.category}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Stats Row */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ArrowDownToLine className="w-4 h-4" />
                  <span className="text-sm font-medium">{detailsWorkflow.downloads_count} downloads</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">{detailsWorkflow.steps_count || 0} steps</span>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(detailsWorkflow.rating)}
                  <span className="text-sm text-gray-500 ml-2">
                    ({detailsWorkflow.rating_count || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {detailsWorkflow.description || 'No description provided.'}
                </p>
              </div>
              
              {/* Tags & Requirements */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {detailsWorkflow.tags && detailsWorkflow.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailsWorkflow.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailsWorkflow.required_connections && detailsWorkflow.required_connections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Required Connections</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailsWorkflow.required_connections.map((conn, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1">
                          <Code className="w-3 h-3" />
                          <span>{conn}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Reviews Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Reviews</span>
                </h3>
                
                {/* Add Review Form */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Write a Review</h4>
                  <div className="space-y-3">
                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Your Rating</label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                star <= newReview.rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        placeholder="Review title (optional)"
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Comment */}
                    <div>
                      <textarea
                        placeholder="Share your experience with this workflow..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>
                    
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Submit Review</span>
                    </button>
                  </div>
                </div>
                
                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                  </div>
                ) : workflowReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflowReviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {review.user_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{review.user_name || 'Anonymous'}</p>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating 
                                          ? 'text-yellow-400 fill-yellow-400' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {review.title && (
                          <p className="font-semibold text-gray-900 mb-1">{review.title}</p>
                        )}
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportWorkflow(detailsWorkflow.id)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON</span>
                </button>
              </div>
              <button
                onClick={() => {
                  handleImportWorkflow(detailsWorkflow);
                  setShowDetailsModal(false);
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Import to My Workflows</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;

