import {
  ArrowLeft,
  CheckCircle,
  Mail,
  Shield,
  ArrowRight
} from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo/icononly_transparent_nobuffer.png';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-4">
            <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
              <img src={logo} alt="Arrotech Hub" className="w-8 h-8 object-contain" />
            </Link>
            <h1 className="text-xl font-black text-gray-900 mb-0.5">Check Your Email</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reset Link Sent</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-xs text-gray-600 mb-4 font-bold uppercase tracking-tight leading-tight">
              We've sent a password reset link to your email address.
            </p>
            <div className="space-y-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Next Steps:</p>
                <ul className="text-[10px] text-gray-500 space-y-1 font-bold">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Check your inbox</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Click reset link</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full" /> Set new password</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setEmailSent(false)}
              className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tight"
            >
              Didn't get it? Try again
            </button>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <Link to="/" className="inline-block hover:scale-110 transition-transform mb-2">
            <img src={logo} alt="Arrotech Hub" className="w-8 h-8 object-contain" />
          </Link>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">Forgot Password?</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reset Instructions</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                <input
                  {...register('email', {
                    required: 'Required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email',
                    },
                  })}
                  type="email"
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Enter email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[9px] text-red-600 font-bold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-black text-xs hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 shadow-md shadow-blue-100 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Sending...' : <>Send Reset Link <ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase tracking-tight"
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