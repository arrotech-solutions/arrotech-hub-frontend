import React, { useState } from 'react';
import {
    Search, MessageCircle, Mail, Book, ChevronDown, ChevronUp,
    HelpCircle, Zap, CreditCard, Link2, Shield, Users, Send,
    Clock, Headphones
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                    <Headphones className="w-16 h-16 mx-auto mb-6 opacity-90" />
                    <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
                    <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                        Search our knowledge base or browse FAQs. Can't find what you need? We're here to help.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for help (e.g., 'withdraw earnings', 'connect TikTok')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 placeholder-slate-400 shadow-lg focus:ring-4 focus:ring-white/30 focus:outline-none"
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
                            className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                                    <option.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{option.title}</h3>
                                    <p className="text-sm text-slate-500">{option.description}</p>
                                    <p className="text-sm font-medium text-primary-600 mt-1">{option.detail}</p>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
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
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === null
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All Topics
                    </button>
                    {faqCategories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${activeCategory === category.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                            <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <category.icon className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">{category.title}</h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {category.faqs.map((faq, index) => {
                                        const key = `${category.id}-${index}`;
                                        const isExpanded = expandedFaqs.has(key);
                                        return (
                                            <div key={index} className="hover:bg-slate-50 transition-colors">
                                                <button
                                                    onClick={() => toggleFaq(category.id, index)}
                                                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                                                >
                                                    <span className="font-medium text-slate-900 flex items-center gap-3">
                                                        <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                        {faq.question}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-6 pb-4 pl-14 text-slate-600 leading-relaxed">
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
                        <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">No results found</h3>
                        <p className="text-slate-500 mt-2">
                            Can't find what you're looking for?{' '}
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="text-primary-600 hover:underline"
                            >
                                Contact our support team
                            </button>
                        </p>
                    </div>
                )}

                {/* Still Need Help CTA */}
                <div className="mt-12 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 text-center border border-primary-100">
                    <Book className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Still need help?</h3>
                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                        Our support team is here to help you get the most out of Arrotech Hub.
                        We typically respond within 24 hours.
                    </p>
                    <button
                        onClick={() => setShowContactForm(true)}
                        className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Mail className="w-5 h-5" />
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-semibold text-slate-900">Contact Support</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                We'll get back to you at support@arrotechsolutions.com
                            </p>
                        </div>
                        <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Subject
                                </label>
                                <select
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select a topic...</option>
                                    <option value="Account Issue">Account Issue</option>
                                    <option value="TikTok Monetization">TikTok Monetization</option>
                                    <option value="Payment / Withdrawal">Payment / Withdrawal</option>
                                    <option value="Integration Problem">Integration Problem</option>
                                    <option value="Feature Request">Feature Request</option>
                                    <option value="Bug Report">Bug Report</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    placeholder="Describe your issue or question in detail..."
                                    rows={5}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="bg-slate-50 border-t border-slate-100 mt-12">
                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-slate-600">
                        Need urgent help? Email us directly at{' '}
                        <a href="mailto:support@arrotechsolutions.com" className="text-primary-600 font-medium hover:underline">
                            support@arrotechsolutions.com
                        </a>
                    </p>
                    <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500">
                        <a href="/privacy" className="hover:text-primary-600">Privacy Policy</a>
                        <span>•</span>
                        <a href="/terms" className="hover:text-primary-600">Terms of Service</a>
                        <span>•</span>
                        <a href="/" className="hover:text-primary-600">Back to Home</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
