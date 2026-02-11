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
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo/fulllogo_transparent.png';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';

// Microsoft Icon SVG component
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
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
  } = useForm<LoginFormData>();

  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setFormError(null);
    try {
      await login(data.email, data.password, rememberMe);
      if (data.email.toLowerCase() === 'support@arrotechsolutions') {
        navigate('/admin');
      } else {
        navigate('/unified');
      }
    } catch (error: any) {
      // Handle specific access errors
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
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
      await loginWithGoogle(response.credential);
      navigate('/unified');
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
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
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
    const msClientId = process.env.REACT_APP_MICROSOFT_CLIENT_ID;
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
              await loginWithMicrosoft(accessToken);
              navigate('/unified');
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
    <div className="min-h-screen flex relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SEO
        title="Log In"
        description="Sign in to your Arrotech Hub account. Access your unified inbox, calendar, tasks, and workflows in one place."
        url="/login"
        keywords={['Login', 'Sign In', 'Arrotech Hub', 'Unified Workspace']}
      />
      {/* OAuth Loading Overlay */}
      {isOAuthLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Signing in with {oAuthProvider}...
              </h3>
              <p className="text-sm text-gray-500 mt-1">
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
            <div className="flex items-center justify-center mb-3">
              <Link to="/" className="hover:scale-110 transition-transform">
                <img src={logo} alt="Arrotech Hub" className="h-16 w-auto object-contain" />
              </Link>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-0.5">
              Welcome back
            </h1>
            <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-xl border border-gray-200/50">
            {formError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-[10px] flex items-start">
                <div className="mr-2 mt-0.5">
                  <Shield className="w-3 h-3 text-red-500" />
                </div>
                <span>{formError}</span>
              </div>
            )}
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold text-gray-600 uppercase tracking-tight mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email',
                        },
                      })}
                      type="email"
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-[10px] font-bold text-gray-600 uppercase tracking-tight mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Required',
                        minLength: {
                          value: 6,
                          message: 'Min 6 chars',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-9 pr-9 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ml-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-tight">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-[10px] text-blue-600 hover:text-blue-500 font-bold uppercase tracking-tight">
                  Forgot?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-lg font-bold text-sm hover:shadow-lg transform hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-2 bg-white text-gray-400 font-bold uppercase tracking-widest">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <div id="google-signin-button" className="w-full min-h-[36px]"></div>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={!process.env.REACT_APP_MICROSOFT_CLIENT_ID}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg text-[10px] font-black text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-tight disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon /> <span>Microsoft Account</span>
              </button>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-500 font-medium">
                New?{' '}
                <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;