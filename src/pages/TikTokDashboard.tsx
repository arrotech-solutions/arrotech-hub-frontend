import React, { useEffect, useState } from 'react';
import { Video, BarChart2, Calendar, Share2, User, Loader, Sparkles } from 'lucide-react';
import apiService from '../services/api';
import TikTokScheduler from '../components/TikTokScheduler';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TikTokDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiService.getTikTokProfile();
            setProfile(response.data);
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-8 h-8 text-black" />
                        TikTok Viral Dashboard
                    </h1>
                    <p className="text-gray-500">Manage your viral content, schedule posts, and track analytics.</p>
                </div>
                {!isConnected && (
                    <button
                        onClick={handleConnect}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Connect TikTok Account
                    </button>
                )}
                {isConnected && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                        <img
                            src={profile.avatar_url || "https://via.placeholder.com/32"}
                            alt="Profile"
                            className="w-8 h-8 rounded-full bg-gray-200"
                        />
                        <div>
                            <p className="text-sm font-medium">{profile.display_name}</p>
                            <p className="text-xs text-green-500">● Connected</p>
                        </div>
                    </div>
                )}

            </div>

            {/* Viral Card Modal/Display */}
            <div className="flex justify-end">
                <button
                    onClick={async () => {
                        const toastId = toast.loading('Generating your Vital Status card...');
                        try {
                            const res: any = await apiService.getViralCard();
                            if (res.success && res.image_base64) {
                                // Create a blob URL to display
                                const byteCharacters = atob(res.image_base64);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'image/png' });
                                const url = URL.createObjectURL(blob);

                                // Open in new tab or mock modal (using window.open for simplicity in MVP)
                                const win = window.open();
                                if (win) {
                                    win.document.write(`<img src="${url}" style="width:100%; height:auto;" />`);
                                    toast.success('Viral Card Generated!', { id: toastId });
                                } else {
                                    toast.error('Pop-up blocked', { id: toastId });
                                }
                            }
                        } catch (e) {
                            console.error(e);
                            toast.error('Failed to generate card', { id: toastId });
                        }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 transition-colors"
                >
                    <Sparkles className="w-4 h-4" />
                    Get Viral Score Card
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Followers', value: isConnected ? profile.follower_count || '-' : '-', icon: User, color: 'text-blue-600' },
                    { label: 'Video Views', value: '-', icon: Video, color: 'text-pink-600' },
                    { label: 'Engagement Rate', value: '-', icon: BarChart2, color: 'text-purple-600' },
                    { label: 'Scheduled Posts', value: '0', icon: Calendar, color: 'text-green-600' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Coming Soon Area */}
            {/* Scheduler & Premium Links Section */}
            {isConnected ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TikTokScheduler />
                    </div>

                    {/* Premium Link Creator */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">New</span>
                            Monetize Content
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Create a paywalled link for your bio.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Link Title</label>
                                <input type="text" id="pl-title" placeholder="e.g. Full Masterclass" className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Secret URL</label>
                                <input type="text" id="pl-url" placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Price (KES)</label>
                                <input type="number" id="pl-price" placeholder="100" className="w-full px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <button
                                onClick={async () => {
                                    const title = (document.getElementById('pl-title') as HTMLInputElement).value;
                                    const url = (document.getElementById('pl-url') as HTMLInputElement).value;
                                    const price = Number((document.getElementById('pl-price') as HTMLInputElement).value);

                                    if (!title || !url || !price) return toast.error('Fill all fields');

                                    try {
                                        const res: any = await apiService.createPremiumLink({ title, url, price });
                                        if (res.success) {
                                            toast.success('Premium Link Created!');
                                            // Reset inputs
                                            (document.getElementById('pl-title') as HTMLInputElement).value = '';
                                            (document.getElementById('pl-url') as HTMLInputElement).value = '';
                                            (document.getElementById('pl-price') as HTMLInputElement).value = '';
                                        }
                                    } catch (e) { toast.error('Failed to create link'); }
                                }}
                                className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                            >
                                Create Paywall
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Connect TikTok to Go Viral 🚀</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
                            Get access to our AI-powered viral scheduler, Sheng caption generator, and Kenyan trend analytics.
                        </p>
                        <button
                            onClick={handleConnect}
                            className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition-colors"
                        >
                            Connect Account Now
                        </button>
                    </div>

                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>
            )}
        </div>
    );
};

export default TikTokDashboard;
