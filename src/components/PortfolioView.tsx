'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Sliders,
  Shield,
  Percent,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Tag
} from 'lucide-react';
import { PortfolioRecord, CacheRecord } from '@/lib/storage';
import { calculateFifoHoldings, calculateNepseFees } from '@/lib/nepse-math';

interface PortfolioViewProps {
  portfolio: PortfolioRecord[];
  cache: CacheRecord[];
  role: 'Admin' | 'View Only';
}

export default function PortfolioView({ portfolio, cache, role }: PortfolioViewProps) {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');

  const activeHoldings = calculateFifoHoldings(portfolio);

  // Compute metrics with exact NEPSE sell deduction logic
  let totalCostSum = 0;
  let totalReceivableSum = 0;
  let totalTruePlSum = 0;

  const rows = activeHoldings.map((h) => {
    const live = cache.find((c) => c.symbol === h.symbol);
    const ltp = live ? live.ltp : h.wacc;

    // Exact Sell Reversal Fee Math at LTP
    const feeRes = calculateNepseFees({
      qty: h.netQty,
      price: ltp,
      trxType: 'SELL',
      wacc: h.wacc,
      cgtRate: 0.10 // Conservative 10% unrealized CGT estimate
    });

    const netReceivable = feeRes.totalPayableOrReceivable;
    const truePlAmt = netReceivable - h.totalCost;
    const truePlPct = h.totalCost > 0 ? (truePlAmt / h.totalCost) * 100 : 0;
    const breakeven = feeRes.breakevenPrice || h.wacc * 1.005 + 25 / h.netQty;

    totalCostSum += h.totalCost;
    totalReceivableSum += netReceivable;
    totalTruePlSum += truePlAmt;

    // Calculate days held
    const daysHeld = Math.max(0, Math.floor((new Date().getTime() - new Date(h.firstBuyDate).getTime()) / (1000 * 3600 * 24)));
    const cgtEst = truePlAmt > 0 ? truePlAmt * (daysHeld > 365 ? 0.05 : 0.075) : 0;

    return {
      ...h,
      ltp,
      breakeven,
      netReceivable,
      truePlAmt,
      truePlPct,
      daysHeld,
      cgtEst
    };
  });

  // Calculate weights & sort descending
  const totalVal = rows.reduce((s, r) => s + r.netReceivable, 0);
  rows.forEach((r) => {
    (r as any).weight = totalVal > 0 ? (r.netReceivable / totalVal) * 100 : 0;
  });
  rows.sort((a: any, b: any) => b.weight - a.weight);

  const totalPct = totalCostSum > 0 ? (totalTruePlSum / totalCostSum) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            💼 Active Stock Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            NEPSE FIFO Tax-Lot Engine with Real-Time Breakeven & Fee-Deducted Valuation.
          </p>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'basic' ? 'advanced' : 'basic')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>{viewMode === 'basic' ? 'Switch to Pro Advanced Analytics' : 'Back to Basic Ledger'}</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Active Investment</div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            Rs {totalCostSum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Sum of WACC Cost Basis</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400 mb-1">Net Receivable (at LTP)</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            Rs {totalReceivableSum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cash in bank after ALL broker, SEBON & DP fees</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400 mb-1">True Unrealized P/L</div>
          <div className={`text-2xl font-bold font-mono ${totalTruePlSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Rs {totalTruePlSum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className={`text-xs mt-1 font-semibold ${totalTruePlSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalTruePlSum >= 0 ? '+' : ''}{totalPct.toFixed(2)}% Net Yield
          </div>
        </div>
      </div>

      {/* PRO-TRADER ADVANCED ANALYTICS (When Active) */}
      {viewMode === 'advanced' && (
        <div className="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" /> Pro-Trader Quantitative Analytics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Panic Meter */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Concentration Risk Meter
              </h4>
              {rows.filter((r: any) => r.weight > 25).length > 0 ? (
                rows
                  .filter((r: any) => r.weight > 25)
                  .map((r: any) => (
                    <div key={r.symbol} className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 mb-2">
                      ⚠️ <strong>{r.symbol}</strong> represents {r.weight.toFixed(1)}% of total equity. Consider rebalancing.
                    </div>
                  ))
              ) : (
                <p className="text-xs text-emerald-400">✅ Excellent risk diversification. No single holding exceeds 25%.</p>
              )}
            </div>

            {/* Tax Reserve Estimate */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Estimated CGT Tax Reserve
              </h4>
              <div className="text-xl font-bold text-slate-200 font-mono">
                Rs {rows.reduce((s, r) => s + r.cgtEst, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Calculated based on 5% (&gt;365 days) / 7.5% (&le;365 days) tax rates.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Holdings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Active Positions ({rows.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Ticker</th>
                <th className="py-3 px-4 text-right">Units</th>
                <th className="py-3 px-4 text-right">WACC</th>
                <th className="py-3 px-4 text-right">Breakeven</th>
                <th className="py-3 px-4 text-right">LTP</th>
                <th className="py-3 px-4 text-right">Unrealized P/L</th>
                <th className="py-3 px-4 text-right">ROI %</th>
                <th className="py-3 px-4 text-center">Weightage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {rows.length > 0 ? (
                rows.map((row: any) => {
                  const isProfit = row.truePlAmt >= 0;
                  return (
                    <tr key={row.symbol} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="py-3.5 px-4 font-bold text-slate-200 font-sans flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {row.symbol}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">{row.netQty.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">Rs {row.wacc.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right text-amber-400/90 font-medium">Rs {row.breakeven.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-100 font-bold">Rs {row.ltp.toFixed(2)}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rs {row.truePlAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{row.truePlPct.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden inline-block align-middle">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, row.weight)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-2 font-sans">{row.weight.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs font-sans">
                    No active positions found in ledger. Add a BUY transaction to populate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
