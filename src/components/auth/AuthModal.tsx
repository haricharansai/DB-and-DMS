import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Store,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    login,
    register,
    quickLoginAs,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'vendor'>('buyer');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (authModalTab === 'login') {
        const res = await login({ email, password });
        if (!res.success) {
          setErrorMsg(res.message || 'Login failed');
        }
      } else {
        const res = await register({
          name,
          email,
          password,
          role,
          businessName: role === 'vendor' ? businessName : undefined,
          gstin: role === 'vendor' ? gstin : undefined,
        });
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 relative">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Mode Switch */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-heading">
            {authModalTab === 'login' ? 'Welcome Back to MarketNexus' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-slate-500">
            JWT Session Token + bcrypt.js encrypted authentication
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => { openAuthModal('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              authModalTab === 'login'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { openAuthModal('register'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              authModalTab === 'register'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {authModalTab === 'register' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      role === 'buyer'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('vendor')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      role === 'vendor'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Merchant Partner</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Aarav Patel"
                    className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {role === 'vendor' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="Apex Audio Tech"
                      className="w-full bg-slate-50 text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={e => setGstin(e.target.value)}
                      placeholder="29AAAAA0000A1Z5"
                      className="w-full bg-slate-50 text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 outline-none font-mono focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <span>
              {isLoading
                ? 'Validating Credentials...'
                : authModalTab === 'login'
                ? 'Sign In to Account'
                : 'Create Verified Account'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> One-Click Demo Role Accounts
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLoginAs('buyer')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-center transition"
            >
              <p className="text-[10px] font-bold text-indigo-600 uppercase">Customer</p>
              <p className="text-[11px] text-slate-700 font-semibold truncate">Aarav Patel</p>
            </button>

            <button
              onClick={() => quickLoginAs('vendor')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-center transition"
            >
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Vendor</p>
              <p className="text-[11px] text-slate-700 font-semibold truncate">SonicPulse</p>
            </button>

            <button
              onClick={() => quickLoginAs('admin')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl text-center transition"
            >
              <p className="text-[10px] font-bold text-purple-600 uppercase">Admin</p>
              <p className="text-[11px] text-slate-700 font-semibold truncate">Super Admin</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
