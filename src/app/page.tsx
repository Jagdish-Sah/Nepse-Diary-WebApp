import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch initial data directly on the server in parallel (fast, no client waterfalls)
  const [
    portfolioRows,
    tmsRows,
    watchlistRows,
    journalRows,
    wealthRows,
    cacheRows,
    auditRows,
  ] = await Promise.all([
    prisma.portfolio.findMany({ orderBy: { date: 'desc' } }).catch(() => []),
    prisma.tmsTransaction.findMany({ orderBy: { date: 'desc' } }).catch(() => []),
    prisma.watchlist.findMany({ orderBy: { symbol: 'asc' } }).catch(() => []),
    prisma.tradingJournal.findMany({ orderBy: { dateTimeStamp: 'desc' } }).catch(() => []),
    prisma.wealthSnapshot.findMany({ orderBy: { snapshotDate: 'asc' } }).catch(() => []),
    prisma.marketCache.findMany({ orderBy: { symbol: 'asc' } }).catch(() => []),
    prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }).catch(() => []),
  ]);

  const initialPortfolio = portfolioRows.map((r) => ({
    id: r.id,
    date: r.date ? r.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    symbol: r.symbol,
    qty: r.qty,
    price: r.price,
    transactionType: (r.transactionType || 'BUY').toUpperCase() as 'BUY' | 'SELL',
    remarks: r.remarks || undefined,
    netAmount: r.netAmount || r.qty * r.price,
    totalInvested: r.totalInvested || 0,
    totalReceived: r.totalReceived || 0,
    tmsCommission: r.tmsCommission || undefined,
    cgt: r.cgt || undefined,
    createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
  }));

  const initialTms = tmsRows.map((r) => ({
    id: r.id,
    date: r.date ? r.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    stock: r.stock || undefined,
    type: r.type,
    medium: r.medium,
    amount: r.amount,
    charge: r.charge,
    remark: r.remark || undefined,
    status: r.status,
    reference: r.reference || undefined,
  }));

  const initialWatchlist = watchlistRows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    targetPrice: r.targetPrice,
    stopLoss: r.stopLoss,
    hardTarget: r.hardTarget,
    hardSl: r.hardSl,
    entry1: r.entry1,
    entryMust: r.entryMust,
    notes: r.notes || undefined,
  }));

  const initialJournal = journalRows.map((r) => ({
    id: r.id,
    dateTimeStamp: r.dateTimeStamp ? r.dateTimeStamp.toISOString() : undefined,
    symbol: r.symbol,
    topic: r.topic,
    feeling: r.feeling,
    star: r.star,
    tradeThesis: r.tradeThesis,
    finalRemark: r.finalRemark || undefined,
  }));

  const initialWealth = wealthRows.map((r) => ({
    id: r.id,
    snapshotDate: r.snapshotDate ? r.snapshotDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    totalInvestment: r.totalInvestment,
    currentValue: r.currentValue,
  }));

  const initialCache = cacheRows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    ltp: r.ltp,
    changePercent: r.changePercent,
    volume: r.volume,
    dayHigh: r.dayHigh,
    dayLow: r.dayLow,
    lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined,
  }));

  const initialAuditLogs = auditRows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp ? r.timestamp.toISOString() : undefined,
    action: r.action,
    symbol: r.symbol || undefined,
    details: r.details,
  }));

  return (
    <AppShell
      initialPortfolio={initialPortfolio}
      initialTms={initialTms}
      initialWatchlist={initialWatchlist}
      initialJournal={initialJournal}
      initialWealth={initialWealth}
      initialCache={initialCache}
      initialAuditLogs={initialAuditLogs}
      initialUser={{
        username: session.username,
        role: session.role,
      }}
    />
  );
}
