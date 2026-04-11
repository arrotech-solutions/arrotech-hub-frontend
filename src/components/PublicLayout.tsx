import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, ArrowRight, Sun, Moon, BookOpen, LifeBuoy, Plug } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo/fulllogo_transparent.png';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [, setResourcesOpen] = useState(false);

    // Theme state
    const [isDark, setIsDark] = useState(() => {
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

    // Handle theme initialization and changes
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300 selection:bg-purple-100 selection:text-purple-900 dark:selection:bg-purple-900 dark:selection:text-purple-100">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 to-pink-200/40 dark:from-purple-900/20 dark:to-pink-900/20 blur-[120px] animate-pulse" />
                <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-bl from-cyan-200/40 to-blue-200/40 dark:from-cyan-900/20 dark:to-blue-900/20 blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-violet-200/30 to-fuchsia-100/30 dark:from-violet-900/10 dark:to-fuchsia-900/10 blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-white/60 dark:bg-black/20 blur-[100px] animate-pulse delay-700" />
            </div>

            {/* Header */}
            <header
                className={`fixed w-full top-0 z-50 transition-all duration-500 pt-4 flex justify-center`}
            >
                <div className={`transition-all duration-500 w-full ${scrolled ? 'max-w-5xl px-3 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
                    <div className={`relative flex justify-between items-center transition-all duration-500 rounded-full px-4 py-2 ${scrolled
                            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
                            : 'bg-transparent border border-transparent'
                        }`}>
                        {/* Logo */}
                        <Link to="/" className="relative flex items-center gap-2 group py-1">
                            <img src={logo} alt="Arrotech Hub" className="h-9 sm:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-90 dark:brightness-0 dark:invert" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-xl px-1.5 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-inner mx-auto absolute left-1/2 transform -translate-x-1/2">
                            <button onClick={() => scrollToSection('features')} className="relative px-5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 group/nav overflow-hidden">
                                <span className="relative z-10">Features</span>
                                <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full scale-0 group-hover/nav:scale-100 opacity-0 group-hover/nav:opacity-100 transition-all duration-300 origin-center shadow-sm"></div>
                            </button>
                            <button onClick={() => scrollToSection('demo-video')} className="relative px-5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 group/nav overflow-hidden">
                                <span className="relative z-10">How it Works</span>
                                <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full scale-0 group-hover/nav:scale-100 opacity-0 group-hover/nav:opacity-100 transition-all duration-300 origin-center shadow-sm"></div>
                            </button>
                            <Link to="/pricing" className="relative px-5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 group/nav overflow-hidden">
                                <span className="relative z-10">Pricing</span>
                                <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full scale-0 group-hover/nav:scale-100 opacity-0 group-hover/nav:opacity-100 transition-all duration-300 origin-center shadow-sm"></div>
                            </Link>

                            {/* Resources Dropdown Mega Menu */}
                            <div className="relative group/menu">
                                <button
                                    className="relative flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 group/nav overflow-hidden"
                                    onMouseEnter={() => setResourcesOpen(true)}
                                >
                                    <span className="relative z-10 flex items-center gap-1">
                                        Resources
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover/menu:rotate-180 group-hover/menu:opacity-100 transition-all duration-300" />
                                    </span>
                                    <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full scale-0 group-hover/nav:scale-100 opacity-0 group-hover/nav:opacity-100 transition-all duration-300 origin-center shadow-sm"></div>
                                </button>

                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-72 invisible opacity-0 group-hover/menu:visible group-hover/menu:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/menu:translate-y-0 z-50">
                                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-100/60 dark:border-slate-700/60 rounded-3xl shadow-2xl shadow-black/[0.1] dark:shadow-black/[0.4] p-3 flex flex-col gap-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-900/30 blur-2xl rounded-full pointer-events-none"></div>
                                        
                                        <Link to="/blog" className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl group/item transition-colors">
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover/item:scale-110 group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-500/20 transition-all duration-300 align-top">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">Blog</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Latest news, articles and product updates.</p>
                                            </div>
                                        </Link>
                                        <Link to="/help" className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl group/item transition-colors">
                                            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl group-hover/item:scale-110 group-hover/item:bg-amber-100 dark:group-hover/item:bg-amber-500/20 transition-all duration-300 align-top">
                                                <LifeBuoy className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors">Help Center</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Guides and tutorials to get you started.</p>
                                            </div>
                                        </Link>
                                        <Link to="/integrations/gmail" className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl group/item transition-colors">
                                            <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover/item:scale-110 group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-500/20 transition-all duration-300 align-top">
                                                <Plug className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">Integrations</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Connect with Gmail, Slack, Jira and more.</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auth Buttons & Theme Toggle */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center hover:rotate-12 transform"
                                aria-label="Toggle Dark Mode"
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {user ? (
                                <Link
                                    to="/unified"
                                    className="group relative inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    <LayoutDashboard className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">Dashboard</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2">Log in</Link>
                                    <Link
                                        to="/register"
                                        className="group relative inline-flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                        <span className="relative z-10">Get Started</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform relative z-10" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button & Theme Toggle */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={() => setIsDark(!isDark)}
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
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`md:hidden fixed inset-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'}`}>
                    <div className="flex flex-col justify-center h-full max-w-sm mx-auto px-6 py-20 gap-8">
                        <div className={`flex flex-col gap-6 transition-all duration-700 ease-out ${mobileMenuOpen ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-8 opacity-0'}`}>
                            <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                Features
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                            </button>
                            <button onClick={() => { scrollToSection('demo-video'); setMobileMenuOpen(false); }} className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                How it Works
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                            </button>
                            <Link onClick={() => setMobileMenuOpen(false)} to="/pricing" className="text-left text-2xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between group">
                                Pricing
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                            </Link>

                            <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2"></div>

                            <div className="flex flex-col gap-4">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resources</span>
                                <Link onClick={() => setMobileMenuOpen(false)} to="/blog" className="text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                    <BookOpen className="w-4 h-4 text-slate-400" /> Blog
                                </Link>
                                <Link onClick={() => setMobileMenuOpen(false)} to="/help" className="text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                    <LifeBuoy className="w-4 h-4 text-slate-400" /> Help Center
                                </Link>
                                <Link onClick={() => setMobileMenuOpen(false)} to="/integrations/gmail" className="text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-3">
                                    <Plug className="w-4 h-4 text-slate-400" /> Integrations
                                </Link>
                            </div>
                        </div>

                        <div className={`mt-auto transition-all duration-700 ease-out ${mobileMenuOpen ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-8 opacity-0'}`}>
                            {user ? (
                                <Link onClick={() => setMobileMenuOpen(false)} to="/unified" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-center shadow-lg flex items-center justify-center gap-2 text-base">
                                    <LayoutDashboard className="w-5 h-5" />
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/register" className="w-full flex items-center justify-center py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 text-base transition-all active:scale-[0.98]">Get Started Free</Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="w-full flex items-center justify-center py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-base transition-colors">Log in to account</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={`relative z-10 min-h-screen pt-20`}>
                {children}
            </main>

            {/* Premium Footer */}
            <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white pt-10 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-12 md:gap-8 mb-16">
                        {/* Brand & Newsletter */}
                        <div className="col-span-2 md:col-span-4 flex flex-col items-start">
                            <Link to="/" className="flex items-center gap-2 mb-5 group">
                                <img src={logo} alt="Arrotech Hub" className="h-[4.5rem] w-auto object-contain opacity-80 group-hover:opacity-100 transition-all dark:brightness-0 dark:invert" />
                            </Link>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs transition-colors">
                                The intelligent workspace that unifies your tools, tasks, and teams. Built for teams that move fast.
                            </p>
                            <div className="w-full max-w-sm">
                                <h5 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 tracking-tight transition-colors">Stay in the loop</h5>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        className="flex-1 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-white/30 dark:focus:border-white/30 transition-all font-medium"
                                    />
                                    <button className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-[1.02] flex-shrink-0">
                                        Subscribe
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2.5">No spam. Unsubscribe anytime.</p>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 md:col-start-6">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs mb-5 transition-colors">Product</h4>
                            <ul className="space-y-3">
                                <li><button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left">Features</button></li>
                                <li><Link to="/pricing" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link></li>
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
                        <div className="flex gap-6">
                            <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
