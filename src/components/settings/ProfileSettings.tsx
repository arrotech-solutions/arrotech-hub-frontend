import React from 'react';
import { User, Mail, Award, Calendar } from 'lucide-react';
import { User as UserType } from '../../types';

interface ProfileSettingsProps {
    user: UserType | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Profile Settings</h3>
                        <p className="text-gray-600">View and manage your account details</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {user.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-6 h-6 rounded-full"></div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900">{user.name}</h4>
                                <div className="flex items-center justify-center md:justify-start space-x-2 text-gray-500 mt-1">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    <span className="capitalize">{user.subscription_tier} Tier</span>
                                </div>
                                <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {new Date().toLocaleDateString()}</span>
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
