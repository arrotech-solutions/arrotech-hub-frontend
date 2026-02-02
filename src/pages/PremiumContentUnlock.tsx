import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Lock, Loader, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

interface LinkInfo {
    id: number;
    title: string;
    description: string;
    price: number;
    creator: {
        username: string;
        display_name: string;
        avatar_url: string;
    };
}

const PremiumContentUnlock: React.FC = () => {
    const { linkId } = useParams<{ linkId: string }>();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Payment flow state
    const [email, setEmail] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);

    // Check if returning from Paystack
    const paystackReference = searchParams.get('reference');
    const paystackTrxRef = searchParams.get('trxref');

    const fetchLinkInfo = useCallback(async () => {
        if (!linkId) return;
        try {
            const response = await apiService.getPublicLinkInfo(parseInt(linkId));
            setLinkInfo(response as any);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Link not found');
        } finally {
            setLoading(false);
        }
    }, [linkId]);

    const verifyPayment = useCallback(async (reference: string, retryCount = 0) => {
        if (!linkId) return;
        setPaymentLoading(true);

        try {
            const result = await apiService.verifyAndUnlockContent(parseInt(linkId), reference);
            if ((result as any).unlocked_url) {
                setUnlocked(true);
                setUnlockedUrl((result as any).unlocked_url);
                toast.dismiss('payment-verify');
                toast.success('Payment verified! Content unlocked.');
                setPaymentLoading(false); // Ensure loading state is reset on success
            }
        } catch (err: any) {
            // If payment verification fails and we haven't exceeded retry attempts, retry after delay
            if (retryCount < 3) {
                // Wait before retrying: 2s, 4s, 6s
                const delay = (retryCount + 1) * 2000;
                toast.loading(`Verifying payment... (${retryCount + 1}/3)`, { id: 'payment-verify' });

                setTimeout(() => {
                    verifyPayment(reference, retryCount + 1);
                }, delay);
            } else {
                // After 3 retries, show error
                toast.dismiss('payment-verify');
                setError('Payment verification failed. Please contact support or refresh the page.');
                setPaymentLoading(false);
            }
        }
    }, [linkId]);

    useEffect(() => {
        fetchLinkInfo();
    }, [fetchLinkInfo]);

    useEffect(() => {
        // If returning from Paystack with a reference, verify the payment
        const reference = paystackReference || paystackTrxRef;
        if (reference && linkInfo) {
            // Show initial loading message
            toast.loading('Verifying your payment...', { id: 'payment-verify' });
            verifyPayment(reference);
        }
    }, [paystackReference, paystackTrxRef, linkInfo, verifyPayment]);

    const handlePurchase = async () => {
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setPaymentLoading(true);
        try {
            // Get the current URL as the callback
            const callbackUrl = window.location.href.split('?')[0];

            const response = await apiService.initiateLinkPurchase(
                parseInt(linkId!),
                email,
                callbackUrl
            );

            const data = response as any;
            if (data.authorization_url) {
                // Redirect to Paystack checkout
                window.location.href = data.authorization_url;
            } else {
                toast.error('Failed to initialize payment');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to start payment');
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    // Content unlocked state
    if (unlocked && unlockedUrl) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-900 to-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Unlocked! 🎉</h1>
                    <p className="text-gray-600 mb-6">Thank you for your purchase. Enjoy the exclusive content!</p>

                    <a
                        href={unlockedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors mb-4"
                    >
                        Access Content →
                    </a>

                    <p className="text-sm text-gray-400">
                        By @{linkInfo?.creator.username}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            {/* Decorative blurs */}
            <div className="fixed top-0 right-0 w-96 h-96 bg-[#FE2C55] rounded-full blur-3xl opacity-10"></div>
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#25F4EE] rounded-full blur-3xl opacity-10"></div>

            <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                {/* Creator Info */}
                {linkInfo?.creator && (
                    <div className="flex items-center gap-3 mb-6">
                        <img
                            src={linkInfo.creator.avatar_url || 'https://via.placeholder.com/48'}
                            alt={linkInfo.creator.display_name}
                            className="w-12 h-12 rounded-full border-2 border-[#FE2C55]"
                        />
                        <div>
                            <p className="font-semibold text-gray-900">{linkInfo.creator.display_name}</p>
                            <p className="text-sm text-gray-500">@{linkInfo.creator.username}</p>
                        </div>
                    </div>
                )}

                {/* Lock Icon & Title */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FE2C55] to-[#FF0050] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{linkInfo?.title}</h1>
                    {linkInfo?.description && (
                        <p className="text-gray-600">{linkInfo.description}</p>
                    )}
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                    <p className="text-sm text-gray-500 mb-1">Unlock this content for</p>
                    <p className="text-4xl font-bold text-gray-900">
                        KES <span className="text-[#FE2C55]">{linkInfo?.price}</span>
                    </p>
                </div>

                {/* Payment Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FE2C55] focus:border-transparent text-gray-900"
                            disabled={paymentLoading}
                        />
                        <p className="text-xs text-gray-400 mt-1">We'll send a receipt to this email</p>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={paymentLoading || !email}
                        className="w-full py-4 bg-gradient-to-r from-[#FE2C55] to-[#FF0050] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                    >
                        {paymentLoading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Smartphone className="w-5 h-5" />
                                Pay with M-Pesa
                            </>
                        )}
                    </button>
                </div>

                {/* Payment Methods Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Secure payment via Paystack • M-Pesa & Cards accepted
                    </p>
                </div>

                {/* Powered by */}
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Powered by <span className="font-semibold text-gray-600">Arrotech Hub</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumContentUnlock;
