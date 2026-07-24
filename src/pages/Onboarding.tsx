import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Building2, User, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Onboarding page shown to new users after registration.
 * They choose between "Personal Use" or "Create an Organization".
 */
const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-gradient-dark px-6 py-10">
            <div className="max-w-3xl w-full text-center">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm text-primary-300 bg-primary-500/15 border border-primary-500/30">
                        <Sparkles size={14} className="text-accent-400" /> Welcome to Arrotech Hub
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
                        Hey {user?.name?.split(' ')[0] || 'there'}, how will you use Hub?
                    </h1>
                    <p className="text-secondary-400 text-lg max-w-lg mx-auto">
                        You can always change this later. Choose what fits best right now.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <button
                        type="button"
                        onClick={() => navigate('/unified')}
                        onMouseEnter={() => setHoveredCard('personal')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`text-left rounded-2xl p-8 transition-all duration-250 border-2 ${
                            hoveredCard === 'personal'
                                ? 'bg-primary-500/15 border-primary-500/50 shadow-brand'
                                : 'bg-white/5 border-white/10 hover:border-primary-500/30'
                        }`}
                    >
                        <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 shadow-brand">
                            <User size={28} className="text-white" />
                        </div>
                        <h3 className="text-white text-xl font-semibold mb-2">Personal Use</h3>
                        <p className="text-secondary-400 text-sm leading-relaxed">
                            Use Hub for your own projects, automations, and integrations. Perfect for freelancers and solopreneurs.
                        </p>
                        <div className="flex items-center gap-2 text-primary-300 mt-6 text-sm font-medium">
                            Go to Dashboard <ArrowRight size={16} />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/create-organization')}
                        onMouseEnter={() => setHoveredCard('org')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`text-left rounded-2xl p-8 transition-all duration-250 border-2 ${
                            hoveredCard === 'org'
                                ? 'bg-accent-500/15 border-accent-500/50 shadow-accent'
                                : 'bg-white/5 border-white/10 hover:border-accent-500/30'
                        }`}
                    >
                        <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center mb-6 shadow-accent">
                            <Building2 size={28} className="text-secondary-950" />
                        </div>
                        <h3 className="text-white text-xl font-semibold mb-2">Create an Organization</h3>
                        <p className="text-secondary-400 text-sm leading-relaxed">
                            Set up a shared workspace for your team or company. Invite members, manage roles, and collaborate.
                        </p>
                        <div className="flex items-center gap-2 text-accent-300 mt-6 text-sm font-medium">
                            Create Organization <ArrowRight size={16} />
                        </div>
                    </button>
                </div>

                <p className="text-secondary-500 text-sm">
                    You can create or join organizations anytime from your dashboard settings.
                </p>
            </div>
        </div>
    );
};

export default Onboarding;
