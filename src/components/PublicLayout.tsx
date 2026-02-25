import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, ArrowRight, Sun, Moon } from 'lucide-react';
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
                className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-gray-200/40 dark:border-slate-800/60 shadow-lg shadow-black/[0.03] py-0'
                    : 'bg-transparent py-0'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center">
                        {/* Logo */}
                        <Link to="/" className="relative flex items-center gap-2 group py-1">
                            <img src={logo} alt="Arrotech Hub" className="h-[4.5rem] w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:opacity-90 dark:brightness-0 dark:invert" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-2 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none mx-auto absolute left-1/2 transform -translate-x-1/2">
                            <button onClick={() => scrollToSection('features')} className="px-4 py-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-200">Features</button>
                            <button onClick={() => scrollToSection('demo-video')} className="px-4 py-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-200">How it Works</button>
                            <Link to="/pricing" className="px-4 py-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-200">Pricing</Link>

                            {/* Resources Dropdown */}
                            <div className="relative group">
                                <button
                                    className="flex items-center gap-1 px-4 py-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-200"
                                    onMouseEnter={() => setResourcesOpen(true)}
                                >
                                    Resources
                                    <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-100/60 dark:border-slate-800/60 rounded-2xl shadow-xl shadow-black/[0.08] dark:shadow-black/[0.3] py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <Link to="/blog" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors rounded-xl mx-1">
                                        Blog
                                    </Link>
                                    <Link to="/help" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors rounded-xl mx-1">
                                        Help Center
                                    </Link>
                                    <Link to="/integrations/gmail" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors rounded-xl mx-1">
                                        Integrations
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Auth Buttons & Theme Toggle */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-2 flex items-center justify-center"
                                aria-label="Toggle Dark Mode"
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {user ? (
                                <Link
                                    to="/unified"
                                    className="group inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 shadow-[0_2px_8px_rgb(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Log in</Link>
                                    <Link
                                        to="/register"
                                        className="group inline-flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 shadow-[0_2px_8px_rgb(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
                                    >
                                        Get Started
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
                                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-gray-100 dark:border-slate-800 py-6 px-5 shadow-2xl shadow-black/[0.08] dark:shadow-black/[0.3] max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="flex flex-col gap-1">
                            <button onClick={() => scrollToSection('features')} className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors">Features</button>
                            <button onClick={() => scrollToSection('demo-video')} className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors">How it Works</button>
                            <Link to="/pricing" className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors">Pricing</Link>

                            <div className="border-t border-gray-100 dark:border-slate-800 py-3 my-2">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block px-4">Resources</span>
                                <Link to="/blog" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-sm">Blog</Link>
                                <Link to="/help" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-sm">Help Center</Link>
                                <Link to="/integrations/gmail" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-sm">Integrations</Link>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                                {user ? (
                                    <Link to="/unified" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-bold text-center shadow-lg flex items-center justify-center gap-2 text-sm">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link to="/login" className="w-full flex items-center justify-center py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors">Log in</Link>
                                        <Link to="/register" className="w-full flex items-center justify-center py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none text-sm transition-all">Get Started</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
