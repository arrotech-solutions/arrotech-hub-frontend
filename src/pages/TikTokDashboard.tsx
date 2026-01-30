import React, { useEffect, useState } from 'react';
import { Video, BarChart2, Calendar, Share2, User, Loader, Sparkles, Wallet, Link2, DollarSign, Copy, ExternalLink, FileText } from 'lucide-react';
import apiService from '../services/api';
import TikTokScheduler from '../components/TikTokScheduler';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as BrandIcons from '../components/BrandIcons';

type TabType = 'overview' | 'money' | 'mediakit';

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
    const [newLink, setNewLink] = useState({ title: '', url: '', price: 50, description: '' });

    // Withdrawal modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawNumber, setWithdrawNumber] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');

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

    const handleConnect = () => {
        navigate('/connections');
    };

    const handleCreateLink = async () => {
        if (!newLink.title || !newLink.url) {
            toast.error('Title and URL are required');
            return;
        }
        try {
            await apiService.createPremiumLink(newLink);
            toast.success('Premium link created!');
            setShowCreateLink(false);
            setNewLink({ title: '', url: '', price: 50, description: '' });
            fetchWalletData();
        } catch (error) {
            toast.error('Failed to create link');
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
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Section */}
            <div className="relative bg-white pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-95"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#25F4EE] rounded-full blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FE2C55] rounded-full blur-3xl opacity-10 -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                <BrandIcons.TikTokLogo className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">TikTok Overview</h1>
                                <p className="text-slate-400 text-sm md:text-base">Manage your viral content and monetization</p>
                            </div>
                        </div>

                        {!isConnected ? (
                            <button
                                onClick={handleConnect}
                                className="group relative px-6 py-3 bg-[#FE2C55] text-white font-semibold rounded-xl hover:bg-[#E0264A] transition-all shadow-lg shadow-pink-500/20 active:scale-95"
                            >
                                <span className="flex items-center gap-2">
                                    <Share2 className="w-5 h-5" />
                                    Connect Account
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                                <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full border-2 border-[#25F4EE]"
                                />
                                <div>
                                    <p className="text-white font-medium">{profile.display_name}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs text-green-400 font-medium">Synced</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    {isConnected && (
                        <div className="flex gap-2 mt-8">
                            {[
                                { id: 'overview' as TabType, label: 'Overview', icon: BarChart2 },
                                { id: 'money' as TabType, label: 'Money', icon: Wallet },
                                { id: 'mediakit' as TabType, label: 'Media Kit', icon: FileText },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-gray-900'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[
                                { label: 'Followers', value: isConnected ? profile.follower_count || 0 : '-', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Video Views', value: isConnected ? profile.total_views || 0 : '-', icon: Video, color: 'text-[#FE2C55]', bg: 'bg-pink-50' },
                                { label: 'Engagement Rate', value: isConnected ? profile.engagement_rate || '0%' : '-', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Scheduled', value: isConnected ? profile.scheduled_posts || 0 : '-', icon: Calendar, color: 'text-[#25F4EE]', bg: 'bg-cyan-50' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 ${stat.bg} rounded-xl`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">{stat.label}</h3>
                                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Area Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            <div className="lg:col-span-2">
                                <TikTokScheduler />
                            </div>
                            <div className="space-y-6">
                                {/* Viral Card Generator */}
                                <div className="bg-gradient-to-br from-[#FE2C55] to-[#FF0050] rounded-2xl p-6 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden group">
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
                                        className="w-full py-3 bg-white text-[#FE2C55] font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Generate Viral Card
                                    </button>
                                </div>

                                {/* Upcoming Schedule */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                    <h3 className="font-semibold text-slate-800 mb-4">Upcoming Schedule</h3>
                                    {isConnected && scheduledPosts.length > 0 ? (
                                        <div className="space-y-4">
                                            {scheduledPosts.map((post: any) => (
                                                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                                                        <Video className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 truncate" title={post.caption}>
                                                            {post.caption || "Untitled Video"}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(post.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Calendar className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-500">No posts scheduled yet</p>
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
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-green-50 rounded-xl">
                                                <Wallet className="w-6 h-6 text-green-600" />
                                            </div>
                                            <h3 className="text-slate-500 text-sm font-medium">Available Balance</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">KES {wallet?.wallet_balance?.toLocaleString() || 0}</p>
                                        <button
                                            onClick={() => setShowWithdrawModal(true)}
                                            disabled={!wallet?.wallet_balance || wallet.wallet_balance <= 0}
                                            className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Withdraw to M-Pesa
                                        </button>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-blue-50 rounded-xl">
                                                <DollarSign className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h3 className="text-slate-500 text-sm font-medium">Total Earned</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">KES {wallet?.total_earned?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-purple-50 rounded-xl">
                                                <Link2 className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <h3 className="text-slate-500 text-sm font-medium">Premium Links</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">{premiumLinks.length}</p>
                                    </div>
                                </div>

                                {/* Premium Links Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800">Your Premium Links</h3>
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
                                                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{link.title}</p>
                                                        <p className="text-sm text-slate-500">KES {link.price} • {link.total_sales || 0} sales</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-green-600">KES {link.total_revenue || 0}</span>
                                                        <button
                                                            onClick={() => copyLinkUrl(link.id)}
                                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                                            title="Copy Link"
                                                        >
                                                            <Copy className="w-4 h-4 text-slate-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.open(`/unlock/${link.id}`, '_blank')}
                                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                                            title="Preview"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-slate-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Link2 className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 mb-4">No premium links yet. Create one to start earning!</p>
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
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Earnings</h3>
                                        <div className="space-y-3">
                                            {wallet.recent_transactions.map((txn: any) => (
                                                <div key={txn.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                                    <div>
                                                        <p className="font-medium text-slate-900">+KES {txn.amount}</p>
                                                        <p className="text-sm text-slate-500">{txn.fan_email || 'Anonymous'}</p>
                                                    </div>
                                                    <span className="text-sm text-slate-400">{new Date(txn.created_at).toLocaleDateString()}</span>
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
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="text-center mb-8">
                            <img src={mediaKit.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#25F4EE]" />
                            <h2 className="text-2xl font-bold text-slate-900">{mediaKit.display_name}</h2>
                            <p className="text-slate-500">@{mediaKit.username}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-slate-900">{mediaKit.follower_count?.toLocaleString()}</p>
                                <p className="text-sm text-slate-500">Followers</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-slate-900">{mediaKit.likes_count?.toLocaleString()}</p>
                                <p className="text-sm text-slate-500">Total Likes</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-slate-900">{mediaKit.video_count}</p>
                                <p className="text-sm text-slate-500">Videos</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <p className="text-2xl font-bold text-slate-900">{mediaKit.engagement_rate}</p>
                                <p className="text-sm text-slate-500">Engagement</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 mb-8">
                            <h3 className="font-semibold text-green-800 mb-2">💰 Suggested Rate (Kenyan Market)</h3>
                            <p className="text-3xl font-bold text-green-700">
                                KES {mediaKit.suggested_rate_range?.min?.toLocaleString()} - {mediaKit.suggested_rate_range?.max?.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600 mt-1">per sponsored post</p>
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
            </div>

            {/* Create Link Modal */}
            {showCreateLink && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Create Premium Link</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newLink.title}
                                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                    placeholder="e.g., My Secret Skincare Routine"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Content URL</label>
                                <input
                                    type="url"
                                    value={newLink.url}
                                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price (KES)</label>
                                <input
                                    type="number"
                                    value={newLink.price}
                                    onChange={(e) => setNewLink({ ...newLink, price: parseInt(e.target.value) || 0 })}
                                    min="10"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                                <textarea
                                    value={newLink.description}
                                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                                    placeholder="What will they get?"
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateLink(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateLink}
                                className="flex-1 py-2 bg-[#FE2C55] text-white rounded-lg font-medium hover:bg-[#E0264A]"
                            >
                                Create Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Withdraw to M-Pesa</h3>
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <p className="text-sm text-green-700">Available Balance</p>
                                <p className="text-2xl font-bold text-green-800">KES {wallet?.wallet_balance?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Withdraw (KES)</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : '';
                                        setWithdrawAmount(val);
                                    }}
                                    placeholder="Enter amount"
                                    min="10"
                                    max={wallet?.wallet_balance || 0}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {withdrawAmount && withdrawAmount > (wallet?.wallet_balance || 0) && (
                                    <p className="text-xs text-red-500 mt-1">Amount exceeds your available balance</p>
                                )}
                                {withdrawAmount && withdrawAmount < 10 && (
                                    <p className="text-xs text-red-500 mt-1">Minimum withdrawal is KES 10</p>
                                )}
                                <button
                                    onClick={() => setWithdrawAmount(wallet?.wallet_balance || 0)}
                                    className="text-xs text-green-600 mt-1 underline hover:text-green-700"
                                >
                                    Withdraw full balance
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">M-Pesa Number</label>
                                <input
                                    type="tel"
                                    value={withdrawNumber || wallet?.mpesa_withdrawal_number || ''}
                                    onChange={(e) => setWithdrawNumber(e.target.value)}
                                    placeholder="e.g., 0712345678"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-400 mt-1">Enter your Safaricom M-Pesa number</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawAmount('');
                                }}
                                className="flex-1 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const num = withdrawNumber || wallet?.mpesa_withdrawal_number;
                                    const amount = withdrawAmount || wallet?.wallet_balance;

                                    if (!num) {
                                        toast.error('Please enter your M-Pesa number');
                                        return;
                                    }
                                    if (!amount || amount <= 0) {
                                        toast.error('Please enter an amount to withdraw');
                                        return;
                                    }
                                    if (amount > (wallet?.wallet_balance || 0)) {
                                        toast.error('Amount exceeds your available balance');
                                        return;
                                    }
                                    if (amount < 10) {
                                        toast.error('Minimum withdrawal is KES 10');
                                        return;
                                    }

                                    toast.loading('Processing withdrawal...', { id: 'withdraw' });
                                    try {
                                        const result = await apiService.withdrawToMpesa(num, amount);
                                        toast.success(result.message || 'Withdrawal successful!', { id: 'withdraw' });
                                        setShowWithdrawModal(false);
                                        setWithdrawNumber('');
                                        setWithdrawAmount('');
                                        fetchWalletData();
                                    } catch (e: any) {
                                        toast.error(e.response?.data?.detail || 'Withdrawal failed', { id: 'withdraw' });
                                    }
                                }}
                                disabled={!withdrawAmount || withdrawAmount > (wallet?.wallet_balance || 0) || withdrawAmount < 10}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Withdraw KES {withdrawAmount ? withdrawAmount.toLocaleString() : '0'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TikTokDashboard;
