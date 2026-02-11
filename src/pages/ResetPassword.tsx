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
    validateResetToken(tokenParam)
      .then(() => {
        setIsValidToken(true);
      })
      .catch(() => {
        setIsValidToken(false);
      })
      .finally(() => {
        setIsValidating(false);
      });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validating...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-4">
            <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
              <img src={logo} alt="Arrotech Hub" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-xl font-black text-gray-900 mb-0.5 text-red-600">Link Invalid</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expired or Broken</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 text-center">
            <div className="p-4 bg-red-50 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
                The password reset link you're trying to use is no longer valid.
              </p>
            </div>
            <div className="space-y-2">
              <Link to="/forgot-password" className="w-full bg-blue-600 text-white py-2 rounded-lg font-black text-xs hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                New Link <ArrowRight className="h-3 w-3" />
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase mt-2">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-4">
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
          <h1 className="text-xl font-black text-gray-900 mb-0.5">New Password</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Your Account</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">New Pass</label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                  <input
                    {...register('newPassword', {
                      required: 'Required',
                      minLength: { value: 6, message: 'Min 6' },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-7 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-[8px] text-red-600 font-bold">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Required',
                      validate: v => v === password || 'No match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-7 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[8px] text-red-600 font-bold">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-black text-xs hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 shadow-md shadow-blue-100 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Resetting...' : <>Update Password <ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;