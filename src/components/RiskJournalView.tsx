'use client';

import React, { useState } from 'react';
import { Brain, Star, Activity, PlusCircle, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { JournalRecord, AuditRecord } from '@/lib/storage';
import { calculatePositionSize } from '@/lib/nepse-math';

interface RiskJournalViewProps {
  journal: JournalRecord[];
  auditLogs: AuditRecord[];
  role: 'Admin' | 'View Only';
  onAddJournal: (entry: any) => Promise<void>;
}

export default function RiskJournalView({
  journal,
  auditLogs,
  role,
  onAddJournal
}: RiskJournalViewProps) {
  const [activeTab, setActiveTab] = useState<'sizer' | 'journal' | 'diagnostics'>('journal');

  // Position Sizer State
  const [cap, setCap] = useState<number>(500000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [entry, setEntry] = useState<number>(500);
  const [sl, setSl] = useState<number>(475);
  const [tp, setTp] = useState<number>(575);

  // Journal Form State
  const [jSym, JSym] = useState('');
  const [topic, setTopic] = useState('');
  const [feeling, setFeeling] = useState('Disciplined');
  const [star, setStar] = useState<number>(8);
  const [thesis, setThesis] = useState('');
  const [remark, setRemark] = useState('');

  // Position Sizing Math
  let pos = null;
  if (entry > sl) {
    try {
      pos = calculatePositionSize({
        accountSize: cap,
        riskPercent: riskPct,
        entryPrice: entry,
        stopLossPrice: sl,
        takeProfitPrice: tp
      });
    } catch {}
  }

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'View Only' || !topic || !thesis) return;

    await onAddJournal({
      symbol: jSym ? jSym.toUpperCase().trim() : 'GENERAL',
      topic,
      feeling,
      star: Number(star),
      tradeThesis: thesis,
      finalRemark: remark
    });

    setTopic('');
    setThesis('');
    setRemark('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🧠 Risk Management &amp; Trading Psychology Journal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforce disciplined position sizing, log trade setups with star ratings, and monitor system diagnostics.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'sizer', label: '⚖️ Sizer' },
            { id: 'journal', label: '📓 Journal' },
            { id: 'diagnostics', label: '🚨 Diagnostics' }
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

      {/* TAB 1: SIZER */}
      {activeTab === 'sizer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Position Sizing Parameters
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Account Capital (Rs)</label>
                <input
                  type="number"
                  value={cap}
                  onChange={(e) => setCap(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Risk per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Entry Price</label>
                <input
                  type="number"
                  value={entry}
                  onChange={(e) => setEntry(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Stop Loss</label>
                <input
                  type="number"
                  value={sl}
                  onChange={(e) => setSl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Take Profit</label>
                <input
                  type="number"
                  value={tp}
                  onChange={(e) => setTp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Output Recommendation
            </h3>

            {pos ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Allowed Buy Units</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                      {pos.unitsToBuy.toLocaleString()} units
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Risk / Reward Ratio</div>
                    <div className={`text-2xl font-bold font-mono mt-1 ${pos.isGoodRr ? 'text-emerald-400' : 'text-amber-400'}`}>
                      1 : {pos.riskRewardRatio.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Total Order Capital:</span>
                    <span>Rs {pos.totalInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span className="font-sans">Max Loss on Stop Loss:</span>
                    <span>Rs {pos.maxRiskAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                Stop loss price must be lower than entry price.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL */}
      {activeTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* New Entry Form */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <PlusCircle className="w-4 h-4 text-emerald-400" /> New Mindset &amp; Setup Journal Entry
            </h3>

            <form onSubmit={handleJournalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Symbol Ticker</label>
                  <input
                    type="text"
                    value={jSym}
                    onChange={(e) => JSym(e.target.value.toUpperCase())}
                    placeholder="GENERAL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Topic / Pattern</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Midday Breakout"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Emotional Mindset</label>
                  <select
                    value={feeling}
                    onChange={(e) => setFeeling(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                  >
                    <option value="Disciplined">Disciplined</option>
                    <option value="Systematic">Systematic</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Anxious">Anxious</option>
                    <option value="FOMO">FOMO</option>
                    <option value="Revenge Trading">Revenge Trading</option>
                    <option value="Overconfident">Overconfident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Setup Rating ({star}★)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={star}
                    onChange={(e) => setStar(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Trade Thesis &amp; Context</label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Rationale behind entry..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Post-Trade Lessons / Remark</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Lessons learned after outcome..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={role === 'View Only'}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                💾 Save Journal Entry
              </button>
            </form>
          </div>

          {/* Logs List */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-400" /> Historical Trade Journal Logs ({journal.length})
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {journal.map((item) => (
                <div key={item.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 font-mono">{item.symbol}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 border border-slate-700 font-semibold">
                      {item.star} ★ Rating
                    </span>
                  </div>

                  <div className="font-semibold text-slate-300">{item.topic}</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">{item.tradeThesis}</div>

                  {item.finalRemark && (
                    <div className="p-2 bg-slate-900/90 rounded-lg text-slate-400 italic text-[11px] border border-slate-800">
                      Lessons: {item.finalRemark}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>Mindset: <strong className="text-slate-400">{item.feeling}</strong></span>
                    <span>{item.dateTimeStamp ? new Date(item.dateTimeStamp).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-emerald-400" /> System Diagnostics &amp; Event Logs ({auditLogs.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (NST)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-sans">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }) : '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400 font-sans">{log.action}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.symbol || '-'}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
