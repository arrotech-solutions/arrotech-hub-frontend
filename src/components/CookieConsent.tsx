import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('cookie_consent');
        if (!hasConsented) {
            // Small delay to not overwhelm on load
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

    // Don't show on login/register pages if desired, but GDPR applies everywhere

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-6 md:flex items-center justify-between gap-6">
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">We value your privacy</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
                            By clicking "Accept All", you consent to our use of cookies.
                            <Link to="/privacy" className="text-blue-600 font-semibold hover:underline ml-1">
                                Read our Privacy Policy
                            </Link>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
