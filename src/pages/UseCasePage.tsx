import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Bot, FileText, Share2, TrendingUp, Zap } from 'lucide-react';
import SEO from '../components/SEO';

const USE_CASES: Record<string, any> = {
    'ai-social-media-manager': {
        title: 'AI Social Media Manager',
        icon: Share2,
        color: 'from-pink-500 to-rose-500',
        description: 'Automate your social media presence with AI. Generate posts, schedule content, and analyze engagement across Twitter, Instagram, and TikTok all from one dashboard.',
        benefits: [
            'Generate 30 days of content in minutes',
            'Cross-post seamlessly to multiple platforms',
            'AI-driven hashtag and timing recommendations'
        ],
        heroImg: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop'
    },
    'automated-pdf-generation': {
        title: 'Automated PDF Generation',
        icon: FileText,
        color: 'from-blue-500 to-cyan-500',
        description: 'Turn your forms, web data, and CRM entries into beautiful, branded PDF documents instantly with zero manual effort.',
        benefits: [
            'Trigger PDF creation from webhook or form submit',
            'Design customizable PDF templates',
            'Auto-email generated PDFs to clients'
        ],
        heroImg: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop'
    },
    'ai-sales-agent': {
        title: 'AI Sales Agent',
        icon: Bot,
        color: 'from-primary-500 to-secondary-900',
        description: 'Deploy a custom AI worker to qualify leads, answer customer questions on WhatsApp, and book meetings 24/7.',
        benefits: [
            'Qualify leads automatically over WhatsApp or Slack',
            'Connects directly to your HubSpot or CRM',
            'Learns from your company knowledge base'
        ],
        heroImg: 'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=800&auto=format&fit=crop'
    },
    'inbound-lead-routing': {
        title: 'Automated Lead Routing',
        icon: Zap,
        color: 'from-amber-400 to-orange-500',
        description: 'Automatically capture leads from multiple channels, score them using AI, and route them to the right sales rep in Slack or Microsoft Teams.',
        benefits: [
            'Instant lead alerts in Slack or Teams',
            'AI-assisted lead scoring based on intent',
            'No-code workflow builder'
        ],
        heroImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'
    }
};

const UseCasePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const data = slug ? USE_CASES[slug.toLowerCase()] : null;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent transition-colors">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">Use Case Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 transition-colors">We couldn't find the use case you were looking for.</p>
                    <Link to="/" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors">Return Home</Link>
                </div>
            </div>
        );
    }

    const Icon = data.icon;

    return (
        <div className="min-h-screen bg-transparent transition-colors">
            <SEO
                title={`${data.title} | Arrotech Hub`}
                description={data.description}
                url={`/use-cases/${slug}`}
                keywords={[`${data.title}`, 'AI Automation', 'Workflow Builder', 'Arrotech Hub Use Cases']}
            />

            {/* Hero Section */}
            <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className={`inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br ${data.color} shadow-lg text-white`}>
                        <Icon className="w-8 h-8" />
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight transition-colors">
                        {data.title}
                    </h1>

                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium max-w-lg transition-colors">
                        {data.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/register" className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r ${data.color} text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all hover:scale-105`}>
                            Start Automating
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/pricing" className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                            View Pricing
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <div className={`absolute -inset-4 bg-gradient-to-tr ${data.color} opacity-20 blur-2xl rounded-[3rem]`}></div>
                    <img
                        src={data.heroImg}
                        alt={data.title}
                        className="relative rounded-[2rem] shadow-2xl w-full h-[500px] object-cover border-8 border-white"
                    />
                </div>
            </section>

            {/* Benefits Section */}
            <section className="bg-transparent py-24 px-4 sm:px-6 lg:px-8 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 transition-colors">Why build this with Arrotech Hub?</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">Replace fragmented tools with a single unified workspace.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {data.benefits.map((benefit: string, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/20 transition-all">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} mb-6 flex items-center justify-center text-white`}>
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug transition-colors">{benefit}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-transparent py-24 px-4 sm:px-6 lg:px-8 text-center transition-colors">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white transition-colors">Ready to implement {data.title}?</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-xl transition-colors">Join thousands of businesses automating their workflows with Arrotech Hub.</p>
                    <Link to="/register" className={`inline-block bg-gradient-to-r ${data.color} text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-xl transition-all hover:scale-105`}>
                        Get Started for Free
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default UseCasePage;
