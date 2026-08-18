import { prisma } from './prisma';
import { calculateNepseFees } from './nepse-math';

export interface PortfolioRecord {
  id?: number;
  date: string;
  symbol: string;
  qty: number;
  price: number;
  transactionType: 'BUY' | 'SELL';
  remarks?: string;
  netAmount: number;
  totalInvested: number;
  totalReceived: number;
  tmsCommission?: number;
  cgt?: number;
  createdAt?: string;
}

export interface TmsRecord {
  id?: number;
  date: string;
  stock?: string;
  type: string; // Deposit, Withdrawal, Buy, Sell, Charges, Collateral Load
  medium: string;
  amount: number;
  charge: number;
  remark?: string;
  status: string; // Settled, Pending
  reference?: string;
}

export interface WatchlistRecord {
  id?: number;
  symbol: string;
  targetPrice: number;
  stopLoss: number;
  hardTarget: number;
  hardSl: number;
  entry1: number;
  entryMust: number;
  notes?: string;
}

export interface JournalRecord {
  id?: number;
  dateTimeStamp?: string;
  symbol: string;
  topic: string;
  feeling: string;
  star: number;
  tradeThesis: string;
  finalRemark?: string;
}

export interface CacheRecord {
  id?: number;
  symbol: string;
  ltp: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated?: string;
}

export interface WealthRecord {
  id?: number;
  snapshotDate: string;
  totalInvestment: number;
  currentValue: number;
}

export interface AuditRecord {
  id?: number;
  timestamp?: string;
  action: string;
  symbol?: string;
  details: string;
}

export const DataService = {
  // PORTFOLIO
  async getPortfolio(): Promise<PortfolioRecord[]> {
    const rows = await prisma.portfolio.findMany({ orderBy: { date: 'desc' } });
    return rows.map(r => ({
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
      createdAt: r.createdAt ? r.createdAt.toISOString() : undefined
    }));
  },

  async addPortfolioTransaction(data: Omit<PortfolioRecord, 'id'>): Promise<PortfolioRecord> {
    const feeResult = calculateNepseFees({
      qty: data.qty,
      price: data.price,
      trxType: data.transactionType,
      wacc: data.transactionType === 'SELL' ? (data.totalInvested / data.qty) : 0
    });

    const netAmount = data.netAmount || feeResult.totalPayableOrReceivable;
    const totalInvested = data.transactionType === 'BUY' ? netAmount : 0;
    const totalReceived = data.transactionType === 'SELL' ? netAmount : 0;
    const tmsCommission = feeResult.brokerCommission + feeResult.sebonFee;
    const cgt = data.transactionType === 'SELL' ? (feeResult.cgt || 0) : undefined;

    const inserted = await prisma.portfolio.create({
      data: {
        date: new Date(data.date),
        symbol: data.symbol.toUpperCase().trim(),
        qty: data.qty,
        price: data.price,
        transactionType: data.transactionType,
        remarks: data.remarks || '',
        netAmount,
        totalInvested,
        totalReceived,
        tmsCommission,
        cgt
      }
    });

    // Auto-log TMS transaction
    const tmsAmount = data.transactionType === 'BUY' ? -netAmount : netAmount;
    await prisma.tmsTransaction.create({
      data: {
        date: new Date(data.date),
        stock: data.symbol.toUpperCase().trim(),
        type: data.transactionType === 'BUY' ? 'Buy' : 'Sell',
        medium: 'Collateral',
        amount: tmsAmount,
        charge: 0,
        remark: `Auto-Logged: ${data.remarks || data.transactionType}`,
        status: 'Settled',
        reference: `AUTOTRX-${Date.now().toString().slice(-5)}`
      }
    });

    // Auto-log audit
    await prisma.auditLog.create({
      data: {
        action: `TRADE_${data.transactionType}`,
        symbol: data.symbol.toUpperCase().trim(),
        details: `${data.qty} units @ Rs ${data.price} | Impact: Rs ${tmsAmount.toFixed(2)}`
      }
    });

    return {
      ...data,
      id: inserted.id,
      netAmount,
      totalInvested,
      totalReceived,
      tmsCommission,
      cgt
    };
  },

  async deletePortfolioRecord(id: number): Promise<boolean> {
    await prisma.portfolio.delete({ where: { id } });
    return true;
  },

  // TMS TRANSACTIONS
  async getTms(): Promise<TmsRecord[]> {
    const rows = await prisma.tmsTransaction.findMany({ orderBy: { date: 'desc' } });
    return rows.map(r => ({
      id: r.id,
      date: r.date ? r.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      stock: r.stock || undefined,
      type: r.type,
      medium: r.medium,
      amount: r.amount,
      charge: r.charge,
      remark: r.remark || undefined,
      status: r.status,
      reference: r.reference || undefined
    }));
  },

  async addTms(data: Omit<TmsRecord, 'id'>): Promise<TmsRecord> {
    const inserted = await prisma.tmsTransaction.create({
      data: {
        date: new Date(data.date),
        stock: data.stock || null,
        type: data.type,
        medium: data.medium,
        amount: data.amount,
        charge: data.charge,
        remark: data.remark || null,
        status: data.status,
        reference: data.reference || null
      }
    });
    return { ...data, id: inserted.id };
  },

  async deleteTms(id: number): Promise<boolean> {
    await prisma.tmsTransaction.delete({ where: { id } });
    return true;
  },

  // WATCHLIST
  async getWatchlist(): Promise<WatchlistRecord[]> {
    const rows = await prisma.watchlist.findMany({ orderBy: { symbol: 'asc' } });
    return rows.map(r => ({
      id: r.id,
      symbol: r.symbol,
      targetPrice: r.targetPrice,
      stopLoss: r.stopLoss,
      hardTarget: r.hardTarget,
      hardSl: r.hardSl,
      entry1: r.entry1,
      entryMust: r.entryMust,
      notes: r.notes || undefined
    }));
  },

  async saveWatchlist(data: Omit<WatchlistRecord, 'id'>): Promise<WatchlistRecord> {
    const symbol = data.symbol.toUpperCase().trim();
    const upserted = await prisma.watchlist.upsert({
      where: { symbol },
      update: { ...data, symbol },
      create: { ...data, symbol }
    });
    return { ...data, id: upserted.id, symbol };
  },

  async deleteWatchlist(symbol: string): Promise<boolean> {
    const sym = symbol.toUpperCase().trim();
    await prisma.watchlist.delete({ where: { symbol: sym } });
    return true;
  },

  // TRADING JOURNAL
  async getJournal(): Promise<JournalRecord[]> {
    const rows = await prisma.tradingJournal.findMany({ orderBy: { dateTimeStamp: 'desc' } });
    return rows.map(r => ({
      id: r.id,
      dateTimeStamp: r.dateTimeStamp ? r.dateTimeStamp.toISOString() : undefined,
      symbol: r.symbol,
      topic: r.topic,
      feeling: r.feeling,
      star: r.star,
      tradeThesis: r.tradeThesis,
      finalRemark: r.finalRemark || undefined
    }));
  },

  async addJournal(data: Omit<JournalRecord, 'id' | 'dateTimeStamp'>): Promise<JournalRecord> {
    const inserted = await prisma.tradingJournal.create({
      data: {
        symbol: data.symbol.toUpperCase().trim(),
        topic: data.topic,
        feeling: data.feeling,
        star: data.star,
        tradeThesis: data.tradeThesis,
        finalRemark: data.finalRemark || null
      }
    });
    return {
      ...data,
      id: inserted.id,
      dateTimeStamp: inserted.dateTimeStamp.toISOString()
    };
  },

  // MARKET CACHE
  async getMarketCache(): Promise<CacheRecord[]> {
    const rows = await prisma.marketCache.findMany({ orderBy: { symbol: 'asc' } });
    return rows.map(r => ({
      id: r.id,
      symbol: r.symbol,
      ltp: r.ltp,
      changePercent: r.changePercent,
      volume: r.volume,
      dayHigh: r.dayHigh,
      dayLow: r.dayLow,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : undefined
    }));
  },

  async updateMarketCache(records: Omit<CacheRecord, 'id'>[]): Promise<void> {
    for (const rec of records) {
      await prisma.marketCache.upsert({
        where: { symbol: rec.symbol.toUpperCase().trim() },
        update: {
          ltp: rec.ltp,
          changePercent: rec.changePercent,
          volume: rec.volume,
          dayHigh: rec.dayHigh,
          dayLow: rec.dayLow,
          lastUpdated: new Date()
        },
        create: {
          symbol: rec.symbol.toUpperCase().trim(),
          ltp: rec.ltp,
          changePercent: rec.changePercent,
          volume: rec.volume,
          dayHigh: rec.dayHigh,
          dayLow: rec.dayLow,
          lastUpdated: new Date()
        }
      });
    }
  },

  // WEALTH HISTORY
  async getWealth(): Promise<WealthRecord[]> {
    const rows = await prisma.wealthSnapshot.findMany({ orderBy: { snapshotDate: 'asc' } });
    return rows.map(r => ({
      id: r.id,
      snapshotDate: r.snapshotDate ? r.snapshotDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalInvestment: r.totalInvestment,
      currentValue: r.currentValue
    }));
  },

  // AUDIT LOG
  async getAuditLog(): Promise<AuditRecord[]> {
    const rows = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 200 });
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp ? r.timestamp.toISOString() : undefined,
      action: r.action,
      symbol: r.symbol || undefined,
      details: r.details
    }));
  },

  async addAuditLog(action: string, symbol: string, details: string): Promise<void> {
    await prisma.auditLog.create({
      data: { action, symbol: symbol || null, details }
    });
  }
};
