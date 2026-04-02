import React, { useEffect, useState, useCallback } from 'react';
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
    Zap,
    X,
    ChevronDown,
    ChevronRight,
    Link2,
    CheckCircle2,
    AlertCircle,
    FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { GalleryTemplate, TemplateCategory, Connection } from '../types';

interface WorkflowTemplatesProps {
    onWorkflowCreated?: () => void;
}

interface DriveFolder {
    id: string;
    name: string;
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

    // Connection & folder state
    const [userConnections, setUserConnections] = useState<Connection[]>([]);
    const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [connectionsLoaded, setConnectionsLoaded] = useState(false);

    useEffect(() => {
        loadTemplates();
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedDifficulty, searchQuery]);

    // Load user connections once
    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            const res = await apiService.getConnections();
            if (res.success && res.data) {
                setUserConnections(res.data);
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
        } finally {
            setConnectionsLoaded(true);
        }
    };

    const isConnected = useCallback((platform: string): boolean => {
        // Normalize: rag_pipeline is always considered connected (platform-managed)
        if (platform === 'rag_pipeline') return true;
        return userConnections.some(
            (c) => c.platform?.toLowerCase() === platform.toLowerCase() && c.status === 'active'
        );
    }, [userConnections]);

    // Load drive folders when a template with folder_picker is selected
    useEffect(() => {
        if (!selectedTemplate) return;
        const hasFolderPicker = Object.values(selectedTemplate.variables).some(
            (v) => v.ui_hint === 'folder_picker'
        );
        if (hasFolderPicker && isConnected('google_workspace') && driveFolders.length === 0) {
            loadDriveFolders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate]);

    const loadDriveFolders = async () => {
        try {
            setLoadingFolders(true);
            const res = await apiService.getDriveFolders();
            if (res.success && Array.isArray(res.data)) {
                setDriveFolders(res.data);
            }
        } catch (error) {
            console.error('Failed to load drive folders:', error);
        } finally {
            setLoadingFolders(false);
        }
    };

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
                return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
            case 'intermediate':
                return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
            case 'advanced':
                return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
            default:
                return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300';
        }
    };

    const getCategoryColor = (categoryName: string) => {
        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        return category?.color || '#8B5CF6';
    };

    const getConnectionLabel = (conn: string) => {
        const labels: Record<string, string> = {
            google_workspace: 'Google Workspace',
            slack: 'Slack',
            notion: 'Notion',
            hubspot: 'HubSpot',
            rag_pipeline: 'RAG Pipeline',
            airtable: 'Airtable',
            clickup: 'ClickUp',
            whatsapp: 'WhatsApp',
        };
        return labels[conn] || conn.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // Check if all required connections are met
    const allConnectionsMet = selectedTemplate
        ? selectedTemplate.required_connections.every((c) => isConnected(c))
        : true;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6 mb-6 transition-colors duration-300">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-4 sm:space-y-0 flex-1 w-full">
                        <div className="relative flex-1 w-full max-w-none lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/40 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-slate-300"
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
                                        className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/40 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none transition-colors"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedDifficulty || ''}
                                        onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/40 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none transition-colors"
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

                    <div className="flex items-center justify-center space-x-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="text-center">
                        <RefreshCw className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400">Loading templates...</p>
                    </div>
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 transition-colors">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No templates found</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Try adjusting your filters or search query to find the perfect starting point.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col h-full"
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
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-lg">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-3 mb-4">{template.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2.5 py-1 rounded-full font-medium ${getDifficultyColor(template.difficulty)}`}>
                                            {template.difficulty}
                                        </span>
                                        <span className="text-gray-500 dark:text-slate-400 flex items-center space-x-1.5 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{template.estimated_time}</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {template.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="px-2.5 py-1 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 rounded-lg text-[10px] font-semibold border border-gray-100 dark:border-slate-700">
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
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50 transition-all cursor-pointer group"
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
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-lg truncate">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{template.description}</p>
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
                                        <span className="text-gray-500 dark:text-slate-400 text-sm flex items-center space-x-1.5 font-medium">
                                            <Clock className="w-4 h-4" />
                                            <span>{template.estimated_time}</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 border-l border-gray-200 dark:border-slate-700 pl-4">
                                            {template.tags.slice(0, 5).map((tag) => (
                                                <span key={tag} className="px-2.5 py-1 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 rounded-lg text-[10px] font-bold border border-gray-100 dark:border-slate-700 uppercase">
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
                <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div
                            className="p-8 border-b border-gray-100 dark:border-slate-700/50 relative"
                            style={{ background: `linear-gradient(135deg, ${getCategoryColor(selectedTemplate.category)}20, transparent)` }}
                        >
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="absolute top-6 right-6 p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <div
                                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-inner-lg bg-white/80 dark:bg-slate-800/80 p-4 border-2 border-white dark:border-slate-700"
                                >
                                    {selectedTemplate.icon}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{selectedTemplate.name}</h2>
                                    <p className="text-lg text-gray-600 dark:text-slate-400 mt-2 font-medium">{selectedTemplate.description}</p>

                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 mt-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${getDifficultyColor(selectedTemplate.difficulty)} shadow-sm`}>
                                            {selectedTemplate.difficulty.toUpperCase()}
                                        </span>
                                        <span className="text-gray-600 dark:text-slate-300 font-bold text-sm bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-white/50 dark:border-slate-700 flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            <span>{selectedTemplate.estimated_time}</span>
                                        </span>
                                        <span className="text-gray-600 dark:text-slate-300 font-bold text-sm bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-white/50 dark:border-slate-700 flex items-center space-x-2">
                                            <Layout className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                            <span>{selectedTemplate.steps.length} STEPS</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-slate-900">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Info */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Workflow Steps Preview */}
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></div>
                                            <span>Automation Flow</span>
                                        </h3>
                                        <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-800">
                                            {selectedTemplate.steps.map((step, index) => (
                                                <div key={index} className="relative z-10 flex items-start space-x-4 group">
                                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 flex items-center justify-center text-sm font-black shadow-sm group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                                        {step.step_number}
                                                    </div>
                                                    <div className="flex-1 p-5 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm group-hover:border-purple-200 dark:group-hover:border-purple-500/30 transition-all">
                                                        <p className="font-bold text-gray-900 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors uppercase text-xs tracking-wide">Action Description</p>
                                                        <p className="text-gray-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">{step.description}</p>
                                                        <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
                                                            <code className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider">{step.tool_name.replace('_', ' ')}</code>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Sidebar Info */}
                                <div className="space-y-8">
                                    {/* Required Connections — with live status */}
                                    {selectedTemplate.required_connections.length > 0 && (
                                        <section className="bg-blue-50/50 dark:bg-blue-500/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Required Services</h3>
                                            <div className="space-y-2.5">
                                                {selectedTemplate.required_connections.map((conn) => {
                                                    const connected = isConnected(conn);
                                                    return (
                                                        <div
                                                            key={conn}
                                                            className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase shadow-sm flex items-center justify-between gap-2 border transition-all ${
                                                                connected
                                                                    ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400'
                                                                    : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-2 min-w-0">
                                                                {connected ? (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                                )}
                                                                <span className="truncate">{getConnectionLabel(conn)}</span>
                                                            </div>
                                                            {connected ? (
                                                                <span className="text-[9px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-black flex-shrink-0">
                                                                    CONNECTED
                                                                </span>
                                                            ) : (
                                                                <a
                                                                    href="/connections"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black flex-shrink-0 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors flex items-center space-x-1"
                                                                >
                                                                    <Link2 className="w-2.5 h-2.5" />
                                                                    <span>CONNECT</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {!allConnectionsMet && (
                                                <p className="mt-3 text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-tight">
                                                    ⚠️ Connect missing services before deploying this workflow.
                                                </p>
                                            )}
                                        </section>
                                    )}

                                    {/* Variables / Inputs Needed — with prefilled defaults, folder picker, connection hints */}
                                    {Object.keys(selectedTemplate.variables).length > 0 && (
                                        <section className="bg-purple-50/30 dark:bg-purple-500/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                                            <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4">Inputs Needed</h3>
                                            <div className="space-y-3">
                                                {Object.entries(selectedTemplate.variables).map(([key, config]) => {
                                                    const connectionMissing = config.connection_for && !isConnected(config.connection_for);
                                                    const isFolderPicker = config.ui_hint === 'folder_picker';

                                                    return (
                                                        <div key={key} className="p-4 bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-500/20 rounded-xl shadow-sm">
                                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                                <code className="text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase truncate">{key}</code>
                                                                <div className="flex items-center space-x-1.5 flex-shrink-0">
                                                                    {config.required && (
                                                                        <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black uppercase">Required</span>
                                                                    )}
                                                                    {connectionMissing && (
                                                                        <a
                                                                            href="/connections"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black flex items-center space-x-1 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                                                                        >
                                                                            <Link2 className="w-2.5 h-2.5" />
                                                                            <span>Connect</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold leading-tight">
                                                                {config.description}
                                                            </p>

                                                            {/* Show prefilled default or folder picker preview */}
                                                            {isFolderPicker && isConnected('google_workspace') ? (
                                                                <div className="mt-2.5 flex items-center space-x-2 text-[11px]">
                                                                    <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                                                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                                        {loadingFolders
                                                                            ? 'Loading folders...'
                                                                            : `${driveFolders.length} folder${driveFolders.length !== 1 ? 's' : ''} available`
                                                                        }
                                                                    </span>
                                                                    <span className="text-gray-400 dark:text-slate-500">— dropdown in execution</span>
                                                                </div>
                                                            ) : config.default != null ? (
                                                                <div className="mt-2.5 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mr-1.5">Default:</span>
                                                                    <span className="text-[11px] text-gray-700 dark:text-slate-300 font-semibold">{String(config.default)}</span>
                                                                </div>
                                                            ) : config.placeholder ? (
                                                                <div className="mt-2.5 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mr-1.5">Example:</span>
                                                                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium italic">{config.placeholder}</span>
                                                                </div>
                                                            ) : config.enum ? (
                                                                <div className="mt-2.5 flex flex-wrap gap-1">
                                                                    {config.enum.map((opt) => (
                                                                        <span
                                                                            key={opt}
                                                                            className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md font-bold border border-purple-100 dark:border-purple-500/20"
                                                                        >
                                                                            {opt}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {/* Tags */}
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 pl-1">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTemplate.tags.map((tag) => (
                                                <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase border border-gray-200 dark:border-slate-700 transition-colors hover:bg-gray-200 dark:hover:bg-slate-700">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Modal Sticky Footer */}
                        <div className="p-8 border-t border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-900">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center space-x-3 text-gray-500 dark:text-slate-400">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <p className="text-sm font-semibold leading-snug">
                                        Instantly deploy this automation.<br className="hidden sm:block" />
                                        <span className="text-gray-400 dark:text-slate-500 font-medium">Fully customizable after setup.</span>
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setSelectedTemplate(null)}
                                        className="flex-1 sm:flex-none px-8 py-3.5 text-gray-900 dark:text-slate-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
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
