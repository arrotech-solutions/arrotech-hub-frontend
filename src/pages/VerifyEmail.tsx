import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle';
import logo from '../assets/Logo/fulllogo_transparent.png';
import logoIcon from '../assets/Logo/icononly_transparent_nobuffer.png';

const RESEND_COOLDOWN = 60; // seconds

const VerifyEmail: React.FC = () => {
  const { user, verifyEmail, resendVerification, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already verified, redirect away
  useEffect(() => {
    if (user?.email_verified) {
      navigate('/onboarding', { replace: true });
    }
  }, [user?.email_verified, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    // Focus the input after the last pasted digit
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Auto-submit when all 6 digits are entered
  const handleSubmit = useCallback(async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyEmail(fullCode);
      setIsVerified(true);
      // Wait a moment to show success animation, then redirect
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid code. Please try again.';
      setError(detail);
      // Clear the code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [code, verifyEmail, navigate]);

  // Auto-submit when all digits are filled
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isVerifying && !isVerified) {
      handleSubmit();
    }
  }, [code, isVerifying, isVerified, handleSubmit]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      await resendVerification();
      setResendCooldown(RESEND_COOLDOWN);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      // Error toast already shown by hook
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = user?.email
    ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '***';

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Email Verified!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Redirecting you to your dashboard...
          </p>
          <div className="mt-4 flex justify-center">
            <Sparkles className="w-5 h-5 text-emerald-500 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative bg-slate-50 dark:bg-slate-900 transition-colors">
      <SEO
        title="Verify Your Email"
        description="Enter the verification code sent to your email to complete your Arrotech Hub registration."
        url="/verify-email"
      />
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 group hover:scale-[1.02] transition-transform mb-4">
              <img src={logoIcon} alt="Arrotech Hub" className="h-6 w-auto object-contain" />
              <span className="text-[15px] font-black bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent tracking-tighter">ARROTECH</span>
            </div>
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="absolute inset-0 bg-violet-500/10 dark:bg-violet-500/20 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full shadow-lg shadow-violet-500/25">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              We sent a 6-digit verification code to
              <br />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {maskedEmail}
              </span>
            </p>
          </div>

          {/* OTP Input Card */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-gray-100 dark:border-slate-800/50 transition-colors">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors">
                <ShieldCheck className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* OTP Inputs */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className={`
                    w-12 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none
                    transition-all duration-200
                    bg-white dark:bg-slate-800
                    text-slate-900 dark:text-white
                    ${digit
                      ? 'border-violet-500 dark:border-violet-400 shadow-sm shadow-violet-500/20'
                      : 'border-slate-200 dark:border-slate-700'
                    }
                    focus:border-violet-500 dark:focus:border-violet-400
                    focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    placeholder-slate-300 dark:placeholder-slate-600
                  `}
                  placeholder="·"
                  id={`otp-input-${index}`}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleSubmit}
              disabled={isVerifying || code.join('').length !== 6}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-lg font-semibold text-sm hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none"
              id="verify-email-button"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-slate-900 border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Resend Section */}
            <div className="mt-5 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Didn't receive the code? Check your spam folder or
              </p>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                id="resend-verification-button"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend verification code'
                }
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-5 bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-3 transition-colors">
              <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                <span className="font-semibold">💡 Tip:</span> The code expires in 15 minutes.
                If you entered the wrong email during registration, you can{' '}
                <button
                  onClick={async () => { await logout(); navigate('/register'); }}
                  className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  create a new account
                </button>
                .
              </p>
            </div>
          </div>

          {/* Sign out option */}
          <div className="mt-4 text-center">
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
