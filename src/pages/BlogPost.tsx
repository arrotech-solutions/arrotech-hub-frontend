import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, User, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { BLOG_POSTS } from '../data/blogData';

// Simple Markdown renderer if react-markdown isn't available
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    // Basic replacement for demo purposes
    const sections = content.split('\n');

    // Helper to process inline styles (bold)
    const processInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="prose prose-lg prose-purple max-w-none">
            {sections.map((line, idx) => {
                if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">{processInline(line.replace('# ', ''))}</h1>;
                if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{processInline(line.replace('## ', ''))}</h2>;
                if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold mt-6 mb-3">{processInline(line.replace('### ', ''))}</h3>;
                if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc">{processInline(line.replace('- ', ''))}</li>;
                if (line.startsWith('> ')) return <blockquote key={idx} className="border-l-4 border-purple-500 pl-4 italic my-4 bg-gray-50 p-4 rounded-r-lg">{processInline(line.replace('> ', ''))}</blockquote>;
                if (line.trim() === '') return <br key={idx} />;
                return <p key={idx} className="mb-4 text-gray-700 leading-relaxed">{processInline(line)}</p>;
            })}
        </div>
    );
};

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const post = BLOG_POSTS.find(p => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
                    <Link to="/blog" className="text-blue-600 hover:underline">Return to Blog</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            <SEO
                title={post.title}
                description={post.description}
                url={`/blog/${slug}`}
                keywords={post.tags}
                type="article"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": post.title,
                    "description": post.description,
                    "author": {
                        "@type": "Organization",
                        "name": post.author
                    },
                    "datePublished": post.date,
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": `https://hub.arrotechsolutions.com/blog/${slug}`
                    }
                }}
            />

            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
                    <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-purple-600 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>

                    <div className="flex gap-2 mb-6">
                        {post.tags.map(tag => (
                            <span key={tag} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {post.date}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content using SimpleMarkdown to avoid adding deps */}
            <article className="max-w-3xl mx-auto px-4 py-12">
                <SimpleMarkdown content={post.content} />
            </article>

            {/* CTA */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to put this into practice?</h3>
                    <p className="opacity-90 max-w-xl mx-auto mb-8 text-lg">
                        Join thousands of businesses using Arrotech Hub to automate their workflows.
                    </p>
                    <Link to="/register" className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
                        Get Started Free
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
