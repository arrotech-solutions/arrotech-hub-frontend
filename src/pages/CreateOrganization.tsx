import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import toast from 'react-hot-toast';
import {
    Building2, Globe, Users, Briefcase, ArrowLeft, Loader2, Check,
} from 'lucide-react';

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
    'E-commerce', 'Manufacturing', 'Real Estate', 'Consulting', 'Other',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const CreateOrganization = () => {
    const navigate = useNavigate();
    const { refreshOrganizations, switchOrg } = useAuth();

    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        website: '',
        industry: '',
        company_size: '',
        billing_email: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [autoSlug, setAutoSlug] = useState(true);

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const handleNameChange = (name: string) => {
        setForm(prev => ({
            ...prev,
            name,
            ...(autoSlug ? { slug: generateSlug(name) } : {}),
        }));
    };

    const handleSlugChange = (slug: string) => {
        setAutoSlug(false);
        setForm(prev => ({ ...prev, slug: generateSlug(slug) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Organization name is required');
            return;
        }
        setSubmitting(true);
        try {
            const response = await organizationService.create(form);
            await refreshOrganizations();
            // Switch to the new org
            await switchOrg(response.data.id);
            toast.success('Organization created successfully!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create organization');
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
        border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '0.95rem', outline: 'none',
        transition: 'border-color 0.2s',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', color: '#cbd5e1', fontSize: '0.85rem',
        fontWeight: 500, marginBottom: '0.4rem',
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '560px', width: '100%' }}>
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8',
                        background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '1rem', padding: '2.5rem',
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1.5rem',
                    }}>
                        <Building2 size={28} color="#fff" />
                    </div>

                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Create your organization
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        Set up a shared workspace for your team or company.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Name */}
                        <div>
                            <label style={labelStyle}>Organization Name *</label>
                            <input
                                type="text"
                                placeholder="Acme Corporation"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label style={labelStyle}>URL Slug</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    hub.arrotech.com/
                                </span>
                                <input
                                    type="text"
                                    placeholder="acme-corp"
                                    value={form.slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                placeholder="What does your organization do?"
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>

                        {/* Industry & Size */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Industry</label>
                                <select
                                    value={form.industry}
                                    onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="">Select...</option>
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Company Size</label>
                                <select
                                    value={form.company_size}
                                    onChange={(e) => setForm(prev => ({ ...prev, company_size: e.target.value }))}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="">Select...</option>
                                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} people</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Website */}
                        <div>
                            <label style={labelStyle}>Website</label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={form.website}
                                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>

                        {/* Billing Email */}
                        <div>
                            <label style={labelStyle}>Billing Email</label>
                            <input
                                type="email"
                                placeholder="billing@example.com"
                                value={form.billing_email}
                                onChange={(e) => setForm(prev => ({ ...prev, billing_email: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !form.name.trim()}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '0.5rem',
                                background: submitting ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600,
                                cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                marginTop: '0.5rem', transition: 'opacity 0.2s',
                            }}
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Creating...</>
                            ) : (
                                <><Check size={18} /> Create Organization</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateOrganization;
