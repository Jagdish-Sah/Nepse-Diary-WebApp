'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight, ShieldCheck, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { calculateNepseFees, calculatePositionSize } from '@/lib/nepse-math';

export default function TradeSimulationView() {
  const [activeSubTab, setActiveSubTab] = useState<'wacc' | 'sell' | 'recovery' | 'kelly'>('wacc');

  // WACC Simulator state
  const [existQty, setExistQty] = useState<number>(100);
  const [existWacc, setExistWacc] = useState<number>(500.0);
  const [newQty, setNewQty] = useState<number>(50);
  const [newPrice, setNewPrice] = useState<number>(450.0);

  // Sell Simulator state
  const [sellQty, setSellQty] = useState<number>(100);
  const [sellPrice, setSellPrice] = useState<number>(600.0);
  const [sellWacc, setSellWacc] = useState<number>(500.0);
  const [sellCgt, setSellCgt] = useState<'short' | 'long'>('short');

  // Loss Recovery state
  const [dropPct, setDropPct] = useState<number>(20);

  // Position Sizing state
  const [accCapital, setAccCapital] = useState<number>(500000);
  const [riskPct, setRiskPct] = useState<number>(1.5);
  const [kEntry, setKEntry] = useState<number>(500);
  const [kSl, setKSl] = useState<number>(470);
  const [kTp, setKTp] = useState<number>(580);

  // Math for WACC Sim
  const buyFee = calculateNepseFees({ qty: newQty, price: newPrice, trxType: 'BUY' });
  const totalNewCost = (existQty * existWacc) + buyFee.totalPayableOrReceivable;
  const newTotalQty = existQty + newQty;
  const simulatedWacc = newTotalQty > 0 ? totalNewCost / newTotalQty : 0;

  // Math for Sell Sim
  const sellFee = calculateNepseFees({
    qty: sellQty,
    price: sellPrice,
    trxType: 'SELL',
    wacc: sellWacc,
    cgtRate: sellCgt === 'long' ? 0.05 : 0.075
  });

  // Math for Recovery
  const recoveryPct = dropPct < 100 ? (dropPct / (100 - dropPct)) * 100 : 0;

  // Math for Position Sizing
  let posSize = null;
  let posError = null;
  try {
    if (kEntry > kSl) {
      posSize = calculatePositionSize({
        accountSize: accCapital,
        riskPercent: riskPct,
        entryPrice: kEntry,
        stopLossPrice: kSl,
        takeProfitPrice: kTp
      });
    }
  } catch (e: any) {
    posError = e.message;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & SubTabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🧮 Trade Simulation &amp; Decision Support
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test WACC averaging, net sell payouts, drawdown recovery math, and Kelly Criterion position sizing.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'wacc', label: '📉 WACC Averaging' },
            { id: 'sell', label: '💰 Sell Payout' },
            { id: 'recovery', label: '🚑 Recovery Math' },
            { id: 'kelly', label: '🎯 Position Sizer' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: WACC AVERAGING */}
      {activeSubTab === 'wacc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              1. Existing Position &amp; New Order Inputs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Existing Quantity</label>
                <input
                  type="number"
                  value={existQty}
                  onChange={(e) => setExistQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Existing WACC (Rs)</label>
                <input
                  type="number"
                  value={existWacc}
                  onChange={(e) => setExistWacc(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Buy Quantity</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Buy Price (Rs)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              2. Simulated Post-Trade Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">New Total Quantity</div>
                <div className="text-xl font-bold text-slate-100 font-mono mt-1">{newTotalQty} units</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Simulated WACC</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1">Rs {simulatedWacc.toFixed(2)}</div>
              </div>
            </div>

            <div className="text-xs space-y-1.5 font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="font-sans text-slate-400">Order Base Value:</span>
                <span>Rs {(newQty * newPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-400">Estimated Buy Fees:</span>
                <span>Rs {buyFee.totalFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400">
                <span className="font-sans">Total Outflow Required:</span>
                <span>Rs {buyFee.totalPayableOrReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SELL PAYOUT */}
      {activeSubTab === 'sell' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Sell Execution Inputs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Units to Sell</label>
                <input
                  type="number"
                  value={sellQty}
                  onChange={(e) => setSellQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Sell Price (Rs)</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cost Basis WACC (Rs)</label>
                <input
                  type="number"
                  value={sellWacc}
                  onChange={(e) => setSellWacc(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Holding Period Tax Class</label>
                <select
                  value={sellCgt}
                  onChange={(e) => setSellCgt(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="short">7.5% (&le; 365 Days Short Term)</option>
                  <option value="long">5.0% (&gt; 365 Days Long Term)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Estimated Net Bank Payout
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Net Cash Receivable in Bank</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                Rs {sellFee.totalPayableOrReceivable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-xs space-y-2 font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span className="font-sans text-slate-400">Broker + SEBON + DP Fees:</span>
                <span>Rs {sellFee.totalFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span className="font-sans">Capital Gains Tax (CGT):</span>
                <span>Rs {(sellFee.cgt || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="font-sans">Net Realized Profit / Loss:</span>
                <span className={sellFee.profit && sellFee.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  Rs {(sellFee.profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RECOVERY MATH */}
      {activeSubTab === 'recovery' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-xl mx-auto text-center">
          <h3 className="text-sm font-bold text-slate-200 flex items-center justify-center gap-2">
            🚑 Drawdown &amp; Loss Recovery Calculator
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Simulated Portfolio / Stock Loss (%)</label>
            <input
              type="range"
              min="5"
              max="80"
              step="5"
              value={dropPct}
              onChange={(e) => setDropPct(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="text-xl font-bold text-rose-400 font-mono mt-1">-{dropPct}% Loss</div>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-medium">Gain Required to Break Even</div>
            <div className="text-4xl font-bold text-emerald-400 font-mono">+{recoveryPct.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-2">
              Note: Losses compound non-linearly. A 50% drop requires a 100% gain to recover your initial capital.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 4: KELLY POSITION SIZER */}
      {activeSubTab === 'kelly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Risk &amp; Position Sizing Inputs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Account Equity (Rs)</label>
                <input
                  type="number"
                  value={accCapital}
                  onChange={(e) => setAccCapital(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Trade Risk (%)</label>
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
                  value={kEntry}
                  onChange={(e) => setKEntry(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Stop Loss</label>
                <input
                  type="number"
                  value={kSl}
                  onChange={(e) => setKSl(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Take Profit</label>
                <input
                  type="number"
                  value={kTp}
                  onChange={(e) => setKTp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
              Position Size &amp; R/R Recommendation
            </h3>

            {posError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {posError}
              </div>
            ) : posSize ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Optimal Units to Buy</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                      {posSize.unitsToBuy.toLocaleString()} units
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Risk/Reward Ratio</div>
                    <div className={`text-2xl font-bold font-mono mt-1 ${posSize.isGoodRr ? 'text-emerald-400' : 'text-amber-400'}`}>
                      1 : {posSize.riskRewardRatio.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Total Capital Investment:</span>
                    <span>Rs {posSize.totalInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span className="font-sans">Maximum Capital Risk:</span>
                    <span>Rs {posSize.maxRiskAmount.toLocaleString()} (-{riskPct}%)</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
