'use client';

import React, { useState } from 'react';
import Sidebar, { NavTab } from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import PortfolioView from '@/components/PortfolioView';
import AddTransactionView from '@/components/AddTransactionView';
import TmsView from '@/components/TmsView';
import TradeSimulationView from '@/components/TradeSimulationView';
import WatchlistView from '@/components/WatchlistView';
import RiskJournalView from '@/components/RiskJournalView';
import HistoryView from '@/components/HistoryView';
import WealthView from '@/components/WealthView';
import AiAnalystView from '@/components/AiAnalystView';
import ManageDataView from '@/components/ManageDataView';
import ActivityLogView from '@/components/ActivityLogView';
import { logoutAction } from '@/app/actions/auth';

import {
  PortfolioRecord,
  CacheRecord,
  TmsRecord,
  WatchlistRecord,
  JournalRecord,
  WealthRecord,
  AuditRecord
} from '@/lib/storage';

interface AppShellProps {
  initialPortfolio: PortfolioRecord[];
  initialTms: TmsRecord[];
  initialWatchlist: WatchlistRecord[];
  initialJournal: JournalRecord[];
  initialWealth: WealthRecord[];
  initialCache: CacheRecord[];
  initialAuditLogs: AuditRecord[];
  initialUser: {
    username: string;
    role: 'admin' | 'viewer';
  };
}

export default function AppShell({
  initialPortfolio,
  initialTms,
  initialWatchlist,
  initialJournal,
  initialWealth,
  initialCache,
  initialAuditLogs,
  initialUser
}: AppShellProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [role, setRole] = useState<'Admin' | 'View Only'>(
    initialUser.role === 'admin' ? 'Admin' : 'View Only'
  );
  const [isSyncing, setIsSyncing] = useState(false);

  // State arrays seeded from server-fetched initial data (instant render, zero flicker)
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>(initialPortfolio);
  const [cache, setCache] = useState<CacheRecord[]>(initialCache);
  const [tms, setTms] = useState<TmsRecord[]>(initialTms);
  const [watchlist, setWatchlist] = useState<WatchlistRecord[]>(initialWatchlist);
  const [journal, setJournal] = useState<JournalRecord[]>(initialJournal);
  const [wealth, setWealth] = useState<WealthRecord[]>(initialWealth);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(initialAuditLogs);

  // Re-fetch only after mutations
  const refreshData = async () => {
    try {
      const [portRes, tmsRes, wlRes, jRes, wRes, auditRes] = await Promise.all([
        fetch('/api/portfolio').then(r => r.json()),
        fetch('/api/tms').then(r => r.json()),
        fetch('/api/watchlist').then(r => r.json()),
        fetch('/api/journal').then(r => r.json()),
        fetch('/api/wealth').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/audit').then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (portRes.success && portRes.data) setPortfolio(portRes.data);
      if (tmsRes.success && tmsRes.data) setTms(tmsRes.data);
      if (wlRes.success && wlRes.data) setWatchlist(wlRes.data);
      if (jRes.success && jRes.data) setJournal(jRes.data);
      if (wRes.success && wRes.data) setWealth(wRes.data);
      if (auditRes.success && auditRes.data) setAuditLogs(auditRes.data);
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  // Periodic background refresh every 1 hour & stale check on mount
  React.useEffect(() => {
    // Check if initial cache is missing or stale
    const checkAndSync = async () => {
      try {
        const res = await fetch('/api/sync');
        const json = await res.json();
        if (json.success && json.data) {
          setCache(json.data);
        }
      } catch (err) {
        console.warn('Auto cache refresh check notice:', err);
      }
    };

    checkAndSync();

    // Auto-refresh interval every 1 hour (3600000 ms) to keep cache fresh
    const interval = setInterval(() => {
      checkAndSync();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Live market sync
  const handleMarketSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setCache(data.data);
      }
    } catch (e) {
      console.error('Market sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddPortfolioTransaction = async (record: any) => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const data = await res.json();
    if (data.success) {
      await refreshData();
    } else {
      throw new Error(data.error || 'Failed to add transaction');
    }
  };

  const handleDeletePortfolioRecord = async (id: number) => {
    const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  const handleAddTms = async (record: any) => {
    const res = await fetch('/api/tms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  const handleDeleteTms = async (id: number) => {
    const res = await fetch(`/api/tms?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  const handleSaveWatchlist = async (item: any) => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  const handleDeleteWatchlist = async (symbol: string) => {
    const res = await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  const handleAddJournal = async (entry: any) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if (data.success) await refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        onSync={handleMarketSync}
        isSyncing={isSyncing}
        onLogout={logoutAction}
        username={initialUser.username}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar role={role} />

        <main className="flex-1 px-6 pt-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              portfolio={portfolio}
              cache={cache}
              tms={tms}
              watchlist={watchlist}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'portfolio' && (
            <PortfolioView portfolio={portfolio} cache={cache} role={role} />
          )}
          {activeTab === 'add-transaction' && (
            <AddTransactionView
              portfolio={portfolio}
              role={role}
              onAddSuccess={handleAddPortfolioTransaction}
            />
          )}
          {activeTab === 'tms' && (
            <TmsView
              tms={tms}
              role={role}
              onAddTms={handleAddTms}
              onDeleteTms={handleDeleteTms}
            />
          )}
          {activeTab === 'trade-sim' && <TradeSimulationView />}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              cache={cache}
              role={role}
              onSaveWatchlist={handleSaveWatchlist}
              onDeleteWatchlist={handleDeleteWatchlist}
            />
          )}
          {activeTab === 'risk-journal' && (
            <RiskJournalView
              journal={journal}
              auditLogs={auditLogs}
              role={role}
              onAddJournal={handleAddJournal}
            />
          )}
          {activeTab === 'history' && <HistoryView portfolio={portfolio} cache={cache} />}
          {activeTab === 'wealth' && <WealthView wealth={wealth} />}
          {activeTab === 'ai-analyst' && <AiAnalystView />}
          {activeTab === 'manage-data' && (
            <ManageDataView
              role={role}
              portfolio={portfolio}
              tms={tms}
              onDeletePortfolio={handleDeletePortfolioRecord}
              onDeleteTms={handleDeleteTms}
            />
          )}
          {activeTab === 'activity-log' && <ActivityLogView auditLogs={auditLogs} />}
        </main>
      </div>
    </div>
  );
}
