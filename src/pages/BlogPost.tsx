import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Copy, Check, ChevronRight } from 'lucide-react';
import { BlogPost } from '../data/blogData';
import { apiService } from '../services/api';
import { Helmet } from 'react-helmet-async';

/* ── Simple Markdown to HTML ───────────────────────────── */
const renderMarkdown = (md: string): string => {
    return md
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4" id="$1">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-10 mb-5">$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-purple-500 pl-4 py-1 my-4 text-gray-600 italic bg-purple-50/50 rounded-r-lg pr-4">$1</blockquote>')
        // Unordered lists
        .replace(/^- (.*$)/gim, '<li class="ml-6 mb-1.5 text-gray-700 list-disc">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-1.5 text-gray-700 list-decimal">$1</li>')
        // Table rows
        .replace(/^\|(.+)\|$/gim, (match) => {
            const cells = match.split('|').filter(c => c.trim());
            if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
            const cellTags = cells.map(c => `<td class="px-4 py-2.5 border-b border-gray-100">${c.trim()}</td>`).join('');
            return `<tr class="hover:bg-gray-50 transition-colors">${cellTags}</tr>`;
        })
        // Emojis in checkmarks
        .replace(/^- ✅ (.*$)/gim, '<li class="ml-6 mb-1.5 text-green-700 list-none flex items-center gap-2">✅ $1</li>')
        .replace(/^- ❌ (.*$)/gim, '<li class="ml-6 mb-1.5 text-red-600 list-none flex items-center gap-2">❌ $1</li>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-900 text-gray-100 rounded-xl p-5 my-6 overflow-x-auto text-sm leading-relaxed font-mono"><code>$1</code></pre>')
        .replace(/`(.*?)`/gim, '<code class="px-1.5 py-0.5 bg-gray-100 text-purple-600 rounded text-sm font-mono">$1</code>')
        // Links
        .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" class="text-purple-600 underline underline-offset-2 hover:text-purple-700 transition-colors" target="_blank" rel="noopener">$1</a>')
        // Paragraphs (lines not already tagged)
        .replace(/^(?!<[hlupbtoar])(.+)$/gim, '<p class="text-gray-700 leading-relaxed mb-4">$1</p>');
};

/* ── Extract headings for ToC ──────────────────────────── */
const extractHeadings = (content: string): { id: string; text: string; level: number }[] => {
    const headings: { id: string; text: string; level: number }[] = [];
    const regex = /^(#{1,3}) (.+)$/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        headings.push({
            id: match[2].trim(),
            text: match[2].trim(),
            level: match[1].length,
        });
    }
    return headings;
};

const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [readProgress, setReadProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

    // Fetch post
    useEffect(() => {
        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const res = await apiService.getBlogPost(slug || '');
                if (res?.post) {
                    const p = res.post;
                    setPost({
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
                    });
                } else {
                    throw new Error('Not found');
                }
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    // Related posts
    useEffect(() => {
        // TODO: Fetch related posts from API
        setRelatedPosts([]);
    }, [post]);

    // Reading progress
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
            setReadProgress(Math.min(100, progress));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const headings = useMemo(() => post ? extractHeadings(post.content) : [], [post]);
    const htmlContent = useMemo(() => post ? renderMarkdown(post.content) : '', [post]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, []);

    const handleShareTwitter = useCallback(() => {
        if (post) window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    }, [post]);

    const handleShareLinkedIn = useCallback(() => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
    }, []);

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse space-y-6 max-w-3xl w-full px-4">
                    <div className="bg-gray-200 h-8 w-64 rounded-lg" />
                    <div className="bg-gray-200 h-12 w-full rounded-lg" />
                    <div className="bg-gray-200 h-80 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    // Not found
    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Post not found</h2>
                <p className="text-gray-500 mb-6">The article you're looking for doesn't exist or has been removed.</p>
                <Link to="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors">
                    <ArrowLeft size={16} /> Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{post.title} — Arrotech Hub Blog</title>
                <meta name="description" content={post.description} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.description} />
                {post.cover_image && <meta property="og:image" content={post.cover_image} />}
            </Helmet>

            {/* Reading progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 transition-all duration-150"
                    style={{ width: `${readProgress}%` }}
                />
            </div>

            <div className="min-h-screen bg-gray-50">
                {/* ── Hero Header ── */}
                <header className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
                    {/* Cover image background */}
                    {post.cover_image && (
                        <div className="absolute inset-0">
                            <img src={post.cover_image} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60" />
                        </div>
                    )}

                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                        {/* Back link */}
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-white transition-colors mb-8"
                        >
                            <ArrowLeft size={16} /> Back to Blog
                        </Link>

                        {/* Category + Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            {post.category && (
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: `${post.category_color || '#7C3AED'}cc` }}
                                >
                                    {post.category}
                                </span>
                            )}
                            {post.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 rounded-full text-xs text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
                            {post.title}
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mb-8">
                            {post.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{post.author}</p>
                                    <p className="text-xs text-gray-400">Author</p>
                                </div>
                            </div>
                            <span className="w-px h-6 bg-gray-700" />
                            <span className="flex items-center gap-1.5"><Calendar size={14} />{post.date}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} />{post.readTime}</span>
                            {post.views_count && (
                                <span className="flex items-center gap-1.5"><Eye size={14} />{post.views_count.toLocaleString()} views</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Main Content Area ── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
                        {/* Article body */}
                        <article className="max-w-none">
                            {/* Mobile TOC */}
                            <div className="lg:hidden mb-8">
                                <details className="group bg-white rounded-xl border border-gray-200/80 p-4 open:shadow-lg transition-all duration-300">
                                    <summary className="flex items-center justify-between font-semibold text-gray-900 cursor-pointer list-none">
                                        <span>Table of Contents</span>
                                        <ChevronRight size={16} className="transition-transform group-open:rotate-90 text-gray-400" />
                                    </summary>
                                    <nav className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                                        {headings.length > 0 ? headings.map((h, idx) => (
                                            <a
                                                key={idx}
                                                href={`#${h.id}`}
                                                className={`block text-sm py-1.5 text-gray-600 hover:text-purple-600 ${h.level > 1 ? 'pl-4' : ''}`}
                                            >
                                                {h.text}
                                            </a>
                                        )) : <p className="text-sm text-gray-400 italic">No headings found in this article.</p>}
                                    </nav>
                                </details>
                            </div>

                            <div
                                className="prose-custom bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-10 lg:p-12 shadow-sm"
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />

                            {/* Share bar */}
                            {/* Share bar */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 p-5 bg-white rounded-2xl border border-gray-200/80">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Share2 size={18} className="text-gray-500" />
                                    <span className="text-sm text-gray-600 font-medium">Share this article</span>
                                </div>
                                <div className="flex-1 hidden sm:block" />
                                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
                                    <button
                                        onClick={handleCopyLink}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    >
                                        {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                                    </button>
                                    <button
                                        onClick={handleShareTwitter}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    >
                                        𝕏 / Twitter
                                    </button>
                                    <button
                                        onClick={handleShareLinkedIn}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    >
                                        LinkedIn
                                    </button>
                                </div>
                            </div>

                            {/* Author card */}
                            <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200/80 flex items-start gap-5">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-lg">{post.author}</p>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                        Building the future of business automation at Arrotech Hub. Passionate about making powerful tools accessible to businesses in Africa.
                                    </p>
                                </div>
                            </div>
                        </article>

                        {/* Sidebar — Table of Contents */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-20">
                                {headings.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">On this page</h4>
                                        <nav className="space-y-1">
                                            {headings.map((h, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`#${h.id}`}
                                                    className={`block text-sm py-1.5 transition-colors hover:text-purple-600 ${h.level === 1 ? 'font-medium text-gray-800' :
                                                        h.level === 2 ? 'pl-3 text-gray-600 border-l-2 border-gray-200 hover:border-purple-500' :
                                                            'pl-6 text-gray-500 text-xs'
                                                        }`}
                                                >
                                                    {h.text}
                                                </a>
                                            ))}
                                        </nav>
                                    </div>
                                )}

                                {/* CTA card */}
                                <div className="mt-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                                    <h4 className="font-bold text-lg mb-2">Try Arrotech Hub</h4>
                                    <p className="text-sm text-purple-200 mb-4 leading-relaxed">
                                        Automate your business workflows with AI-powered integrations.
                                    </p>
                                    <Link
                                        to="/register"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors"
                                    >
                                        Get Started Free <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* ── Related Posts ── */}
                {relatedPosts.length > 0 && (
                    <section className="bg-white border-t border-gray-200/80 py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {relatedPosts.map(rp => (
                                    <Link
                                        key={rp.slug}
                                        to={`/blog/${rp.slug}`}
                                        className="group bg-gray-50 rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    >
                                        {rp.cover_image && (
                                            <div className="h-40 overflow-hidden">
                                                <img src={rp.cover_image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                            </div>
                                        )}
                                        <div className="p-5">
                                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">{rp.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{rp.description}</p>
                                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                                                <Clock size={11} />{rp.readTime}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── CTA Banner ── */}
                <section className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 py-16">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to automate your business?</h2>
                        <p className="text-purple-200 mb-8 max-w-lg mx-auto">
                            Join thousands of businesses using Arrotech Hub to streamline their operations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="px-8 py-3.5 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all hover:shadow-lg"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                to="/blog"
                                className="px-8 py-3.5 border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
                            >
                                Read More Articles
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default BlogPostPage;
