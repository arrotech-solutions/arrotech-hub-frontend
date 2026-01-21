import React from 'react';
import { X, Sparkles, Zap, Crown, ArrowRight, CheckCircle2, Shield, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
    requiredTier: string;
    currentTier: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    feature,
    requiredTier,
    currentTier
}) => {
    if (!isOpen) return null;

    // Dynamic benefits based on tier
    const getBenefits = () => {
        if (requiredTier.toLowerCase().includes('lite')) {
            return [
                { icon: Zap, text: 'Google Workspace, Gmail & Outlook integrations' },
                { icon: Shield, text: '50 AI messages per day' },
                { icon: Rocket, text: 'Email support & weekly reports' },
            ];
        }
        return [
            { icon: Zap, text: 'All premium integrations (50+ apps)' },
            { icon: Shield, text: '500 AI messages per day' },
            { icon: Rocket, text: 'Priority chat support & team collaboration' },
        ];
    };

    const benefits = getBenefits();

    // Get tier color scheme
    const getTierColors = () => {
        if (requiredTier.toLowerCase().includes('enterprise')) {
            return {
                gradient: 'from-gray-900 via-gray-800 to-gray-900',
                accent: 'text-amber-400',
                badge: 'bg-gradient-to-r from-amber-500 to-yellow-400',
                button: 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black',
            };
        }
        if (requiredTier.toLowerCase().includes('pro')) {
            return {
                gradient: 'from-violet-600 via-purple-600 to-indigo-600',
                accent: 'text-violet-400',
                badge: 'bg-gradient-to-r from-violet-500 to-purple-500',
                button: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
            };
        }
        return {
            gradient: 'from-orange-500 via-amber-500 to-orange-500',
            accent: 'text-orange-400',
            badge: 'bg-gradient-to-r from-orange-500 to-amber-500',
            button: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
        };
    };

    const colors = getTierColors();

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300 scale-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative gradient header */}
                    <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${colors.gradient} opacity-90`}>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLThoLTJ2LTRoMnY0em0tNC00aC0ydi00aDJ2NHptMCA4aC0ydi00aDJ2NHptLTQtNGgtMnYtNGgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 group"
                    >
                        <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                    </button>

                    {/* Content */}
                    <div className="relative pt-12 pb-6 px-6">
                        {/* Icon Badge */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-16 h-16 ${colors.badge} rounded-2xl shadow-lg flex items-center justify-center transform -translate-y-2`}>
                                <Crown className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Premium Feature
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                Unlock {feature}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                                Upgrade to <span className={`font-semibold ${colors.accent}`}>{requiredTier}</span> to access this integration and supercharge your workflow
                            </p>
                        </div>

                        {/* Plan Comparison Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 mb-4 border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                                        Current
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl">
                                        <span className="text-base font-bold text-gray-600 dark:text-gray-300">
                                            {currentTier}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 mx-4">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center">
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>

                                <div className="text-center flex-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                                        Recommended
                                    </p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.badge} rounded-xl shadow-lg`}>
                                        <Sparkles className="w-4 h-4 text-white" />
                                        <span className="text-base font-bold text-white">
                                            {requiredTier}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-2 mb-5">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                                What you'll get
                            </p>
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg ${colors.badge} bg-opacity-10 flex items-center justify-center`}>
                                        <benefit.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {benefit.text}
                                    </span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2">
                            <Link
                                to="/pricing"
                                onClick={onClose}
                                className={`flex items-center justify-center gap-2 w-full px-5 py-3 ${colors.button} text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
                            >
                                <Rocket className="w-4 h-4" />
                                See Pricing & Upgrade
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>

                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium text-sm transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>

                        {/* Trust badges */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5" />
                                    Secure payment
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    Instant access
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Cancel anytime
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpgradeModal;
