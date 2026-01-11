import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Check,
  Download,
  Edit2,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Linkedin,
  Zap,
  Sparkles,
  Star,
  Shield,
  RefreshCw,
  Save,
  Twitter,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { CreatorProfile as CreatorProfileType, CreatorWorkflow, TopCreator, Following, ActivityFeedItem } from '../types';
import EarningsDashboard from '../components/EarningsDashboard';

const CreatorProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfileType | null>(null);
  const [myWorkflows, setMyWorkflows] = useState<CreatorWorkflow[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Follower state
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<Following[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    github_url: '',
    twitter_url: '',
    linkedin_url: '',
    is_public: true,
    accept_donations: false,
  });

  useEffect(() => {
    loadProfile();
    loadTopCreators();
    loadFollowerStats();
    loadActivityFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFollowerStats = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        apiService.getMyFollowers(1, 0),
        apiService.getMyFollowing(10, 0),
      ]);

      if (followersRes.success) {
        setFollowersCount(followersRes.data?.total || 0);
      }
      if (followingRes.success) {
        setFollowingCount(followingRes.data?.total || 0);
        setFollowingList(followingRes.data?.following || []);
      }
    } catch (error) {
      console.error('Failed to load follower stats:', error);
    }
  };

  const loadActivityFeed = async () => {
    try {
      const response = await apiService.getActivityFeed(10);
      if (response.success) {
        setActivityFeed(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load activity feed:', error);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMyCreatorProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        setEditForm({
          display_name: response.data.display_name || user?.name || '',
          bio: response.data.bio || '',
          avatar_url: response.data.avatar_url || '',
          website: response.data.website || '',
          github_url: response.data.github_url || '',
          twitter_url: response.data.twitter_url || '',
          linkedin_url: response.data.linkedin_url || '',
          is_public: response.data.is_public ?? true,
          accept_donations: response.data.accept_donations ?? false,
        });

        // Load workflows if profile exists
        if (response.data.id) {
          const workflowsResponse = await apiService.getCreatorWorkflows(response.data.id);
          if (workflowsResponse.success) {
            setMyWorkflows(workflowsResponse.data || []);
          }
        }
      } else {
        // No profile yet, initialize form with user info
        setEditForm(prev => ({
          ...prev,
          display_name: user?.name || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopCreators = async () => {
    try {
      const response = await apiService.getTopCreators(5, 'downloads');
      if (response.success) {
        setTopCreators(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load top creators:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.createOrUpdateCreatorProfile(editForm);
      if (response.success) {
        toast.success('Profile saved successfully!');
        setIsEditing(false);
        loadProfile();
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshStats = async () => {
    try {
      const response = await apiService.refreshCreatorStats();
      if (response.success) {
        toast.success('Stats refreshed!');
        loadProfile();
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast.error('Failed to refresh stats');
    }
  };

  const renderBadge = (badge: string) => {
    const badgeStyles: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      top_creator: { icon: <Star className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Top Creator' },
      verified: { icon: <Shield className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'Verified' },
      expert: { icon: <Award className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700', label: 'Expert' },
      early_adopter: { icon: <Zap className="w-3 h-3" />, color: 'bg-green-100 text-green-700', label: 'Early Adopter' },
    };

    const style = badgeStyles[badge] || { icon: <Award className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: badge };

    return (
      <span key={badge} className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.color}`}>
        {style.icon}
        <span>{style.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm mb-8">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-10 creator-header">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                  <div className="p-1.5 bg-purple-100/80 rounded-lg">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Creator Hub</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                  {profile?.display_name?.split(' ')[0] || 'Creator'} <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Profile</span>
                </h1>
                <p className="text-gray-500 max-w-md font-medium mx-auto sm:mx-0">
                  Manage your identity, track your metrics, and showcase your digital reach.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                {profile && !isEditing && (
                  <button
                    onClick={handleRefreshStats}
                    className="p-3 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm group"
                  >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                )}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transform hover:-translate-y-1 transition-all duration-300 font-bold"
                  >
                    <Edit2 className="w-5 h-5" />
                    <span>{profile ? 'Edit Profile' : 'Create Profile'}</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-4 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:bg-gray-50 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center space-x-2 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-bold disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card - Glassmorphism */}
            <div className="creator-profile-card bg-white/60 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/50 overflow-hidden relative group">
              <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

              <div className="p-8 -mt-16 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 mb-8 text-center sm:text-left">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 animate-pulse"></div>
                    <div className="relative w-32 h-32 rounded-[32px] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-black">
                          {(profile?.display_name || user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex flex-col sm:flex-row items-center sm:items-baseline sm:space-x-3 mb-2">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {profile?.display_name || user?.name || 'Your Name'}
                      </h2>
                      {profile?.is_verified && (
                        <div title="Verified Creator" className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100 flex items-center space-x-1">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    {profile?.badges && profile.badges.length > 0 && (
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {profile.badges.map(renderBadge)}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  /* Edit Form - Premium Style */
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Identity Name</label>
                        <input
                          type="text"
                          value={editForm.display_name}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold"
                          placeholder="Your display name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Avatar Resource (URL)</label>
                        <input
                          type="url"
                          value={editForm.avatar_url}
                          onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Creator Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={4}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 resize-none font-medium leading-relaxed"
                        placeholder="Tell the world about your expertise..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
                      {[
                        { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://' },
                        { id: 'github_url', label: 'GitHub', icon: Github, placeholder: 'https://github.com/' },
                        { id: 'twitter_url', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/' },
                        { id: 'linkedin_url', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/' },
                      ].map((social) => {
                        const Icon = social.icon;
                        return (
                          <div key={social.id} className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center">
                              <Icon className="w-3.5 h-3.5 mr-1.5" />
                              {social.label}
                            </label>
                            <input
                              type="url"
                              value={(editForm as any)[social.id]}
                              onChange={(e) => setEditForm({ ...editForm, [social.id]: e.target.value })}
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold text-sm"
                              placeholder={social.placeholder}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={editForm.is_public}
                            onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                            className="w-6 h-6 text-purple-600 rounded-lg border-gray-200 focus:ring-purple-500"
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Public Profile</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editForm.accept_donations}
                          onChange={(e) => setEditForm({ ...editForm, accept_donations: e.target.checked })}
                          className="w-6 h-6 text-green-600 rounded-lg border-gray-200 focus:ring-green-500"
                        />
                        <span className="text-sm font-bold text-gray-700">Accept Donations</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Profile Details View */
                  <div className="space-y-8 animate-in fade-in duration-700">
                    {profile?.bio ? (
                      <p className="text-gray-600 text-lg font-medium leading-relaxed italic">
                        "{profile.bio}"
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No bio provided yet.</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                      {profile?.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-all font-bold text-sm shadow-sm">
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      )}
                      {profile?.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-900 transition-all font-bold text-sm shadow-sm">
                          <Github className="w-4 h-4" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {profile?.twitter_url && (
                        <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-gray-600 hover:text-blue-400 hover:border-blue-400 transition-all font-bold text-sm shadow-sm">
                          <Twitter className="w-4 h-4" />
                          <span>Twitter</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid - Premium Experience */}
            <div className="creator-stats grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Downloads', value: profile?.total_downloads || 0, icon: Download, color: 'blue' },
                { label: 'Rating', value: profile?.average_rating?.toFixed(1) || '0.0', icon: Star, color: 'amber' },
                { label: 'Reviews', value: profile?.total_reviews || 0, icon: Heart, color: 'rose' },
                { label: 'Following', value: followingCount || 0, icon: Users, color: 'indigo' },
                { label: 'Followers', value: followersCount || 0, icon: Award, color: 'purple' },
                { label: 'Tier', value: user?.subscription_tier || 'Free', icon: Zap, color: 'emerald' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="relative z-10">
                      <div className={`p-2 w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 mb-3 group-hover:scale-110 transition-transform ${stat.color === 'blue' ? 'text-blue-500' :
                        stat.color === 'amber' ? 'text-amber-500' :
                          stat.color === 'rose' ? 'text-rose-500' :
                            stat.color === 'indigo' ? 'text-indigo-500' :
                              stat.color === 'purple' ? 'text-purple-500' :
                                'text-emerald-500'
                        }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-xl font-black text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Earnings Dashboard */}
            {profile && (
              <EarningsDashboard className="mb-6" />
            )}

            {/* My Public Workflows */}
            {myWorkflows.length > 0 ? (
              <div className="creator-workflows bg-white/60 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/50 p-8">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <span>Shared Workflows</span>
                </h3>
                <div className="space-y-4 creator-workflows-list">
                  {myWorkflows.map((wf) => (
                    <div key={wf.id} className="group flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 border border-transparent hover:border-purple-100 rounded-2xl transition-all duration-300">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{wf.name}</h4>
                        <div className="flex items-center space-x-4 text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                          <span className="flex items-center space-x-1.5">
                            <Download className="w-3.5 h-3.5" />
                            <span>{wf.downloads_count}</span>
                          </span>
                          {wf.rating && (
                            <span className="flex items-center space-x-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>{wf.rating.toFixed(1)}</span>
                            </span>
                          )}
                          {wf.category && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg">
                              {wf.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${wf.visibility === 'marketplace' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {wf.visibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="creator-workflows creator-workflows-empty bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/50 p-10 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No Public Assets</h3>
                <p className="text-gray-500 font-medium">Your marketplace contributions will appear here.</p>
              </div>
            )}

            {/* Activity Feed */}
            {activityFeed.length > 0 ? (
              <div className="creator-activity bg-white/60 backdrop-blur-xl rounded-[32px] shadow-sm border border-white/50 p-8">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Engagement Feed</span>
                </h3>
                <div className="space-y-4 creator-activity-list">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-4 bg-white/40 rounded-2xl border border-transparent hover:border-blue-100 transition-all cursor-default">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-black shrink-0">
                        {item.actor_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          <span className="text-blue-600">{item.actor_name}</span> {item.title}
                        </p>
                        {item.workflow_name && (
                          <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            {item.workflow_name}
                          </div>
                        )}
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="creator-activity creator-activity-empty bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/50 p-10 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Passive Feed</h3>
                <p className="text-gray-500 font-medium">Follower interactions will be logged here.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* People You Follow */}
            {followingList.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-8">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center space-x-3 uppercase tracking-tight">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Following</span>
                </h3>
                <div className="space-y-4">
                  {followingList.slice(0, 5).map((following) => (
                    <div key={following.id} className="flex items-center space-x-3 group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-black overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
                        {following.avatar_url ? (
                          <img src={following.avatar_url} alt={following.display_name || ''} className="w-full h-full object-cover" />
                        ) : (
                          (following.display_name || following.user_name || '?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {following.display_name || following.user_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {followingCount > 5 && (
                  <button className="mt-6 w-full py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                    Discover More ({followingCount - 5})
                  </button>
                )}
              </div>
            )}

            {/* Top Creators Leaderboard */}
            <div className="creator-leaderboard bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 p-8 creator-top-leaderboard">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center space-x-3 uppercase tracking-tight">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span>Elite Node</span>
              </h3>
              {topCreators.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-center py-4 italic">No nodes detected</p>
              ) : (
                <div className="space-y-4">
                  {topCreators.map((creator, index) => (
                    <div key={creator.id} className="flex items-center space-x-3 group cursor-default">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                            'bg-gray-100 text-gray-400'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-black overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                        ) : (
                          creator.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{creator.display_name}</p>
                          {creator.is_verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {creator.total_downloads} CLXS • {creator.total_workflows} OPS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 rounded-[32px] border border-purple-100 p-8">
              <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">Creator Protocols</h3>
              <ul className="space-y-4">
                {[
                  'Optimize bio for neural search',
                  'Calibrate social linked nodes',
                  'Descriptive syntax nomenclature',
                  'Categorical frequency tagging'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="p-1 bg-green-500 rounded-lg mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;

