import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import SEO from '../components/SEO';
import { BLOG_POSTS } from '../data/blogData';

const Blog: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title="Blog"
                description="Insights on productivity, workflow automation, and business growth. Learn how to master your unified workspace."
                url="/blog"
                keywords={['Productivity Blog', 'Automation Tips', 'Arrotech Blog', 'Business Growth Kenya']}
            />

            {/* Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                        The Arrotech <span className="text-purple-600">Blog</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tips, tutorials, and insights to help you work smarter, not harder.
                    </p>
                </div>
            </div>

            {/* Post Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map((post) => (
                        <Link
                            key={post.slug}
                            to={`/blog/${post.slug}`}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col items-start border border-gray-100 hover:-translate-y-1 group"
                        >
                            <div className="p-8 flex flex-col h-full w-full">
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {post.tags.map(tag => (
                                        <span key={tag} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 line-clamp-3 mb-6 flex-grow">
                                    {post.description}
                                </p>

                                <div className="flex items-center justify-between w-full pt-6 border-t border-gray-50 text-sm text-gray-500">
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
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog;
