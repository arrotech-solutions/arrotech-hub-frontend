import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        navigate('/');
      }
    } catch (error: any) {
      // Handle specific access errors
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-2">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Sign in to your Mini-Hub account
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
            {formError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start">
                <div className="mr-3 mt-0.5">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <span>{formError}</span>
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
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
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Create account
                </Link>
              </p>
              <p className="text-center text-sm text-gray-600 mt-2">
                Need access?{' '}
                <Link to="/" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Request invite
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 items-center justify-center p-12">
        <div className="max-w-lg space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Platform
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Connect your AI models to marketing tools and automate your workflows
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Automation</h3>
                <p className="text-gray-600">Automate repetitive tasks with AI-powered workflows</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security for your data and integrations</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
                <p className="text-gray-600">Get insights and optimize your marketing performance</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
            <h3 className="font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <div className="space-y-3">
              {[
                'Unlimited AI-powered workflows',
                'Connect to 50+ marketing tools',
                'Real-time analytics & insights',
                '24/7 customer support',
                'Enterprise-grade security'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 