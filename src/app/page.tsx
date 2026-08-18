'use client';

import React, { useState, useEffect } from 'react';
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

import {
  PortfolioRecord,
  CacheRecord,
  TmsRecord,
  WatchlistRecord,
  JournalRecord,
  WealthRecord,
  AuditRecord
} from '@/lib/storage';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [role, setRole] = useState<'Admin' | 'View Only'>('Admin');
  const [isSyncing, setIsSyncing] = useState(false);

  // State arrays
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>([]);
  const [cache, setCache] = useState<CacheRecord[]>([]);
  const [tms, setTms] = useState<TmsRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistRecord[]>([]);
  const [journal, setJournal] = useState<JournalRecord[]>([]);
  const [wealth, setWealth] = useState<WealthRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [portRes, cacheRes, tmsRes, wlRes, jRes, wRes, auditRes] = await Promise.all([
        fetch('/api/portfolio').then((r) => r.json()),
        fetch('/api/sync', { method: 'POST' }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/tms').then((r) => r.json()),
        fetch('/api/watchlist').then((r) => r.json()),
        fetch('/api/journal').then((r) => r.json()),
        fetch('/api/wealth').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/audit').then((r) => r.json()).catch(() => ({ data: [] }))
      ]);

      if (portRes.success) setPortfolio(portRes.data);
      if (cacheRes.success && cacheRes.data) setCache(cacheRes.data);
      if (tmsRes.success) setTms(tmsRes.data);
      if (wlRes.success) setWatchlist(wlRes.data);
      if (jRes.success) setJournal(jRes.data);
      if (wRes.success) setWealth(wRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      await fetchData();
    } else {
      throw new Error(data.error);
    }
  };

  const handleDeletePortfolioRecord = async (id: number) => {
    const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  const handleAddTms = async (record: any) => {
    const res = await fetch('/api/tms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  const handleDeleteTms = async (id: number) => {
    const res = await fetch(`/api/tms?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  const handleSaveWatchlist = async (item: any) => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  const handleDeleteWatchlist = async (symbol: string) => {
    const res = await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  const handleAddJournal = async (entry: any) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if (data.success) {
      await fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        onSync={handleMarketSync}
        isSyncing={isSyncing}
      />

      {/* Main Workspace Area */}
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
