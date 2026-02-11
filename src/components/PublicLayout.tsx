import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo/fulllogo_transparent.png';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [resourcesOpen, setResourcesOpen] = useState(false);
    const { pathname, hash } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setResourcesOpen(false);
    }, [pathname]);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex justify-between items-center h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="relative w-24 h-full flex items-center">
                            <img src={logo} alt="Arrotech Hub" className="absolute top-1/2 left-0 h-32 w-auto object-contain z-50 transform -translate-y-1/2" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">How it Works</button>
                            <Link to="/pricing" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Pricing</Link>

                            {/* Resources Dropdown */}
                            <div className="relative group">
                                <button
                                    className="flex items-center gap-1 text-gray-600 hover:text-purple-600 font-medium transition-colors py-2"
                                    onMouseEnter={() => setResourcesOpen(true)}
                                    onClick={() => setResourcesOpen(!resourcesOpen)}
                                >
                                    Resources
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <Link to="/blog" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium">
                                        Blog
                                    </Link>
                                    <Link to="/help" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium">
                                        Help Center
                                    </Link>
                                    <Link to="/integrations/gmail" className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium">
                                        Integrations
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link
                                    to="/unified"
                                    className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Log In</Link>
                                    <Link
                                        to="/register"
                                        className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-600"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 py-4 px-4 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            <button onClick={() => scrollToSection('features')} className="text-left py-2 text-gray-600 font-medium">Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2 text-gray-600 font-medium">How it Works</button>
                            <Link to="/pricing" className="text-left py-2 text-gray-600 font-medium">Pricing</Link>

                            <div className="border-t border-b border-gray-50 py-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Resources</span>
                                <Link to="/blog" className="block py-2 text-gray-600 font-medium pl-2">Blog</Link>
                                <Link to="/help" className="block py-2 text-gray-600 font-medium pl-2">Help Center</Link>
                                <Link to="/integrations/gmail" className="block py-2 text-gray-600 font-medium pl-2">Integrations</Link>
                            </div>

                            <hr className="border-gray-100" />
                            {user ? (
                                <Link to="/unified" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-center shadow-md flex items-center justify-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-left py-2 text-gray-600 font-medium">Log In</Link>
                                    <Link to="/register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-center shadow-md">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="pt-16 md:pt-20">

                {children}
            </div>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-200 bg-gray-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-purple-600 text-left">Features</button></li>
                            <li><Link to="/pricing" className="hover:text-purple-600">Pricing</Link></li>
                            <li><Link to="/register" className="hover:text-purple-600">Sign Up Free</Link></li>
                            <li><Link to="/help" className="hover:text-purple-600">Help Center</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Integrations</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link to="/integrations/gmail" className="hover:text-purple-600">Gmail</Link></li>
                            <li><Link to="/integrations/slack" className="hover:text-purple-600">Slack</Link></li>
                            <li><Link to="/integrations/mpesa" className="hover:text-purple-600">M-Pesa Automation</Link></li>
                            <li><Link to="/integrations/whatsapp" className="hover:text-purple-600">WhatsApp Business</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Compare</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link to="/vs/akiflow" className="hover:text-purple-600">vs Akiflow</Link></li>
                            <li><Link to="/vs/motion" className="hover:text-purple-600">vs Motion</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link to="/blog" className="hover:text-purple-600">Blog</Link></li>
                            <li><Link to="/privacy" className="hover:text-purple-600">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-purple-600">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
                    <p>© 2026 Arrotech Solutions. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
