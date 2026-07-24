import React from 'react';
import { User, Mail, Award, Calendar } from 'lucide-react';
import { User as UserType } from '../../types';
import { getDisplayTier, getDisplayTierName, isSubscriptionExpired } from '../../hooks/useSubscription';

interface ProfileSettingsProps {
    user: UserType | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
    if (!user) return null;

    const displayTier = getDisplayTier(user);
    const subscriptionExpired = isSubscriptionExpired(user);
    const expiredEndDate = user.subscription_end_date
        ? new Date(user.subscription_end_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg transition-colors">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Profile Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">View and manage your account details</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/50 p-8 shadow-sm transition-colors">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-all">
                                {user.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white dark:border-slate-800 w-6 h-6 rounded-full transition-colors"></div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{user.name}</h4>
                                <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-500 dark:text-slate-400 mt-1 transition-colors">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                                    <Award className="w-4 h-4" />
                                    <span className="capitalize transition-colors">{getDisplayTierName(displayTier)} Tier</span>
                                </div>
                                {subscriptionExpired && (
                                    <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium transition-colors">
                                        Expired{expiredEndDate ? ` ${expiredEndDate}` : ''}
                                    </div>
                                )}
                                <div className="px-3 py-1 bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                    <span className="transition-colors">Joined {new Date().toLocaleDateString()}</span>
                                    {/* Todo: Add created_at to User type if real date needed */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
