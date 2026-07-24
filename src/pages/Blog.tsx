import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, Eye, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from '../data/blogData';
import { apiService } from '../services/api';
import { Helmet } from 'react-helmet-async';
import { EmptyState } from '../components/states';
import { chart } from '../theme';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prod.api.arrotechsolutions.com';

const Blog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [nlEmail, setNlEmail] = useState('');
    const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [nlMessage, setNlMessage] = useState('');

    // Attempt API fetch, fallback to local data
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await apiService.getBlogPosts({ per_page: 50 });
                if (res?.posts?.length > 0) {
                    const apiPosts: BlogPost[] = res.posts.map((p: any) => ({
                        id: p.id,
                        slug: p.slug,
                        title: p.title,
                        description: p.description,
                        content: p.content,
                        cover_image: p.cover_image,
                        author: p.author_name,
                        author_avatar: p.author_avatar,
                        date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                        readTime: p.read_time,
                        tags: p.tags || [],
                        category: p.category,
                        category_color: p.category_color,
                        is_featured: p.is_featured,
                        views_count: p.views_count,
                    }));
                    setPosts(apiPosts);
                }
            } catch (err) {
                console.error('Failed to fetch blog posts:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const filteredPosts = useMemo(() => {
        let result = posts;
        if (activeCategory !== 'all') {
            const catName = BLOG_CATEGORIES.find(c => c.slug === activeCategory)?.name;
            result = result.filter(p => p.category?.toLowerCase() === catName?.toLowerCase());
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        return result;
    }, [posts, activeCategory, searchQuery]);

    const featuredPost = useMemo(() => posts.find(p => p.is_featured), [posts]);
    const regularPosts = useMemo(() => filteredPosts.filter(p => p.slug !== featuredPost?.slug), [filteredPosts, featuredPost]);

    const handleCategoryClick = useCallback((slug: string) => setActiveCategory(slug), []);

    return (
        <>
            <Helmet>
                <title>Blog — Arrotech Hub | Insights on Automation, AI & Productivity</title>
                <meta name="description" content="Explore the latest insights on business automation, AI agents, M-Pesa integrations, and productivity from the Arrotech Hub team." />
            </Helmet>

            <div className="min-h-screen bg-transparent transition-colors">
                {/* ── Hero Section ── */}
                {featuredPost && (
                    <section className="relative overflow-hidden bg-transparent transition-colors">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 25% 50%, rgba(255, 70, 150, 0.3) 0%, transparent 50%),
                                                  radial-gradient(circle at 75% 50%, rgba(255, 200, 87, 0.2) 0%, transparent 50%)`,
                            }} />
                            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-slate-200 dark:stroke-white/5" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>

                        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30 backdrop-blur-sm transition-colors">
                                            <Sparkles size={12} />
                                            Featured
                                        </span>
                                        {featuredPost.category && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-white/70 border border-slate-200 dark:border-white/10 backdrop-blur-sm transition-colors">
                                                {featuredPost.category}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tighter transition-colors">
                                        {featuredPost.title}
                                    </h1>

                                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl font-medium transition-colors">
                                        {featuredPost.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{featuredPost.author}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <span>{featuredPost.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <span className="flex items-center gap-1"><Clock size={13} />{featuredPost.readTime}</span>
                                    </div>

                                    <Link
                                        to={`/blog/${featuredPost.slug}`}
                                        className="group inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-50 transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5"
                                    >
                                        Read Article
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                <div className="mt-10 lg:mt-0 lg:block">
                                    {featuredPost.cover_image ? (
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-secondary-800 to-primary-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                                            <img
                                                src={featuredPost.cover_image}
                                                alt={featuredPost.title}
                                                className="relative rounded-2xl shadow-2xl w-full h-80 object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative rounded-2xl bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur w-full h-80 flex items-center justify-center">
                                            <TrendingUp className="text-purple-400/30" size={120} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Filter & Search Bar ── */}
                <section className="sticky top-0 z-30 bg-transparent backdrop-blur-md transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
                            {/* Category pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto sm:flex-1 pb-2">
                                {BLOG_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.slug}
                                        onClick={() => handleCategoryClick(cat.slug)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.slug
                                            ? 'text-white shadow-md'
                                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                                            }`}
                                        style={activeCategory === cat.slug ? { backgroundColor: cat.color } : undefined}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-500/50 focus:border-purple-300 dark:focus:border-purple-500/50 transition-all"
                                />
                                <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-slate-500 bg-gray-200/80 dark:bg-slate-700/80 rounded transition-colors">⌘K</kbd>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Post Grid ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-200 rounded-2xl h-48 mb-4" />
                                    <div className="bg-gray-200 h-4 rounded-lg w-3/4 mb-3" />
                                    <div className="bg-gray-200 h-3 rounded-lg w-full mb-2" />
                                    <div className="bg-gray-200 h-3 rounded-lg w-5/6" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && filteredPosts.length === 0 && (
                        <EmptyState
                            query={searchQuery || undefined}
                            title={searchQuery ? undefined : 'No articles found'}
                            description={
                                searchQuery
                                    ? undefined
                                    : 'No articles in this category yet. Check back soon!'
                            }
                            action={{
                                label: 'View all articles',
                                onClick: () => { setSearchQuery(''); setActiveCategory('all'); },
                            }}
                        />
                    )}

                    {/* Posts grid */}
                    {!isLoading && filteredPosts.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {regularPosts.map((post, index) => (
                                <Link
                                    key={post.slug}
                                    to={`/blog/${post.slug}`}
                                    onMouseEnter={() => setHoveredCard(post.slug)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    className="group bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-none hover:-translate-y-1 hover:border-purple-200/60 dark:hover:border-purple-500/30"
                                    style={{ animationDelay: `${index * 80}ms` }}
                                >
                                    {/* Cover image */}
                                    {post.cover_image && (
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={post.cover_image}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                            {post.category && (
                                                <span
                                                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                                                    style={{ backgroundColor: `${post.category_color || chart.secondary}cc` }}
                                                >
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-1">
                                        {/* Tags */}
                                        {!post.cover_image && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {post.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full transition-colors">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>

                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium line-clamp-2 flex-1 transition-colors">
                                            {post.description}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-700 to-primary-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {post.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-900 dark:text-white transition-colors">{post.author}</p>
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 transition-colors">{post.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 transition-colors">
                                                <span className="flex items-center gap-1"><Clock size={11} />{post.readTime}</span>
                                                {post.views_count && (
                                                    <span className="flex items-center gap-1"><Eye size={11} />{post.views_count.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Read more indicator */}
                                        <div className={`flex items-center gap-1 mt-4 text-sm font-medium text-purple-600 transition-all duration-300 ${hoveredCard === post.slug ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                            }`}>
                                            Read more <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Newsletter CTA ── */}
                <section className="bg-transparent transition-colors">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tighter leading-[1.1] transition-colors">Stay ahead of the curve</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto font-medium transition-colors">
                            Get the latest insights on automation, AI, and productivity delivered to your inbox every week.
                        </p>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!nlEmail.trim() || nlStatus === 'loading') return;
                                setNlStatus('loading');
                                try {
                                    const res = await fetch(`${API_BASE_URL}/api/public/subscribe`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: nlEmail, source_site: 'hub.arrotechsolutions.com', honeypot: '' }),
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                        setNlStatus('success');
                                        setNlMessage(data.message || 'Subscribed successfully!');
                                        setNlEmail('');
                                    } else {
                                        setNlStatus('error');
                                        setNlMessage('Something went wrong. Please try again.');
                                    }
                                } catch {
                                    setNlStatus('error');
                                    setNlMessage('Network error. Please try again.');
                                }
                            }}
                            className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
                        >
                            <input
                                type="email"
                                placeholder="you@company.com"
                                value={nlEmail}
                                onChange={(e) => { setNlEmail(e.target.value); if (nlStatus !== 'idle') setNlStatus('idle'); }}
                                className="w-full px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-colors"
                                required
                                disabled={nlStatus === 'loading'}
                            />
                            <button
                                type="submit"
                                disabled={nlStatus === 'loading'}
                                className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none whitespace-nowrap disabled:opacity-50"
                            >
                                {nlStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                        {nlStatus === 'success' && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-medium">✅ {nlMessage}</p>
                        )}
                        {nlStatus === 'error' && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">❌ {nlMessage}</p>
                        )}
                        {nlStatus === 'idle' && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 transition-colors">No spam. Unsubscribe anytime.</p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default Blog;
