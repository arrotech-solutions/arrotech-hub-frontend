import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import toast from '../lib/notify';
import {
    Building2, Users, Mail, Shield, Clock, Settings, Trash2,
    ChevronRight, Plus, Loader2, ArrowLeft, X, UserPlus,
    FolderTree, Pencil, UserCog, Crown,
} from 'lucide-react';

type Tab = 'general' | 'members' | 'departments' | 'invitations' | 'audit';

const OrganizationSettings = () => {
    const navigate = useNavigate();
    const { activeOrg, refreshOrganizations } = useAuth();
    const [tab, setTab] = useState<Tab>('general');
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    // General form state
    const [form, setForm] = useState({ name: '', description: '', website: '', billing_email: '' });
    const [saving, setSaving] = useState(false);

    // Invitation form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);

    // Department form state
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null);
    const [deptForm, setDeptForm] = useState({ name: '', description: '', head_id: '' });
    const [savingDept, setSavingDept] = useState(false);

    useEffect(() => {
        if (!activeOrg) {
            navigate('/unified');
            return;
        }
        fetchData();
    }, [activeOrg]);

    const fetchData = async () => {
        if (!activeOrg) return;
        setLoading(true);
        try {
            const [orgRes, membersRes, invitesRes, auditRes, deptsRes] = await Promise.all([
                organizationService.get(activeOrg.id),
                organizationService.listMembers(activeOrg.id),
                organizationService.listInvitations(activeOrg.id).catch(() => ({ data: [] })),
                organizationService.getAuditLog(activeOrg.id, { limit: 50 }).catch(() => ({ data: [] })),
                organizationService.listDepartments(activeOrg.id).catch(() => ({ data: [] })),
            ]);
            setOrg(orgRes.data);
            setMembers(membersRes.data || []);
            setInvitations(invitesRes.data || []);
            setAuditLog(auditRes.data || []);
            setDepartments(deptsRes.data || []);
            setForm({
                name: orgRes.data.name || '',
                description: orgRes.data.description || '',
                website: orgRes.data.website || '',
                billing_email: orgRes.data.billing_email || '',
            });
        } catch (e: any) {
            toast.error('Failed to load organization data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!activeOrg) return;
        setSaving(true);
        try {
            await organizationService.update(activeOrg.id, form);
            await refreshOrganizations();
            toast.success('Organization updated');
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async () => {
        if (!activeOrg || !inviteEmail.trim()) return;
        setInviting(true);
        try {
            await organizationService.createInvitation(activeOrg.id, inviteEmail, inviteRole as any);
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Invite failed');
        } finally {
            setInviting(false);
        }
    };

    const handleRevokeInvite = async (id: number) => {
        if (!activeOrg) return;
        try {
            await organizationService.revokeInvitation(activeOrg.id, id);
            toast.success('Invitation revoked');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Revoke failed');
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!activeOrg) return;
        if (!confirm('Remove this member?')) return;
        try {
            await organizationService.removeMember(activeOrg.id, userId);
            toast.success('Member removed');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Remove failed');
        }
    };

    const handleRoleChange = async (userId: number, role: string) => {
        if (!activeOrg) return;
        try {
            await organizationService.updateMemberRole(activeOrg.id, userId, role as any);
            toast.success('Role updated');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Role update failed');
        }
    };

    // ── Department handlers ────────────────────────────────────────────

    const openDeptCreate = () => {
        setEditingDept(null);
        setDeptForm({ name: '', description: '', head_id: '' });
        setShowDeptForm(true);
    };

    const openDeptEdit = (dept: any) => {
        setEditingDept(dept);
        setDeptForm({
            name: dept.name || '',
            description: dept.description || '',
            head_id: dept.head_id ? String(dept.head_id) : '',
        });
        setShowDeptForm(true);
    };

    const handleDeptSave = async () => {
        if (!activeOrg || !deptForm.name.trim()) return;
        setSavingDept(true);
        try {
            if (editingDept) {
                await organizationService.updateDepartment(activeOrg.id, editingDept.id, {
                    name: deptForm.name,
                    description: deptForm.description || undefined,
                    head_id: deptForm.head_id ? Number(deptForm.head_id) : undefined,
                });
                toast.success('Department updated');
            } else {
                await organizationService.createDepartment(
                    activeOrg.id,
                    deptForm.name,
                    deptForm.description || undefined,
                    deptForm.head_id ? Number(deptForm.head_id) : undefined,
                );
                toast.success('Department created');
            }
            setShowDeptForm(false);
            setEditingDept(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Save failed');
        } finally {
            setSavingDept(false);
        }
    };

    const handleDeptDelete = async (deptId: number) => {
        if (!activeOrg) return;
        if (!confirm('Delete this department? Members will be unassigned.')) return;
        try {
            await organizationService.deleteDepartment(activeOrg.id, deptId);
            toast.success('Department deleted');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Delete failed');
        }
    };

    const handleMemberDeptChange = async (userId: number, deptId: string) => {
        if (!activeOrg) return;
        try {
            const val = deptId === '' ? null : Number(deptId);
            await organizationService.assignMemberDepartment(activeOrg.id, userId, val);
            toast.success('Department assigned');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Assignment failed');
        }
    };

    // ── Helpers ─────────────────────────────────────────────────────────

    const getDeptName = (deptId: number | null) => {
        if (!deptId) return null;
        const dept = departments.find((d: any) => d.id === deptId);
        return dept?.name || null;
    };

    const getDeptMemberCount = (deptId: number) => {
        return members.filter((m: any) => m.department_id === deptId).length;
    };

    const getHeadName = (headId: number | null) => {
        if (!headId) return null;
        const m = members.find((mem: any) => mem.user_id === headId);
        return m?.name || m?.email || null;
    };

    if (!activeOrg) return null;

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'general', label: 'General', icon: Settings },
        { key: 'members', label: 'Members', icon: Users },
        { key: 'departments', label: 'Departments', icon: FolderTree },
        { key: 'invitations', label: 'Invitations', icon: Mail },
        { key: 'audit', label: 'Audit Log', icon: Shield },
    ];

    const canManage = activeOrg.role === 'owner' || activeOrg.role === 'admin';

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-900 flex items-center justify-center shadow-brand">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activeOrg.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Organization Settings</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    {/* General Tab */}
                    {tab === 'general' && (
                        <div className="space-y-6 max-w-xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Organization Name</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    disabled={!canManage}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-vertical transition-colors"
                                    disabled={!canManage}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Website</label>
                                <input type="url" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    disabled={!canManage}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Billing Email</label>
                                <input type="email" value={form.billing_email} onChange={e => setForm(p => ({ ...p, billing_email: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    disabled={!canManage}
                                />
                            </div>
                            {canManage && (
                                <button onClick={handleSave} disabled={saving}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Members Tab */}
                    {tab === 'members' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{members.length} Members</h3>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                                {members.map((m: any) => {
                                    const deptName = getDeptName(m.department_id);
                                    return (
                                        <div key={m.user_id} className="flex items-center justify-between px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-900 flex items-center justify-center text-white font-semibold text-sm">
                                                    {(m.name || m.email)?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{m.name || m.email}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">{m.email}</p>
                                                        {deptName && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                                                                {deptName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Department assignment dropdown */}
                                                {canManage && departments.length > 0 && (
                                                    <select
                                                        value={m.department_id || ''}
                                                        onChange={e => handleMemberDeptChange(m.user_id, e.target.value)}
                                                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                                                        title="Assign department"
                                                    >
                                                        <option value="">No department</option>
                                                        {departments.map((d: any) => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {/* Role dropdown */}
                                                {canManage && m.role !== 'owner' ? (
                                                    <select value={m.role} onChange={e => handleRoleChange(m.user_id, e.target.value)}
                                                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="member">Member</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 capitalize font-medium">{m.role}</span>
                                                )}
                                                {canManage && m.role !== 'owner' && (
                                                    <button onClick={() => handleRemoveMember(m.user_id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Departments Tab */}
                    {tab === 'departments' && (
                        <div className="space-y-6">
                            {/* Header + Create button */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {departments.length} Department{departments.length !== 1 ? 's' : ''}
                                </h3>
                                {canManage && !showDeptForm && (
                                    <button
                                        onClick={openDeptCreate}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Department
                                    </button>
                                )}
                            </div>

                            {/* Create / Edit Form */}
                            {showDeptForm && (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <FolderTree className="w-4 h-4" />
                                            {editingDept ? 'Edit Department' : 'Create Department'}
                                        </h4>
                                        <button onClick={() => { setShowDeptForm(false); setEditingDept(null); }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Department Name *</label>
                                        <input
                                            value={deptForm.name}
                                            onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g. Engineering, Marketing"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Description</label>
                                        <input
                                            value={deptForm.description}
                                            onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Brief department description"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Department Head</label>
                                        <select
                                            value={deptForm.head_id}
                                            onChange={e => setDeptForm(p => ({ ...p, head_id: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">No head assigned</option>
                                            {members.map((m: any) => (
                                                <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            onClick={handleDeptSave}
                                            disabled={savingDept || !deptForm.name.trim()}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                                        >
                                            {savingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            {editingDept ? 'Update' : 'Create'}
                                        </button>
                                        <button
                                            onClick={() => { setShowDeptForm(false); setEditingDept(null); }}
                                            className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-sm transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Department list */}
                            {departments.length > 0 ? (
                                <div className="grid gap-4">
                                    {departments.map((dept: any) => {
                                        const memberCount = getDeptMemberCount(dept.id);
                                        const headName = getHeadName(dept.head_id);
                                        return (
                                            <div key={dept.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-900 flex items-center justify-center flex-shrink-0">
                                                            <FolderTree className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h4>
                                                            {dept.description && (
                                                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{dept.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                                    <Users className="w-3.5 h-3.5" />
                                                                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                                                                </span>
                                                                {headName && (
                                                                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                                                                        {headName}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-400 dark:text-slate-500">
                                                                    Created {new Date(dept.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canManage && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => openDeptEdit(dept)}
                                                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                                                                title="Edit department"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeptDelete(dept.id)}
                                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                                title="Delete department"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : !showDeptForm ? (
                                <div className="text-center py-12">
                                    <FolderTree className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">No departments yet</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Create departments to organize your team members</p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Invitations Tab */}
                    {tab === 'invitations' && (
                        <div className="space-y-6">
                            {canManage && (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite Member</h3>
                                    <div className="flex gap-3">
                                        <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                                        >
                                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            Invite
                                        </button>
                                    </div>
                                </div>
                            )}

                            {invitations.length > 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                                    {invitations.map((inv: any) => (
                                        <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">{inv.email}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Role: <span className="capitalize">{inv.role}</span> · Expires {new Date(inv.expires_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {canManage && (
                                                <button onClick={() => handleRevokeInvite(inv.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-gray-400 hover:text-red-500 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No pending invitations.</p>
                            )}
                        </div>
                    )}

                    {/* Audit Log Tab */}
                    {tab === 'audit' && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                            {auditLog.length > 0 ? auditLog.map((entry: any) => (
                                <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            <span className="font-medium">{entry.actor_name || entry.actor_email || 'System'}</span> {entry.action}
                                            {entry.entity_type && <span className="text-gray-500 dark:text-slate-400"> · {entry.entity_type}</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No audit log entries yet.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OrganizationSettings;
