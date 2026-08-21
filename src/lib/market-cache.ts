import { prisma } from './prisma';

/**
 * Returns staggered cache TTL in minutes (50, 60, or 70 minutes)
 * with 10-minute differences based on the stock symbol hash
 * to prevent thundering-herd API spikes.
 */
export function getSymbolTtlMinutes(symbol: string): number {
  const clean = (symbol || '').trim().toUpperCase();
  const charSum = clean.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const tiers = [50, 60, 70]; // Staggered 50, 60, 70 mins (10 min difference)
  return tiers[charSum % tiers.length];
}

/**
 * Checks if a specific stock ticker cache has expired based on its staggered TTL.
 */
export function isSymbolCacheExpired(symbol: string, lastUpdated?: Date | string | null): boolean {
  if (!lastUpdated) return true;
  const updatedMs = new Date(lastUpdated).getTime();
  if (isNaN(updatedMs)) return true;
  const ttlMs = getSymbolTtlMinutes(symbol) * 60 * 1000;
  return Date.now() - updatedMs > ttlMs;
}

/**
 * Determines whether the market cache needs a refresh:
 * - Empty cache
 * - Any symbol exceeded its 50/60/70 min staggered TTL
 * - Any record older than the hard ceiling (120 minutes / 2 hours)
 */
export function shouldRefreshCache(
  cacheRows: Array<{ symbol: string; lastUpdated?: Date | string | null }>
): boolean {
  if (!cacheRows || cacheRows.length === 0) return true;

  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  for (const row of cacheRows) {
    if (!row.lastUpdated) return true;
    const updatedMs = new Date(row.lastUpdated).getTime();
    if (isNaN(updatedMs)) return true;

    // Hard ceiling: older than 2 hours must be refreshed
    if (now - updatedMs > TWO_HOURS_MS) return true;

    // Staggered TTL check (50, 60, or 70 mins)
    const ttlMs = getSymbolTtlMinutes(row.symbol) * 60 * 1000;
    if (now - updatedMs > ttlMs) return true;
  }

  return false;
}

/**
 * Fetches latest market data from Chukul API and batch-upserts into PostgreSQL cache.
 */
export async function syncMarketDataFromSource(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  let stocks: any[] = [];
  try {
    const response = await fetch('https://chukul.com/api/data/market', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NepseTerminalPro/2.5',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const rawData = await response.json();
      stocks = Array.isArray(rawData) ? rawData : rawData.data || rawData.stocks || [];
    }
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    console.warn('Market sync fetch warning (using existing cache if available):', fetchErr?.message || fetchErr);
    return { success: false, count: 0, error: fetchErr?.message || 'Fetch failed' };
  }

  if (!stocks || stocks.length === 0) {
    return { success: false, count: 0, error: 'Empty stock response' };
  }

  const validRecords: Array<{
    symbol: string;
    ltp: number;
    changePercent: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
  }> = [];

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

  if (validRecords.length === 0) {
    return { success: false, count: 0, error: 'No valid tickers parsed' };
  }

  const now = new Date();
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
            lastUpdated: now,
          },
          create: {
            symbol: rec.symbol,
            ltp: rec.ltp,
            changePercent: rec.changePercent,
            volume: rec.volume,
            dayHigh: rec.dayHigh,
            dayLow: rec.dayLow,
            lastUpdated: now,
          },
        })
      )
    );
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: 'MARKET_SYNC',
        details: `Synced ${validRecords.length} live tickers from Chukul API with staggered TTL (50-70m)`,
      },
    });
  } catch {
    // Non-blocking audit log
  }

  return { success: true, count: validRecords.length };
}
