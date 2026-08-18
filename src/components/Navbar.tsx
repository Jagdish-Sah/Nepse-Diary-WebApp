'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, ShieldCheck, Zap, Bell, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface NavbarProps {
  onSearchSymbol?: (symbol: string) => void;
  marketStats?: {
    nepseIndex?: number;
    nepseChange?: number;
    totalTurnover?: number;
    lastSyncTime?: string;
  };
  role: 'Admin' | 'View Only';
}

export default function Navbar({ onSearchSymbol, marketStats, role }: NavbarProps) {
  const [nstTime, setNstTime] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Add UTC+5:45 for Nepal Standard Time
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nepalTime = new Date(utc + (5 * 3600000 + 45 * 60000));
      setNstTime(nepalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearchSymbol) {
      onSearchSymbol(searchInput.trim().toUpperCase());
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search ticker (e.g. NABIL, HDL)..."
          className="w-full bg-slate-900/80 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition-all outline-none"
        />
      </form>

      {/* Center Market Ticker Summary */}
      <div className="hidden md:flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400 font-medium">NEPSE:</span>
          <span className="font-semibold text-slate-200">2,745.80</span>
          <span className="flex items-center text-emerald-400 font-semibold gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.20 (+0.52%)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400 font-medium">Daily Turnover:</span>
          <span className="font-semibold text-emerald-400">Rs 4.82 Arba</span>
        </div>
      </div>

      {/* Right System Info & Clock */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{nstTime || '11:45:00 AM'} NST</span>
        </div>

        {/* Security / Mode Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>{role} Mode</span>
        </div>
      </div>
    </header>
  );
}
