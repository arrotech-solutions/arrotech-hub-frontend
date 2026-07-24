import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import toast from '../lib/notify';
import {
    Building2, ArrowLeft, Loader2, Check,
} from 'lucide-react';

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
    'E-commerce', 'Manufacturing', 'Real Estate', 'Consulting', 'Other',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const fieldClass =
    'w-full px-4 py-3 rounded-lg border border-white/15 bg-white/5 text-white text-[0.95rem] outline-none transition-colors placeholder:text-secondary-500 focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/25';

const labelClass = 'block text-secondary-300 text-sm font-medium mb-1.5';

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
            await switchOrg(response.data.id);
            toast.success('Organization created successfully!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create organization');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-gradient-dark p-8">
            <div className="max-w-xl w-full">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-secondary-400 hover:text-primary-300 bg-transparent border-0 cursor-pointer mb-6 text-sm transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-10 shadow-surface">
                    <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-primary-500 to-secondary-900 flex items-center justify-center mb-6 shadow-brand">
                        <Building2 size={28} className="text-white" />
                    </div>

                    <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">
                        Create your organization
                    </h2>
                    <p className="text-secondary-400 text-sm mb-8">
                        Set up a shared workspace for your team or company.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className={labelClass}>Organization Name *</label>
                            <input
                                type="text"
                                placeholder="Acme Corporation"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className={fieldClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>URL Slug</label>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-500 text-sm whitespace-nowrap">
                                    hub.arrotech.com/
                                </span>
                                <input
                                    type="text"
                                    placeholder="acme-corp"
                                    value={form.slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea
                                placeholder="What does your organization do?"
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className={`${fieldClass} resize-y`}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Industry</label>
                                <select
                                    value={form.industry}
                                    onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
                                    className={`${fieldClass} cursor-pointer`}
                                >
                                    <option value="" className="bg-secondary-900">Select...</option>
                                    {INDUSTRIES.map(i => (
                                        <option key={i} value={i} className="bg-secondary-900">{i}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Company Size</label>
                                <select
                                    value={form.company_size}
                                    onChange={(e) => setForm(prev => ({ ...prev, company_size: e.target.value }))}
                                    className={`${fieldClass} cursor-pointer`}
                                >
                                    <option value="" className="bg-secondary-900">Select...</option>
                                    {COMPANY_SIZES.map(s => (
                                        <option key={s} value={s} className="bg-secondary-900">{s} people</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Website</label>
                            <input
                                type="url"
                                placeholder="https://example.com"
                                value={form.website}
                                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                                className={fieldClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Billing Email</label>
                            <input
                                type="email"
                                placeholder="billing@example.com"
                                value={form.billing_email}
                                onChange={(e) => setForm(prev => ({ ...prev, billing_email: e.target.value }))}
                                className={fieldClass}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !form.name.trim()}
                            className="w-full mt-2 py-3.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 text-base font-semibold flex items-center justify-center gap-2 shadow-brand hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
