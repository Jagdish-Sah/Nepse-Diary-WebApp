import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.marketCache.findMany({
      orderBy: { symbol: 'asc' },
    });

    const data = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      ltp: r.ltp,
      changePercent: r.changePercent,
      volume: r.volume,
      dayHigh: r.dayHigh,
      dayLow: r.dayLow,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined,
    }));

    return NextResponse.json({ success: true, data });
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

    // Fetch live market data from Chukul API with 8s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let stocks: any[] = [];
    try {
      const response = await fetch('https://chukul.com/api/data/market', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'NepseTerminalPro/2.5' },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const rawData = await response.json();
        stocks = Array.isArray(rawData) ? rawData : rawData.data || rawData.stocks || [];
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.warn('Live Chukul API fetch timed out or failed, using local cache:', fetchErr);
    }

    if (stocks.length > 0) {
      // Prepare parsed valid stock records
      const validRecords: {
        symbol: string;
        ltp: number;
        changePercent: number;
        volume: number;
        dayHigh: number;
        dayLow: number;
      }[] = [];

      for (const stock of stocks) {
        const symbol = (stock.symbol || stock.s || '').toUpperCase().trim();
        const ltp = parseFloat(stock.ltp || stock.c || stock.close || 0);
        const changePercent = parseFloat(stock.change_percent || stock.pc || stock.pchange || 0);
        const volume = parseInt(stock.volume || stock.v || stock.qty || 0, 10);
        const dayHigh = parseFloat(stock.high || stock.h || stock.day_high || 0);
        const dayLow = parseFloat(stock.low || stock.l || stock.day_low || 0);

        if (symbol && ltp > 0) {
          validRecords.push({ symbol, ltp, changePercent, volume, dayHigh, dayLow });
        }
      }

      // High-performance batch upsert in chunks of 50 concurrently
      const CHUNK_SIZE = 50;
      for (let i = 0; i < validRecords.length; i += CHUNK_SIZE) {
        const chunk = validRecords.slice(i, i + CHUNK_SIZE);
        await prisma.$transaction(
          chunk.map((rec) =>
            prisma.marketCache.upsert({
              where: { symbol: rec.symbol },
              update: {
                ltp: rec.ltp,
                changePercent: rec.changePercent,
                volume: rec.volume,
                dayHigh: rec.dayHigh,
                dayLow: rec.dayLow,
                lastUpdated: new Date(),
              },
              create: {
                symbol: rec.symbol,
                ltp: rec.ltp,
                changePercent: rec.changePercent,
                volume: rec.volume,
                dayHigh: rec.dayHigh,
                dayLow: rec.dayLow,
                lastUpdated: new Date(),
              },
            })
          )
        );
      }

      // Log sync audit
      await prisma.auditLog.create({
        data: {
          action: 'MARKET_SYNC',
          details: `Synced ${validRecords.length} live tickers from Chukul API`,
        },
      });
    }

    // Return the latest cache
    const updatedRows = await prisma.marketCache.findMany({
      orderBy: { symbol: 'asc' },
    });

    const data = updatedRows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      ltp: r.ltp,
      changePercent: r.changePercent,
      volume: r.volume,
      dayHigh: r.dayHigh,
      dayLow: r.dayLow,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined,
    }));

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Market sync error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync market data' }, { status: 500 });
  }
}
