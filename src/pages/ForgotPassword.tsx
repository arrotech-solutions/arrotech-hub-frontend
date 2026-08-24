import {
  ArrowLeft,
  CheckCircle,
  Mail,
  Shield,
  ArrowRight
} from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle';
import logo from '../assets/Logo/lockup-horizontal-dark.svg';
import logoIcon from '../assets/Logo/icon-indigo.svg';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../lib/schemas';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-secondary-900 transition-colors px-4 py-4 relative">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full">
          <div className="text-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2 group hover:scale-[1.02] transition-transform mb-2">
              <img src={logoIcon} alt="Arrotech Hub" className="h-6 w-auto object-contain" />
              <span className="text-[15px] font-black bg-gradient-to-r from-secondary-900 to-primary-500 dark:from-white dark:to-primary-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
            </Link>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mb-0.5 transition-colors">Check Your Email</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Reset Link Sent</p>
          </div>

          <div className="bg-white/80 dark:bg-secondary-900/50 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 dark:border-secondary-800/50 text-center transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full mb-3 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 font-bold uppercase tracking-tight leading-tight transition-colors">
              We've sent a password reset link to your email address.
            </p>
            <div className="space-y-2 mb-4">
              <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-lg p-2 text-left transition-colors">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 transition-colors">Next Steps:</p>
                <ul className="text-[10px] text-gray-500 dark:text-gray-400 space-y-1 font-bold transition-colors">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary-500 rounded-full" /> Check your inbox</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary-500 rounded-full" /> Click reset link</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary-500 rounded-full" /> Set new password</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setEmailSent(false)}
              className="text-[10px] font-black text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-tight transition-colors"
            >
              Didn't get it? Try again
            </button>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-secondary-800 transition-colors">
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-blue-400 uppercase transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-secondary-900 transition-colors px-4 py-4 relative">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>
      <SEO
        title="Forgot Password"
        description="Reset your Arrotech Hub password. We'll send you a secure link to get back into your account."
        url="/forgot-password"
      />
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <Link to="/" className="inline-flex items-center gap-2 group hover:scale-[1.02] transition-transform mb-2">
            <img src={logoIcon} alt="Arrotech Hub" className="h-6 w-auto object-contain" />
            <span className="text-[15px] font-black bg-gradient-to-r from-secondary-900 to-primary-500 dark:from-white dark:to-primary-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-0.5 transition-colors">Forgot Password?</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Reset Instructions</p>
        </div>

        <div className="bg-white/80 dark:bg-secondary-900/50 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-100 dark:border-secondary-800/50 transition-colors">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-0.5 transition-colors">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 dark:text-gray-600 transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-primary-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[9px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 transition-colors">
                  <Shield className="w-2.5 h-2.5" /> {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-black text-xs hover:bg-slate-800 dark:hover:bg-gray-100 transition-all transform active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending...' : <>Send Reset Link <ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-secondary-800 text-center transition-colors">
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-blue-400 uppercase tracking-tight transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;