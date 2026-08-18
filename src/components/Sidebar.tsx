'use client';

import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Building2,
  Calculator,
  Eye,
  Brain,
  History,
  TrendingUp,
  Bot,
  Database,
  FileText,
  RefreshCw,
  Lock,
  UserCheck,
  ShieldAlert,
  LogOut
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'portfolio'
  | 'add-transaction'
  | 'tms'
  | 'trade-sim'
  | 'watchlist'
  | 'risk-journal'
  | 'history'
  | 'wealth'
  | 'ai-analyst'
  | 'manage-data'
  | 'activity-log';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  role: 'Admin' | 'View Only';
  setRole: (role: 'Admin' | 'View Only') => void;
  onSync: () => void;
  isSyncing: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  setRole,
  onSync,
  isSyncing
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard Overview', icon: LayoutDashboard, category: 'Core' },
    { id: 'portfolio' as NavTab, label: 'Active Portfolio', icon: Briefcase, category: 'Core' },
    { id: 'add-transaction' as NavTab, label: 'Add Transaction', icon: PlusCircle, category: 'Trading' },
    { id: 'tms' as NavTab, label: 'My TMS (Ledger)', icon: Building2, category: 'Trading' },
    { id: 'trade-sim' as NavTab, label: 'Trade Simulation', icon: Calculator, category: 'Analytics' },
    { id: 'watchlist' as NavTab, label: 'Watchlist & Radar', icon: Eye, category: 'Analytics' },
    { id: 'risk-journal' as NavTab, label: 'Risk & Journal', icon: Brain, category: 'Analytics' },
    { id: 'history' as NavTab, label: 'Realized History', icon: History, category: 'Analytics' },
    { id: 'wealth' as NavTab, label: 'Wealth Trajectory', icon: TrendingUp, category: 'Analytics' },
    { id: 'ai-analyst' as NavTab, label: 'AI Market Analyst', icon: Bot, category: 'Intelligence' },
    ...(role === 'Admin'
      ? [
          { id: 'manage-data' as NavTab, label: 'Admin: Manage Data', icon: Database, category: 'System' },
          { id: 'activity-log' as NavTab, label: 'System Activity Log', icon: FileText, category: 'System' }
        ]
      : [])
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 text-slate-200 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-lg shadow-emerald-500/10">
            🦅
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-wide text-base leading-tight flex items-center gap-1.5">
              NEPSE Terminal <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Enterprise Stock Diary</p>
          </div>
        </div>

        {/* Role Badge & Switcher */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {role === 'Admin' ? (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-medium text-slate-300">
              Role: <strong className={role === 'Admin' ? 'text-emerald-400' : 'text-amber-400'}>{role}</strong>
            </span>
          </div>
          <button
            onClick={() => setRole(role === 'Admin' ? 'View Only' : 'Admin')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors border border-slate-700"
            title="Toggle user permissions mode"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* System Actions & Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing Market...' : 'Sync Live Market'}
        </button>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>v2.5 Next.js App</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Neon Live
          </span>
        </div>
      </div>
    </aside>
  );
}
