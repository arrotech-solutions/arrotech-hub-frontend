import React, { useEffect, useState } from 'react';
import { Video, BarChart2, Calendar, Share2, User, Loader, Sparkles, Wallet, Link2, DollarSign, Copy, ExternalLink, FileText, Heart, Users, TrendingUp, Download } from 'lucide-react';
import apiService from '../services/api';
import TikTokScheduler from '../components/TikTokScheduler';
import { useNavigate } from 'react-router-dom';
import toast from '../lib/notify';
import * as BrandIcons from '../components/BrandIcons';

type TabType = 'overview' | 'money' | 'mediakit' | 'tips' | 'analytics' | 'fans';

const TikTokDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Money tab state
    const [wallet, setWallet] = useState<any>(null);
    const [premiumLinks, setPremiumLinks] = useState<any[]>([]);
    const [mediaKit, setMediaKit] = useState<any>(null);
    const [walletLoading, setWalletLoading] = useState(false);

    // Create link modal
    const [showCreateLink, setShowCreateLink] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', unlock_url: '', price: 50 });

    // Withdrawal modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawNumber, setWithdrawNumber] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');

    // Phase 1 state
    const [tips, setTips] = useState<any[]>([]);
    const [tipsStats, setTipsStats] = useState({ total_tips: 0, total_amount: 0 });
    const [fans, setFans] = useState<any[]>([]);
    const [fansStats, setFansStats] = useState({ total_fans: 0, total_lifetime_value: 0 });
    const [selectedLinkAnalytics, setSelectedLinkAnalytics] = useState<any>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'money' && profile?.connected) {
            fetchWalletData();
        }
        if (activeTab === 'mediakit' && profile?.connected) {
            fetchMediaKit();
        }
        if (activeTab === 'tips' && profile?.connected) {
            fetchTips();
        }
        if (activeTab === 'fans' && profile?.connected) {
            fetchFans();
        }
    }, [activeTab, profile?.connected]);

    const fetchProfile = async () => {
        try {
            const response = await apiService.getTikTokProfile() as any;
            if (response) {
                setProfile(response);
                if (response.connected) {
                    try {
                        const posts = await apiService.getScheduledPosts();
                        if (Array.isArray(posts)) {
                            setScheduledPosts(posts);
                        }
                    } catch (e) {
                        console.error("Failed to load scheduled posts", e);
                    }
                }
            } else {
                setProfile({ connected: false });
            }
        } catch (error) {
            console.error('Failed to fetch TikTok profile:', error);
            toast.error('Could not load TikTok profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletData = async () => {
        setWalletLoading(true);
        try {
            const [walletRes, linksRes] = await Promise.all([
                apiService.getTikTokWallet(),
                apiService.getMyPremiumLinks()
            ]);
            setWallet(walletRes);
            setPremiumLinks(Array.isArray(linksRes) ? linksRes : []);
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setWalletLoading(false);
        }
    };

    const fetchMediaKit = async () => {
        try {
            const res = await apiService.getTikTokMediaKit();
            setMediaKit(res);
        } catch (error) {
            console.error('Failed to fetch media kit:', error);
        }
    };

    const fetchTips = async () => {
        try {
            const res = await apiService.getMyTips() as any;
            setTips(res.tips || []);
            setTipsStats({ total_tips: res.total_tips || 0, total_amount: res.total_amount || 0 });
        } catch (error) {
            console.error('Failed to fetch tips:', error);
        }
    };

    const fetchFans = async () => {
        try {
            const res = await apiService.getMyFans() as any;
            setFans(res.fans || []);
            setFansStats({ total_fans: res.total_fans || 0, total_lifetime_value: res.total_lifetime_value || 0 });
        } catch (error) {
            console.error('Failed to fetch fans:', error);
        }
    };

    const fetchLinkAnalytics = async (linkId: number) => {
        try {
            const res = await apiService.getLinkAnalytics(linkId) as any;
            setSelectedLinkAnalytics(res);
        } catch (error) {
            console.error('Failed to fetch link analytics:', error);
            toast.error('Failed to load analytics');
        }
    };

    const handleExportFans = async () => {
        try {
            const blob = await apiService.exportFansCSV();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fans_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Fans exported successfully!');
        } catch (error) {
            console.error('Failed to export fans:', error);
            toast.error('Failed to export fans');
        }
    };

    const handleConnect = () => {
        navigate('/connections');
    };


    const handleCreateLink = async () => {
        if (!newLink.title || !newLink.unlock_url) {
            toast.error('Title and Unlock URL are required');
            return;
        }
        try {
            await apiService.createPremiumLink({
                title: newLink.title,
                url: newLink.unlock_url,
                price: newLink.price
            });
            toast.success('Premium link created!');
            setShowCreateLink(false);
            setNewLink({ title: '', unlock_url: '', price: 50 });
            fetchWalletData();
        } catch (error) {
            toast.error('Failed to create link');
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawNumber) {
            toast.error('Please enter your M-Pesa number');
            return;
        }
        if (!withdrawAmount || withdrawAmount <= 0) {
            toast.error('Please enter an amount to withdraw');
            return;
        }
        if (withdrawAmount > (wallet?.wallet_balance || 0)) {
            toast.error('Amount exceeds your available balance');
            return;
        }
        if (withdrawAmount < 10) {
            toast.error('Minimum withdrawal is KES 10');
            return;
        }

        toast.loading('Processing withdrawal...', { id: 'withdraw' });
        try {
            const result = await apiService.withdrawToMpesa(withdrawNumber, withdrawAmount);
            toast.success(result.message || 'Withdrawal successful!', { id: 'withdraw' });
            setShowWithdrawModal(false);
            setWithdrawNumber('');
            setWithdrawAmount('');
            fetchWalletData();
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Withdrawal failed', { id: 'withdraw' });
        }
    };


    const copyLinkUrl = (linkId: number) => {
        const url = `${window.location.origin}/unlock/${linkId}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader className="animate-spin text-gray-400" /></div>;
    }

    const isConnected = profile?.connected;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-500">
            {/* Header Section */}
            <div className="relative bg-white dark:bg-slate-900 pb-32 overflow-hidden transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#25F4EE] to-cyan-400 rounded-full blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-[#FE2C55] to-pink-500 rounded-full blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 tiktok-header-tut">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                                    <BrandIcons.TikTokLogo className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">TikTok Hub</h1>
                                <p className="text-slate-300 text-sm md:text-base">Monetize your viral content</p>
                            </div>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={handleConnect}
                                className="group relative px-6 py-3 bg-gradient-to-r from-[#FE2C55] to-pink-600 text-white font-semibold rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-pink-500/50 transition-all active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    <Share2 className="w-5 h-5" />
                                    Connect Account
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-4 bg-white/10 dark:bg-slate-800/20 backdrop-blur-xl px-5 py-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-xl transition-colors">
                                <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full border-2 border-[#25F4EE] shadow-lg"
                                />
                                <div>
                                    <p className="text-white font-semibold">{profile.display_name}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                                        <span className="text-xs text-emerald-300 font-medium">Live</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    {isConnected && (
                        <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide tiktok-tabs-tut">
                            {[
                                { id: 'overview' as TabType, label: 'Overview', icon: BarChart2 },
                                { id: 'money' as TabType, label: 'Money', icon: Wallet },
                                { id: 'tips' as TabType, label: 'Tips', icon: Heart },
                                { id: 'fans' as TabType, label: 'Fans', icon: Users },
                                { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
                                { id: 'mediakit' as TabType, label: 'Media Kit', icon: FileText },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap flex-shrink-0
                                        ${activeTab === tab.id
                                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-lg'
                                            : 'bg-white/10 dark:bg-slate-800/40 backdrop-blur-sm text-white hover:bg-white/20 dark:hover:bg-slate-700/60 border border-white/10 dark:border-slate-700/50'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 tiktok-stats-tut">
                            {[
                                { label: 'Followers', value: isConnected ? profile.follower_count || 0 : '-', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Video Views', value: isConnected ? profile.total_views || 0 : '-', icon: Video, color: 'text-[#FE2C55]', bg: 'bg-pink-50' },
                                { label: 'Engagement Rate', value: isConnected ? profile.engagement_rate || '0%' : '-', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Scheduled', value: isConnected ? profile.scheduled_posts || 0 : '-', icon: Calendar, color: 'text-[#25F4EE]', bg: 'bg-cyan-50' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100/50 dark:border-slate-800 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 ${stat.bg} dark:bg-slate-800 rounded-xl transition-colors`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color} dark:text-opacity-80`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">{stat.label}</h3>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Area Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            <div className="lg:col-span-2 tiktok-scheduler-tut">
                                <TikTokScheduler />
                            </div>
                            <div className="space-y-6">
                                {/* Tip Jar Link - NEW */}
                                <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-red-500 rounded-2xl p-6 text-white shadow-xl shadow-pink-500/30 relative overflow-hidden group tiktok-monetization-tut">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
                                    <Heart className="w-8 h-8 mb-4 text-white/90 fill-white/50" />
                                    <h3 className="text-xl font-bold mb-2">Receive Tips 💖</h3>
                                    <p className="text-pink-100 mb-4 text-sm">Share this link so fans can send you tips directly!</p>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
                                        <p className="text-xs text-pink-100 mb-1">Your Tip Link:</p>
                                        <p className="font-mono text-sm truncate text-white">
                                            {window.location.origin}/tip/{profile.username}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/tip/${profile.username}`);
                                                toast.success('Tip link copied!');
                                            }}
                                            className="flex-1 py-2 bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy Link
                                        </button>
                                        <button
                                            onClick={() => window.open(`/tip/${profile.username}`, '_blank')}
                                            className="flex-1 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Preview
                                        </button>
                                    </div>
                                </div>

                                {/* Viral Card Generator */}
                                <div className="bg-gradient-to-br from-[#FE2C55] to-[#FF0050] rounded-2xl p-6 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden group tiktok-viral-tut">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
                                    <Sparkles className="w-8 h-8 mb-4 text-white/90" />
                                    <h3 className="text-xl font-bold mb-2">Share Your Growth</h3>
                                    <p className="text-pink-100 mb-6 text-sm">Generate a beautiful summary card of your TikTok performance to share on socials.</p>
                                    <button
                                        onClick={async () => {
                                            const toastId = toast.loading('Generating card...');
                                            try {
                                                const res: any = await apiService.getViralCard();
                                                if (res.success && res.image_base64) {
                                                    const byteCharacters = atob(res.image_base64);
                                                    const byteNumbers = new Array(byteCharacters.length);
                                                    for (let i = 0; i < byteCharacters.length; i++) {
                                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                    }
                                                    const byteArray = new Uint8Array(byteNumbers);
                                                    const blob = new Blob([byteArray], { type: 'image/png' });
                                                    const url = URL.createObjectURL(blob);
                                                    const win = window.open();
                                                    if (win) {
                                                        win.document.write(`<img src="${url}" style="width:100%; height:auto;" />`);
                                                        toast.success('Generated!', { id: toastId });
                                                    }
                                                }
                                            } catch (e) {
                                                toast.error('Failed', { id: toastId });
                                            }
                                        }}
                                        className="w-full py-3 bg-white dark:bg-slate-800 text-[#FE2C55] dark:text-pink-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        Generate Viral Card
                                    </button>
                                </div>

                                {/* Upcoming Schedule */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Upcoming Schedule</h3>
                                    {isConnected && scheduledPosts.length > 0 ? (
                                        <div className="space-y-4">
                                            {scheduledPosts.map((post: any) => (
                                                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 transition-colors">
                                                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                                                        <Video className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={post.caption}>
                                                            {post.caption || "Untitled Video"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {new Date(post.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded">Pending</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No posts scheduled yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* MONEY TAB */}
                {activeTab === 'money' && (
                    <div className="space-y-6">
                        {walletLoading ? (
                            <div className="flex justify-center py-12"><Loader className="animate-spin" /></div>
                        ) : (
                            <>
                                {/* Wallet Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Available Balance</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">KES {wallet?.wallet_balance?.toLocaleString() || 0}</p>
                                        <button
                                            onClick={() => setShowWithdrawModal(true)}
                                            disabled={!wallet?.wallet_balance || wallet.wallet_balance <= 0}
                                            className="mt-4 w-full py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                                        >
                                            Withdraw to M-Pesa
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Total Earned</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">KES {wallet?.total_earned?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                                <Link2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Premium Links</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{premiumLinks.length}</p>
                                    </div>
                                </div>

                                {/* Premium Links Section */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your Premium Links</h3>
                                        <button
                                            onClick={() => setShowCreateLink(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#FE2C55] text-white rounded-lg font-medium hover:bg-[#E0264A] transition-colors"
                                        >
                                            <Link2 className="w-4 h-4" />
                                            Create Link
                                        </button>
                                    </div>
                                    {premiumLinks.length > 0 ? (
                                        <div className="space-y-3">
                                            {premiumLinks.map((link: any) => (
                                                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{link.title}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">KES {link.price} • {link.total_sales || 0} sales</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">KES {link.total_revenue || 0}</span>
                                                        <button
                                                            onClick={() => copyLinkUrl(link.id)}
                                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Copy Link"
                                                        >
                                                            <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.open(`/unlock/${link.id}`, '_blank')}
                                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Preview"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Link2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 mb-4">No premium links yet. Create one to start earning!</p>
                                            <button
                                                onClick={() => setShowCreateLink(true)}
                                                className="px-6 py-2 bg-[#FE2C55] text-white rounded-lg font-medium hover:bg-[#E0264A]"
                                            >
                                                Create Your First Link
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Transactions */}
                                {wallet?.recent_transactions && wallet.recent_transactions.length > 0 && (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Earnings</h3>
                                        <div className="space-y-3">
                                            {wallet.recent_transactions.map((txn: any) => (
                                                <div key={txn.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">+KES {txn.amount}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{txn.fan_email || 'Anonymous'}</p>
                                                    </div>
                                                    <span className="text-sm text-slate-400 dark:text-slate-500">{new Date(txn.created_at).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* MEDIA KIT TAB */}
                {activeTab === 'mediakit' && mediaKit && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="text-center mb-8">
                            <img src={mediaKit.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#25F4EE]" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{mediaKit.display_name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">@{mediaKit.username}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaKit.follower_count?.toLocaleString()}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Followers</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaKit.likes_count?.toLocaleString()}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Likes</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaKit.video_count}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Videos</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaKit.engagement_rate}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Engagement</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-6 rounded-xl border border-green-100 dark:border-green-800/30 mb-8 transition-colors">
                            <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">💰 Suggested Rate (Kenyan Market)</h3>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-500">
                                KES {mediaKit.suggested_rate_range?.min?.toLocaleString()} - {mediaKit.suggested_rate_range?.max?.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400/80 mt-1">per sponsored post</p>
                        </div>

                        <div className="flex gap-4">
                            <a
                                href={mediaKit.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 bg-black text-white text-center rounded-xl font-medium hover:bg-gray-800 transition-colors"
                            >
                                View TikTok Profile
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin + mediaKit.media_kit_url);
                                    toast.success('Media Kit link copied!');
                                }}
                                className="flex-1 py-3 bg-[#FE2C55] text-white text-center rounded-xl font-medium hover:bg-[#E0264A] transition-colors"
                            >
                                Copy Media Kit Link
                            </button>
                        </div>
                    </div>
                )}

                {/* TIPS TAB */}
                {activeTab === 'tips' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Tips Received</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">See who's supporting your content</p>
                            </div>
                            <div className="flex gap-2 sm:gap-4">
                                <div className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">{tipsStats.total_tips}</p>
                                    <p className="text-xs text-pink-500 dark:text-pink-400/80 uppercase tracking-tight">Total Tips</p>
                                </div>
                                <div className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">KES {tipsStats.total_amount.toLocaleString()}</p>
                                    <p className="text-xs text-green-500 dark:text-green-400/80 uppercase tracking-tight">Earned</p>
                                </div>
                            </div>
                        </div>

                        {tips.length === 0 ? (
                            <div className="text-center py-12">
                                <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No tips received yet</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Share your tip link to start receiving support</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tips.map((tip) => (
                                    <div key={tip.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent dark:border-slate-800/50 transition-colors">
                                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {tip.fan_name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{tip.fan_name || 'Anonymous'}</p>
                                                <p className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base">+KES {tip.creator_amount.toLocaleString()}</p>
                                            </div>
                                            {tip.fan_message && (
                                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 break-words bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg italic">"{tip.fan_message}"</p>
                                            )}
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                {new Date(tip.created_at).toLocaleDateString('en-KE', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">Link Analytics</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">Track performance of your premium links</p>

                            {premiumLinks.length === 0 ? (
                                <div className="text-center py-12">
                                    <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400">No premium links yet</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Create a premium link to see analytics</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {premiumLinks.map((link: any) => (
                                        <button
                                            key={link.id}
                                            onClick={() => fetchLinkAnalytics(link.id)}
                                            className={`text-left p-3 sm:p-4 border rounded-xl transition-all active:scale-98 ${selectedLinkAnalytics?.link_id === link.id
                                                ? 'border-[#FE2C55] bg-pink-50 dark:bg-pink-900/10'
                                                : 'border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                        >
                                            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">{link.title}</p>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">KES {link.price} • {link.total_sales || 0} sales</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedLinkAnalytics && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 truncate">
                                    📊 {selectedLinkAnalytics.title}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
                                    <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
                                        <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedLinkAnalytics.metrics?.total_views || 0}</p>
                                        <p className="text-xs text-blue-500 dark:text-blue-400/80 uppercase tracking-tight">Views</p>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl transition-colors">
                                        <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedLinkAnalytics.metrics?.total_clicks || 0}</p>
                                        <p className="text-xs text-purple-500 dark:text-purple-400/80 uppercase tracking-tight">Clicks</p>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl transition-colors">
                                        <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{selectedLinkAnalytics.metrics?.total_purchases || 0}</p>
                                        <p className="text-xs text-green-500 dark:text-green-400/80 uppercase tracking-tight">Sales</p>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl transition-colors">
                                        <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedLinkAnalytics.metrics?.conversion_rate || 0}%</p>
                                        <p className="text-xs text-amber-500 dark:text-amber-400/80 uppercase tracking-tight">Reach</p>
                                    </div>
                                </div>

                                {selectedLinkAnalytics.sources && Object.keys(selectedLinkAnalytics.sources).length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 text-sm sm:text-base">Traffic Sources</h4>
                                        <div className="space-y-2">
                                            {Object.entries(selectedLinkAnalytics.sources).map(([source, count]) => (
                                                <div key={source} className="flex items-center justify-between text-sm sm:text-base">
                                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{source || 'Direct'}</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{count as number} views</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FANS TAB */}
                {activeTab === 'fans' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Fan Contacts</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">People who purchased your content</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{fansStats.total_fans}</p>
                                    <p className="text-xs text-purple-500 dark:text-purple-400/80 uppercase tracking-tight">Fans</p>
                                </div>
                                <div className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">KES {fansStats.total_lifetime_value.toLocaleString()}</p>
                                    <p className="text-xs text-green-500 dark:text-green-400/80 uppercase tracking-tight">Lifetime</p>
                                </div>
                                {fans.length > 0 && (
                                    <button
                                        onClick={handleExportFans}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-98 text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Export CSV</span>
                                        <span className="sm:hidden">Export</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {fans.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No fan contacts yet</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Emails are collected when fans purchase your content</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Source</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Spent</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Purchases</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fans.map((fan) => (
                                            <tr key={fan.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{fan.email}</td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{fan.name || '-'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${fan.source_type === 'tip'
                                                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        }`}>
                                                        {fan.source_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-green-600 dark:text-green-400">
                                                    KES {fan.total_spent.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{fan.purchase_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Link Modal */}
            {showCreateLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateLink(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Premium Link</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Charge fans to unlock exclusive content</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Link Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Exclusive Behind the Scenes"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent outline-none transition-all dark:text-white"
                                    value={newLink.title}
                                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Price (KES)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">KES</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent outline-none transition-all dark:text-white"
                                        value={newLink.price}
                                        onChange={(e) => setNewLink({ ...newLink, price: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Unlock URL (The protected content)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent outline-none transition-all dark:text-white"
                                    value={newLink.unlock_url}
                                    onChange={(e) => setNewLink({ ...newLink, unlock_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowCreateLink(false)}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateLink}
                                className="flex-[2] py-3 px-4 bg-[#FE2C55] text-white rounded-xl font-semibold hover:bg-[#E0264A] shadow-lg shadow-pink-500/30 transition-all active:scale-95"
                            >
                                Create Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Withdraw Funds</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Withdraw your earnings to M-Pesa</p>

                        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl mb-6 border dark:border-slate-800 transition-colors">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Available Balance</p>
                            <p className="text-3xl font-black text-green-600 dark:text-green-400">KES {wallet?.wallet_balance?.toLocaleString()}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number (M-Pesa)</label>
                                <input
                                    type="text"
                                    placeholder="2547..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    value={withdrawNumber || wallet?.mpesa_withdrawal_number || ''}
                                    onChange={(e) => setWithdrawNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (KES)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    value={withdrawAmount}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : '';
                                        setWithdrawAmount(val);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawAmount('');
                                }}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={!withdrawAmount || (typeof withdrawAmount === 'number' && withdrawAmount > (wallet?.wallet_balance || 0)) || (typeof withdrawAmount === 'number' && withdrawAmount < 10)}
                                className="flex-[2] py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Withdraw Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TikTokDashboard;
