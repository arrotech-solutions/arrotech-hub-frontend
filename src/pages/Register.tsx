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
      await registerUser(data.email, data.password, data.name);
      navigate('/unified');
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
      await loginWithGoogle(response.credential);
      navigate('/unified');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Google signup failed.';
      setFormError(errorMessage);
    } finally {
      setIsOAuthLoading(false);
      setOAuthProvider(null);
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
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
    const msClientId = process.env.REACT_APP_MICROSOFT_CLIENT_ID;
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
              await loginWithMicrosoft(token); navigate('/unified');
            }
          }
        } catch (e) { }
      }, 500);
    } catch (error) { setFormError('Microsoft signup failed'); }
  }, [loginWithMicrosoft, navigate]);

  return (
    <div className="min-h-screen flex relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <SEO
        title="Create Your Account"
        description="Get started with Arrotech Hub for free. Connect your apps, automate workflows, and boost your productivity with our unified workspace."
        url="/register"
        keywords={['Sign Up', 'Register', 'Create Account', 'Arrotech Hub', 'Free Workspace']}
      />
      {isOAuthLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="font-bold text-sm text-gray-800">Signing up with {oAuthProvider}...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-3">
            <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
              <img src={logo} alt="Arrotech Hub" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-xl font-black text-gray-900 mb-0.5">Join Arrotech Hub</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Create Account</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100">
            {formError && (
              <div className="mb-2 bg-red-50 border border-red-100 text-red-600 px-2 py-1 rounded text-[9px] flex items-center gap-1.5 font-bold uppercase">
                <Shield className="w-3 h-3" /> {formError}
              </div>
            )}
            <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input {...register('name', { required: 'Required' })} className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Name" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                    <input {...register('email', { required: 'Required' })} type="email" className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Email" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                      <input {...register('password', { required: 'Required', minLength: 6 })} type={showPassword ? 'text' : 'password'} className="w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">{showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                      <input {...register('confirmPassword', { validate: v => v === password || 'No match' })} type={showConfirmPassword ? 'text' : 'password'} className="w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">{showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-0.5">
                <input type="checkbox" className="h-3 w-3 rounded border-gray-300 text-blue-600" required />
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Agree to <Link to="/terms" className="text-blue-500 underline">Terms</Link> & <Link to="/privacy" className="text-blue-500 underline">Privacy</Link></span>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-black text-xs hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 shadow-md shadow-blue-100 flex items-center justify-center gap-2">
                {isLoading ? 'Processing...' : <>Create Account <ArrowRight className="h-3 w-3" /></>}
              </button>
            </form>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative px-2 bg-white text-[8px] font-black text-gray-300 uppercase tracking-widest">Or Signup With</span>
            </div>

            <div className="space-y-2">
              <div id="google-signup-button" className="w-full min-h-[36px]"></div>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={!process.env.REACT_APP_MICROSOFT_CLIENT_ID}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg text-[10px] font-black text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-tight disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <MicrosoftIcon /> <span>Microsoft Account</span>
              </button>
            </div>

            <div className="mt-3.5 pt-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                Got an account? <Link to="/login" className="text-blue-600 hover:underline">Sign In Now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;