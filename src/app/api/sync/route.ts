import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth';
import {
  getSymbolTtlMinutes,
  isSymbolCacheExpired,
  shouldRefreshCache,
  syncMarketDataFromSource
} from '@/lib/market-cache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';

    let rows = await prisma.marketCache.findMany({
      orderBy: { symbol: 'asc' },
    });

    // Check if cache needs auto-refresh (50/60/70m staggered expiry or 1-2 hours ceiling)
    const needsRefresh = forceRefresh || shouldRefreshCache(rows);

    if (needsRefresh) {
      const syncResult = await syncMarketDataFromSource();
      if (syncResult.success) {
        rows = await prisma.marketCache.findMany({
          orderBy: { symbol: 'asc' },
        });
      }
    }

    const data = rows.map((r) => ({
      symbol: r.symbol,
      ltp: r.ltp,
      changePercent: r.changePercent,
      volume: r.volume,
      dayHigh: r.dayHigh,
      dayLow: r.dayLow,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined,
      ttlMinutes: getSymbolTtlMinutes(r.symbol),
      isExpired: isSymbolCacheExpired(r.symbol, r.lastUpdated),
    }));

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      autoRefreshed: needsRefresh
    });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Market cache GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireAuth();

    await syncMarketDataFromSource();

    const updatedRows = await prisma.marketCache.findMany({
      orderBy: { symbol: 'asc' },
    });

    const data = updatedRows.map((r) => ({
      symbol: r.symbol,
      ltp: r.ltp,
      changePercent: r.changePercent,
      volume: r.volume,
      dayHigh: r.dayHigh,
      dayLow: r.dayLow,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined,
      ttlMinutes: getSymbolTtlMinutes(r.symbol),
      isExpired: false,
    }));

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Market sync error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync market data' }, { status: 500 });
  }
}
