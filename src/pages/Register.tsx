import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  User
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle';
import logo from '../assets/Logo/fulllogo_transparent.png';

// Microsoft Icon SVG component
const MicrosoftIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { register: registerUser, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [oAuthProvider, setOAuthProvider] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await registerUser(data.email, data.password, data.name);
      // New users go to email verification first
      navigate('/verify-email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed.';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCallback = useCallback(async (response: any) => {
    setFormError(null);
    setIsOAuthLoading(true);
    setOAuthProvider('Google');
    try {
      const result = await loginWithGoogle(response.credential);
      navigate(result?.is_new_user ? '/onboarding' : '/unified');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Google signup failed.';
      setFormError(errorMessage);
    } finally {
      setIsOAuthLoading(false);
      setOAuthProvider(null);
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCallback });
        window.google.accounts.id.renderButton(document.getElementById('google-signup-button'), {
          theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'rectangular'
        });
      }
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [handleGoogleCallback]);

  const handleMicrosoftLogin = useCallback(async () => {
    const msClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    if (!msClientId) { setFormError('Microsoft not configured'); return; }
    try {
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/microsoft/callback');
      const scope = encodeURIComponent('openid profile email User.Read');
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${msClientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&response_mode=fragment&prompt=select_account`;
      const popup = window.open(authUrl, 'Microsoft Login', 'width=500,height=600');
      if (!popup) { setFormError('Popup blocked'); return; }
      const checkPopup = setInterval(async () => {
        try {
          if (popup.closed) { clearInterval(checkPopup); return; }
          if (popup.location.href.includes('/auth/microsoft/callback')) {
            const params = new URLSearchParams(popup.location.hash.substring(1));
            const token = params.get('access_token');
            popup.close(); clearInterval(checkPopup);
            if (token) {
              setIsOAuthLoading(true); setOAuthProvider('Microsoft');
              const result = await loginWithMicrosoft(token);
              navigate(result?.is_new_user ? '/onboarding' : '/unified');
            }
          }
        } catch (e) { }
      }, 500);
    } catch (error) { setFormError('Microsoft signup failed'); }
  }, [loginWithMicrosoft, navigate]);

  return (
    <div className="min-h-screen flex relative bg-slate-50 dark:bg-slate-900 transition-colors">
      <SEO
        title="Create Your Account"
        description="Get started with Arrotech Hub for free. Connect your apps, automate workflows, and boost your productivity with our unified workspace."
        url="/register"
        keywords={['Sign Up', 'Register', 'Create Account', 'Arrotech Hub', 'Free Workspace']}
      />
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>
      {isOAuthLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-3 border border-transparent dark:border-slate-800 transition-colors">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="font-bold text-sm text-gray-800 dark:text-white transition-colors">Signing up with {oAuthProvider}...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-3">
            <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
              <img src={logo} alt="Arrotech Hub" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tighter leading-tight transition-colors">Join Arrotech Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Create your account</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 dark:border-slate-800/50 transition-colors">
            {formError && (
              <div className="mb-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-2 py-1 rounded text-[9px] flex items-center gap-1.5 font-bold uppercase transition-colors">
                <Shield className="w-3 h-3 text-red-500 dark:text-red-400" /> {formError}
              </div>
            )}
            <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 transition-colors">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors" />
                    <input {...register('name', { required: 'Required' })} className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="Enter your name" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 transition-colors">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors" />
                    <input {...register('email', { required: 'Required' })} type="email" className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="name@company.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 transition-colors">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors" />
                      <input {...register('password', { required: 'Required', minLength: 6 })} type={showPassword ? 'text' : 'password'} className="w-full pl-8 pr-8 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="Minimum 6 characters" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 transition-colors">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 transition-colors" />
                      <input {...register('confirmPassword', { validate: v => v === password || 'No match' })} type={showConfirmPassword ? 'text' : 'password'} className="w-full pl-8 pr-8 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" placeholder="Confirm password" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 mt-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-slate-900 dark:focus:ring-slate-100 transition-colors" required />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">I agree to the <Link to="/terms" className="text-slate-900 dark:text-slate-200 hover:text-slate-700 dark:hover:text-slate-400 font-semibold transition-colors">Terms</Link> and <Link to="/privacy" className="text-slate-900 dark:text-slate-200 hover:text-slate-700 dark:hover:text-slate-400 font-semibold transition-colors">Privacy Policy</Link></span>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-lg font-semibold text-sm hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none">
                {isLoading ? 'Processing...' : <>Create Account <ArrowRight className="h-3 w-3" /></>}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700 transition-colors"></div></div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Or continue with</span>
            </div>

            <div className="space-y-2">
              <div id="google-signup-button" className="w-full min-h-[36px]"></div>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={!import.meta.env.VITE_MICROSOFT_CLIENT_ID}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-tight disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon /> <span>Microsoft Account</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                Already have an account? <Link to="/login" className="text-slate-900 dark:text-slate-200 hover:text-slate-700 dark:hover:text-slate-400 font-semibold transition-colors">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;