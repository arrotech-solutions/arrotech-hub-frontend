import React, { useState, useEffect } from 'react';
import { Shield, Clock, Globe, ChevronDown, ChevronRight, Lock, Key, Copy, Check, Smartphone, Mail } from 'lucide-react';
import { SecuritySettings } from '../../types';
import apiService from '../../services/api';

interface SecuritySettingsProps {
    settings: SecuritySettings;
    onUpdate: (settings: SecuritySettings) => void;
    expanded?: boolean;
    onToggle?: () => void;
}

const SecuritySettingsTab: React.FC<SecuritySettingsProps> = ({
    settings,
    onUpdate,
    expanded = true,
    onToggle
}) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = (key: keyof SecuritySettings, value: any) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qr_code: string; uri: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isCopied, setIsCopied] = useState(false);

    // Fine-grained 2FA states from the backend
    const [hasTotp, setHasTotp] = useState(false);
    const [isEmail2FAEnabled, setIsEmail2FAEnabled] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    useEffect(() => {
        if (expanded) {
            fetch2FAStatus();
        }
    }, [expanded]);

    const fetch2FAStatus = async () => {
        try {
            const res = await apiService.request({
                method: 'GET',
                url: '/api/v1/security/2fa/status'
            });
            if (res.data.success) {
                setHasTotp(res.data.data.has_totp);
                setIsEmail2FAEnabled(res.data.data.has_email_2fa);
                // Sync the generic flag just in case
                handleChange('two_factor_enabled', res.data.data.two_factor_enabled);
            }
        } catch (error) {
            console.error('Failed to fetch 2FA status', error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    // Provide a mocked mechanism to hook into until the API service is updated with these endpoints
    // These should ideally come from an API layer like `useAuth()` or `api.ts` directly.
    const handleStart2FASetup = async () => {
        setIsSettingUp2FA(true);
        try {
            const res = await apiService.request({
                method: 'POST',
                url: '/api/v1/security/2fa/totp/setup'
            });
            if (res.data.success) {
                setTotpSetupData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to start 2FA setup', error);
            setIsSettingUp2FA(false);
        }
    };

    const handleVerify2FASetup = async () => {
        try {
            const res = await apiService.request({
                method: 'POST',
                url: '/api/v1/security/2fa/totp/verify',
                data: { code: verificationCode }
            });
            if (res.data.success) {
                handleChange('two_factor_enabled', true);
                setHasTotp(true);
                setBackupCodes(res.data.data.backup_codes);
                setIsSettingUp2FA(false);
            }
        } catch (error: any) {
            const detail = error.response?.data?.detail || 'Failed to verify code. Please try again.';
            console.error('Failed to verify 2FA setup', detail);
            alert(detail);
        }
    };

    const handleDisable2FA = async (method: string = 'all') => {
        const methodLabel = method === 'all' ? 'all 2FA methods' : method === 'totp' ? 'Authenticator App' : 'Email 2FA';
        if (!confirm(`Are you sure you want to disable ${methodLabel}? This will make your account less secure.`)) return;
        try {
            const res = await apiService.request({
                method: 'POST',
                url: '/api/v1/security/2fa/disable',
                data: { method }
            });
            if (res.data.success) {
                if (method === 'all' || method === 'totp') {
                    setTotpSetupData(null);
                    setHasTotp(false);
                }
                if (method === 'all') {
                    handleChange('two_factor_enabled', false);
                    setBackupCodes([]);
                    setIsEmail2FAEnabled(false);
                }
                if (method === 'email') {
                    setIsEmail2FAEnabled(false);
                }
                fetch2FAStatus();
            }
        } catch (error) {
            console.error('Failed to disable 2FA', error);
        }
    };

    // --- Email 2FA ---
    const [isSettingUpEmail2FA, setIsSettingUpEmail2FA] = useState(false);
    const [emailVerificationCode, setEmailVerificationCode] = useState('');
    const [emailSetupMessage, setEmailSetupMessage] = useState('');

    const handleStartEmail2FASetup = async () => {
        setIsSettingUpEmail2FA(true);
        setEmailSetupMessage('');
        try {
            const res = await apiService.request({
                method: 'POST',
                url: '/api/v1/security/2fa/email/setup'
            });
            if (res.data.success) {
                setEmailSetupMessage(res.data.message || 'Verification code sent to your email.');
            }
        } catch (error) {
            console.error('Failed to start Email 2FA setup', error);
            setEmailSetupMessage('Failed to send code. Please try again.');
        }
    };

    const handleVerifyEmail2FASetup = async () => {
        try {
            const res = await apiService.request({
                method: 'POST',
                url: '/api/v1/security/2fa/email/verify',
                data: { code: emailVerificationCode }
            });
            if (res.data.success) {
                handleChange('two_factor_enabled', true);
                setIsEmail2FAEnabled(true);
                setIsSettingUpEmail2FA(false);
                setEmailVerificationCode('');
                if (res.data.data?.backup_codes) {
                    setBackupCodes(res.data.data.backup_codes);
                }
            }
        } catch (error) {
            console.error('Failed to verify Email 2FA setup', error);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg transition-colors">
                        <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Security Settings</h3>
                        <p className="text-gray-600 dark:text-slate-400 transition-colors">Configure security policies and access controls</p>
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Two Factor Authentication */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Lock className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Two Factor Authentication</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors">Authenticator App (TOTP)</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Add an extra layer of security to your account</p>
                                </div>
                                {isLoadingStatus ? (
                                    <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-700 rounded transition-colors"></div>
                                ) : hasTotp ? (
                                    <button
                                        onClick={() => handleDisable2FA('totp')}
                                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        Disable TOTP
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStart2FASetup}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-600 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-sm hover:shadow-md"
                                    >
                                        Enable TOTP
                                    </button>
                                )}
                            </div>

                            {/* Setup Modal/Inline View */}
                            {isSettingUp2FA && totpSetupData && (
                                <div className="mt-4 p-4 border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl space-y-4 transition-colors">
                                    <h5 className="font-semibold text-gray-900 dark:text-white transition-colors">1. Scan QR Code</h5>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Scan this code with Microsoft Authenticator, Google Authenticator, or Authy.</p>
                                    <div className="flex justify-center bg-white dark:bg-slate-200 p-4 rounded-lg inline-block mx-auto border border-gray-200 dark:border-slate-100 transition-colors">
                                        <img src={totpSetupData.qr_code} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 dark:text-slate-500 font-mono break-all transition-colors">{totpSetupData.secret}</p>

                                    <div className="pt-4 border-t border-blue-100 dark:border-blue-500/20 transition-colors">
                                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 transition-colors">2. Enter Verification Code</h5>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="flex-1 px-3 py-2 text-center text-lg tracking-[0.5em] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-700"
                                                placeholder="000000"
                                            />
                                            <button
                                                onClick={handleVerify2FASetup}
                                                disabled={verificationCode.length !== 6}
                                                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Backup Codes Display (Shown only once right after setup) */}
                            {backupCodes.length > 0 && (
                                <div className="mt-4 p-6 border-2 border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5 rounded-xl transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 transition-colors">
                                                <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                Save Your Backup Codes
                                            </h5>
                                            <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 max-w-md transition-colors">
                                                These codes are the ONLY way to access your account if you lose your device. Keep them somewhere safe. <strong>They will only be shown once.</strong>
                                            </p>
                                        </div>
                                        <button
                                            onClick={copyBackupCodes}
                                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-medium transition-colors text-gray-700 dark:text-slate-200 shadow-sm"
                                        >
                                            {isCopied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                                            {isCopied ? 'Copied' : 'Copy Codes'}
                                        </button>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        {backupCodes.map((code, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded border border-green-100 dark:border-green-900/30 text-center font-mono font-medium tracking-wider text-gray-800 dark:text-slate-200 shadow-sm transition-colors">
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setBackupCodes([])}
                                            className="w-full py-2 bg-green-600 dark:bg-green-500 text-white font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-400 transition-all shadow-sm hover:shadow-md"
                                        >
                                            I have saved my backup codes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email 2FA */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Email Verification</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors">Email One-Time Password</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Receive a 6-digit code via email when you log in</p>
                                </div>
                                {isLoadingStatus ? (
                                    <div className="animate-pulse h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded transition-colors"></div>
                                ) : isEmail2FAEnabled ? (
                                    <button
                                        onClick={() => handleDisable2FA('email')}
                                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        Disable Email 2FA
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartEmail2FASetup}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-600 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-sm hover:shadow-md"
                                    >
                                        Enable Email 2FA
                                    </button>
                                )}
                            </div>

                            {/* Email Setup Inline View */}
                            {isSettingUpEmail2FA && (
                                <div className="mt-4 p-4 border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl space-y-4 transition-colors">
                                    <h5 className="font-semibold text-gray-900 dark:text-white transition-colors">Verify Your Email</h5>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">
                                        {emailSetupMessage || 'A verification code has been sent to your email address.'}
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={emailVerificationCode}
                                            onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="flex-1 px-3 py-2 text-center text-lg tracking-[0.5em] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-700"
                                            placeholder="000000"
                                        />
                                        <button
                                            onClick={handleVerifyEmail2FASetup}
                                            disabled={emailVerificationCode.length !== 6}
                                            className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleStartEmail2FASetup}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                                    >
                                        Resend code
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Timeout */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Clock className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">Session Timeout</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    Session Timeout (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.session_timeout}
                                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500/50 focus:border-transparent transition-colors"
                                    min="5"
                                    max="1440"
                                />
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Time before session expires (5-1440 minutes)</p>
                            </div>
                        </div>
                    </div>

                    {/* IP Whitelist */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6 border border-transparent dark:border-slate-700/50 transition-colors">
                        <div className="flex items-center space-x-3 mb-4">
                            <Globe className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">IP Whitelist</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 transition-colors">
                                    IP Addresses (one per line)
                                </label>
                                <textarea
                                    value={localSettings.ip_whitelist?.join('\n') || ''}
                                    onChange={(e) => handleChange('ip_whitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500/50 focus:border-transparent font-mono text-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600"
                                    rows={4}
                                    placeholder="192.168.1.1&#10;10.0.0.1"
                                />
                                <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors">Restrict access to specific IP addresses (leave empty to allow all)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettingsTab;
