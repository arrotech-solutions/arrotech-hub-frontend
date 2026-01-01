import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Filter,
  Grid,
  Layout,
  List,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { GalleryTemplate, TemplateCategory } from '../types';

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<GalleryTemplate | null>(null);
  const [usingTemplate, setUsingTemplate] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTemplates({
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
        search: searchQuery || undefined,
      });
      
      if (response.success) {
        setTemplates(response.data?.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getTemplateCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      setUsingTemplate(true);
      const response = await apiService.useTemplate(templateId);
      
      if (response.success) {
        toast.success(`Workflow created from template!`);
        setSelectedTemplate(null);
        // Optionally navigate to the workflow
        // navigate(`/workflows/${response.data.workflow_id}`);
      } else {
        toast.error(response.message || 'Failed to create workflow');
      }
    } catch (error) {
      console.error('Failed to use template:', error);
      toast.error('Failed to create workflow from template');
    } finally {
      setUsingTemplate(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return category?.color || '#8B5CF6';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflow Templates</h1>
            <p className="text-gray-600">Pre-built workflows to get you started quickly</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Categories</span>
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    selectedCategory === category.name ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No templates found</h3>
              <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div 
                    className="h-24 flex items-center justify-center text-4xl"
                    style={{ backgroundColor: getCategoryColor(template.category) + '20' }}
                  >
                    {template.icon}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </span>
                      <span className="text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{template.estimated_time}</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(template.category) + '20' }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template.id);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Use</span>
                        </button>
                      </div>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(template.difficulty)}`}>
                          {template.difficulty}
                        </span>
                        <span className="text-gray-500 text-sm flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{template.estimated_time}</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div 
              className="p-6 border-b border-gray-200"
              style={{ backgroundColor: getCategoryColor(selectedTemplate.category) + '10' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: getCategoryColor(selectedTemplate.category) + '20' }}
                  >
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                  {selectedTemplate.difficulty}
                </span>
                <span className="text-gray-600 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedTemplate.estimated_time}</span>
                </span>
                <span className="text-gray-600 flex items-center space-x-1">
                  <Layout className="w-4 h-4" />
                  <span>{selectedTemplate.steps.length} steps</span>
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Required Connections */}
              {selectedTemplate.required_connections.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Required Connections
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.required_connections.map((conn) => (
                      <span
                        key={conn}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize"
                      >
                        {conn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Workflow Steps
                </h3>
                <div className="space-y-3">
                  {selectedTemplate.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {step.step_number}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{step.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Tool: <code className="bg-gray-200 px-1 rounded">{step.tool_name}</code>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variables */}
              {Object.keys(selectedTemplate.variables).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Input Variables
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedTemplate.variables).map(([key, config]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <code className="text-purple-600 font-medium">{key}</code>
                          {config.required && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">required</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {config.type}
                          {config.description && ` - ${config.description}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 inline mr-1 text-purple-600" />
                  This will create a new workflow that you can customize
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUseTemplate(selectedTemplate.id)}
                    disabled={usingTemplate}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {usingTemplate ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Use This Template</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;

