'use client';

import React, { useState } from 'react';
import { FileText, Download, Search, Clock, Tag } from 'lucide-react';
import { AuditRecord } from '@/lib/storage';

interface ActivityLogViewProps {
  auditLogs: AuditRecord[];
}

export default function ActivityLogView({ auditLogs }: ActivityLogViewProps) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesQuery =
      !search.trim() ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.symbol && log.symbol.toLowerCase().includes(search.toLowerCase())) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesQuery;
  });

  const actionsList = Array.from(new Set(auditLogs.map((l) => l.action)));

  const handleExport = () => {
    const headers = 'Timestamp (NST),Action,Symbol,Details\n';
    const csvRows = filtered
      .map(
        (l) =>
          `"${l.timestamp ? new Date(l.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }) : ''}",${l.action},${
            l.symbol || ''
          },"${l.details.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepse_activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🗂️ Master System Activity &amp; Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological, tamper-proof audit log recording every system sync, trade execution, and database modification.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" /> Export Log CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Filter Action Type</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Search Audit Details</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, action, details..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (NST)</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filtered.map((log) => (
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
    </div>
  );
}
