import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, Sparkles, Heart, ArrowRight } from 'lucide-react';
import apiService from '../services/api';

const TipVerify: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('');
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        const verifyPayment = async () => {
            const reference = searchParams.get('reference');
            const tipId = searchParams.get('tip_id');

            if (!reference || !tipId) {
                setStatus('failed');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const result = await apiService.verifyTip(Number(tipId), reference) as any;
                setStatus('success');
                setMessage(result.message || 'Thank you for your support!');
                setAmount(result.amount || 0);
            } catch (error: any) {
                setStatus('failed');
                setMessage(error.response?.data?.detail || 'Verification failed');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white relative overflow-hidden flex items-center justify-center px-4 py-8 sm:py-0">
            {/* Animated background blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative max-w-md w-full backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 text-center">
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <Loader className="relative w-16 h-16 sm:w-20 sm:h-20 text-pink-500 animate-spin mx-auto" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Verifying Payment...
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600">Please wait while we confirm your tip</p>
                        </div>
                        <div className="flex justify-center gap-1">
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        {/* Success icon with scale animation */}
                        <div className="relative inline-block animate-in zoom-in-50 duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={3} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                    Tip Sent Successfully!
                                </h2>
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto">{message}</p>
                        </div>

                        {amount > 0 && (
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                                        KES {amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                                        <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                                        <span className="font-medium">sent to @{username}</span>
                                        <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => navigate(`/tip/${username}`)}
                            className="group w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-pink-500/50 transition-all duration-300 active:scale-98 inline-flex items-center justify-center gap-2"
                        >
                            <span>Send Another Tip</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="space-y-6">
                        {/* Error icon */}
                        <div className="relative inline-block animate-in zoom-in-50 duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-red-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                                <XCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={3} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Payment Failed</h2>
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                <p className="text-sm sm:text-base text-rose-700 font-medium">{message}</p>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Don't worry, you haven't been charged. Please try again or contact support if the issue persists.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate(`/tip/${username}`)}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-slate-500/50 transition-all duration-300 active:scale-98 inline-flex items-center justify-center gap-2"
                        >
                            <span>Try Again</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TipVerify;
