import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, ArrowRight, Sun, Moon, BookOpen, LifeBuoy, Plug, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo/lockup-horizontal-dark.svg';
import logoIcon from '../assets/Logo/icon-orange.svg';
import { OfflineBanner } from './states/OfflineBanner';
import { SlowNetworkBanner } from './states/SlowNetworkBanner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prod.api.arrotechsolutions.com';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [, setResourcesOpen] = useState(false);
    const [nlEmail, setNlEmail] = useState('');
    const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [nlMsg, setNlMsg] = useState('');

    // Theme state — follow global preference; only write on explicit toggle
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) return true;
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const { pathname, hash } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(sync);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    };

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setResourcesOpen(false);
    }, [pathname]);

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        if (pathname !== '/') {
            navigate(`/#${id}`);
            return;
        }

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Handle initial hash scroll if navigating from another page
    useEffect(() => {
        if (pathname === '/' && hash) {
            const id = hash.replace('#', '');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [pathname, hash]);

    return (
        <div className="min-h-screen bg-surface-gradient dark:bg-surface-gradient-dark font-sans text-secondary-900 dark:text-secondary-50 transition-colors duration-300 selection:bg-primary-100 selection:text-secondary-900 dark:selection:bg-accent-500/35 dark:selection:text-secondary-950">
            {/* Mesh — 60% night violet · 30% dragon fruit · 10% amber spark */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-primary-200/45 to-secondary-200/40 dark:from-primary-500/18 dark:to-secondary-900/50 blur-[120px] animate-pulse" />
                <div className="absolute top-[8%] right-[-8%] w-[42%] h-[42%] rounded-full bg-gradient-to-bl from-accent-200/40 to-primary-100/30 dark:from-accent-500/12 dark:to-secondary-900/40 blur-[120px] animate-float" />
                <div className="absolute bottom-[-12%] left-[18%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-secondary-200/35 to-primary-50/40 dark:from-secondary-950/70 dark:to-primary-900/15 blur-[140px]" />
                <div className="absolute top-[42%] left-[32%] w-[28%] h-[28%] rounded-full bg-white/50 dark:bg-secondary-950/50 blur-[100px]" />
            </div>

            {/* Header */}
            <header
                className={`fixed w-full top-0 z-50 transition-all duration-700 ${scrolled ? 'pt-2' : 'pt-6'} flex justify-center px-4`}
            >
                <div className={`transition-all duration-700 w-full ${scrolled ? 'max-w-4xl' : 'max-w-7xl'}`}>
                    <nav className={`relative flex justify-between items-center transition-all duration-700 rounded-[2rem] px-6 py-3 ${scrolled
                            ? 'bg-white/70 dark:bg-secondary-950/70 backdrop-blur-3xl border border-white/40 dark:border-secondary-800/40 shadow-[0_20px_50px_rgba(30,16,51,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
                            : 'bg-white/40 dark:bg-secondary-900/40 backdrop-blur-md border border-white/20 dark:border-secondary-800/20'
                        }`}>
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="relative flex items-center gap-2 group py-1">
                                <img src={logoIcon} alt="Arrotech Hub" className="h-[32px] w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-90" />
                                <span className="text-[16px] sm:text-[18px] font-black bg-gradient-to-r from-secondary-900 to-primary-500 dark:from-white dark:to-primary-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex flex-1 items-center justify-center gap-1">
                            <button 
                                onClick={() => scrollToSection('features')} 
                                className="relative px-4 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-300 group/nav"
                            >
                                <span className="relative z-10">Automation</span>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-300 group-hover/nav:w-4 opacity-0 group-hover/nav:opacity-100"></div>
                            </button>

                            <Link to="/pricing" className="relative px-4 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-300 group/nav">
                                <span className="relative z-10">Pricing</span>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-300 group-hover/nav:w-4 opacity-0 group-hover/nav:opacity-100"></div>
                            </Link>
                            
                            {/* Resources Mega Menu Trigger */}
                            <div className="relative group/menu">
                                <button
                                    className="relative flex items-center gap-1.5 px-4 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-300 group/nav"
                                >
                                    <span className="relative z-10 flex items-center gap-1">
                                        Resources
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover/menu:rotate-180 transition-transform duration-300" />
                                    </span>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-300 group-hover/nav:w-4 opacity-0 group-hover/nav:opacity-100"></div>
                                </button>

                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 w-[500px] invisible opacity-0 group-hover/menu:visible group-hover/menu:opacity-100 transition-all duration-500 transform translate-y-4 group-hover/menu:translate-y-0 z-50">
                                    <div className="bg-white/95 dark:bg-secondary-950/95 backdrop-blur-3xl border border-white/20 dark:border-secondary-800/40 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)] p-6 overflow-hidden">
                                        {/* Background glow in mega menu */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/20 blur-3xl rounded-full -mr-20 -mt-20"></div>
                                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500/10 dark:bg-cyan-600/20 blur-3xl rounded-full -ml-20 -mb-20"></div>
                                        
                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <div className="col-span-1 space-y-2">
                                                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-3 mb-3">Learn & Support</h5>
                                                <Link to="/blog" className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl group/item transition-all duration-300">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-primary-500 group-hover/item:text-white transition-all duration-300">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:translate-x-1 transition-transform">Blog</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Industry insights</p>
                                                    </div>
                                                </Link>
                                                <Link to="/help" className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl group/item transition-all duration-300">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-amber-600 group-hover/item:text-white transition-all duration-300">
                                                        <LifeBuoy className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:translate-x-1 transition-transform">Help Center</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Guides & Tutorials</p>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className="col-span-1 space-y-2">
                                                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-3 mb-3">Ecosystem</h5>
                                                <Link to="/integrations/gmail" className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl group/item transition-all duration-300">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-cyan-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-cyan-600 group-hover/item:text-white transition-all duration-300">
                                                        <Plug className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:translate-x-1 transition-transform">Integrations</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Connect your tools</p>
                                                    </div>
                                                </Link>
                                                <a href="https://docs.arrotechsolutions.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl group/item transition-all duration-300">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-300">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:translate-x-1 transition-transform">Documentation</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Developer API & Guides</p>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link 
                                to="/help" 
                                className="relative px-4 py-2 text-[14px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-300 group/nav"
                            >
                                <span className="relative z-10">Support</span>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-300 group-hover/nav:w-4 opacity-0 group-hover/nav:opacity-100"></div>
                            </Link>
                        </div>

                        {/* Auth Buttons & Theme Toggle */}
                        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center hover:rotate-12 transform"
                                aria-label="Toggle Dark Mode"
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {user ? (
                                <Link
                                    to="/unified"
                                    className="group relative inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-2.5 rounded-full text-[13px] font-black transition-all duration-500 shadow-brand hover:shadow-brand-lg hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-black/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                    <LayoutDashboard className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">Dashboard</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors px-2">Log in</Link>
                                    <Link
                                        to="/register"
                                        className="group relative inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-7 py-2.5 rounded-full text-[13px] font-black transition-all duration-500 shadow-brand hover:shadow-brand-lg hover:-translate-y-1 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-black/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                        <span className="relative z-10">Get Started</span>
                                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button & Theme Toggle */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-secondary-950/95 backdrop-blur-3xl transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'}`}>
                    <div className="flex flex-col justify-center h-full max-w-sm mx-auto px-6 py-20 gap-8">
                        <div className={`flex flex-col gap-6 transition-all duration-700 ease-out ${mobileMenuOpen ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-8 opacity-0'}`}>
                            <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                Automation
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-500" />
                            </button>
                            <Link onClick={() => setMobileMenuOpen(false)} to="/pricing" className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                Pricing
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-500" />
                            </Link>
                            <div className="flex flex-col gap-4 mt-2">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Resources</span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/blog" className="text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-slate-400" /> Blog
                                    </Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/help" className="text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                        <LifeBuoy className="w-4 h-4 text-slate-400" /> Help Center
                                    </Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/integrations/gmail" className="text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                        <Plug className="w-4 h-4 text-slate-400" /> Integrations
                                    </Link>
                                    <a onClick={() => setMobileMenuOpen(false)} href="https://docs.arrotechsolutions.com/" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-slate-400" /> Documentation
                                    </a>
                                </div>
                            </div>
                            
                            <div className="h-px w-full bg-slate-200 dark:bg-secondary-800 my-2"></div>

                            <Link onClick={() => setMobileMenuOpen(false)} to="/help" className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                Support
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-500" />
                            </Link>
                        </div>

                        <div className={`mt-auto transition-all duration-700 ease-out ${mobileMenuOpen ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-8 opacity-0'}`}>
                            {user ? (
                                <Link onClick={() => setMobileMenuOpen(false)} to="/unified" className="w-full bg-primary-500 dark:bg-primary-500 text-white py-4 rounded-2xl font-bold text-center shadow-lg flex items-center justify-center gap-2 text-base">
                                    <LayoutDashboard className="w-5 h-5" />
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/register" className="w-full flex items-center justify-center py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-900 text-white font-bold shadow-lg shadow-primary-500/25 text-base transition-all active:scale-[0.98]">Get Started Free</Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="w-full flex items-center justify-center py-4 rounded-2xl border-2 border-slate-200 dark:border-secondary-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-base transition-colors">Log in to account</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={`relative z-10 min-h-screen pt-20`}>
                <OfflineBanner />
                <SlowNetworkBanner />
                {children}
            </main>

            {/* Premium Footer */}
            <footer className="relative z-10 border-t border-slate-200 dark:border-secondary-800 bg-transparent text-slate-900 dark:text-white pt-10 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary-500/10 dark:bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-12 md:gap-8 mb-16">
                        {/* Brand & Newsletter */}
                        <div className="col-span-2 md:col-span-4 flex flex-col items-start">
                            <Link to="/" className="flex items-center gap-2 mb-5 group">
                                <img src={logoIcon} alt="Arrotech Hub" className="h-[36px] sm:h-[40px] w-auto object-contain opacity-80 group-hover:opacity-100 transition-all" />
                                <span className="text-[18px] sm:text-[24px] font-black bg-gradient-to-r from-secondary-900 to-primary-500 dark:from-white dark:to-primary-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
                            </Link>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs transition-colors">
                                The intelligent workspace that unifies your tools, tasks, and teams. Built for teams that move fast.
                            </p>
                            <div className="w-full max-w-sm">
                                <h5 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 tracking-tight transition-colors">Stay in the loop</h5>
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
                                                setNlMsg(data.message || 'Subscribed!');
                                                setNlEmail('');
                                            } else {
                                                setNlStatus('error');
                                                setNlMsg('Something went wrong.');
                                            }
                                        } catch {
                                            setNlStatus('error');
                                            setNlMsg('Network error.');
                                        }
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        value={nlEmail}
                                        onChange={(e) => { setNlEmail(e.target.value); if (nlStatus !== 'idle') setNlStatus('idle'); }}
                                        className="flex-1 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-cyan-500 dark:focus:ring-white/30 dark:focus:border-white/30 transition-all font-medium"
                                        required
                                        disabled={nlStatus === 'loading'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={nlStatus === 'loading'}
                                        className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] flex-shrink-0 disabled:opacity-50"
                                    >
                                        {nlStatus === 'loading' ? '...' : 'Subscribe'}
                                    </button>
                                </form>
                                {nlStatus === 'success' && (
                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2.5 font-medium">✅ {nlMsg}</p>
                                )}
                                {nlStatus === 'error' && (
                                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-2.5 font-medium">❌ {nlMsg}</p>
                                )}
                                {nlStatus === 'idle' && (
                                    <p className="text-[11px] text-slate-500 mt-2.5">No spam. Unsubscribe anytime.</p>
                                )}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 md:col-start-6">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-5 transition-colors">Product</h4>
                            <ul className="space-y-3">
                                <li><button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left">Automation</button></li>
                                <li><Link to="/pricing" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link to="/help" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Support</Link></li>
                                <li><Link to="/changelog" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Changelog</Link></li>
                                <li><Link to="/docs" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</Link></li>
                            </ul>
                        </div>

                        {/* Links Column 2 */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-5 transition-colors">Company</h4>
                            <ul className="space-y-3">
                                <li><Link to="/about" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="/careers" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Careers</Link></li>
                                <li><Link to="/blog" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Blog</Link></li>
                                <li><Link to="/contact" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Links Column 3 */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-5 transition-colors">Legal</h4>
                            <ul className="space-y-3">
                                <li><Link to="/privacy" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link to="/terms" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link></li>
                                <li><Link to="/security" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Security</Link></li>
                                <li><Link to="/cookies" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            &copy; {new Date().getFullYear()} Arrotech Solutions. All rights reserved.
                        </p>
                        <div className="flex gap-6 flex-wrap items-center justify-center md:justify-end">
                            <a href="tel:+254797568564" title="+254 797 568564" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">Phone</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </a>
                            <a href="https://twitter.com/ArrotechAI" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                            <a href="https://instagram.com/arrotech" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">Instagram</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="https://tiktok.com/@arrotech_ai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">TikTok</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                            </a>
                            <a href="https://www.facebook.com/gachanjaharun" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            <a href="https://youtube.com/@arrotech_ai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">YouTube</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
