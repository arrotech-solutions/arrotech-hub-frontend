import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo/fulllogo_transparent.png';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [, setResourcesOpen] = useState(false);
    const { pathname, hash } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

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
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
            {/* Mesh Gradient Background */}
            {/* Premium Mesh Gradient Background (Canva-inspired) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-200/40 to-pink-200/40 blur-[120px] animate-pulse" />
                <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-bl from-cyan-200/40 to-blue-200/40 blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-violet-200/30 to-fuchsia-100/30 blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-white/60 blur-[100px] animate-pulse delay-700" />
            </div>

            {/* Header */}
            <header
                className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-white/70 backdrop-blur-2xl border-b border-gray-200/40 shadow-lg shadow-black/[0.03] py-3'
                    : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center">
                        {/* Logo */}
                        <Link to="/" className="relative flex items-center gap-2 group">
                            <img src={logo} alt="Arrotech Hub" className="h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:opacity-90" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-0.5 bg-white/60 backdrop-blur-xl px-1.5 py-1 rounded-full border border-gray-200/40 shadow-sm mx-auto absolute left-1/2 transform -translate-x-1/2">
                            <button onClick={() => scrollToSection('features')} className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-full transition-all duration-200">Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-full transition-all duration-200">How it Works</button>
                            <Link to="/pricing" className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-full transition-all duration-200">Pricing</Link>

                            {/* Resources Dropdown */}
                            <div className="relative group">
                                <button
                                    className="flex items-center gap-1 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-full transition-all duration-200"
                                    onMouseEnter={() => setResourcesOpen(true)}
                                >
                                    Resources
                                    <ChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-70 transition-opacity" />
                                </button>

                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white/95 backdrop-blur-2xl border border-gray-100/60 rounded-2xl shadow-xl shadow-black/[0.08] py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <Link to="/blog" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors rounded-xl mx-1">
                                        Blog
                                    </Link>
                                    <Link to="/help" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors rounded-xl mx-1">
                                        Help Center
                                    </Link>
                                    <Link to="/integrations/gmail" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors rounded-xl mx-1">
                                        Integrations
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link
                                    to="/unified"
                                    className="group inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/10 hover:scale-[1.02]"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Log in</Link>
                                    <Link
                                        to="/register"
                                        className="group inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 shadow-md shadow-purple-500/15 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
                                    >
                                        Get Started
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-gray-100 py-6 px-5 shadow-2xl shadow-black/[0.08] max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="flex flex-col gap-1">
                            <button onClick={() => scrollToSection('features')} className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 text-slate-800 font-semibold text-base transition-colors">Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 text-slate-800 font-semibold text-base transition-colors">How it Works</button>
                            <Link to="/pricing" className="text-left py-3 px-4 rounded-xl hover:bg-slate-50 text-slate-800 font-semibold text-base transition-colors">Pricing</Link>

                            <div className="border-t border-gray-100 py-3 my-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-4">Resources</span>
                                <Link to="/blog" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 text-slate-500 font-medium text-sm">Blog</Link>
                                <Link to="/help" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 text-slate-500 font-medium text-sm">Help Center</Link>
                                <Link to="/integrations/gmail" className="block py-2.5 px-4 rounded-xl hover:bg-slate-50 text-slate-500 font-medium text-sm">Integrations</Link>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                                {user ? (
                                    <Link to="/unified" className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-center shadow-lg flex items-center justify-center gap-2 text-sm">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link to="/login" className="w-full flex items-center justify-center py-3 rounded-2xl border border-gray-200 font-bold text-slate-700 hover:bg-slate-50 text-sm transition-colors">Log in</Link>
                                        <Link to="/register" className="w-full flex items-center justify-center py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-500/20 text-sm">Get Started</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-24 md:pt-32 min-h-screen">
                {children}
            </main>

            {/* Premium Footer */}
            <footer className="relative z-10 bg-slate-900 text-white pt-20 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-12 md:gap-8 mb-16">
                        {/* Brand & Newsletter */}
                        <div className="col-span-2 md:col-span-4 flex flex-col items-start">
                            <Link to="/" className="flex items-center gap-2 mb-5 group">
                                <img src={logo} alt="Arrotech Hub" className="h-8 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-all" />
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
                                The intelligent workspace that unifies your tools, tasks, and teams. Built for teams that move fast.
                            </p>
                            <div className="w-full max-w-sm">
                                <h5 className="font-bold text-white text-sm mb-3">Stay in the loop</h5>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                                    />
                                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] flex-shrink-0">
                                        Subscribe
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2.5">No spam. Unsubscribe anytime.</p>
                            </div>
                        </div>

                        {/* Links Column 1 */}
                        <div className="col-span-1 md:col-span-2 md:col-start-6">
                            <h4 className="font-bold text-white text-[11px] uppercase tracking-widest mb-5">Product</h4>
                            <ul className="space-y-3">
                                <li><button onClick={() => scrollToSection('features')} className="text-sm text-slate-400 hover:text-white transition-colors text-left">Features</button></li>
                                <li><Link to="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link to="/changelog" className="text-sm text-slate-400 hover:text-white transition-colors">Changelog</Link></li>
                                <li><Link to="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</Link></li>
                            </ul>
                        </div>

                        {/* Links Column 2 */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="font-bold text-white text-[11px] uppercase tracking-widest mb-5">Company</h4>
                            <ul className="space-y-3">
                                <li><Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="/careers" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</Link></li>
                                <li><Link to="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</Link></li>
                                <li><Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Links Column 3 */}
                        <div className="col-span-1 md:col-span-2">
                            <h4 className="font-bold text-white text-[11px] uppercase tracking-widest mb-5">Legal</h4>
                            <ul className="space-y-3">
                                <li><Link to="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms</Link></li>
                                <li><Link to="/security" className="text-sm text-slate-400 hover:text-white transition-colors">Security</Link></li>
                                <li><Link to="/cookies" className="text-sm text-slate-400 hover:text-white transition-colors">Cookies</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-xs font-medium">© 2026 Arrotech Solutions. All rights reserved.</p>
                        <div className="flex gap-4">
                            <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/[0.06] rounded-xl"><span className="sr-only">Twitter</span><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></button>
                            <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/[0.06] rounded-xl"><span className="sr-only">GitHub</span><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg></button>
                            <button className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/[0.06] rounded-xl"><span className="sr-only">LinkedIn</span><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
