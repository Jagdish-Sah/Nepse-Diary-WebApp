'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  AlertTriangle,
  PieChart as PieIcon,
  Search
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TmsRecord } from '@/lib/storage';

interface TmsViewProps {
  tms: TmsRecord[];
  role: 'Admin' | 'View Only';
  onAddTms: (record: any) => Promise<void>;
  onDeleteTms: (id: number) => Promise<void>;
}

const MEDIUM_OPTIONS = [
  'ConnectIPS',
  'Collateral',
  'NABIL Bank',
  'GLOBAL IME Bank',
  'SIDDHARTHA Bank',
  'NIMB Bank',
  'Nic Asia Bank',
  'Khalti',
  'Esewa',
  'Moru Pay',
  'Other Specified In Remark'
];

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function TmsView({ tms, role, onAddTms, onDeleteTms }: TmsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'ledger' | 'log' | 'graphs' | 'export'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [tType, setTType] = useState<string>('Deposit');
  const [tDate, setTDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tStock, setTStock] = useState('');
  const [tMedium, setTMedium] = useState('ConnectIPS');
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [tCharge, setTCharge] = useState<number>(0);
  const [tStatus, setTStatus] = useState('Settled');
  const [tRef, setTRef] = useState('');
  const [tRemark, setTRemark] = useState('');

  // Calculations
  const sortedTms = useMemo(() => {
    const sorted = [...tms].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runBal = 0;
    return sorted.map((t) => {
      runBal += t.amount;
      return { ...t, runningBalance: runBal };
    });
  }, [tms]);

  const displayLedger = useMemo(() => {
    const list = [...sortedTms].reverse();
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.type.toLowerCase().includes(q) ||
        (t.stock && t.stock.toLowerCase().includes(q)) ||
        t.medium.toLowerCase().includes(q) ||
        (t.remark && t.remark.toLowerCase().includes(q))
    );
  }, [sortedTms, searchQuery]);

  const deposits = tms.filter((t) => t.type.toUpperCase() === 'DEPOSIT');
  const totalCashIn = deposits.reduce((s, t) => s + t.amount + t.charge, 0);

  const withdrawals = tms.filter((t) => t.type.toUpperCase() === 'WITHDRAWAL');
  const totalCashOut = withdrawals.reduce((s, t) => s + Math.abs(t.amount) - t.charge, 0);

  const netCashInTms = totalCashIn - totalCashOut;
  const netTmsBalance = tms.reduce((s, t) => s + t.amount, 0);

  const buys = Math.abs(tms.filter((t) => t.type.toUpperCase() === 'BUY').reduce((s, t) => s + t.amount, 0));
  const sells = tms.filter((t) => t.type.toUpperCase() === 'SELL').reduce((s, t) => s + t.amount, 0);
  const netSettlement = sells - buys;
  const buyingPower = netTmsBalance + 10824.0; // Base collateral

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'View Only') return;

    let finalAmount = rawAmount;
    if (tType === 'Buy') finalAmount = -(rawAmount + tCharge);
    else if (tType === 'Sell') finalAmount = rawAmount - tCharge;
    else if (tType === 'Withdrawal' || tType === 'Charges') finalAmount = -Math.abs(rawAmount);

    await onAddTms({
      date: tDate,
      stock: tStock ? tStock.toUpperCase().trim() : undefined,
      type: tType,
      medium: tMedium,
      amount: finalAmount,
      charge: tCharge,
      remark: tRemark,
      status: tStatus,
      reference: tRef
    });

    setRawAmount(0);
    setTCharge(0);
    setTRemark('');
    setTRef('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🏦 TMS Broker Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cash Flow Reconciliation, Wallet Running Balance &amp; Collateral Buying Power.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'metrics', label: '📊 Summary' },
            { id: 'ledger', label: '📜 Ledger' },
            { id: 'log', label: '✍️ Log Trx' },
            { id: 'graphs', label: '📈 Graphs' },
            { id: 'export', label: '💾 Export' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* SUBTAB 1: METRICS */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Total Cash In (Deposits)</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                Rs {totalCashIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Principal + Charges sent to broker</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Total Cash Out (Withdrawals)</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                Rs {totalCashOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Net money returned to bank</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Net Principal Tied Up</div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                Rs {netCashInTms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Cash In minus Cash Out</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Net TMS Wallet Balance</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                Rs {netTmsBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Usable cash in wallet</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Net Stock Settlement</div>
              <div className={`text-2xl font-bold font-mono ${netSettlement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rs {netSettlement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Total Sells minus Total Buys</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-medium text-slate-400 mb-1">Total Buying Power</div>
              <div className="text-2xl font-bold text-blue-400 font-mono">
                Rs {buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Wallet + Rs 10,824 Free Collateral</div>
            </div>
          </div>

          {/* Wallet Balance Trend Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> TMS Wallet Running Balance Trend
            </h3>
            {sortedTms.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sortedTms}>
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Balance']}
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="runningBalance" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                No ledger transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: UNIVERSAL LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Universal Broker Ledger ({displayLedger.length})
            </h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Charge</th>
                  <th className="py-3 px-4 text-right">Net Balance</th>
                  <th className="py-3 px-4">Medium</th>
                  <th className="py-3 px-4">Status</th>
                  {role === 'Admin' && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {displayLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-sans">{row.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-200 font-sans">{row.type}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{row.stock || '-'}</td>
                    <td className={`py-3 px-4 text-right font-bold ${row.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Rs {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">Rs {row.charge.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100">
                      Rs {(row.runningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">{row.medium}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.status}
                      </span>
                    </td>
                    {role === 'Admin' && (
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={() => row.id && onDeleteTms(row.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: LOG TRANSACTION */}
      {activeSubTab === 'log' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <PlusCircle className="w-4 h-4 text-emerald-400" /> Log TMS Transaction
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Transaction Category</label>
              <select
                value={tType}
                onChange={(e) => setTType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              >
                <option value="Deposit">Deposit (Cash In)</option>
                <option value="Withdrawal">Withdrawal (Cash Out)</option>
                <option value="Buy">Buy (Stock Outflow)</option>
                <option value="Sell">Sell (Stock Inflow)</option>
                <option value="Charges">Charges / Fine</option>
                <option value="Collateral Load">Collateral Load</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={tDate}
                  onChange={(e) => setTDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stock Ticker (Optional)</label>
                <input
                  type="text"
                  value={tStock}
                  onChange={(e) => setTStock(e.target.value.toUpperCase())}
                  placeholder="e.g. NABIL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Payment Medium</label>
                <select
                  value={tMedium}
                  onChange={(e) => setTMedium(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                >
                  {MEDIUM_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Principal Amount (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rawAmount}
                  onChange={(e) => setRawAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bank / Gateway Charges (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tCharge}
                  onChange={(e) => setTCharge(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={tStatus}
                  onChange={(e) => setTStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="Settled">Settled</option>
                  <option value="Pending">Pending T+2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Remarks</label>
              <input
                type="text"
                value={tRemark}
                onChange={(e) => setTRemark(e.target.value)}
                placeholder="Transaction details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={role === 'View Only'}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              💾 Save to Broker Ledger
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 4: GRAPHS */}
      {activeSubTab === 'graphs' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" /> Cash Flow Composition &amp; Costs
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Deposits', value: totalCashIn },
                    { name: 'Withdrawals', value: totalCashOut },
                    { name: 'Net Settlement', value: Math.abs(netSettlement) }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {COLORS.slice(0, 3).map((col, idx) => (
                    <Cell key={idx} fill={col} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SUBTAB 5: EXPORT */}
      {activeSubTab === 'export' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-md mx-auto text-center">
          <h3 className="text-sm font-bold text-slate-200 flex items-center justify-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" /> Export Broker Ledger
          </h3>
          <p className="text-xs text-slate-400">Download your full universal TMS transaction history as a CSV file.</p>
          <button
            onClick={() => {
              const headers = 'Date,Type,Stock,Amount,Charge,Medium,Status,Remark\n';
              const csvRows = tms.map((t) => `${t.date},${t.type},${t.stock || ''},${t.amount},${t.charge},${t.medium},${t.status},"${t.remark || ''}"`).join('\n');
              const blob = new Blob([headers + csvRows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tms_ledger_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV File
          </button>
        </div>
      )}
    </div>
  );
}
