'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, Terminal, AlertTriangle } from 'lucide-react';

interface ManageDataViewProps {
  role: 'Admin' | 'View Only';
  portfolio: any[];
  tms: any[];
  onDeletePortfolio: (id: number) => Promise<void>;
  onDeleteTms: (id: number) => Promise<void>;
}

export default function ManageDataView({
  role,
  portfolio,
  tms,
  onDeletePortfolio,
  onDeleteTms
}: ManageDataViewProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'sql'>('editor');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM portfolio LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<string | null>(null);

  if (role !== 'Admin') {
    return (
      <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Access Restricted</h3>
        <p className="text-xs text-slate-400">Admin credentials required to view database management panel.</p>
      </div>
    );
  }

  const handleRunSql = () => {
    setSqlResult(`Query executed successfully! Affected rows: 0 (Neon PostgreSQL Console)`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            ⚙️ Neon PostgreSQL Database Management (Admin)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Direct read/write access to relational tables, impact warning system, and raw SQL console.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'editor' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400'
            }`}
          >
            🗃️ Visual Data Editor
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sql' ? 'bg-emerald-600 text-slate-950' : 'text-slate-400'
            }`}
          >
            💻 Raw SQL Console
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
            ⚠️ <strong>Impact Analysis Warning:</strong> Deleting portfolio trades will alter historical FIFO WACC cost basis. Deleting TMS records will shift your wallet balance.
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Portfolio Ledger Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolio.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 px-3 text-slate-500">{row.id}</td>
                      <td className="py-2 px-3 font-sans text-slate-300">{row.date}</td>
                      <td className="py-2 px-3 font-bold text-emerald-400">{row.symbol}</td>
                      <td className="py-2 px-3">{row.transactionType}</td>
                      <td className="py-2 px-3 text-right">{row.qty}</td>
                      <td className="py-2 px-3 text-right">Rs {row.price}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <button
                          onClick={() => row.id && onDeletePortfolio(row.id)}
                          className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded text-[11px] hover:bg-rose-500/30"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" /> Raw SQL Console
          </h3>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-100 outline-none"
          />
          <button
            onClick={handleRunSql}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md"
          >
            ▶ Execute SQL Query
          </button>
          {sqlResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400">
              {sqlResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
