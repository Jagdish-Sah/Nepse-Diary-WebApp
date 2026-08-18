'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  Target,
  RefreshCw,
  Layers,
  Repeat
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PortfolioRecord, CacheRecord, TmsRecord, WatchlistRecord } from '@/lib/storage';
import { calculateFifoHoldings } from '@/lib/nepse-math';

interface DashboardViewProps {
  portfolio: PortfolioRecord[];
  cache: CacheRecord[];
  tms: TmsRecord[];
  watchlist: WatchlistRecord[];
  onNavigate: (tab: any) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

export default function DashboardView({
  portfolio,
  cache,
  tms,
  watchlist,
  onNavigate
}: DashboardViewProps) {
  const activeHoldings = calculateFifoHoldings(portfolio);

  // Realized calculations
  let realizedPl = 0;
  let realizedInv = 0;
  let realizedRecv = 0;
  let bestTradeVal = -Infinity;
  let bestTradeSym = '-';

  // Process chronological trades for realized metrics
  const sortedPort = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const stateMap: Record<string, { qty: number; invested: number }> = {};

  for (const row of sortedPort) {
    const sym = row.symbol.toUpperCase().trim();
    if (!stateMap[sym]) stateMap[sym] = { qty: 0, invested: 0 };

    const currQty = stateMap[sym].qty;
    const currInv = stateMap[sym].invested;
    const wacc = currQty > 0 ? currInv / currQty : 0;
    const netAmt = row.netAmount || row.qty * row.price;

    if (row.transactionType === 'BUY') {
      stateMap[sym].qty += row.qty;
      stateMap[sym].invested += netAmt;
    } else if (row.transactionType === 'SELL') {
      const cogs = row.qty * wacc;
      const profit = netAmt - cogs;

      realizedPl += profit;
      realizedInv += cogs;
      realizedRecv += netAmt;

      if (profit > bestTradeVal) {
        bestTradeVal = profit;
        bestTradeSym = sym;
      }

      stateMap[sym].qty -= row.qty;
      stateMap[sym].invested -= cogs;

      if (stateMap[sym].qty <= 0) {
        stateMap[sym].qty = 0;
        stateMap[sym].invested = 0;
      }
    }
  }

  // Active Portfolio Metrics
  let currInv = 0;
  let currVal = 0;
  let dayChange = 0;

  const chartData = activeHoldings.map((h) => {
    const live = cache.find((c) => c.symbol === h.symbol);
    const ltp = live ? live.ltp : h.wacc;
    const val = h.netQty * ltp;
    const change = live ? (live.changePercent * val) / 100 : 0;

    currInv += h.totalCost;
    currVal += val;
    dayChange += change;

    return {
      name: h.symbol,
      value: Math.round(val),
      qty: h.netQty,
      wacc: h.wacc,
      ltp
    };
  });

  const currPl = currVal - currInv;
  const currRet = currInv > 0 ? (currPl / currInv) * 100 : 0;
  const realizedRet = realizedInv > 0 ? (realizedPl / realizedInv) * 100 : 0;
  const lifetimeInvested = currInv + realizedInv;
  const lifetimeReceived = realizedRecv;
  const netExposure = lifetimeReceived - lifetimeInvested;
  const turnover = currInv > 0 ? (realizedInv / currInv) * 100 : 0;

  // Alerts logic
  const alerts: { symbol: string; type: 'SL' | 'TARGET'; message: string }[] = [];
  chartData.forEach((item) => {
    const wl = watchlist.find((w) => w.symbol === item.name);
    if (wl) {
      if (wl.stopLoss > 0 && item.ltp <= wl.stopLoss) {
        alerts.push({ symbol: item.name, type: 'SL', message: `STOP LOSS HIT @ Rs ${item.ltp} (Trigger: Rs ${wl.stopLoss})` });
      }
      if (wl.targetPrice > 0 && item.ltp >= wl.targetPrice) {
        alerts.push({ symbol: item.name, type: 'TARGET', message: `TARGET HIT @ Rs ${item.ltp} (Trigger: Rs ${wl.targetPrice})` });
      }
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📊 Executive Market Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time NEPSE Net Worth, FIFO WACC Engine, and Execution Analytics.
          </p>
        </div>
        <button
          onClick={() => onNavigate('add-transaction')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <span>➕ Log Trade</span>
        </button>
      </div>

      {/* Row 1: Snapshot KPIs */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          🏦 Net Worth Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="text-xs font-medium text-slate-400 mb-1">Current Portfolio Value</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              Rs {currVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Live LTP Valuation
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="text-xs font-medium text-slate-400 mb-1">Total Active Investment</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              Rs {currInv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-medium">Cost Basis (FIFO WACC)</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="text-xs font-medium text-slate-400 mb-1">Today's Market Change</div>
            <div className={`text-2xl font-bold font-mono ${dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dayChange >= 0 ? '+' : ''}Rs {dayChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dayChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {currVal > 0 ? `${((dayChange / currVal) * 100).toFixed(2)}%` : '0.00%'}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Profit/Loss Metrics */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          ⚖️ Profit / Loss Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">💰 Net Realized P/L</div>
            <div className={`text-xl font-bold font-mono ${realizedPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs {realizedPl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">ROI: {realizedRet.toFixed(2)}%</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">📈 Unrealized P/L</div>
            <div className={`text-xl font-bold font-mono ${currPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs {currPl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">ROI: {currRet.toFixed(2)}%</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">🏆 Lifetime Total P/L</div>
            <div className={`text-xl font-bold font-mono ${(realizedPl + currPl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs {(realizedPl + currPl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Realized + Unrealized</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">🥇 Best Closed Trade</div>
            <div className="text-xl font-bold text-amber-400 font-mono truncate">
              {bestTradeSym !== '-' ? `${bestTradeSym} (+Rs ${Math.round(bestTradeVal)})` : '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Highest Profit Closed Lot</div>
          </div>
        </div>
      </div>

      {/* Row 3: Investment Cycle & Capital Turnover */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          💼 Lifetime Investment Cycle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">Total Capital Deployed</div>
            <div className="text-lg font-bold text-slate-200 font-mono">
              Rs {Math.round(lifetimeInvested).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cost of Sold + Held Assets</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">Total Cash Recycled</div>
            <div className="text-lg font-bold text-slate-200 font-mono">
              Rs {Math.round(lifetimeReceived).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Returned to Bank from Sales</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">Net Cash Flow Exposure</div>
            <div className={`text-lg font-bold font-mono ${netExposure >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Rs {Math.round(netExposure).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Capital currently at risk</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 mb-1">Capital Turnover</div>
            <div className="text-lg font-bold text-blue-400 font-mono">
              {turnover.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Capital Rotation Velocity</div>
          </div>
        </div>
      </div>

      {/* Row 4: Asset Allocation & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" /> Portfolio Asset Allocation
          </h3>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Valuation']}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No active assets to display. Log a BUY trade to populate.
            </div>
          )}
        </div>

        {/* Signals Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Market Signals & Radar
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {alerts.length > 0 ? (
              alerts.map((alt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs ${
                    alt.type === 'SL'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className="font-semibold">{alt.symbol}</div>
                  <div className="text-[11px] mt-0.5">{alt.message}</div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
                All systems normal. No stop-loss or target price alerts triggered.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
