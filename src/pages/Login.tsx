import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo/lockup-horizontal-dark.svg';
import logoIcon from '../assets/Logo/icon-indigo.svg';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle';
import { Fingerprint } from 'lucide-react';
import { loginSchema, type LoginValues } from '../lib/schemas';

// Microsoft Icon SVG component
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

const Login: React.FC = () => {
  const { login, loginWithGoogle, loginWithMicrosoft, verifyTOTP, verifyBackupCode, sendEmailOTP, verifyEmailOTP } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [oAuthProvider, setOAuthProvider] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const [formError, setFormError] = useState<string | null>(null);

  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaType, setMfaType] = useState<'totp' | 'backup' | 'email'>('totp');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaOptions, setMfaOptions] = useState({ has_totp: false, has_email_2fa: false, default_2fa_method: 'totp', passkeys_count: 0 });
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpMessage, setEmailOtpMessage] = useState('');

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await login(data.email, data.password, rememberMe);
      if (result.requires_2fa) {
        setRequires2FA(true);
        setMfaToken(result.data['2fa_token']);
        const opts = {
          has_totp: result.data.has_totp,
          has_email_2fa: result.data.has_email_2fa,
          default_2fa_method: result.data.default_2fa_method || 'totp',
          passkeys_count: result.data.passkeys_count
        };
        setMfaOptions(opts);

        // Set the default MFA type and auto-trigger email send if email is default
        const defaultMethod = opts.default_2fa_method as 'totp' | 'email';
        if (defaultMethod === 'email' && opts.has_email_2fa) {
          setMfaType('email');
          // Auto-send email OTP
          try {
            const sendResult = await sendEmailOTP(result.data['2fa_token']);
            setEmailOtpSent(true);
            setEmailOtpMessage(sendResult.message || 'Code sent to your email.');
          } catch {
            setEmailOtpMessage('Failed to send code. Try again.');
          }
        } else if (opts.has_totp) {
          setMfaType('totp');
        } else if (opts.has_email_2fa) {
          setMfaType('email');
        }
        return;
      }
      navigate(result.is_new_user ? '/onboarding' : '/unified');
    } catch (error: any) {
      // Handle specific access errors
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      if (mfaType === 'totp') {
        await verifyTOTP(mfaToken, mfaCode);
      } else if (mfaType === 'email') {
        await verifyEmailOTP(mfaToken, mfaCode);
      } else {
        await verifyBackupCode(mfaToken, mfaCode);
      }

      navigate('/unified');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Verification failed.';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleCallback = useCallback(async (response: any) => {
    setFormError(null);
    setIsOAuthLoading(true);
    setOAuthProvider('Google');
    try {
      const result = await loginWithGoogle(response.credential);
      navigate(result?.is_new_user ? '/onboarding' : '/unified');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Google login failed. Please try again.';
      setFormError(errorMessage);
    } finally {
      setIsOAuthLoading(false);
      setOAuthProvider(null);
    }
  }, [loginWithGoogle, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.warn('Google Client ID not configured');
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          }
        );
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [handleGoogleCallback]);

  // Microsoft Sign-In handler
  const handleMicrosoftLogin = useCallback(async () => {
    const msClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    if (!msClientId) {
      setFormError('Microsoft login is not configured');
      return;
    }

    try {
      // Open Microsoft login popup
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/microsoft/callback');
      const scope = encodeURIComponent('openid profile email User.Read');
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${msClientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&response_mode=fragment&prompt=select_account`;

      const popup = window.open(authUrl, 'Microsoft Login', 'width=500,height=600,scrollbars=yes');

      if (!popup) {
        setFormError('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Listen for the popup to close and check for token
      const checkPopup = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            setIsOAuthLoading(false);
            setOAuthProvider(null);
            return;
          }

          // Check if we're on the callback URL
          if (popup.location.href.includes('/auth/microsoft/callback')) {
            const hash = popup.location.hash;
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');

            popup.close();
            clearInterval(checkPopup);

            if (accessToken) {
              setIsOAuthLoading(true);
              setOAuthProvider('Microsoft');
              const result = await loginWithMicrosoft(accessToken);
              navigate(result?.is_new_user ? '/onboarding' : '/unified');
            } else {
              setFormError('Microsoft login failed. No access token received.');
              setIsOAuthLoading(false);
              setOAuthProvider(null);
            }
          }
        } catch (e) {
          // Cross-origin error - popup is still on Microsoft domain
        }
      }, 500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Microsoft login failed. Please try again.';
      setFormError(errorMessage);
      setIsOAuthLoading(false);
      setOAuthProvider(null);
    }
  }, [loginWithMicrosoft, navigate]);

  return (
    <div className="min-h-screen flex relative bg-slate-50 dark:bg-secondary-900 transition-colors">
      <SEO
        title="Log In"
        description="Sign in to your Arrotech Hub account. Access your unified inbox, calendar, tasks, and workflows in one place."
        url="/login"
        keywords={['Login', 'Sign In', 'Arrotech Hub', 'Unified Workspace']}
      />
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>
      {/* OAuth Loading Overlay */}
      {isOAuthLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all">
          <div className="bg-white dark:bg-secondary-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4 border border-transparent dark:border-secondary-800 transition-colors">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
                Signing in with {oAuthProvider}...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                Please wait while we authenticate your account
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Link to="/" className="flex items-center gap-2 group hover:scale-[1.02] transition-transform">
                <img src={logoIcon} alt="Arrotech Hub" className="h-8 w-auto object-contain" />
                <span className="text-[18px] font-black bg-gradient-to-r from-secondary-900 to-primary-500 dark:from-white dark:to-primary-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tighter leading-tight transition-colors">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/80 dark:bg-secondary-900/50 backdrop-blur-md rounded-xl p-5 shadow-xl border border-gray-200/50 dark:border-secondary-800/50 transition-colors">
            {formError && (
              <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-[10px] flex items-start transition-colors">
                <div className="mr-2 mt-0.5">
                  <Shield className="w-3 h-3 text-red-500 dark:text-red-400" />
                </div>
                <span>{formError}</span>
              </div>
            )}

            {requires2FA ? (
              <form className="space-y-4" onSubmit={handleMfaSubmit}>
                  <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-3 text-primary-600 dark:text-primary-400 transition-colors">
                    {mfaType === 'totp' ? <Lock className="w-6 h-6" /> : mfaType === 'email' ? <Mail className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Two-Factor Authentication</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    {mfaType === 'totp'
                      ? 'Enter the 6-digit code from your authenticator app.'
                      : mfaType === 'email'
                      ? (emailOtpMessage || 'We sent a 6-digit code to your email.')
                      : 'Enter one of your 8-character backup codes.'
                    }
                  </p>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full text-center tracking-[0.5em] text-lg py-2 bg-white dark:bg-secondary-900 border border-gray-300 dark:border-secondary-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono placeholder-slate-300 dark:placeholder-slate-600"
                      placeholder={mfaType === 'backup' ? "ABCDEFGH" : "000000"}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.toUpperCase().trim())}
                      maxLength={mfaType === 'backup' ? 8 : 6}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 text-xs px-1">
                  {/* Try another way */}
                  <div className="flex gap-3">
                    {mfaType !== 'totp' && mfaOptions.has_totp && (
                      <button
                        type="button"
                        onClick={() => {
                          setMfaType('totp');
                          setMfaCode('');
                          setFormError(null);
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Use authenticator app
                      </button>
                    )}
                    {mfaType !== 'email' && mfaOptions.has_email_2fa && (
                      <button
                        type="button"
                        onClick={async () => {
                          setMfaType('email');
                          setMfaCode('');
                          setFormError(null);
                          if (!emailOtpSent) {
                            try {
                              const sendResult = await sendEmailOTP(mfaToken);
                              setEmailOtpSent(true);
                              setEmailOtpMessage(sendResult.message || 'Code sent to your email.');
                            } catch {
                              setEmailOtpMessage('Failed to send code.');
                            }
                          }
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Use email code
                      </button>
                    )}
                    {mfaType !== 'backup' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMfaType('backup');
                          setMfaCode('');
                          setFormError(null);
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Use backup code
                      </button>
                    )}
                  </div>

                  {/* Resend for email method */}
                  {mfaType === 'email' && emailOtpSent && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const sendResult = await sendEmailOTP(mfaToken);
                          setEmailOtpMessage(sendResult.message || 'New code sent!');
                        } catch {
                          setEmailOtpMessage('Failed to resend. Try again.');
                        }
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      Resend code
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setMfaToken('');
                      setMfaCode('');
                      setFormError(null);
                      setEmailOtpSent(false);
                      setEmailOtpMessage('');
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !mfaCode}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-900 text-white py-2 px-6 rounded-lg font-bold text-sm hover:shadow-lg transform hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>
            ) : (
              // Add a wrapper div to satisfy JSX one parent rule
              <div className="space-y-4">
                <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="email" className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight mb-1 transition-colors">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors" />
                        </div>
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all duration-200 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center transition-colors">
                          <span className="w-1 h-1 bg-red-500 dark:bg-red-400 rounded-full mr-2 transition-colors"></span>
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight mb-1 transition-colors">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors" />
                        </div>
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full pl-9 pr-9 py-2 border border-slate-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all duration-200 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center transition-colors">
                          <span className="w-1 h-1 bg-red-500 dark:bg-red-400 rounded-full mr-2 transition-colors"></span>
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-slate-900 dark:focus:ring-slate-100 bg-white dark:bg-secondary-800 transition-colors h-4 w-4"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-slate-900 dark:text-slate-200 hover:text-slate-700 dark:hover:text-slate-400 font-semibold transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-500 dark:bg-primary-500 text-white py-2.5 px-6 rounded-lg font-semibold text-sm shadow-brand hover:bg-primary-600 dark:hover:bg-primary-600 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-slate-900"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-2.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700 transition-colors"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-2 bg-white dark:bg-secondary-900 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div id="google-signin-button" className="w-full min-h-[36px]"></div>
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    disabled={!import.meta.env.VITE_MICROSOFT_CLIENT_ID}
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-secondary-700 py-2 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-tight disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    <MicrosoftIcon /> <span>Microsoft Account</span>
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-secondary-800 text-center transition-colors">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                    New to Arrotech?{' '}
                    <Link to="/register" className="font-semibold text-slate-900 dark:text-slate-200 hover:text-slate-700 dark:hover:text-slate-400 transition-colors">
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;