'use client';

import React, { useState } from 'react';
import { History, Award, CheckCircle2, Clock, FileSpreadsheet, Percent, Layers } from 'lucide-react';
import { PortfolioRecord, CacheRecord } from '@/lib/storage';

interface HistoryViewProps {
  portfolio: PortfolioRecord[];
  cache: CacheRecord[];
}

export default function HistoryView({ portfolio, cache }: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<'realized' | 'unrealized' | 'settlement' | 'ledger'>('realized');

  // Process Realized & Unrealized Tax Lots using FIFO
  const sorted = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  interface RealizedLot {
    symbol: string;
    qty: number;
    buyDate: string;
    sellDate: string;
    buyPrice: number;
    sellPrice: number;
    invested: number;
    received: number;
    netPl: number;
    roiPct: number;
  }

  interface InventoryLot {
    qty: number;
    buyPrice: number;
    unitCost: number;
    buyDate: string;
    remarks?: string;
  }

  const inventoryMap: Record<string, InventoryLot[]> = {};
  const realizedLots: RealizedLot[] = [];

  for (const row of sorted) {
    const sym = row.symbol.toUpperCase().trim();
    if (!inventoryMap[sym]) inventoryMap[sym] = [];

    if (row.transactionType === 'BUY') {
      const netAmt = row.netAmount || row.qty * row.price;
      const unitCost = row.qty > 0 ? netAmt / row.qty : row.price;
      inventoryMap[sym].push({
        qty: row.qty,
        buyPrice: row.price,
        unitCost,
        buyDate: row.date
      });
    } else if (row.transactionType === 'SELL') {
      let rem = row.qty;
      const netAmt = row.netAmount || row.qty * row.price;
      const recPerUnit = row.qty > 0 ? netAmt / row.qty : row.price;

      while (rem > 0 && inventoryMap[sym].length > 0) {
        const lot = inventoryMap[sym][0];
        let matchedQty = 0;

        if (lot.qty <= rem) {
          matchedQty = lot.qty;
          rem -= matchedQty;
          inventoryMap[sym].shift();
        } else {
          matchedQty = rem;
          lot.qty -= rem;
          rem = 0;
        }

        const inv = matchedQty * lot.unitCost;
        const rec = matchedQty * recPerUnit;
        const netPl = rec - inv;
        const roiPct = inv > 0 ? (netPl / inv) * 100 : 0;

        realizedLots.push({
          symbol: sym,
          qty: matchedQty,
          buyDate: lot.buyDate,
          sellDate: row.date,
          buyPrice: lot.buyPrice,
          sellPrice: row.price,
          invested: inv,
          received: rec,
          netPl,
          roiPct
        });
      }
    }
  }

  // Realized Metrics
  const totalRealizedPl = realizedLots.reduce((s, r) => s + r.netPl, 0);
  const totalTrades = realizedLots.length;
  const winningTrades = realizedLots.filter((r) => r.netPl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Aggregated Realized By Symbol
  const aggRealizedMap: Record<string, { qty: number; invested: number; received: number; netPl: number }> = {};
  realizedLots.forEach((r) => {
    if (!aggRealizedMap[r.symbol]) {
      aggRealizedMap[r.symbol] = { qty: 0, invested: 0, received: 0, netPl: 0 };
    }
    aggRealizedMap[r.symbol].qty += r.qty;
    aggRealizedMap[r.symbol].invested += r.invested;
    aggRealizedMap[r.symbol].received += r.received;
    aggRealizedMap[r.symbol].netPl += r.netPl;
  });
  const aggRealizedList = Object.entries(aggRealizedMap).map(([symbol, data]) => ({
    symbol,
    ...data,
    avgBuy: data.qty > 0 ? data.invested / data.qty : 0,
    avgSell: data.qty > 0 ? data.received / data.qty : 0,
    roiPct: data.invested > 0 ? (data.netPl / data.invested) * 100 : 0
  }));

  // T+2 Settlement calculation (transactions within last 3 days)
  const threeDaysAgo = new Date(new Date().getTime() - 3 * 24 * 3600 * 1000);
  const unsettled = sorted.filter((t) => new Date(t.date) > threeDaysAgo);
  const pendingBuys = unsettled.filter((t) => t.transactionType === 'BUY').reduce((s, t) => s + (t.netAmount || t.qty * t.price), 0);
  const pendingSells = unsettled.filter((t) => t.transactionType === 'SELL').reduce((s, t) => s + (t.netAmount || t.qty * t.price), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🏛️ Trade History &amp; Settlement Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track closed tax lots, trade win rates, pending T+2 broker settlements, and master raw ledger.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'realized', label: '🏆 Realized' },
            { id: 'unrealized', label: '📈 Unrealized' },
            { id: 'settlement', label: '⏳ T+2 Status' },
            { id: 'ledger', label: '📜 Master Ledger' }
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

      {/* TAB 1: REALIZED */}
      {activeTab === 'realized' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400">Total Realized Profit</div>
              <div className={`text-2xl font-bold font-mono ${totalRealizedPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rs {totalRealizedPl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400">Closed Tax Lots</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{totalTrades}</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400">Trade Win Rate</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{winRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Aggregated Realized Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">📊 Aggregated Realized Summary (By Symbol)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Avg Buy</th>
                    <th className="py-3 px-4 text-right">Avg Sell</th>
                    <th className="py-3 px-4 text-right">Invested</th>
                    <th className="py-3 px-4 text-right">Received</th>
                    <th className="py-3 px-4 text-right">Net P/L</th>
                    <th className="py-3 px-4 text-right">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {aggRealizedList.map((row) => (
                    <tr key={row.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100 font-sans">{row.symbol}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">{row.qty.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">Rs {row.avgBuy.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">Rs {row.avgSell.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">Rs {row.invested.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">Rs {row.received.toLocaleString()}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${row.netPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Rs {row.netPl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${row.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.roiPct >= 0 ? '+' : ''}{row.roiPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNREALISED */}
      {activeTab === 'unrealized' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          Refer to the Active Portfolio tab for full real-time unrealized holding performance &amp; breakeven analytics.
        </div>
      )}

      {/* TAB 3: SETTLEMENT STATUS */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400">💸 Cash Payable to Broker (Pending Buys)</div>
              <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
                Rs {pendingBuys.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400">💰 Cash Receivable from Broker (Pending Sells)</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                Rs {pendingSells.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Pending T+2 Trades ({unsettled.length})</h3>
            {unsettled.length > 0 ? (
              <div className="space-y-2">
                {unsettled.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <strong className="text-slate-100">{t.symbol}</strong> ({t.transactionType}) - {t.qty} units @ Rs {t.price}
                    </div>
                    <div className="text-amber-400 font-sans">Settlement Pending ⏳</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 font-medium">🎉 All transactions are fully settled!</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Master Raw Transaction Ledger ({portfolio.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {sorted.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-sans">{t.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-100 font-sans">{t.symbol}</td>
                    <td className={`py-3 px-4 font-bold ${t.transactionType === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.transactionType}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{t.qty}</td>
                    <td className="py-3 px-4 text-right text-slate-300">Rs {t.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100">
                      Rs {(t.netAmount || t.qty * t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-xs">{t.remarks || '-'}</td>
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
