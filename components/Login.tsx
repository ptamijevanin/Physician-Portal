
import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Loader2, ArrowRight, CheckCircle, Mail, ArrowLeft, Smartphone } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'forgot-password' | '2fa'>('login');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setView('2fa');
      setLoading(false);
    }, 1200);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(username || 'Dr. Sarah Connor');
      setLoading(false);
    }, 1200);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResetSent(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans">
      {/* Left Side: Pure Visual Section */}
      <div className="w-full md:w-1/2 lg:w-3/5 h-[30vh] md:h-auto relative flex-shrink-0">
        <img 
          src="https://etimg.etb2bimg.com/photo/98429796.cms" 
          /*src="https://picsum.photos/seed/hospital-building/1200/1600"*/ 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hospital Building"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Gradient Overlay to ensure it feels integrated */}
        <div className="absolute inset-0 bg-slate-900/20 md:bg-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10"></div>
      </div>

      {/* Right Side: Content & Authentication Section */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md mx-auto space-y-12">
          {/* Brand Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tighter uppercase">Physician Portal</h1>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight tracking-tighter uppercase">
                {view === 'login' ? (
                  <>Precision <span className="text-blue-600">Care</span> <br /> Portal.</>
                ) : view === '2fa' ? (
                  <>Two-Step <span className="text-blue-600">Verification</span>.</>
                ) : (
                  <>Account <span className="text-blue-600">Recovery</span> <br /> System.</>
                )}
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                {view === 'login' 
                  ? "Access the comprehensive physician network for real-time patient analytics and clinical workflows."
                  : view === '2fa'
                  ? "To protect patient data, please verify your identity using the code sent to your mobile device."
                  : "Enter your registered email address to receive password recovery instructions."
                }
              </p>
            </div>
          </div>

          {view === '2fa' ? (
            /* 2FA Form */
            <form className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500" onSubmit={handleVerify2FA}>
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">SMS Verification Code</label>
                  <div className="relative">
                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-200 tracking-[0.5em] text-center text-xl"
                      placeholder="••••••"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 ml-1 font-medium">
                    We've sent a 6-digit code to your registered mobile device ending in <span className="font-bold text-slate-700">**42</span>.
                  </p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-600 transform transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/10 disabled:opacity-70 flex items-center justify-center gap-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    VERIFYING...
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button 
                  type="button"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                  onClick={() => {
                    setVerificationCode('');
                    alert('A new code has been sent to your device.');
                  }}
                >
                  Resend Code
                </button>
              </div>
            </form>
          ) : view === 'login' ? (
            /* Login Form */
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Username</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-200"
                      placeholder="Medical ID or Email"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end text-[11px] font-semibold tracking-widest">
                <button 
                  type="button"
                  onClick={() => setView('forgot-password')}
                  className="text-orange-500 hover:text-orange-600 transition-colors uppercase"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-600 transform transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/10 disabled:opacity-70 flex items-center justify-center gap-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    AUTHORIZING...
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password View */
            <div className="space-y-8">
              {!resetSent ? (
                <form className="space-y-8" onSubmit={handleResetPassword}>
                  <div className="group">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-blue-600 transition-colors">Recovery Email</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        type="email" 
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-200"
                        placeholder="doctor@yashian.md"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-6 rounded-3xl font-semibold uppercase tracking-[0.2em] hover:bg-blue-700 transform transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/10 disabled:opacity-70 flex items-center justify-center gap-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="text-emerald-600" size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-emerald-900 uppercase tracking-tight">Recovery Link Sent</h4>
                    <p className="text-emerald-700 text-sm font-medium leading-relaxed">
                      If an account exists for <span className="font-bold">{resetEmail}</span>, you will receive password reset instructions shortly.
                    </p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setView('login');
                  setResetSent(false);
                  setResetEmail('');
                }}
                className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft size={14} />
                Back to Secure Entrance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
