import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasConsented = localStorage.getItem('cookie_consent');
        if (!hasConsented) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto bg-white/95 dark:bg-secondary-900/95 backdrop-blur-xl border border-secondary-200 dark:border-secondary-700 shadow-surface rounded-2xl p-6 md:flex items-center justify-between gap-6">
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="p-2 bg-primary-100 dark:bg-primary-500/15 rounded-xl shrink-0">
                        <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary-900 dark:text-secondary-50 text-lg mb-1">We value your privacy</h3>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
                            By clicking "Accept All", you consent to our use of cookies.
                            <Link to="/privacy" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1">
                                Read our Privacy Policy
                            </Link>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-brand hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
