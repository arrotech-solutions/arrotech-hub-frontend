import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    ArrowRight,
    CheckCircle,
    Clock,
    AlertCircle,
    Globe,
    Zap,
    Shield,
    Sparkles
} from 'lucide-react';
import apiService from '../services/api';

import { useAuth } from '../hooks/useAuth';

const RequestAccess: React.FC = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'pending' | 'approved' | 'rejected' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            if (user.email?.toLowerCase() === 'support@arrotechsolutions') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            // 1. First check if they already have a request
            const data = await apiService.getAccessStatus(email);

            if (data.success) {
                setStatus(data.data.status);
                if (data.data.status === 'approved') {
                    setMessage('Welcome back! Your access is approved.');
                    localStorage.setItem('access_approved_email', email);
                } else if (data.data.status === 'pending') {
                    setMessage("You're on the list! We'll notify you as soon as a spot opens up.");
                } else {
                    setMessage('Your request is currently being reviewed.');
                }
            } else {
                throw new Error('Not found');
            }
        } catch (err: any) {
            // 2. If not found (404), submit a new request
            if (err.response?.status === 404) {
                try {
                    const requestData = await apiService.requestAccess(email);
                    if (requestData.success) {
                        setStatus('pending');
                        setMessage("Great! You've joined the waitlist. We'll be in touch soon.");
                    } else {
                        setStatus('error');
                        setMessage(requestData.message || 'Something went wrong. Please try again.');
                    }
                } catch (reqErr: any) {
                    setStatus('error');
                    setMessage(reqErr.response?.data?.detail || 'Could not join the waitlist.');
                }
            } else {
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Something went wrong. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                                <Globe className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-2">
                            Private Beta
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Request early access to the intelligent operating system for modern business.
                        </p>
                    </div>

                    {/* Form Component */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
                        {status === 'approved' ? (
                            <div className="space-y-6 text-center animate-fade-in">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                        <CheckCircle className="text-green-500 w-8 h-8" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Access Granted</h3>
                                    <p className="text-gray-600">{message}</p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
                                    >
                                        Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>
                        ) : status === 'pending' ? (
                            <div className="space-y-6 text-center animate-fade-in">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                        <Clock className="text-blue-500 w-8 h-8" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">You're on the list</h3>
                                    <p className="text-gray-600">{message}</p>
                                </div>
                                <button
                                    onClick={() => { setStatus('idle'); setEmail(''); }}
                                    className="w-full bg-white border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                                >
                                    Check another email
                                </button>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleAction}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                            <span>Checking...</span>
                                        </>
                                    ) : (
                                        <>
                                            Request Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                {status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {message}
                                    </div>
                                )}
                            </form>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Already have an invite?{' '}
                                <span
                                    onClick={() => navigate('/login')}
                                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer"
                                >
                                    Sign in
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Features (Same as Login.tsx for consistency) */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 items-center justify-center p-12">
                <div className="max-w-lg space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Automate the Future
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Join the waitlist to access the most powerful AI automation platform.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Smart Automation</h3>
                                <p className="text-gray-600">Automate repetitive tasks with AI-powered workflows</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Secure & Reliable</h3>
                                <p className="text-gray-600">Enterprise-grade security for your data and integrations</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
                                <p className="text-gray-600">Get insights and optimize your marketing performance</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                        <h3 className="font-semibold text-gray-900 mb-4">Why join the waitlist?</h3>
                        <div className="space-y-3">
                            {[
                                'Early access to new features',
                                'Priority onboarding support',
                                'Exclusive founder rates',
                                'Shape the product roadmap',
                                'Join a community of innovators'
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestAccess;
