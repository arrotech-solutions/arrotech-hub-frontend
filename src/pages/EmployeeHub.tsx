import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PenLine, FileText, Eye, Clock, Plus, Edit3, Trash2, LogOut,
    Save, Send, ArrowLeft, Tag, Image, Star, ChevronDown, Briefcase,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { BLOG_CATEGORIES } from '../data/blogData';

interface MyPost {
    id: number;
    slug: string;
    title: string;
    description: string;
    status: string;
    is_featured: boolean;
    read_time: string;
    views_count: number;
    published_at: string | null;
    created_at: string | null;
}

type Tab = 'my-posts' | 'write';

const EmployeeHub: React.FC = () => {
    const { user, isEmployee, hasPermission, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('my-posts');
    const [myPosts, setMyPosts] = useState<MyPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Editor state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const canWrite = hasPermission('blog_write');
    const canPublish = hasPermission('blog_publish');

    // Fetch my posts
    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiService.getMyPosts();
            if (res.success) setMyPosts(res.data);
        } catch {
            // Silently handle
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isEmployee) {
            navigate('/');
            return;
        }
        fetchPosts();
    }, [isEmployee, navigate, fetchPosts]);

    // Reset editor
    const resetEditor = useCallback(() => {
        setTitle('');
        setDescription('');
        setContent('');
        setCategory('');
        setTags('');
        setCoverImage('');
        setIsFeatured(false);
        setEditingPostId(null);
        setShowPreview(false);
    }, []);

    // Load post into editor
    const loadPostForEdit = useCallback(async (post: MyPost) => {
        try {
            const res = await apiService.getBlogPost(post.slug);
            if (res?.post) {
                const p = res.post;
                setTitle(p.title);
                setDescription(p.description);
                setContent(p.content);
                setCategory(p.category || '');
                setTags((p.tags || []).join(', '));
                setCoverImage(p.cover_image || '');
                setIsFeatured(p.is_featured || false);
                setEditingPostId(p.id);
                setActiveTab('write');
            }
        } catch {
            toast.error('Failed to load post');
        }
    }, []);

    // Save draft
    const handleSaveDraft = useCallback(async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        setIsSaving(true);
        try {
            const data = {
                title,
                description,
                content,
                category: category || undefined,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                cover_image: coverImage || undefined,
                is_featured: isFeatured,
                is_published: false,
                author_name: user?.name || 'Arrotech Team',
            };

            if (editingPostId) {
                await apiService.updateBlogPost(editingPostId, data);
                toast.success('Draft updated');
            } else {
                await apiService.createBlogPost(data);
                toast.success('Draft saved');
            }
            resetEditor();
            setActiveTab('my-posts');
            fetchPosts();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    }, [title, description, content, category, tags, coverImage, isFeatured, editingPostId, user, resetEditor, fetchPosts]);

    // Publish
    const handlePublish = useCallback(async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        setIsSaving(true);
        try {
            const data = {
                title,
                description,
                content,
                category: category || undefined,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                cover_image: coverImage || undefined,
                is_featured: isFeatured,
                is_published: true,
                author_name: user?.name || 'Arrotech Team',
            };

            if (editingPostId) {
                await apiService.updateBlogPost(editingPostId, data);
                toast.success('Post published!');
            } else {
                await apiService.createBlogPost(data);
                toast.success('Post published!');
            }
            resetEditor();
            setActiveTab('my-posts');
            fetchPosts();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to publish');
        } finally {
            setIsSaving(false);
        }
    }, [title, description, content, category, tags, coverImage, isFeatured, editingPostId, user, resetEditor, fetchPosts]);

    // Delete
    const handleDelete = useCallback(async (postId: number) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await apiService.deleteBlogPost(postId);
            toast.success('Post deleted');
            fetchPosts();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to delete');
        }
    }, [fetchPosts]);

    // Simple markdown preview
    const previewHtml = useMemo(() => {
        return content
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-purple-400 pl-4 my-2 text-gray-600 italic">$1</blockquote>')
            .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
            .replace(/`(.*?)`/gim, '<code class="px-1 py-0.5 bg-gray-100 text-purple-600 rounded text-sm">$1</code>')
            .replace(/^(?!<[hlubsc])(.+)$/gim, '<p class="mb-3 text-gray-700">$1</p>');
    }, [content]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <Helmet>
                <title>Employee Hub — Arrotech</title>
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Employee Hub</h1>
                                <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Permission badges */}
                            <div className="hidden sm:flex items-center gap-2">
                                {canWrite && (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">✏️ Write</span>
                                )}
                                {canPublish && (
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">🚀 Publish</span>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
                        <button
                            onClick={() => { resetEditor(); setActiveTab('my-posts'); }}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-posts'
                                    ? 'border-purple-600 text-purple-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-1.5" /> My Posts
                        </button>
                        {canWrite && (
                            <button
                                onClick={() => { resetEditor(); setActiveTab('write'); }}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'write'
                                        ? 'border-purple-600 text-purple-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <PenLine className="w-4 h-4 inline mr-1.5" /> Write Post
                            </button>
                        )}
                    </div>
                </header>

                {/* Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* ── My Posts Tab ── */}
                    {activeTab === 'my-posts' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Your Blog Posts</h2>
                                {canWrite && (
                                    <button
                                        onClick={() => { resetEditor(); setActiveTab('write'); }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> New Post
                                    </button>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                                            <div className="h-4 bg-gray-100 rounded w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : myPosts.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
                                    <p className="text-gray-500 text-sm mb-6">Start writing your first blog post!</p>
                                    {canWrite && (
                                        <button
                                            onClick={() => { resetEditor(); setActiveTab('write'); }}
                                            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700"
                                        >
                                            Write Your First Post
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myPosts.map(post => (
                                        <div
                                            key={post.id}
                                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex items-start justify-between gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${post.status === 'published'
                                                            ? 'bg-green-100 text-green-700'
                                                            : post.status === 'archived'
                                                                ? 'bg-gray-100 text-gray-500'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {post.status}
                                                    </span>
                                                    {post.is_featured && (
                                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{post.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time}</span>
                                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views_count} views</span>
                                                    {post.published_at && (
                                                        <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {canWrite && (
                                                    <button
                                                        onClick={() => loadPostForEdit(post)}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canPublish && (
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Write Tab ── */}
                    {activeTab === 'write' && canWrite && (
                        <div>
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { resetEditor(); setActiveTab('my-posts'); }}
                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingPostId ? 'Edit Post' : 'New Post'}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showPreview ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Eye className="w-4 h-4 inline mr-1" /> Preview
                                    </button>
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 inline mr-1" /> Save Draft
                                    </button>
                                    {canPublish && (
                                        <button
                                            onClick={handlePublish}
                                            disabled={isSaving}
                                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4 inline mr-1" /> Publish
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-[1fr_320px]'} gap-6`}>
                                {/* Editor or Preview split */}
                                <div className="space-y-4">
                                    {/* Title */}
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Post title..."
                                        className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                                    />

                                    {/* Description */}
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Brief description or excerpt..."
                                        rows={2}
                                        className="w-full text-gray-600 bg-white border border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-none"
                                    />

                                    {/* Content */}
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        placeholder="Write your article in Markdown..."
                                        rows={showPreview ? 20 : 28}
                                        className="w-full font-mono text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-y"
                                    />
                                </div>

                                {/* Side panel — Preview or Metadata */}
                                <div>
                                    {showPreview ? (
                                        <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-auto max-h-[80vh]">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{title || 'Untitled'}</h3>
                                            <p className="text-gray-500 mb-6">{description}</p>
                                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Category */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                    <ChevronDown className="w-4 h-4" /> Category
                                                </label>
                                                <select
                                                    value={category}
                                                    onChange={e => setCategory(e.target.value)}
                                                    className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                                >
                                                    <option value="">No category</option>
                                                    {BLOG_CATEGORIES.map(c => (
                                                        <option key={c.slug} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Tags */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                    <Tag className="w-4 h-4" /> Tags
                                                </label>
                                                <input
                                                    type="text"
                                                    value={tags}
                                                    onChange={e => setTags(e.target.value)}
                                                    placeholder="Tag1, Tag2, Tag3"
                                                    className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                                />
                                            </div>

                                            {/* Cover Image */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                    <Image className="w-4 h-4" /> Cover Image URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={coverImage}
                                                    onChange={e => setCoverImage(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                                />
                                                {coverImage && (
                                                    <img src={coverImage} alt="Cover" className="mt-3 rounded-lg w-full h-32 object-cover" />
                                                )}
                                            </div>

                                            {/* Featured toggle */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isFeatured}
                                                        onChange={e => setIsFeatured(e.target.checked)}
                                                        className="w-4 h-4 accent-purple-600"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                                            <Star className="w-4 h-4" /> Featured Post
                                                        </span>
                                                        <p className="text-xs text-gray-400 mt-0.5">Show in hero section on the blog page</p>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Word count */}
                                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                                                <p><strong>{content.split(/\s+/).filter(Boolean).length}</strong> words</p>
                                                <p><strong>{Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 200))}</strong> min read</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No permission state */}
                    {activeTab === 'write' && !canWrite && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                            <PenLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Writing Permission Required</h3>
                            <p className="text-gray-500 text-sm">
                                You need the <strong>blog_write</strong> permission to create posts.<br />
                                Contact your admin to get access.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default EmployeeHub;
