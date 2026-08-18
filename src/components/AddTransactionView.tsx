'use client';

import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Calculator,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Percent
} from 'lucide-react';
import { PortfolioRecord } from '@/lib/storage';
import { calculateNepseFees, calculateFifoHoldings } from '@/lib/nepse-math';

interface AddTransactionViewProps {
  portfolio: PortfolioRecord[];
  role: 'Admin' | 'View Only';
  onAddSuccess: (trx: any) => Promise<void>;
}

export default function AddTransactionView({
  portfolio,
  role,
  onAddSuccess
}: AddTransactionViewProps) {
  const [trxType, setTrxType] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState<number>(10);
  const [price, setPrice] = useState<number>(100.0);
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [includeDp, setIncludeDp] = useState(true);
  const [overrideComm, setOverrideComm] = useState<number>(0);
  const [cgtOption, setCgtOption] = useState<'short' | 'long'>('short');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute owned quantity and FIFO WACC for selected symbol
  const activeHoldings = useMemo(() => calculateFifoHoldings(portfolio), [portfolio]);
  const currentHolding = useMemo(() => {
    const sym = symbol.toUpperCase().trim();
    return activeHoldings.find((h) => h.symbol === sym) || null;
  }, [symbol, activeHoldings]);

  const ownedQty = currentHolding ? currentHolding.netQty : 0;
  const currentWacc = currentHolding ? currentHolding.wacc : 0;
  const firstBuyDate = currentHolding ? currentHolding.firstBuyDate : trxDate;

  // Real-time Fee Calculation
  const feeResult = useMemo(() => {
    const cgtRate = cgtOption === 'long' ? 0.05 : 0.075;
    return calculateNepseFees({
      qty: qty || 0,
      price: price || 0,
      trxType,
      includeDp,
      wacc: currentWacc,
      cgtRate,
      overrideComm
    });
  }, [qty, price, trxType, includeDp, currentWacc, cgtOption, overrideComm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'View Only') {
      setMessage({ type: 'error', text: '🔒 Read-Only Mode: You cannot commit transactions to the database.' });
      return;
    }

    if (!symbol.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid stock symbol.' });
      return;
    }

    if (trxType === 'SELL' && qty > ownedQty) {
      setMessage({ type: 'error', text: `⚠️ Cannot Sell: You only own ${ownedQty} units of ${symbol.toUpperCase()}.` });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await onAddSuccess({
        date: trxDate,
        symbol: symbol.toUpperCase().trim(),
        qty: Number(qty),
        price: Number(price),
        transactionType: trxType,
        remarks,
        netAmount: feeResult.totalPayableOrReceivable,
        totalInvested: trxType === 'BUY' ? feeResult.totalPayableOrReceivable : 0,
        totalReceived: trxType === 'SELL' ? feeResult.totalPayableOrReceivable : 0
      });

      setMessage({ type: 'success', text: `✅ ${trxType} transaction logged successfully! TMS Ledger synced.` });
      setSymbol('');
      setRemarks('');
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to save transaction: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          📝 Trade & Settlement Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Precision NEPSE fee calculator with automated CGT holding analysis and instant TMS wallet sync.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* BUY / SELL Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTrxType('BUY')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  trxType === 'BUY'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🚀 BUY / AVERAGE
              </button>
              <button
                type="button"
                onClick={() => setTrxType('SELL')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  trxType === 'SELL'
                    ? 'bg-rose-600 text-slate-100 shadow-md shadow-rose-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔻 LOG SELL
              </button>
            </div>

            {/* Symbol & Holdings Check */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Stock Ticker Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. NABIL, GBIME, HDL"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                required
              />

              {symbol.trim() && (
                <div className="mt-2 text-xs font-medium">
                  {trxType === 'SELL' && qty > ownedQty ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Short Sell Warning: You only own {ownedQty} units.
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Portfolio Balance: <strong className="text-emerald-400 font-mono">{ownedQty} units</strong> (WACC: Rs {currentWacc.toFixed(2)})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Qty & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Execution Price (Rs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                  required
                />
              </div>
            </div>

            {/* Date & CGT Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={trxDate}
                  onChange={(e) => setTrxDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                />
              </div>

              {trxType === 'SELL' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CGT Rate Class</label>
                  <select
                    value={cgtOption}
                    onChange={(e) => setCgtOption(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                  >
                    <option value="short">7.5% (Short Term &le; 1 yr)</option>
                    <option value="long">5.0% (Long Term &gt; 1 yr)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Trade Thesis / Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Accumulating dip on support..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>

            {/* Fees Overrides */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDp}
                  onChange={(e) => setIncludeDp(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0"
                />
                Include DP Fee (Rs 25)
              </label>

              <div>
                <label className="block text-[11px] font-medium text-slate-400">Override Broker Comm (Rs)</label>
                <input
                  type="number"
                  value={overrideComm}
                  onChange={(e) => setOverrideComm(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || role === 'View Only'}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-lg ${
                trxType === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-slate-100 shadow-rose-600/20'
              } disabled:opacity-50`}
            >
              {isSubmitting
                ? 'Processing...'
                : trxType === 'BUY'
                ? '🚀 Execute Buy & Average Stock'
                : '🔻 Log Sell & Calculate Payout'}
            </button>
          </form>
        </div>

        {/* Settlement Bill Preview */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="w-4 h-4 text-emerald-400" /> Settlement Bill Preview
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-xs text-slate-400 font-medium">
              {trxType === 'BUY' ? 'Total Payable Amount' : 'Final Receivable Amount'}
            </div>
            <div className={`text-3xl font-bold font-mono ${trxType === 'BUY' ? 'text-emerald-400' : 'text-slate-100'}`}>
              Rs {feeResult.totalPayableOrReceivable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {trxType === 'BUY' && feeResult.breakevenPrice && (
              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Target Breakeven Price:</span>{' '}
                <strong className="text-amber-400 font-mono">Rs {feeResult.breakevenPrice.toFixed(2)}</strong>
              </div>
            )}

            {trxType === 'SELL' && feeResult.profit !== undefined && (
              <div className="pt-2 border-t border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Net Profit / Loss:</span>
                <strong className={`font-mono ${feeResult.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rs {feeResult.profit.toFixed(2)}
                </strong>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 font-sans">Base Order Value:</span>
              <span>Rs {feeResult.baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 font-sans">Broker Commission:</span>
              <span>Rs {feeResult.brokerCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 font-sans">SEBON Fee (0.015%):</span>
              <span>Rs {feeResult.sebonFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400 font-sans">DP Fee:</span>
              <span>Rs {feeResult.dpFee.toFixed(2)}</span>
            </div>

            {trxType === 'SELL' && feeResult.cgt !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-800/50 text-amber-400">
                <span className="font-sans">Capital Gains Tax (CGT):</span>
                <span>Rs {feeResult.cgt.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
            Total Fees &amp; Taxes: <strong>Rs {feeResult.totalFees + (feeResult.cgt || 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
