'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { WealthRecord } from '@/lib/storage';
import { calculateDrawdown } from '@/lib/nepse-math';

interface WealthViewProps {
  wealth: WealthRecord[];
}

export default function WealthView({ wealth }: WealthViewProps) {
  const sortedWealth = [...wealth].sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  const currentVal = sortedWealth.length > 0 ? sortedWealth[sortedWealth.length - 1].currentValue : 0;
  const initialVal = sortedWealth.length > 0 ? sortedWealth[0].currentValue : 0;

  const totalGain = currentVal - initialVal;
  const totalGainPct = initialVal > 0 ? (totalGain / initialVal) * 100 : 0;

  const values = sortedWealth.map((w) => w.currentValue);
  const { maxDrawdownPct, currentDrawdownPct, peakValue } = calculateDrawdown(values);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          📈 Wealth Analytics &amp; Drawdown Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical net worth trajectory, peak-to-trough drawdown risk analysis, and account compounding.
        </p>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400">Current Net Worth</div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            Rs {currentVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400">Peak Net Worth</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            Rs {peakValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400">Maximum Historical Drawdown</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
            -{maxDrawdownPct.toFixed(2)}%
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400">Current Drawdown from Peak</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${currentDrawdownPct === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            -{currentDrawdownPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Wealth Equity Growth Trajectory
        </h3>
        {sortedWealth.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sortedWealth}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="snapshotDate" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="currentValue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-xs text-slate-500">
            No wealth snapshots logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
