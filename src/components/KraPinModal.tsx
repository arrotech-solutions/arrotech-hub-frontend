import React, { useState } from 'react';
import { X, Shield, Fingerprint, UserCheck, Loader2, Info } from 'lucide-react';
import { KRALogo } from './BrandIcons';

interface KraPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => Promise<{ success: boolean; message: string; data?: any }>;
    onSuccess: (pin: string, data: any) => void;
}

const KraPinModal: React.FC<KraPinModalProps> = ({ isOpen, onClose, onVerify, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<any>(null);

    if (!isOpen) return null;

    const handleVerify = async () => {
        if (!pin.match(/^[A-Z]\d{9}[A-Z]$/i)) {
            setError('Please enter a valid 11-character KRA PIN (e.g., A009278635E or P012345678X)');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await onVerify(pin.toUpperCase());
            if (result.success) {
                setVerifiedData(result.data);
            } else {
                setError(result.message || 'Verification failed. Please check your PIN.');
            }
        } catch (err) {
            setError('An error occurred during verification.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (verifiedData) {
            onSuccess(pin.toUpperCase(), verifiedData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative bg-white/90 dark:bg-slate-900/90 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                {/* Header with Gradient */}
                <div className="h-32 bg-gradient-to-br from-red-600 via-red-500 to-orange-400 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center p-3 border-4 border-slate-50 dark:border-slate-800">
                            <KRALogo className="w-full h-full" />
                        </div>
                    </div>
                </div>

                <div className="pt-14 p-8 text-center">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                        Connect to KRA Portal
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Enter your KRA PIN to authorize the Arrotech Digital Tax Assistant.
                    </p>

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Shield className={`w-5 h-5 transition-colors ${loading ? 'text-blue-500 animate-pulse' : 'text-slate-400 group-focus-within:text-red-500'}`} />
                            </div>
                            <input
                                type="text"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                disabled={loading || !!verifiedData}
                                placeholder="A012345678X"
                                className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-lg font-mono tracking-widest focus:ring-2 focus:ring-red-500 transition-all outline-none text-slate-900 dark:text-white uppercase placeholder:lowercase placeholder:tracking-normal"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-left">
                                <Info className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {verifiedData && (
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-left animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 mb-2 text-emerald-700 dark:text-emerald-400">
                                    <UserCheck className="w-5 h-5" />
                                    <span className="font-bold text-sm">PIN Verified Successfully</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Taxpayer Name:</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                        {verifiedData.taxpayer_name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!verifiedData ? (
                            <button
                                onClick={handleVerify}
                                disabled={loading || pin.length < 11}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Verifying with KRA...</span>
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint className="w-5 h-5" />
                                        <span>Verify & Continue</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleConnect}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Complete Connection
                            </button>
                        )}
                    </div>

                    <p className="mt-6 text-[10px] text-slate-400 dark:text-slate-500 italic">
                        Arrotech Hub uses end-to-end encryption to store your KRA PIN securely using the GavaConnect gateway protocol.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KraPinModal;
