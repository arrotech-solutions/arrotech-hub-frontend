export interface BlogPost {
    id?: number;
    slug: string;
    title: string;
    description: string;
    content: string;
    cover_image?: string;
    author: string;
    author_avatar?: string;
    date: string;
    readTime: string;
    tags: string[];
    category?: string;
    category_color?: string;
    is_featured?: boolean;
    views_count?: number;
    image?: string;
}

export const BLOG_CATEGORIES = [
    { name: 'All', slug: 'all', color: '#6B7280' },
    { name: 'Automation', slug: 'automation', color: '#7C3AED' },
    { name: 'Productivity', slug: 'productivity', color: '#2563EB' },
    { name: 'Product Updates', slug: 'product-updates', color: '#059669' },
    { name: 'Engineering', slug: 'engineering', color: '#DC2626' },
    { name: 'Business', slug: 'business', color: '#D97706' },
    { name: 'Industry Trends', slug: 'industry-trends', color: '#8B5CF6' },
];

// Blog posts are now fetched from the API — no hardcoded posts
export const BLOG_POSTS: BlogPost[] = [];
