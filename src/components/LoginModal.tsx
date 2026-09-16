import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { loginUser, getAuthHint } from '../services/auth';

interface LoginModalProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<{ isCustom: boolean; defaultHint: string | null } | null>(null);

  useEffect(() => {
    getAuthHint().then((res) => {
      setHint(res);
      if (!res.isCustom) {
        setUsername('admin');
        setPassword('password123');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await loginUser(username.trim(), password.trim());
    setLoading(false);

    if (result.success) {
      onLoginSuccess(username.trim());
    } else {
      setError(result.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md transition-all">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header */}
        <div className="p-8 pb-6 text-center border-b border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-b from-neutral-50/50 to-transparent dark:from-neutral-800/30">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-lg shadow-neutral-900/10 dark:shadow-white/5">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Productivity Suite
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to your private personal workspace
          </p>
        </div>

        {/* Card Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/70 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/70 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 font-medium text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security & Env Credentials Info */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Server-verified credentials via <code className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">.env</code></span>
            </div>
            {hint?.defaultHint && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 pl-5">
                Quick test login: <strong className="font-medium text-neutral-700 dark:text-neutral-300">admin</strong> / <strong className="font-medium text-neutral-700 dark:text-neutral-300">password123</strong>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
