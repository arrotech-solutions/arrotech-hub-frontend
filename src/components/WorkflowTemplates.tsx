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
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { GalleryTemplate, TemplateCategory } from '../types';

interface WorkflowTemplatesProps {
    onWorkflowCreated?: () => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({ onWorkflowCreated }) => {
    const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
    const [categories, setCategories] = useState<TemplateCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTemplate, setSelectedTemplate] = useState<GalleryTemplate | null>(null);
    const [usingTemplate, setUsingTemplate] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

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
                if (onWorkflowCreated) {
                    onWorkflowCreated();
                }
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Filters - Redesigned to match Workflows page style */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 flex-1 w-full">
                        <div className="relative flex-1 w-full max-w-none lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filters</span>
                                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {showFilters && (
                                <>
                                    <select
                                        value={selectedCategory || ''}
                                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedDifficulty || ''}
                                        onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-center">
                        <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading templates...</p>
                    </div>
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900">No templates found</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">Try adjusting your filters or search query to find the perfect starting point.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer group flex flex-col h-full"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div
                                className="h-32 flex items-center justify-center text-5xl transition-transform duration-300 group-hover:scale-110"
                                style={{ backgroundColor: getCategoryColor(template.category) + '15' }}
                            >
                                {template.icon}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors text-lg">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{template.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2.5 py-1 rounded-full font-medium ${getDifficultyColor(template.difficulty)}`}>
                                            {template.difficulty}
                                        </span>
                                        <span className="text-gray-500 flex items-center space-x-1.5 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{template.estimated_time}</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {template.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-semibold border border-gray-100">
                                                {tag.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                                    style={{ backgroundColor: getCategoryColor(template.category) + '15' }}
                                >
                                    {template.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-lg truncate">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUseTemplate(template.id);
                                            }}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center space-x-2 shadow-sm"
                                        >
                                            <Play className="w-4 h-4 fill-white" />
                                            <span>Use Template</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getDifficultyColor(template.difficulty)}`}>
                                            {template.difficulty.toUpperCase()}
                                        </span>
                                        <span className="text-gray-500 text-sm flex items-center space-x-1.5 font-medium">
                                            <Clock className="w-4 h-4" />
                                            <span>{template.estimated_time}</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 border-l border-gray-200 pl-4">
                                            {template.tags.slice(0, 5).map((tag) => (
                                                <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold border border-gray-100 uppercase">
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

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div
                            className="p-8 border-b border-gray-100 relative"
                            style={{ background: `linear-gradient(135deg, ${getCategoryColor(selectedTemplate.category)}20, transparent)` }}
                        >
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all shadow-sm flex items-center justify-center bg-white/50 border border-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <div
                                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-inner-lg bg-white/80 p-4 border-2 border-white"
                                >
                                    {selectedTemplate.icon}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{selectedTemplate.name}</h2>
                                    <p className="text-lg text-gray-600 mt-2 font-medium">{selectedTemplate.description}</p>

                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 mt-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${getDifficultyColor(selectedTemplate.difficulty)} shadow-sm`}>
                                            {selectedTemplate.difficulty.toUpperCase()}
                                        </span>
                                        <span className="text-gray-600 font-bold text-sm bg-white/60 px-3 py-1.5 rounded-full border border-white/50 flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-purple-600" />
                                            <span>{selectedTemplate.estimated_time}</span>
                                        </span>
                                        <span className="text-gray-600 font-bold text-sm bg-white/60 px-3 py-1.5 rounded-full border border-white/50 flex items-center space-x-2">
                                            <Layout className="w-4 h-4 text-pink-600" />
                                            <span>{selectedTemplate.steps.length} STEPS</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Info */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Workflow Steps Preview */}
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                                            <span>Automation Flow</span>
                                        </h3>
                                        <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                            {selectedTemplate.steps.map((step, index) => (
                                                <div key={index} className="relative z-10 flex items-start space-x-4 group">
                                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-purple-600 text-purple-700 flex items-center justify-center text-sm font-black shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                                        {step.step_number}
                                                    </div>
                                                    <div className="flex-1 p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm group-hover:border-purple-200 transition-all">
                                                        <p className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors uppercase text-xs tracking-wide">Action Description</p>
                                                        <p className="text-gray-700 mt-1 font-medium leading-relaxed">{step.description}</p>
                                                        <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                            <code className="text-[10px] font-black text-pink-600 uppercase tracking-wider">{step.tool_name.replace('_', ' ')}</code>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Sidebar Info */}
                                <div className="space-y-8">
                                    {/* Required Connections */}
                                    {selectedTemplate.required_connections.length > 0 && (
                                        <section className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Required Services</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.required_connections.map((conn) => (
                                                    <div
                                                        key={conn}
                                                        className="px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-bold uppercase shadow-sm flex items-center space-x-2"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                        <span>{conn}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Variables */}
                                    {Object.keys(selectedTemplate.variables).length > 0 && (
                                        <section className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100">
                                            <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">Inputs Needed</h3>
                                            <div className="space-y-3">
                                                {Object.entries(selectedTemplate.variables).map(([key, config]) => (
                                                    <div key={key} className="p-4 bg-white border border-purple-100 rounded-xl shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <code className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded uppercase">{key}</code>
                                                            {config.required && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Required</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 font-bold leading-tight">
                                                            {config.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Tags */}
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTemplate.tags.map((tag) => (
                                                <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase border border-gray-200 transition-colors hover:bg-gray-200">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Sticky Footer */}
                        <div className="p-8 border-t border-gray-100 bg-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center space-x-3 text-gray-500">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-semibold leading-snug">
                                        Instantly deploy this automation.<br className="hidden sm:block" />
                                        <span className="text-gray-400 font-medium">Fully customizable after setup.</span>
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setSelectedTemplate(null)}
                                        className="flex-1 sm:flex-none px-8 py-3.5 text-gray-900 font-bold hover:bg-gray-100 rounded-2xl transition-all border border-transparent hover:border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUseTemplate(selectedTemplate.id)}
                                        disabled={usingTemplate}
                                        className="flex-1 sm:flex-none px-10 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-xl hover:scale-[1.02] transform transition-all flex items-center justify-center space-x-3 disabled:opacity-50 shadow-lg font-black tracking-wide"
                                    >
                                        {usingTemplate ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                <span className="uppercase">Creating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 fill-white" />
                                                <span className="uppercase">Deploy This Flow</span>
                                                <ArrowRight className="w-5 h-5" />
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

export default WorkflowTemplates;
