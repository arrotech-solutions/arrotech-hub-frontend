import React, { useEffect, useState } from 'react';
import { Video, BarChart2, Calendar, Share2, User, Loader, Sparkles } from 'lucide-react';
import apiService from '../services/api';
import TikTokScheduler from '../components/TikTokScheduler';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as BrandIcons from '../components/BrandIcons'; // Fix missing import

const TikTokDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiService.getTikTokProfile() as any;
            console.log('TikTok Profile Response:', response); // DEBUG LOG

            // apiService already returns response.data, so response IS the profile object
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
                console.log('No data in response'); // DEBUG LOG
                setProfile({ connected: false });
            }
        } catch (error) {
            console.error('Failed to fetch TikTok profile:', error);
            toast.error('Could not load TikTok profile');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        navigate('/connections');
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader className="animate-spin text-gray-400" /></div>;
    }

    const isConnected = profile?.connected;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* 1. Header Section - Modern "Glass" effect with Gradient */}
            <div className="relative bg-white pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-95"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                {/* TikTok Accent Blurs */}
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
                                <p className="text-slate-400 text-sm md:text-base">Manage your viral content and growth</p>
                            </div>
                        </div>

                        {/* Connection Status / Action */}
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
                </div>
            </div>

            {/* 2. Main Content - Negative Margin for overlapping card effect */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8">

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
                                {isConnected && <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">+2.4%</span>}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">{stat.label}</h3>
                                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Action Area Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* Left: Scheduler (Takes 2/3 width on desktop) */}
                    <div className="lg:col-span-2">
                        <TikTokScheduler />
                    </div>

                    {/* Right: Quick Actions & Viral Card */}
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

                        {/* Recent Activity / Placeholder */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-4">Upcoming Schedule</h3>
                            {isConnected && scheduledPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {scheduledPosts.map((post: any) => (
                                        <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                                                {/* Thumbnail placeholder or video icon */}
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
            </div>
        </div>
    );
};

export default TikTokDashboard;
