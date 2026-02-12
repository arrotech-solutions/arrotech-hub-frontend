import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Shield, Users, UserPlus, UserMinus, Check, X,
    Search, ChevronLeft, ChevronRight, Crown, Mail,
    ToggleLeft, ToggleRight, RefreshCw, CreditCard, AlertCircle,
} from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

interface AccessRequest {
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    name?: string;
    reason?: string;
}

interface Employee {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: Record<string, boolean>;
    created_at: string | null;
}

interface Subscriber {
    id: number;
    email: string;
    name: string;
    subscription_tier: string;
    subscription_status: string | null;
    subscription_end_date: string | null;
    role: string;
    created_at: string | null;
}

type Tab = 'access' | 'employees' | 'subscribers';

const TIER_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-100 text-blue-700',
    business: 'bg-purple-100 text-purple-700',
    pro: 'bg-amber-100 text-amber-700',
    enterprise: 'bg-emerald-100 text-emerald-700',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-500',
    expired: 'bg-gray-100 text-gray-400',
    grace_period: 'bg-yellow-100 text-yellow-700',
};

const AdminDashboard: React.FC = () => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('access');

    // Access requests state
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    // Employees state
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [promoteEmail, setPromoteEmail] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);

    // Subscribers state
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
    const [subPage, setSubPage] = useState(1);
    const [subTotalPages, setSubTotalPages] = useState(1);
    const [subTotal, setSubTotal] = useState(0);
    const [subSearch, setSubSearch] = useState('');
    const [subTierFilter, setSubTierFilter] = useState('');

    // ── Access Requests ──
    const fetchRequests = useCallback(async () => {
        setIsLoadingRequests(true);
        try {
            const res = await apiService.getAccessRequests();
            if (res.success) setRequests(res.data);
        } catch { /* ignore */ } finally { setIsLoadingRequests(false); }
    }, []);

    const handleAccessAction = async (email: string, action: 'approve' | 'reject') => {
        try {
            await apiService.approveAccess(email, action);
            toast.success(`Request ${action}d`);
            fetchRequests();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || `Failed to ${action}`);
        }
    };

    // ── Employees ──
    const fetchEmployees = useCallback(async () => {
        setIsLoadingEmployees(true);
        try {
            const res = await apiService.getEmployees();
            if (res.success) setEmployees(res.data);
        } catch { /* ignore */ } finally { setIsLoadingEmployees(false); }
    }, []);

    const handlePromote = async () => {
        if (!promoteEmail.trim()) return;
        setIsPromoting(true);
        try {
            await apiService.promoteEmployee(promoteEmail.trim());
            toast.success(`${promoteEmail} promoted to employee`);
            setPromoteEmail('');
            fetchEmployees();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Promotion failed');
        } finally { setIsPromoting(false); }
    };

    const handleTogglePermission = async (emp: Employee, perm: string) => {
        const newVal = !emp.permissions[perm];
        try {
            await apiService.updateEmployeePermissions(emp.id, { [perm]: newVal });
            setEmployees(prev =>
                prev.map(e =>
                    e.id === emp.id
                        ? { ...e, permissions: { ...e.permissions, [perm]: newVal } }
                        : e
                )
            );
            toast.success(`${perm} ${newVal ? 'granted' : 'revoked'}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to update');
        }
    };

    const handleDemote = async (emp: Employee) => {
        if (!window.confirm(`Demote ${emp.email} to regular user? Their permissions will be removed.`)) return;
        try {
            await apiService.demoteEmployee(emp.id);
            toast.success(`${emp.email} demoted`);
            fetchEmployees();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Failed to demote');
        }
    };

    // ── Subscribers ──
    const fetchSubscribers = useCallback(async (page: number = 1) => {
        setIsLoadingSubscribers(true);
        try {
            const params: any = { page, per_page: 15 };
            if (subTierFilter) params.tier = subTierFilter;
            if (subSearch.trim()) params.search = subSearch.trim();
            const res = await apiService.getSubscribers(params);
            if (res.success) {
                setSubscribers(res.data);
                setSubPage(res.page);
                setSubTotalPages(res.total_pages);
                setSubTotal(res.total);
            }
        } catch { /* ignore */ } finally { setIsLoadingSubscribers(false); }
    }, [subTierFilter, subSearch]);

    // Tab switching
    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        if (activeTab === 'access') fetchRequests();
        else if (activeTab === 'employees') fetchEmployees();
        else if (activeTab === 'subscribers') fetchSubscribers(1);
    }, [activeTab, isAdmin, navigate, fetchRequests, fetchEmployees, fetchSubscribers]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <>
            <Helmet><title>Admin Dashboard — Arrotech Hub</title></Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
                        {([
                            { id: 'access' as Tab, label: 'Access Requests', icon: <Shield className="w-4 h-4" />, badge: pendingCount },
                            { id: 'employees' as Tab, label: 'Employees', icon: <Users className="w-4 h-4" /> },
                            { id: 'subscribers' as Tab, label: 'Subscribers', icon: <CreditCard className="w-4 h-4" /> },
                        ]).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'border-purple-600 text-purple-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                                {tab.badge ? (
                                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">{tab.badge}</span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* ── Access Requests Tab ── */}
                    {activeTab === 'access' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Access Requests</h2>
                                <button onClick={fetchRequests} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                            </div>

                            {isLoadingRequests ? (
                                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No access requests</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map(req => (
                                        <div key={req.email} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">{req.name || req.email}</span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                                        : req.status === 'approved' ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}>{req.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5"><Mail className="w-3 h-3 inline mr-1" />{req.email}</p>
                                                {req.reason && <p className="text-sm text-gray-400 mt-1 italic">"{req.reason}"</p>}
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAccessAction(req.email, 'approve')}
                                                        className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                    <button onClick={() => handleAccessAction(req.email, 'reject')}
                                                        className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1">
                                                        <X className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Employees Tab ── */}
                    {activeTab === 'employees' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
                                <button onClick={fetchEmployees} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                            </div>

                            {/* Promote form */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-purple-600" /> Promote User to Employee
                                </h3>
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        value={promoteEmail}
                                        onChange={e => setPromoteEmail(e.target.value)}
                                        placeholder="firstname.lastname@arrotechsolutions.com"
                                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                    />
                                    <button
                                        onClick={handlePromote}
                                        disabled={isPromoting || !promoteEmail.endsWith('@arrotechsolutions.com')}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {isPromoting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                                        Promote
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Only @arrotechsolutions.com emails can be promoted. User must register first.
                                </p>
                            </div>

                            {/* Employee list */}
                            {isLoadingEmployees ? (
                                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No employees yet</h3>
                                    <p className="text-sm text-gray-500">Promote an @arrotechsolutions.com user above.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {employees.map(emp => (
                                        <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{emp.name}</span>
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">{emp.role}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-0.5">{emp.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDemote(emp)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" /> Demote
                                                </button>
                                            </div>

                                            {/* Permissions */}
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {['blog_write', 'blog_publish'].map(perm => {
                                                    const enabled = !!emp.permissions[perm];
                                                    return (
                                                        <button
                                                            key={perm}
                                                            onClick={() => handleTogglePermission(emp, perm)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${enabled
                                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                                : 'bg-gray-50 text-gray-400 border border-gray-200'
                                                                }`}
                                                        >
                                                            {enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                            {perm.replace('_', ' ')}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Subscribers Tab ── */}
                    {activeTab === 'subscribers' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Subscribers</h2>
                                    <p className="text-sm text-gray-500">{subTotal} total users</p>
                                </div>
                                <button onClick={() => fetchSubscribers(1)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
                            </div>

                            {/* Filters */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={subSearch}
                                        onChange={e => setSubSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && fetchSubscribers(1)}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                    />
                                </div>
                                <select
                                    value={subTierFilter}
                                    onChange={e => { setSubTierFilter(e.target.value); }}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                >
                                    <option value="">All Tiers</option>
                                    <option value="free">Free</option>
                                    <option value="starter">Starter</option>
                                    <option value="business">Business</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                                <button
                                    onClick={() => fetchSubscribers(1)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Table */}
                            {isLoadingSubscribers ? (
                                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
                            ) : subscribers.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No subscribers found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        <th className="px-5 py-3">User</th>
                                                        <th className="px-5 py-3">Tier</th>
                                                        <th className="px-5 py-3">Status</th>
                                                        <th className="px-5 py-3">Expiry</th>
                                                        <th className="px-5 py-3">Role</th>
                                                        <th className="px-5 py-3">Joined</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {subscribers.map(sub => (
                                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{sub.name}</p>
                                                                    <p className="text-xs text-gray-500">{sub.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${TIER_COLORS[sub.subscription_tier] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {sub.subscription_tier}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_COLORS[sub.subscription_status || 'active'] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {sub.subscription_status || 'active'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-500 text-xs">
                                                                {sub.subscription_end_date
                                                                    ? new Date(sub.subscription_end_date).toLocaleDateString()
                                                                    : <span className="text-gray-300">—</span>}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sub.role === 'admin' ? 'bg-red-100 text-red-700'
                                                                    : sub.role === 'employee' ? 'bg-purple-100 text-purple-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                    }`}>{sub.role}</span>
                                                            </td>
                                                            <td className="px-5 py-3 text-xs text-gray-400">
                                                                {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-sm text-gray-500">Page {subPage} of {subTotalPages}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fetchSubscribers(subPage - 1)}
                                                disabled={subPage <= 1}
                                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => fetchSubscribers(subPage + 1)}
                                                disabled={subPage >= subTotalPages}
                                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
