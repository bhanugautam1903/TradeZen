import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCcw, ArrowRight, Fingerprint } from 'lucide-react';
import { auth, googleProvider, appleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthScreenProps {
  onLogin: (sessionData: any) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [view, setView] = useState<'login' | 'mfa'>('login');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleMfaChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...mfaCode];
    newCode[index] = value;
    setMfaCode(newCode);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackendLogin = async (user: any) => {
    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          providerData: user.providerData
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onLogin(data.session);
      } else {
        setMessage({ text: data.message || 'Failed to sync with backend server', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Network error authorizing terminal session.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        sessionStorage.setItem('tempToken', data.tempToken);
        setView('mfa');
        setMessage(null);
      } else {
        setMessage({ text: data.message || 'Failed to send OTP code.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: 'Network connection error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const [otpTimer, setOtpTimer] = useState(0);

  const handleResendOtp = async () => {
    handleEmailOtpSubmit({ preventDefault: () => {} } as any);
    setOtpTimer(60);
  };

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const tempToken = sessionStorage.getItem('tempToken');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ otp: mfaCode.join('') })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        sessionStorage.removeItem('tempToken');
        onLogin(data.session);
      } else {
        setMessage({ text: data.message || 'Invalid OTP code.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: 'Network verification error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: any) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await signInWithPopup(auth, provider);
      await handleBackendLogin(result.user);
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication provider error', type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 bg-teal-500/20 blur-[24px] rounded-full scale-125 pointer-events-none"></div>
          <svg className="w-16 h-16 drop-shadow-xl relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="36" stroke="url(#zen-grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="170 60" />
            <path d="M 35 65 L 72 28" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
            <path d="M 52 28 L 72 28 L 72 48" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="35" cy="65" r="4" fill="#34d399" />
            <defs>
              <linearGradient id="zen-grad" x1="14" y1="86" x2="86" y2="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f766e" />
                <stop offset="0.5" stopColor="#14b8a6" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 className="mt-2 text-center text-3xl font-black text-white tracking-tight">TradeZen</h2>
        <p className="mt-1 text-center text-sm text-slate-400 font-medium">Invest Smarter, Grow Faster</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-[0_0_40px_rgba(20,184,166,0.05)] sm:rounded-2xl sm:px-10 border border-slate-800/80 relative overflow-hidden">
          
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {message && (
            <div className={`mb-4 mx-4 mt-2 p-3 rounded-lg text-sm font-semibold border relative z-10 ${message.type === 'success' ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' : message.type === 'error' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-blue-500/10 border-blue-500/50 text-blue-400'}`}>
              {message.text}
            </div>
          )}

          {view === 'login' && (
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">Private Wealth Portal</h3>
                <p className="text-xs text-slate-500 mt-1">Access your portfolio with Multi-Factor Authentication</p>
              </div>

              <form className="space-y-5" onSubmit={handleEmailOtpSubmit}>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1.5 font-mono">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-lg bg-slate-950/80 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="investor@example.com"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> Transmitting...</span>
                    ) : (
                      <span className="flex items-center gap-2">Send Secure OTP Code <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-900 text-slate-500 text-[10px] font-mono uppercase tracking-widest">Or authenticate via provider</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleProviderSignIn(googleProvider); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 shadow-sm text-sm font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none transition-colors">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleProviderSignIn(appleProvider); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 shadow-sm text-sm font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none transition-colors">
                    <svg className="w-4 h-4 shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.078 1.52-.048 2.122-.962 3.94-.962 1.802 0 2.366.962 3.96.936 1.636-.026 2.66-1.5 3.65-2.937 1.144-1.666 1.614-3.284 1.636-3.366-.037-.015-3.149-1.206-3.176-4.814-.022-3.021 2.47-4.475 2.585-4.555-1.425-2.079-3.623-2.362-4.409-2.417-1.745-.116-3.483 1.084-4.321 1.084-.816 0-2.222-1.053-3.77-1.01z" />
                      <path d="M14.773 4.383c.795-.964 1.332-2.302 1.186-3.619-1.127.045-2.54.747-3.361 1.733-.733.873-1.339 2.238-1.17 3.528 1.258.098 2.541-.676 3.345-1.642z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'mfa' && (
            <div className="relative z-10 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Fingerprint className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Verify Your Identity</h3>
                <p className="text-xs text-slate-500 mt-1">Check your email for the 6-digit verification code. <span className="font-mono text-teal-400 bg-teal-500/10 px-1 py-0.5 rounded">(Or check terminal for mock OTP)</span></p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input 
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text" 
                      maxLength={1}
                      value={mfaCode[i]}
                      onChange={(e) => handleMfaChange(i, e.target.value)}
                      onKeyDown={(e) => handleMfaKeyDown(i, e)}
                      className="w-10 h-12 text-center text-xl font-mono font-bold bg-slate-950 border border-slate-700 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-white transition-all"
                      placeholder="-"
                    />
                  ))}
                </div>
                <button type="submit" disabled={isLoading} className="w-full font-bold py-2.5 px-4 rounded-lg text-slate-950 bg-teal-500 hover:bg-teal-400 transition-all mt-4">
                  {isLoading ? 'Decrypting Session...' : 'Verify & Enter'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button type="button" onClick={handleResendOtp} disabled={otpTimer > 0} className="text-xs text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50">
                  {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend Code'}
                </button>
              </div>

              <button onClick={() => setView('login')} className="mt-6 w-full text-center text-xs text-slate-400 hover:text-white transition-colors">
                Cancel Authentication
              </button>
            </div>
          )}

        </div>
        
        {/* Strict Compliance Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-8 font-mono px-4">
          Unlicensed access to TradeZen terminals is strictly prohibited. Network anomalies are logged in our immutable cloud registry.
        </p>

      </div>
    </div>
  );
}

