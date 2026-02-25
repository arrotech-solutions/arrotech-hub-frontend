import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, MessageCircle, Mail, Book, ChevronDown, ChevronUp,
    HelpCircle, Zap, CreditCard, Link2, Shield, Users, Send,
    Clock, Headphones
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
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
        action: 'mailto:support@arrotechsolutions.com',
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
            // Compute filtered categories inside effect to match searchQuery
            const matchedCategories = faqCategories.map(category => ({
                ...category,
                faqs: category.faqs.filter(faq =>
                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })).filter(category => category.faqs.length > 0);

            matchedCategories.forEach(category => {
                category.faqs.forEach((matchedFaq) => {
                    // Find original index in the unfiltered array
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
            // Clear category filter when searching
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
            // Send support ticket via API
            await apiService.createSupportTicket({
                name: contactForm.name,
                email: contactForm.email,
                subject: contactForm.subject || 'Support Request',
                message: contactForm.message
            });
            toast.success('Support request submitted! We\'ll get back to you soon.');
            setContactForm({ name: '', email: '', subject: '', message: '' });
            setShowContactForm(false);
        } catch (error) {
            // Fallback to mailto if API fails
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
            <div className="bg-transparent transition-colors text-slate-900 dark:text-white pb-6 pt-8">
                <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                    <Headphones className="w-16 h-16 mx-auto mb-6 opacity-90 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">How can we help you?</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto transition-colors">
                        Search our knowledge base or browse FAQs. Can't find what you need? We're here to help.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for help (e.g., 'withdraw earnings', 'connect TikTok')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-lg focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Contact Options */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
                <div className="grid md:grid-cols-3 gap-4">
                    {contactOptions.map((option, index) => (
                        <a
                            key={index}
                            href={option.action === 'chat' ? '#' : option.action}
                            onClick={option.action === 'chat' ? (e) => {
                                e.preventDefault();
                                setShowContactForm(true);
                            } : undefined}
                            className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl transition-all group hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shadow-sm">
                                    <option.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white transition-colors">{option.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">{option.description}</p>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 transition-colors">{option.detail}</p>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500 transition-colors">
                                        <Clock className="w-3 h-3" />
                                        {option.responseTime}
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === null
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform hover:scale-105'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        All Topics
                    </button>
                    {faqCategories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === category.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform hover:scale-105'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <category.icon className="w-4 h-4" />
                            {category.title}
                        </button>
                    ))}
                </div>

                {/* FAQ Sections */}
                <div className="space-y-8">
                    {(searchQuery ? filteredCategories : faqCategories)
                        .filter(category => !activeCategory || category.id === activeCategory)
                        .map(category => (
                            <div key={category.id} className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                                        <category.icon className="w-5 h-5 text-primary-600 dark:text-primary-400 transition-colors" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{category.title}</h2>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                                    {category.faqs.map((faq, index) => {
                                        const key = `${category.id}-${index}`;
                                        const isExpanded = expandedFaqs.has(key);
                                        return (
                                            <div key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <button
                                                    onClick={() => toggleFaq(category.id, index)}
                                                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 group"
                                                >
                                                    <span className="font-medium text-slate-900 dark:text-slate-200 flex items-center gap-3 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                        <HelpCircle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-colors" />
                                                        {faq.question}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-all" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-all" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-6 pb-4 pl-14 text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
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

                {/* No Results */}
                {searchQuery && filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center transition-colors">
                            <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 transition-colors">No results found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">
                            Can't find what you're looking for?{' '}
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
                            >
                                Contact our support team
                            </button>
                        </p>
                    </div>
                )}

                {/* Still Need Help CTA */}
                <div className="mt-12 bg-slate-900 dark:bg-slate-800/80 rounded-2xl p-8 text-center border border-slate-800 dark:border-slate-700 shadow-xl transition-all">
                    <Book className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold text-white mb-2">Still need help?</h3>
                    <p className="text-slate-400 dark:text-slate-300 mb-6 max-w-lg mx-auto transition-colors">
                        Our support team is here to help you get the most out of Arrotech Hub.
                        We typically respond within 24 hours.
                    </p>
                    <button
                        onClick={() => setShowContactForm(true)}
                        className="px-6 py-3 bg-white dark:bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                    >
                        <Mail className="w-5 h-5" />
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 transition-colors">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">Contact Support</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                We'll get back to you at support@arrotechsolutions.com
                            </p>
                        </div>
                        <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                                    Subject
                                </label>
                                <select
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-colors"
                                >
                                    <option value="" className="bg-white dark:bg-slate-900">Select a topic...</option>
                                    <option value="Account Issue" className="bg-white dark:bg-slate-900">Account Issue</option>
                                    <option value="TikTok Monetization" className="bg-white dark:bg-slate-900">TikTok Monetization</option>
                                    <option value="Payment / Withdrawal" className="bg-white dark:bg-slate-900">Payment / Withdrawal</option>
                                    <option value="Integration Problem" className="bg-white dark:bg-slate-900">Integration Problem</option>
                                    <option value="Feature Request" className="bg-white dark:bg-slate-900">Feature Request</option>
                                    <option value="Bug Report" className="bg-white dark:bg-slate-900">Bug Report</option>
                                    <option value="Other" className="bg-white dark:bg-slate-900">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    placeholder="Describe your issue or question in detail..."
                                    rows={5}
                                    required
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent resize-none transition-colors"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="bg-transparent mt-12 transition-colors">
                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-slate-600 dark:text-slate-400 transition-colors">
                        Need urgent help? Email us directly at{' '}
                        <a href="mailto:support@arrotechsolutions.com" className="text-primary-600 dark:text-primary-400 font-medium hover:underline transition-colors">
                            support@arrotechsolutions.com
                        </a>
                    </p>
                    <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500 dark:text-slate-400 transition-colors">
                        <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Back to Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
