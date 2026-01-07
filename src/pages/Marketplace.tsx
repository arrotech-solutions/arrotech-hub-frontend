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
      <div className="marketplace-header flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 flex flex-col sm:flex-row items-center sm:space-x-3 gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <span>Workflow Marketplace</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium max-w-md">
            Discover, share, and import community-driven intelligent workflows.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-center md:justify-end">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all shadow-sm font-bold"
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
            className="p-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto custom-scrollbar-hide mb-8">
        <div className="marketplace-tabs flex space-x-1 bg-gray-100/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-1.5 w-max">
          {[
            { id: 'browse', label: 'Browse', icon: Globe },
            { id: 'my-shared', label: 'My Shared', icon: Share2 },
            { id: 'my-downloads', label: 'My Downloads', icon: Download }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive
                  ? 'bg-white text-purple-600 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <div className="marketplace-filters bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-4 sm:p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sm:gap-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search workflows by name, tags, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>
              </form>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4">
                {/* Category Filter */}
                <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                  <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full pl-10 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-sm appearance-none cursor-pointer"
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
                <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="downloads">Most Popular</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Latest First</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center p-1 bg-gray-100 rounded-xl mx-auto sm:mx-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                    className="group bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 border border-orange-100/50 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-12 h-12 text-orange-600" />
                    </div>
                    <div className="relative flex items-center space-x-3 mb-3">
                      <span className="text-xl font-black text-orange-600/40">#{index + 1}</span>
                      <span className="flex-1 font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{wf.name}</span>
                    </div>
                    <p className="relative text-xs text-gray-500 line-clamp-2 mb-4 font-medium leading-relaxed italic">"{wf.description || 'Seamless community automation.'}"</p>
                    <div className="relative flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Download className="w-3 h-3 text-orange-500" />
                        <span>{wf.downloads_count}</span>
                      </span>
                      {wf.rating ? (
                        <span className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-gray-900">{wf.rating.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">Unrated</span>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Downloads</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myShared.map((wf) => (
                      <tr key={wf.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{wf.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${wf.visibility === 'public' ? 'bg-green-50 border-green-100 text-green-700' :
                            wf.visibility === 'marketplace' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                              'bg-gray-50 border-gray-100 text-gray-700'
                            }`}>
                            {wf.visibility}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 font-medium text-gray-600">
                            <Download className="w-4 h-4 text-gray-400" />
                            <span>{wf.downloads_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{renderStars(wf.rating)}</td>
                        <td className="px-6 py-4">
                          {wf.share_code && (
                            <button
                              onClick={() => handleCopyShareLink(wf.share_code)}
                              className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all font-bold text-xs"
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

              <div className="sm:hidden divide-y divide-gray-100">
                {myShared.map((wf) => (
                  <div key={wf.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{wf.name}</h4>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${wf.visibility === 'public' ? 'bg-green-50 border-green-100 text-green-700' :
                          wf.visibility === 'marketplace' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                            'bg-gray-50 border-gray-100 text-gray-700'
                          }`}>
                          {wf.visibility}
                        </span>
                      </div>
                      {wf.share_code && (
                        <button
                          onClick={() => handleCopyShareLink(wf.share_code)}
                          className="p-2 text-purple-600 bg-purple-50 rounded-lg"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5 text-gray-600 font-medium">
                          <Download className="w-3.5 h-3.5 text-gray-400" />
                          <span>{wf.downloads_count}</span>
                        </div>
                      </div>
                      {renderStars(wf.rating)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Workflow</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Downloaded</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Imported As</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myDownloads.map((dl) => (
                      <tr key={dl.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{dl.workflow_name}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {new Date(dl.downloaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                            {dl.imported_workflow_id ? `Workflow #${dl.imported_workflow_id}` : 'Manual Import'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View for Downloads */}
              <div className="sm:hidden divide-y divide-gray-100">
                {myDownloads.map((dl) => (
                  <div key={dl.id} className="p-5 space-y-3">
                    <h4 className="font-bold text-gray-900">{dl.workflow_name}</h4>
                    <div className="flex items-center justify-between text-xs italic text-gray-500 font-medium">
                      <span>Downloaded on {new Date(dl.downloaded_at).toLocaleDateString()}</span>
                      <span className="text-blue-600 font-black">
                        {dl.imported_workflow_id ? `#${dl.imported_workflow_id}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Import Workflow</h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Paste exported workflow JSON
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full h-64 px-4 py-3 border border-gray-200 rounded-2xl font-mono text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all placeholder:text-gray-400"
                    placeholder='{"format_version": "1.0", "workflow": {...}}'
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleImportFromJson}
                disabled={!importData.trim() || importLoading}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 font-bold text-sm"
              >
                {importLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Import JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Details Modal */}
      {showDetailsModal && detailsWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-pink-600">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                    {getCategoryIcon(detailsWorkflow.category)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate max-w-[200px] sm:max-w-none">{detailsWorkflow.name}</h2>
                    <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">
                      by {detailsWorkflow.author_name || 'Anonymous'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6">
                <div className="flex items-center space-x-2 text-white/90">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-bold">{detailsWorkflow.downloads_count} downloads</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">{detailsWorkflow.steps_count || 0} steps</span>
                </div>
                <div className="flex items-center rounded-lg bg-white/20 px-3 py-1 backdrop-blur-md">
                  {renderStars(detailsWorkflow.rating)}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-5 rounded-2xl border border-gray-100 italic">
                  "{detailsWorkflow.description || 'No description provided.'}"
                </p>
              </div>

              {/* Tags & Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {detailsWorkflow.tags && detailsWorkflow.tags.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Community Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailsWorkflow.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailsWorkflow.required_connections && detailsWorkflow.required_connections.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dependencies</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailsWorkflow.required_connections.map((conn, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 flex items-center space-x-2">
                          <Code className="w-3.5 h-3.5" />
                          <span>{conn}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>Community Reviews</span>
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase">{detailsWorkflow.rating_count || 0} Ratings</span>
                </div>

                {/* Add Review Form */}
                <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-4 text-sm">Contribute a Review</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Rating</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="focus:outline-none transform hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${star <= newReview.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200 hover:text-yellow-200'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Headline for your review..."
                          value={newReview.title}
                          onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <textarea
                          placeholder="How has this workflow helped you? What could be improved?"
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="flex items-center space-x-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 font-bold text-sm shadow-md"
                      >
                        {submittingReview ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Post Review</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                  </div>
                ) : workflowReviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-bold text-sm uppercase">No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflowReviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-purple-500/20">
                              {review.user_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{review.user_name || 'Anonymous User'}</p>
                              <div className="flex items-center space-x-1 mt-0.5">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {review.title && (
                          <p className="font-bold text-gray-900 mb-2 truncate">{review.title}</p>
                        )}
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => handleExportWorkflow(detailsWorkflow.id)}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => {
                  handleImportWorkflow(detailsWorkflow);
                  setShowDetailsModal(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-bold text-sm shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Import to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Marketplace;

