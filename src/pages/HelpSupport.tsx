import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import {
    Search, MessageCircle, Mail, Book, ChevronDown, ChevronUp,
    HelpCircle, Zap, CreditCard, Link2, Shield, Users, Send,
    Clock, Headphones
} from 'lucide-react';
import toast from '../lib/notify';
import SEO from '../components/SEO';

// FAQ Data organized by category
const faqCategories = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Zap,
        faqs: [
            {
                question: 'How do I create an account?',
                answer: 'Click "Sign Up" on the homepage, enter your email and create a password. You\'ll receive a verification email to confirm your account. Once verified, you can start connecting your apps and using Arrotech Hub.'
            },
            {
                question: 'How do I connect my apps?',
                answer: 'Go to Connections in the sidebar, find the app you want to connect (Gmail, TikTok, Slack, etc.), and click "Connect". Follow the authentication prompts to grant access. Your data will sync automatically.'
            },
            {
                question: 'Is Arrotech Hub free to use?',
                answer: 'Yes! Arrotech Hub offers a free tier with core features. Premium features like advanced analytics, unlimited workflows, and priority support are available on paid plans. Check our Pricing page for details.'
            }
        ]
    },
    {
        id: 'tiktok-monetization',
        title: 'TikTok Monetization',
        icon: CreditCard,
        faqs: [
            {
                question: 'How do I sell exclusive content?',
                answer: 'Go to your TikTok Dashboard → Money tab → Create Premium Link. Add a title, description, price (in KES), and the URL to your exclusive content. Share the generated link with your fans - when they pay, you earn 90%!'
            },
            {
                question: 'How do I withdraw my earnings?',
                answer: 'In the Money tab, click "Withdraw to M-Pesa", enter your Safaricom number and the amount you want to withdraw. Funds are typically sent within minutes. Minimum withdrawal is KES 10.'
            },
            {
                question: 'What\'s the revenue split?',
                answer: 'You keep 90% of every sale. Arrotech Hub takes a 10% platform fee to cover payment processing and maintain the service.'
            },
            {
                question: 'Why isn\'t M-Pesa payout working?',
                answer: 'Ensure you\'re using a valid Safaricom M-Pesa number in format 07XXXXXXXX. If you see "pending disbursement", the payment is queued and will be processed shortly. Contact support if funds don\'t arrive within 24 hours.'
            }
        ]
    },
    {
        id: 'integrations',
        title: 'Integrations & Connections',
        icon: Link2,
        faqs: [
            {
                question: 'Which apps can I connect?',
                answer: 'Arrotech Hub supports 50+ integrations including: Gmail, Google Calendar, Google Drive, Slack, Microsoft Teams, Zoom, TikTok, WhatsApp, Trello, Jira, M-Pesa, and many more. Visit the Connections page for the full list.'
            },
            {
                question: 'My connection stopped working. What do I do?',
                answer: 'Connections can expire due to security policies. Go to Connections, find the affected app, click "Reconnect" and re-authenticate. If issues persist, try disconnecting and connecting again.'
            },
            {
                question: 'Is my data secure?',
                answer: 'Yes. We use OAuth 2.0 for secure authentication and never store your passwords. All data is encrypted in transit and at rest. We only access the permissions you explicitly grant.'
            }
        ]
    },
    {
        id: 'payments',
        title: 'Payments & Billing',
        icon: CreditCard,
        faqs: [
            {
                question: 'What payment methods do you accept?',
                answer: 'We accept M-Pesa, credit/debit cards (Visa, Mastercard), and bank transfers through Paystack. For Kenyan users, M-Pesa is the fastest and most convenient option.'
            },
            {
                question: 'How do I upgrade my plan?',
                answer: 'Go to Settings → Subscription or visit the Pricing page. Select your desired plan and complete the payment. Your account will be upgraded immediately.'
            },
            {
                question: 'Can I get a refund?',
                answer: 'We offer refunds within 7 days of purchase if you\'re not satisfied. Contact support@arrotechsolutions.com with your account email and reason for refund.'
            }
        ]
    },
    {
        id: 'account',
        title: 'Account & Security',
        icon: Shield,
        faqs: [
            {
                question: 'How do I reset my password?',
                answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send you a reset link. The link expires in 1 hour for security.'
            },
            {
                question: 'How do I delete my account?',
                answer: 'Go to Settings → Privacy & Security → Delete Account. This action is permanent and will remove all your data, connections, and earnings history. Make sure to withdraw any pending earnings first.'
            },
            {
                question: 'How do I change my email address?',
                answer: 'Go to Settings → Profile → Email. Enter your new email and verify it. Your account will be updated once you confirm the new email.'
            }
        ]
    }
];

// Contact options
const contactOptions = [
    {
        icon: Mail,
        title: 'Email Support',
        description: 'Get help via email',
        detail: 'support@arrotechsolutions.com',
        action: 'email',
        responseTime: 'Within 24 hours'
    },
    {
        icon: MessageCircle,
        title: 'Live Chat',
        description: 'Chat with our team',
        detail: 'Available 9 AM - 6 PM EAT',
        action: 'chat',
        responseTime: 'Usually instant'
    },
    {
        icon: Users,
        title: 'Community',
        description: 'Join our WhatsApp group',
        detail: 'Connect with other users',
        action: 'https://chat.whatsapp.com/your-invite-link',
        responseTime: 'Community support'
    }
];

const HelpSupport: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const toggleFaq = (categoryId: string, index: number) => {
        const key = `${categoryId}-${index}`;
        const newExpanded = new Set(expandedFaqs);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedFaqs(newExpanded);
    };

    // Filter categories based on search query
    const filteredCategories = faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.faqs.length > 0);

    // Auto-expand all matching FAQs when searching
    React.useEffect(() => {
        if (searchQuery.trim()) {
            const newExpanded = new Set<string>();
            const matchedCategories = faqCategories.map(category => ({
                ...category,
                faqs: category.faqs.filter(faq =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })).filter(category => category.faqs.length > 0);

            matchedCategories.forEach(category => {
                category.faqs.forEach((matchedFaq) => {
                    const originalCategory = faqCategories.find(c => c.id === category.id);
                    if (originalCategory) {
                        const originalIndex = originalCategory.faqs.findIndex(
                            faq => faq.question === matchedFaq.question
                        );
                        if (originalIndex !== -1) {
                            newExpanded.add(`${category.id}-${originalIndex}`);
                        }
                    }
                });
            });
            setExpandedFaqs(newExpanded);
            setActiveCategory(null);
        }
    }, [searchQuery]);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.email || !contactForm.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prod.api.arrotechsolutions.com';
            const res = await fetch(`${API_BASE_URL}/api/public/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: contactForm.name,
                    email: contactForm.email,
                    category: contactForm.subject || 'general',
                    subject: contactForm.subject ? `${contactForm.subject} - Help Center` : 'Support Request',
                    message: contactForm.message,
                    source_site: 'hub.arrotechsolutions.com',
                    honeypot: '',
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Support request submitted! We\'ll get back to you soon.');
                setContactForm({ name: '', email: '', subject: '', message: '' });
                setShowContactForm(false);
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            const mailtoLink = `mailto:support@arrotechsolutions.com?subject=${encodeURIComponent(contactForm.subject || 'Support Request')}&body=${encodeURIComponent(`Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`)}`;
            window.location.href = mailtoLink;
            toast.success('Opening email client...');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent transition-colors">
            <SEO
                title="Help Center"
                description="Get help with Arrotech Hub. Browse FAQs, contact support, or join our community. We're here to help you succeed."
                url="/help"
                keywords={['Help Center', 'Support', 'FAQ', 'Arrotech Hub Support', 'Contact Us']}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": faqCategories.reduce((acc: any[], category: any) => [
                        ...acc,
                        ...category.faqs.map((faq: any) => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer
                            }
                        }))
                    ], [])
                }}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6 ring-1 ring-blue-500/20 shadow-sm transition-colors">
                        <Zap className="w-4 h-4" />
                        Support Center
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight transition-colors">
                        How can we help you?
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto font-medium transition-colors">
                        Search our knowledge base or browse FAQs. Can't find what you need? We're here to help.
                    </p>

                    {/* Premium Search Bar */}
                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-900 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <div className="pl-6 text-slate-400">
                                <Search className="w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for help (e.g., 'withdraw earnings', 'connect TikTok')"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-6 py-5 bg-transparent text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
                            />
                            <div className="hidden sm:flex items-center pr-6">
                                <kbd className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">⌘K</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 pb-24 flex flex-col lg:flex-row gap-12 relative z-10">
                {/* Mobile Categories (Horizontal Scroll) */}
                <div className="lg:hidden w-full overflow-x-auto pb-4 flex gap-2 scrollbar-hide snap-x">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`snap-center flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === null
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-1 ring-slate-900 dark:ring-white scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        All Topics
                    </button>
                    {faqCategories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`snap-center flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${activeCategory === category.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-1 ring-slate-900 dark:ring-white scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <category.icon className="w-4 h-4" />
                            {category.title}
                        </button>
                    ))}
                </div>

                {/* Desktop Left Sidebar Navigation */}
                <div className="hidden lg:block w-72 flex-shrink-0">
                    <div className="sticky top-28 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-3xl shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-3">CATEGORIES</h3>
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between group ${activeCategory === null
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent'
                                    }`}
                            >
                                <span>All Topics</span>
                                {activeCategory === null && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                            </button>
                            {faqCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center gap-3 group ${activeCategory === category.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent'
                                        }`}
                                >
                                    <category.icon className={`w-4 h-4 ${activeCategory === category.id ? 'opacity-100' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`} />
                                    <span className="flex-1">{category.title}</span>
                                    {activeCategory === category.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 space-y-12">
                    {/* Contact Cards Grid */}
                    <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
                        {contactOptions.map((option, index) => (
                            <a
                                key={index}
                                href={option.action === 'chat' || option.action === 'email' ? '#' : option.action}
                                onClick={(e) => {
                                    if (option.action === 'chat') {
                                        e.preventDefault();
                                        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                                    } else if (option.action === 'email') {
                                        e.preventDefault();
                                        setShowContactForm(true);
                                    }
                                }}
                                className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 z-10 overflow-hidden text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-purple-500/[0.03] dark:from-blue-500/[0.08] dark:to-purple-500/[0.08] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex flex-col items-start gap-4 h-full">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-700 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,70,150,0.4)] transition-all duration-300">
                                        <option.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{option.title}</h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{option.description}</p>
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[200px] sm:max-w-full">{option.detail}</p>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500/80 transition-colors">
                                        <Clock className="w-3.5 h-3.5" />
                                        {option.responseTime}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* FAQ Panels */}
                    <div className="space-y-8">
                        {(searchQuery ? filteredCategories : faqCategories)
                            .filter(category => !activeCategory || category.id === activeCategory)
                            .map(category => (
                                <div key={category.id} className="animate-fade-in-up">
                                    <div className="flex items-center gap-3 mb-6 pl-2">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <category.icon className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{category.title}</h2>
                                    </div>

                                    <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                        {category.faqs.map((faq, index) => {
                                            const key = `${category.id}-${index}`;
                                            const isExpanded = expandedFaqs.has(key);
                                            return (
                                                <div key={index} className="group transition-colors">
                                                    <button
                                                        onClick={() => toggleFaq(category.id, index)}
                                                        className="w-full px-6 py-5 text-left flex items-start justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 focus:outline-none transition-colors"
                                                    >
                                                        <span className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                                            {faq.question}
                                                        </span>
                                                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${isExpanded ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-blue-300 dark:group-hover:border-blue-600'}`}>
                                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-6 pb-6 pt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-[15px] animate-fade-in pr-12">
                                                            {faq.answer}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* No Results State */}
                    {searchQuery && filteredCategories.length === 0 && (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800">
                            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
                                <Search className="w-10 h-10 text-slate-400 dark:text-slate-500 opacity-50" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No answers found</h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                We couldn't find what you're looking for. Try adjusting your search or reaching out to us.
                            </p>
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                            >
                                <Mail className="w-5 h-5" />
                                Contact our support team
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Form Modal — portaled to document.body to escape navbar stacking context */}
            {showContactForm && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 transition-opacity duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Contact Support</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1">We typically reply within a few hours.</p>
                            </div>
                            <button
                                onClick={() => setShowContactForm(false)}
                                className="p-2.5 bg-slate-200/50 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L13 13M1 13L13 1L1 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto px-8 py-6 hide-scrollbar flex-1">
                            <form onSubmit={handleSubmitTicket} className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Your Name</label>
                                        <input
                                            type="text"
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Email Address <span className="text-red-500 ml-0.5">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                                    <div className="relative">
                                        <select
                                            value={contactForm.subject}
                                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                            className="w-full appearance-none px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all font-medium"
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="general">General Inquiry</option>
                                            <option value="support">Technical Support</option>
                                            <option value="sales">Sales Inquiry</option>
                                            <option value="partnership">Partnership Opportunity</option>
                                            <option value="billing">Billing & Payments</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Message <span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <textarea
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        placeholder="Describe your issue or question in detail..."
                                        rows={5}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/40 focus:border-blue-500 outline-none resize-none transition-all font-medium"
                                    />
                                </div>
                                <div className="pt-4 pb-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-[15px]"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Support Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Animation styles */}
            <style>
                {`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .hide-scrollbar::-webkit-scrollbar { width: 6px; }
                .hide-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .hide-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                `}
            </style>
        </div>
    );
};

export default HelpSupport;
