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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                {/* Header */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '999px', padding: '0.4rem 1rem', marginBottom: '1.5rem',
                        fontSize: '0.85rem', color: '#a5b4fc',
                    }}>
                        <Sparkles size={14} /> Welcome to Arrotech Hub
                    </div>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: 700, color: '#fff',
                        marginBottom: '0.75rem', lineHeight: 1.2,
                    }}>
                        Hey {user?.name?.split(' ')[0] || 'there'}, how will you use Hub?
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                        You can always change this later. Choose what fits best right now.
                    </p>
                </div>

                {/* Cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
                    marginBottom: '2rem',
                }}>
                    {/* Personal Card */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        onMouseEnter={() => setHoveredCard('personal')}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                            background: hoveredCard === 'personal'
                                ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.04)',
                            border: hoveredCard === 'personal'
                                ? '2px solid rgba(99, 102, 241, 0.5)' : '2px solid rgba(255,255,255,0.08)',
                            borderRadius: '1rem', padding: '2.5rem 2rem',
                            cursor: 'pointer', transition: 'all 0.25s ease',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.5rem',
                        }}>
                            <User size={28} color="#fff" />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Personal Use
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Use Hub for your own projects, automations, and integrations. Perfect for freelancers and solopreneurs.
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: '#a5b4fc', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: 500,
                        }}>
                            Go to Dashboard <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* Organization Card */}
                    <div
                        onClick={() => navigate('/create-organization')}
                        onMouseEnter={() => setHoveredCard('org')}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                            background: hoveredCard === 'org'
                                ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                            border: hoveredCard === 'org'
                                ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(255,255,255,0.08)',
                            borderRadius: '1rem', padding: '2.5rem 2rem',
                            cursor: 'pointer', transition: 'all 0.25s ease',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.5rem',
                        }}>
                            <Building2 size={28} color="#fff" />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Create an Organization
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Set up a shared workspace for your team or company. Invite members, manage roles, and collaborate.
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: '#6ee7b7', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: 500,
                        }}>
                            Create Organization <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    You can create or join organizations anytime from your dashboard settings.
                </p>
            </div>
        </div>
    );
};

export default Onboarding;
