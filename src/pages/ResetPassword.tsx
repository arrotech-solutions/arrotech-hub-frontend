import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Shield
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle';
import logo from '../assets/Logo/fulllogo_transparent.png';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('newPassword');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setIsValidating(false);
      setIsValidToken(false);
      return;
    }

    setToken(tokenParam);
    const validate = async () => {
      try {
        await validateResetToken(tokenParam);
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
      }
      setIsValidating(false);
    };
    validate();
  }, [searchParams, validateResetToken]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await resetPassword(token, data.newPassword);
      navigate('/login');
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors px-4 py-4 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Validating...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors px-4 py-4 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full">
          <div className="text-center mb-4">
            <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
              <img src={logo} alt="Arrotech Hub" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-xl font-black text-red-600 dark:text-red-500 mb-0.5 transition-colors">Link Invalid</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Expired or Broken</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 dark:border-slate-800/50 text-center transition-colors">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4 transition-colors">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-500 mx-auto mb-2 transition-colors" />
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tight transition-colors">
                The password reset link you're trying to use is no longer valid.
              </p>
            </div>
            <div className="space-y-2">
              <Link to="/forgot-password" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-black text-xs hover:bg-slate-800 dark:hover:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                New Link <ArrowRight className="h-3 w-3" />
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase mt-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors px-4 py-4 relative">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>
      <SEO
        title="Reset Password"
        description="Create a new password for your Arrotech Hub account."
        url="/reset-password"
        noindex={true}
      />
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
            <img src={logo} alt="Arrotech Hub" className="h-12 w-auto object-contain" />
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-0.5 transition-colors">New Password</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Secure Your Account</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 dark:border-slate-800/50 transition-colors">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-0.5 transition-colors">New Pass</label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 dark:text-gray-600 transition-colors" />
                  <input
                    {...register('newPassword', {
                      required: 'Required',
                      minLength: { value: 6, message: 'Min 6' },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-7 pr-7 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-[8px] text-red-600 dark:text-red-400 font-bold transition-colors">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-0.5 transition-colors">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 dark:text-gray-600 transition-colors" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Required',
                      validate: v => v === password || 'No match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-7 pr-7 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[8px] text-red-600 dark:text-red-400 font-bold transition-colors">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-black text-xs hover:bg-slate-800 dark:hover:bg-gray-100 transition-all transform active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? 'Resetting...' : <>Update Password <ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 text-center transition-colors">
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;