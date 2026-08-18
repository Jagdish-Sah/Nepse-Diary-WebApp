'use client';

import React, { useState } from 'react';
import { Eye, Target, AlertTriangle, PlusCircle, Trash2, CheckCircle2, Search, Sliders } from 'lucide-react';
import { WatchlistRecord, CacheRecord } from '@/lib/storage';

interface WatchlistViewProps {
  watchlist: WatchlistRecord[];
  cache: CacheRecord[];
  role: 'Admin' | 'View Only';
  onSaveWatchlist: (item: any) => Promise<void>;
  onDeleteWatchlist: (symbol: string) => Promise<void>;
}

export default function WatchlistView({
  watchlist,
  cache,
  role,
  onSaveWatchlist,
  onDeleteWatchlist
}: WatchlistViewProps) {
  const [activeTab, setActiveTab] = useState<'radar' | 'observers' | 'manage'>('radar');

  // Form State
  const [sym, setSym] = useState('');
  const [e1, setE1] = useState<number>(0);
  const [em, setEm] = useState<number>(0);
  const [tp, setTp] = useState<number>(0);
  const [htp, setHtp] = useState<number>(0);
  const [sl, setSl] = useState<number>(0);
  const [hsl, setHsl] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Process Watchlist + Live Cache
  const merged = watchlist.map((w) => {
    const live = cache.find((c) => c.symbol === w.symbol.toUpperCase());
    const ltp = live ? live.ltp : 0;
    const changePct = live ? live.changePercent : 0;

    const targetHit = w.targetPrice > 0 && ltp >= w.targetPrice;
    const hardTargetHit = w.hardTarget > 0 && ltp >= w.hardTarget;
    const slHit = w.stopLoss > 0 && ltp <= w.stopLoss;
    const hardSlHit = w.hardSl > 0 && ltp <= w.hardSl;
    const entry1Hit = w.entry1 > 0 && ltp <= w.entry1;
    const mustEntryHit = w.entryMust > 0 && ltp <= w.entryMust;

    return {
      ...w,
      ltp,
      changePct,
      targetHit,
      hardTargetHit,
      slHit,
      hardSlHit,
      entry1Hit,
      mustEntryHit
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'View Only' || !sym.trim()) return;

    await onSaveWatchlist({
      symbol: sym.toUpperCase().trim(),
      targetPrice: Number(tp),
      stopLoss: Number(sl),
      hardTarget: Number(htp),
      hardSl: Number(hsl),
      entry1: Number(e1),
      entryMust: Number(em),
      notes
    });

    setSym('');
    setNotes('');
  };

  const entriesTriggered = merged.filter((m) => m.entry1Hit || m.mustEntryHit);
  const exitsTriggered = merged.filter((m) => m.targetHit || m.slHit || m.hardTargetHit || m.hardSlHit);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            👀 Watchlist Radar &amp; Signal Observers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live market observation deck with dynamic entry/exit triggers and investment thesis tracking.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'radar', label: '📡 Radar' },
            { id: 'observers', label: '🔎 Observers' },
            { id: 'manage', label: '🛠️ Manage' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Total Tracked Symbols</div>
              <div className="text-2xl font-bold text-slate-100 font-mono mt-1">{merged.length}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Entry Zones Active</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{entriesTriggered.length}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Exit / Target Zones Active</div>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{exitsTriggered.length}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4 text-right">LTP</th>
                    <th className="py-3 px-4 text-right">Change</th>
                    <th className="py-3 px-4 text-right">Entry 1</th>
                    <th className="py-3 px-4 text-right">Must Entry</th>
                    <th className="py-3 px-4 text-right">Target</th>
                    <th className="py-3 px-4 text-right">Stop Loss</th>
                    <th className="py-3 px-4">Thesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {merged.length > 0 ? (
                    merged.map((row) => (
                      <tr key={row.symbol} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-100 font-sans flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {row.symbol}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                          Rs {row.ltp > 0 ? row.ltp.toFixed(2) : '-'}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${row.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {row.changePct >= 0 ? '+' : ''}{row.changePct.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-400/90">{row.entry1 || '-'}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">{row.entryMust || '-'}</td>
                        <td className="py-3.5 px-4 text-right text-amber-400 font-bold">{row.targetPrice || '-'}</td>
                        <td className="py-3.5 px-4 text-right text-rose-400">{row.stopLoss || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-sans truncate max-w-xs">{row.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                        No symbols in Watchlist. Add tickers in the Manage tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OBSERVERS */}
      {activeTab === 'observers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              🛒 Entry Observers ({entriesTriggered.length})
            </h3>
            {entriesTriggered.length > 0 ? (
              entriesTriggered.map((item) => (
                <div key={item.symbol} className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                  🔥 <strong>{item.symbol}</strong> is in Entry Zone! (LTP: Rs {item.ltp})
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No symbols currently in target buy entry zones.</p>
            )}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              🎯 Exit &amp; Stop Loss Observers ({exitsTriggered.length})
            </h3>
            {exitsTriggered.length > 0 ? (
              exitsTriggered.map((item) => (
                <div key={item.symbol} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium">
                  🎯 <strong>{item.symbol}</strong> target or SL triggered! (LTP: Rs {item.ltp})
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No target or stop-loss triggers active.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE */}
      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              ➕ Add / Update Watchlist Ticker
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Symbol Ticker</label>
                <input
                  type="text"
                  value={sym}
                  onChange={(e) => setSym(e.target.value.toUpperCase())}
                  placeholder="e.g. HDL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price 1</label>
                  <input
                    type="number"
                    value={e1}
                    onChange={(e) => setE1(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Must Buy Price</label>
                  <input
                    type="number"
                    value={em}
                    onChange={(e) => setEm(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Price</label>
                  <input
                    type="number"
                    value={tp}
                    onChange={(e) => setTp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss Price</label>
                  <input
                    type="number"
                    value={sl}
                    onChange={(e) => setSl(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Investment Thesis Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thesis logic..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={role === 'View Only'}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                💾 Save Symbol to Watchlist
              </button>
            </form>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              🗑️ Tracked Watchlist Items
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {watchlist.map((w) => (
                <div key={w.symbol} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-slate-100 font-mono">{w.symbol}</span>
                    <span className="text-slate-400 ml-2">Target: Rs {w.targetPrice} | SL: Rs {w.stopLoss}</span>
                  </div>
                  {role === 'Admin' && (
                    <button
                      onClick={() => onDeleteWatchlist(w.symbol)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
