import React, { useState } from 'react';
import { Heart, Loader, Shield, Sparkles } from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const TipPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        amount: 50,
        name: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || formData.amount < 10) {
            toast.error('Email and minimum KES 10 required');
            return;
        }

        setLoading(true);
        try {
            const result = await apiService.initiateTip({
                creator_username: username!,
                email: formData.email,
                amount: formData.amount,
                name: formData.name || undefined,
                message: formData.message || undefined,
                callback_url: `${window.location.origin}/tip/${username}/verify`
            }) as any;

            // Redirect to Paystack
            window.location.href = result.authorization_url;
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to initiate tip');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white relative overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    {/* Avatar with pulse animation */}
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                        <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                            Support @{username}
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 px-4 max-w-sm mx-auto">
                        Show your appreciation with a tip ✨
                    </p>
                </div>

                {/* Tip Form Card */}
                <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Quick Amount Buttons */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                Choose Amount
                            </label>
                            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                {[50, 100, 200, 500].map(amount => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount })}
                                        className={`
                                            relative py-4 sm:py-3 px-2 rounded-xl font-bold text-sm sm:text-base
                                            transition-all duration-300 active:scale-95
                                            ${formData.amount === amount
                                                ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50 scale-105'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <span className="relative z-10">{amount}</span>
                                        {formData.amount === amount && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount with floating label */}
                        <div className="relative">
                            <input
                                type="number"
                                min="10"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-lg font-bold outline-none"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">
                                Or Enter Custom Amount (KES)
                            </label>
                            <p className="text-xs text-slate-500 mt-2 ml-1">Minimum: KES 10</p>
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-base outline-none"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">
                                Your Email <span className="text-pink-500">*</span>
                            </label>
                        </div>

                        {/* Name */}
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-base outline-none"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">
                                Your Name <span className="text-slate-400 text-xs">(Optional)</span>
                            </label>
                        </div>

                        {/* Message */}
                        <div className="relative">
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={3}
                                className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all resize-none text-base outline-none"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-medium text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400">
                                Leave a Message <span className="text-slate-400 text-xs">(Optional)</span>
                            </label>
                        </div>

                        {/* Submit Button with gradient and shimmer */}
                        <button
                            type="submit"
                            disabled={loading || !formData.email || formData.amount < 10}
                            className="group relative w-full py-4 sm:py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-pink-500/50 active:scale-98 text-base sm:text-lg"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Send KES {formData.amount} Tip</span>
                                        <Heart className="w-5 h-5" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Payment Info */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-xs text-slate-500">
                            <Shield className="w-4 h-4 flex-shrink-0" />
                            <span className="text-center">Secure payment via Paystack • M-Pesa & Cards accepted</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 sm:mt-8 px-4">
                    Powered by <span className="font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Arrotech Hub</span>
                </p>
            </div>
        </div>
    );
};

export default TipPage;
