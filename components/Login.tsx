import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Loader2,
  ArrowRight,
  CheckCircle,
  Mail,
  ArrowLeft,
  Smartphone,
  Server,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  Radio
} from 'lucide-react';
import { sapAuthService, getRawODataEndpoint } from '../services/sapAuthService';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password' | '2fa'>('login');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [require2FA, setRequire2FA] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string>('');

  const sapEndpoint = getRawODataEndpoint();

  useEffect(() => {
    // Ensure clean state when landing on Login
    sapAuthService.logout();
  }, []);

  const handleSapLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const result = await sapAuthService.login(username, password);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify your SAP credentials.');
        setLoading(false);
        return;
      }

      const displayName = result.user?.displayName || username;
      setAuthenticatedUser(displayName);

      if (require2FA) {
        setView('2fa');
        setLoading(false);
      } else {
        setSuccessMessage('SAP Basic Authentication verified. Access granted.');
        // onLogin triggers App.tsx handleLogin which calls physicianProfileService.fetchProfile()
        // using session.username (the raw SAP ID). Do NOT call fetchProfile here to avoid duplicates.
        setTimeout(() => {
          onLogin(displayName);
          setLoading(false);
        }, 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during SAP login.';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(authenticatedUser || username || 'Dr. Sarah Connor');
      setLoading(false);
    }, 700);
  };

  const handleDemoLogin = () => {
    setErrorMessage(null);
    setLoading(true);
    const demo = sapAuthService.loginAsDemo(username || 'Dr. Sarah Connor');
    setSuccessMessage('Logged in with Demo / Offline credentials.');
    setTimeout(() => {
      onLogin(demo.user?.displayName || 'Dr. Sarah Connor');
      setLoading(false);
    }, 400);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResetSent(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans">
      {/* Left Side: Visual Section */}
      <div className="w-full md:w-1/2 lg:w-3/5 h-[30vh] md:h-auto relative flex-shrink-0 bg-slate-900">
        <img
          src="https://etimg.etb2bimg.com/photo/98429796.cms"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          alt="Hospital Facility"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />

      </div>

      {/* Right Side: Authentication Section */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:p-16 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-8">

          {/* Brand Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Physician Portal</h1>
                <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-widest">Clinical Care Network</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight uppercase">
                {view === 'login' ? (
                  <span className="text-blue-600">Sign In</span>
                ) : view === '2fa' ? (
                  <>Two-Step <span className="text-blue-600">Verification</span>.</>
                ) : (
                  <>Account <span className="text-blue-600">Recovery</span>.</>
                )}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {view === 'login'
                  ? 'Authenticate securely using your SAP ERP credentials via Basic Auth.'
                  : view === '2fa'
                    ? 'Enter the 6-digit confirmation code to complete two-factor authentication.'
                    : 'Enter your registered email address to receive password reset instructions.'
                }
              </p>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">
                <div className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-0.5">Authentication Failed</div>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
              <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          {view === '2fa' ? (
            /* 2FA Form */
            <form className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleVerify2FA}>
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                    SMS Verification Code
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300 tracking-[0.4em] text-center text-lg"
                      placeholder="••••••"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 ml-1 font-medium">
                    SAP user <span className="font-bold text-slate-700">{authenticatedUser || username}</span> verified. Enter 6-digit 2FA code.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-600 transform transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 disabled:opacity-60 flex items-center justify-center gap-3 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); setErrorMessage(null); }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider cursor-pointer"
                  onClick={() => {
                    setVerificationCode('123456');
                  }}
                >
                  Auto-fill Test Code (123456)
                </button>
              </div>
            </form>
          ) : view === 'login' ? (
            /* SAP Login Form */
            <form className="space-y-5" onSubmit={handleSapLogin}>
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                    SAP Username / User ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setErrorMessage(null); }}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-300 text-sm"
                      placeholder="e.g. PHYSICIAN_USER"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                    SAP Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-300 text-sm"
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-[11px]">Require 2FA SMS Step</span>
                </label>

                <button
                  type="button"
                  onClick={() => { setView('forgot-password'); setErrorMessage(null); }}
                  className="text-orange-500 hover:text-orange-600 transition-colors uppercase font-semibold text-[10px] tracking-wider cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-600 transform transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10 disabled:opacity-60 flex items-center justify-center gap-3 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>AUTHENTICATING SAP...</span>
                  </>
                ) : (
                  <>
                    <span>Login with SAP</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Demo Mode Fallback for testing */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider py-1 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Or continue with Demo Mode (Offline Testing)</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </form>
          ) : (
            /* Forgot Password View */
            <div className="space-y-6 animate-in fade-in duration-300">
              {!resetSent ? (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div className="group">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                      Registered Email / SAP ID
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-300 text-sm"
                        placeholder="doctor@hospital.org"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-700 transform transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-60 flex items-center justify-center gap-3 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>SENDING...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Request</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-emerald-600" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-emerald-900 uppercase tracking-tight">Reset Request Submitted</h4>
                    <p className="text-emerald-700 text-xs font-medium leading-relaxed">
                      If an SAP account exists for <span className="font-bold">{resetEmail}</span>, recovery instructions have been dispatched. Contact your SAP Basis administrator if you need immediate assistance.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setView('login');
                  setResetSent(false);
                  setResetEmail('');
                  setErrorMessage(null);
                }}
                className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
