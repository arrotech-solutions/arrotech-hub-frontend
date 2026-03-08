import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import toast from 'react-hot-toast';
import {
    Building2, Check, Clock, AlertTriangle, Loader2, ArrowRight, LogIn,
} from 'lucide-react';

interface InviteInfo {
    email: string;
    role: string;
    status: string;
    org_name: string;
    org_logo: string | null;
    inviter_name: string;
    expires_at: string | null;
}

const AcceptInvite = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { user, refreshOrganizations, switchOrg } = useAuth();

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [info, setInfo] = useState<InviteInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetchInfo();
    }, [token]);

    const fetchInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await organizationService.getInvitationInfo(token!);
            setInfo(res.data);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Invitation not found or already expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        try {
            const res = await organizationService.acceptInvitation(token);
            setAccepted(true);
            toast.success(`You've joined ${info?.org_name}!`);

            // Refresh org list and switch to the new org
            await refreshOrganizations();
            if (res.data?.org_id) {
                await switchOrg(res.data.org_id);
            }

            // Redirect after short delay
            setTimeout(() => navigate('/unified'), 1500);
        } catch (e: any) {
            const msg = e.response?.data?.detail || 'Failed to accept invitation.';
            toast.error(msg);
            setError(msg);
        } finally {
            setAccepting(false);
        }
    };

    const isExpired = info?.expires_at && new Date(info.expires_at) < new Date();
    const isAlreadyUsed = info?.status !== 'pending';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                            {info?.org_logo ? (
                                <img src={info.org_logo} alt="" className="w-10 h-10 rounded-lg" />
                            ) : (
                                <Building2 className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-white">Organization Invitation</h1>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        {loading ? (
                            <div className="flex flex-col items-center py-8 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                <p className="text-sm text-gray-500 dark:text-slate-400">Loading invitation…</p>
                            </div>
                        ) : error && !info ? (
                            <div className="text-center py-6">
                                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invalid Invitation</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{error}</p>
                                <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                                    Go to Login <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : accepted ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">You're In!</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Welcome to <strong>{info?.org_name}</strong>. Redirecting to dashboard…
                                </p>
                            </div>
                        ) : info && (isExpired || isAlreadyUsed) ? (
                            <div className="text-center py-6">
                                <Clock className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {isExpired ? 'Invitation Expired' : `Invitation ${info.status}`}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                    {isExpired
                                        ? 'This invitation has expired. Ask the organization admin to send a new one.'
                                        : `This invitation has already been ${info.status}.`}
                                </p>
                                <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : info ? (
                            <div className="space-y-5">
                                <div className="text-center">
                                    <p className="text-gray-600 dark:text-slate-300">
                                        <strong>{info.inviter_name}</strong> has invited you to join
                                    </p>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {info.org_name}
                                    </h2>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-slate-400">Your Role</span>
                                        <span className="font-medium text-gray-900 dark:text-white capitalize">{info.role}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-slate-400">Invited Email</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{info.email}</span>
                                    </div>
                                    {info.expires_at && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-slate-400">Expires</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {new Date(info.expires_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!user ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-center text-gray-500 dark:text-slate-400">
                                            You need to sign in to accept this invitation.
                                        </p>
                                        <Link
                                            to={`/login?redirect=/invite/${token}`}
                                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                        >
                                            <LogIn className="w-4 h-4" /> Sign In to Accept
                                        </Link>
                                        <p className="text-xs text-center text-gray-400 dark:text-slate-500">
                                            Don't have an account? <Link to={`/register?redirect=/invite/${token}`} className="text-emerald-600 dark:text-emerald-400 font-medium">Sign up</Link>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {user.email !== info.email && (
                                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                                    ⚠️ You're signed in as <strong>{user.email}</strong> but this invitation is for <strong>{info.email}</strong>. You need to be signed in with the invited email to accept.
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleAccept}
                                            disabled={accepting || user.email !== info.email}
                                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {accepting ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</>
                                            ) : (
                                                <><Check className="w-4 h-4" /> Accept Invitation</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvite;
