'use client';

import React, { useActionState, useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Shield, Lock, User, ArrowRight, Eye, EyeOff, Terminal, Activity, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background glowing grid effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-lg shadow-emerald-500/10">
            🦅
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-wide text-base leading-tight flex items-center gap-1.5">
              NEPSE Terminal <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Institutional Wealth Management</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>NEPSE MARKET ONLINE</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Institutional Access Gateway</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Security Verification</h2>
            <p className="text-xs text-slate-400">Sign in to access your FIFO portfolio, TMS ledger, and radar observers</p>
          </div>

          {state?.error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="Enter your username"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer info */}
      <footer className="z-10 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span>Next.js 16.3 App Router • Server-Side JWT Stateless Session</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Optimized for Nepal Stock Exchange (NEPSE)</span>
        </div>
      </footer>
    </div>
  );
}
