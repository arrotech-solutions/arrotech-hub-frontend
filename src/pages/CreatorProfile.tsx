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
  RefreshCw,
  Save,
  Shield,
  Star,
  Twitter,
  User,
  Users,
  Zap,
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="creator-header flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <span>Creator Profile</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your creator profile and view your marketplace statistics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {profile && !isEditing && (
            <button
              onClick={handleRefreshStats}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Stats</span>
            </button>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>{profile ? 'Edit Profile' : 'Create Profile'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="creator-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Header with gradient */}
            <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="p-6 -mt-12">
              {/* Avatar and Basic Info */}
              <div className="flex items-end space-x-4 mb-6">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                      {(profile?.display_name || user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile?.display_name || user?.name || 'Your Name'}
                    </h2>
                    {profile?.is_verified && (
                      <span title="Verified Creator">
                        <Shield className="w-5 h-5 text-blue-500" />
                      </span>
                    )}
                  </div>
                  {profile?.badges && profile.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.badges.map(renderBadge)}
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                      <input
                        type="url"
                        value={editForm.avatar_url}
                        onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Tell others about yourself and your expertise..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Globe className="w-4 h-4 inline mr-1" />Website
                      </label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Github className="w-4 h-4 inline mr-1" />GitHub
                      </label>
                      <input
                        type="url"
                        value={editForm.github_url}
                        onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Twitter className="w-4 h-4 inline mr-1" />Twitter
                      </label>
                      <input
                        type="url"
                        value={editForm.twitter_url}
                        onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Linkedin className="w-4 h-4 inline mr-1" />LinkedIn
                      </label>
                      <input
                        type="url"
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_public}
                        onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Public profile</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.accept_donations}
                        onChange={(e) => setEditForm({ ...editForm, accept_donations: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span>Accept donations</span>
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                /* Display Profile */
                <div>
                  {profile?.bio && (
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                  )}
                  
                  {/* Social Links */}
                  <div className="flex flex-wrap gap-3">
                    {profile?.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center space-x-1 text-sm text-gray-600 hover:text-purple-600">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {profile?.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center space-x-1 text-sm text-gray-600 hover:text-purple-600">
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {profile?.twitter_url && (
                      <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center space-x-1 text-sm text-gray-600 hover:text-purple-600">
                        <Twitter className="w-4 h-4" />
                        <span>Twitter</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center space-x-1 text-sm text-gray-600 hover:text-purple-600">
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          {profile && (
            <div className="creator-stats grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-purple-600">{profile.total_workflows}</div>
                <div className="text-sm text-gray-600">Workflows</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-green-600">{profile.total_downloads}</div>
                <div className="text-sm text-gray-600">Downloads</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-yellow-600">{profile.average_rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-blue-600">{profile.total_reviews}</div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-pink-600">{followersCount}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-3xl font-bold text-indigo-600">{followingCount}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          )}

          {/* Earnings Dashboard */}
          {profile && (
            <EarningsDashboard className="mb-6" />
          )}

          {/* My Public Workflows */}
          {myWorkflows.length > 0 && (
            <div className="creator-workflows bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span>Your Public Workflows</span>
              </h3>
              <div className="space-y-3">
                {myWorkflows.map((wf) => (
                  <div key={wf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{wf.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{wf.downloads_count}</span>
                        </span>
                        {wf.rating && (
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{wf.rating.toFixed(1)} ({wf.rating_count})</span>
                          </span>
                        )}
                        {wf.category && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {wf.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      wf.visibility === 'marketplace' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {wf.visibility}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activityFeed.length > 0 && (
            <div className="creator-activity bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Activity Feed</span>
              </h3>
              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                      {item.actor_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{item.actor_name}</span> {item.title}
                      </p>
                      {item.workflow_name && (
                        <p className="text-xs text-gray-600 mt-1">
                          <Zap className="w-3 h-3 inline mr-1" />
                          {item.workflow_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* People You Follow */}
          {followingList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Following</span>
              </h3>
              <div className="space-y-3">
                {followingList.slice(0, 5).map((following) => (
                  <div key={following.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {following.avatar_url ? (
                        <img src={following.avatar_url} alt={following.display_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        (following.display_name || following.user_name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {following.display_name || following.user_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {followingCount > 5 && (
                <button className="mt-3 text-sm text-purple-600 hover:text-purple-700">
                  View all {followingCount} following →
                </button>
              )}
            </div>
          )}

          {/* Top Creators Leaderboard */}
          <div className="creator-leaderboard bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Top Creators</span>
            </h3>
            {topCreators.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No creators yet</p>
            ) : (
              <div className="space-y-3">
                {topCreators.map((creator, index) => (
                  <div key={creator.id} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                      ) : (
                        creator.display_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{creator.display_name}</p>
                        {creator.is_verified && <Shield className="w-3 h-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-500">
                        {creator.total_downloads} downloads • {creator.total_workflows} workflows
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips for Creators</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Add a detailed bio to build trust</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Link your social profiles</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use descriptive names for workflows</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Add tags to improve discoverability</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;

