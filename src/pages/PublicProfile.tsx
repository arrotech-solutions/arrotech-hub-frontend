import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, MessageCircle, ShoppingBag, Video, ExternalLink, Lock } from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const PublicProfile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (username) {
            fetchPublicProfile(username);
        }
    }, [username]);

    const fetchPublicProfile = async (user: string) => {
        try {
            const res = await apiService.getPublicProfile(user);
            // Handling untyped response gracefully
            // Assuming the route returns the dict directly or wrapped in data
            // Based on previous patterns, apiService methods usually return response.data 
            // but the route I wrote returns a direct dict. 
            // Let's assume apiService returns the result of axios.get(...).data
            setProfile(res);
        } catch (err) {
            console.error(err);
            setError('Profile not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader className="animate-spin" /></div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-black text-white">{error}</div>;
    if (!profile) return null;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <div className="max-w-md mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block">
                        <img
                            src={profile.avatar_url || "https://via.placeholder.com/150"}
                            alt={profile.display_name}
                            className="w-24 h-24 rounded-full border-4 border-pink-500 mx-auto object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full border-2 border-black">
                            <Video className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                        <p className="text-gray-400">@{profile.username}</p>
                    </div>
                    {profile.bio && (
                        <p className="text-gray-300 text-sm max-w-xs mx-auto">{profile.bio}</p>
                    )}
                    <div className="flex justify-center gap-6 text-sm">
                        <div className="text-center">
                            <div className="font-bold text-lg">{profile.follower_count}</div>
                            <div className="text-gray-500">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg">-</div>
                            <div className="text-gray-500">Likes</div>
                        </div>
                    </div>
                </div>

                {/* Main Links */}
                <div className="space-y-4">
                    {/* Placeholder Logic for links until dynamic */}
                    <a href="#" className="block bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl flex items-center gap-4 border border-white/5 backdrop-blur-sm">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="font-medium flex-1">Chat on WhatsApp</span>
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                    <a href="#" className="block bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl flex items-center gap-4 border border-white/5 backdrop-blur-sm">
                        <div className="bg-pink-500/20 p-2 rounded-lg text-pink-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <span className="font-medium flex-1">Visit My Store</span>
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                </div>

                {/* Latest Videos Grid */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Video className="w-5 h-5 text-gray-400" />
                        Latest Videos
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {profile.videos && profile.videos.length > 0 ? (
                            profile.videos.map((video: any) => (
                                <div key={video.id} className="relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-xs line-clamp-2 text-white/90">{video.caption}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                No videos posted yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-gray-600">Powered by <span className="font-bold text-gray-500">Arrotech Hub</span></p>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
