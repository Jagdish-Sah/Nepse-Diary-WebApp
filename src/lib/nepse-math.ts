/**
 * NEPSE Quantitative Financial Math Engine
 * Precision formulas for Nepal Stock Exchange (NEPSE) transactions,
 * broker commission tiers, SEBON fees, DP charges, CGT, FIFO WACC, and breakeven prices.
 */

export interface TransactionFeeResult {
  baseAmount: number;
  brokerCommission: number;
  sebonFee: number;
  dpFee: number;
  totalFees: number;
  totalPayableOrReceivable: number; // Payable for BUY, Receivable for SELL
  breakevenPrice?: number;
  cgt?: number;
  profit?: number;
  cgtRate?: number;
}

export interface InventoryLot {
  qty: number;
  totalCost: number;
  buyDate: string;
  buyPrice: number;
  buyRemark?: string;
}

export interface ActiveHolding {
  symbol: string;
  netQty: number;
  wacc: number;
  totalCost: number;
  firstBuyDate: string;
}

/**
 * Calculates NEPSE Tiered Broker Commission based on order value.
 * Tiers:
 * - Up to Rs 50,000: 0.36% (Minimum Rs 10)
 * - Rs 50,001 to Rs 500,000: 0.33%
 * - Rs 500,001 to Rs 2,000,000: 0.31%
 * - Rs 2,000,001 to Rs 10,000,000: 0.27%
 * - Above Rs 10,000,000: 0.24%
 */
export function getBrokerCommissionRate(amount: number): number {
  if (amount <= 50000) return 0.0036;
  if (amount <= 500000) return 0.0033;
  if (amount <= 2000000) return 0.0031;
  if (amount <= 10000000) return 0.0027;
  return 0.0024;
}

export function calculateBrokerCommission(amount: number, overrideComm: number = 0): number {
  if (overrideComm > 0) return overrideComm;
  const rate = getBrokerCommissionRate(amount);
  return Math.max(10.0, amount * rate);
}

/**
 * Calculates full NEPSE settlement bill for BUY or SELL.
 */
export function calculateNepseFees(params: {
  qty: number;
  price: number;
  trxType: 'BUY' | 'SELL';
  includeDp?: boolean;
  wacc?: number;
  cgtRate?: number; // 0.05 for > 1 year, 0.075 or 0.10 for <= 1 year
  overrideComm?: number;
}): TransactionFeeResult {
  const {
    qty,
    price,
    trxType,
    includeDp = true,
    wacc = 0,
    cgtRate = 0.075,
    overrideComm = 0
  } = params;

  const baseAmount = qty * price;
  const brokerCommission = calculateBrokerCommission(baseAmount, overrideComm);
  const sebonFee = baseAmount * 0.00015; // 0.015%
  const dpFee = includeDp ? 25.0 : 0.0;
  const totalFees = brokerCommission + sebonFee + dpFee;

  if (trxType === 'BUY') {
    const totalPayable = baseAmount + totalFees;

    // Exact algebraic breakeven price calculation:
    // Finds the sell price required to recover buy fees + estimated sell fees
    let breakevenPrice = 0;
    const commRate = getBrokerCommissionRate(baseAmount);
    if (baseAmount * commRate < 10.0) {
      const targetSellBase = (totalPayable + dpFee + 10.0) / (1.0 - 0.00015);
      breakevenPrice = targetSellBase / qty;
    } else {
      const targetSellBase = (totalPayable + dpFee) / (1.0 - commRate - 0.00015);
      breakevenPrice = targetSellBase / qty;
    }

    return {
      baseAmount,
      brokerCommission,
      sebonFee,
      dpFee,
      totalFees,
      totalPayableOrReceivable: totalPayable,
      breakevenPrice
    };
  } else {
    // SELL SIDE
    const netSellValue = baseAmount - totalFees;
    const totalBuyCost = wacc * qty;
    const profit = netSellValue - totalBuyCost;

    const cgt = profit > 0 ? profit * cgtRate : 0.0;
    const receivable = netSellValue - cgt;

    return {
      baseAmount,
      brokerCommission,
      sebonFee,
      dpFee,
      totalFees,
      totalPayableOrReceivable: receivable,
      cgt,
      profit,
      cgtRate
    };
  }
}

/**
 * Calculates active holdings and WACC using strict FIFO (First-In, First-Out) tax lot matching.
 */
export function calculateFifoHoldings(transactions: Array<{
  date: string | Date;
  symbol: string;
  qty: number;
  price: number;
  transactionType: string;
  netAmount?: number;
  totalInvested?: number;
}>): ActiveHolding[] {
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => {
    const d1 = new Date(a.date).getTime();
    const d2 = new Date(b.date).getTime();
    if (d1 !== d2) return d1 - d2;
    // On same day, SELLs process after BUYs
    return a.transactionType.toUpperCase() === 'SELL' ? 1 : -1;
  });

  const symbolInventory: Record<string, InventoryLot[]> = {};

  for (const row of sorted) {
    const sym = row.symbol.toUpperCase().trim();
    if (!symbolInventory[sym]) symbolInventory[sym] = [];

    const qty = Math.abs(Number(row.qty));
    const netAmt = row.netAmount && row.netAmount > 0
      ? Number(row.netAmount)
      : qty * Number(row.price);

    const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];

    if (row.transactionType.toUpperCase() === 'BUY') {
      symbolInventory[sym].push({
        qty,
        totalCost: netAmt,
        buyDate: dateStr,
        buyPrice: Number(row.price)
      });
    } else if (row.transactionType.toUpperCase() === 'SELL') {
      let rem = qty;
      while (rem > 0 && symbolInventory[sym].length > 0) {
        const oldestLot = symbolInventory[sym][0];
        if (oldestLot.qty <= rem) {
          rem -= oldestLot.qty;
          symbolInventory[sym].shift();
        } else {
          const unitCost = oldestLot.totalCost / oldestLot.qty;
          oldestLot.qty -= rem;
          oldestLot.totalCost = Math.round((oldestLot.totalCost - unitCost * rem) * 10000) / 10000;
          rem = 0;
        }
      }
    }
  }

  const activeHoldings: ActiveHolding[] = [];

  for (const [sym, lots] of Object.entries(symbolInventory)) {
    if (lots.length > 0) {
      const netQty = lots.reduce((sum, l) => sum + l.qty, 0);
      const totalCost = lots.reduce((sum, l) => sum + l.totalCost, 0);
      if (netQty > 0) {
        activeHoldings.push({
          symbol: sym,
          netQty,
          wacc: totalCost / netQty,
          totalCost,
          firstBuyDate: lots[0].buyDate
        });
      }
    }
  }

  return activeHoldings;
}

/**
 * Position Sizing Risk Engine (Kelly Criterion & R/R math)
 */
export function calculatePositionSize(params: {
  accountSize: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}) {
  const { accountSize, riskPercent, entryPrice, stopLossPrice, takeProfitPrice } = params;

  if (entryPrice <= stopLossPrice) {
    throw new Error('Stop loss price must be lower than entry price.');
  }

  const maxRiskAmount = accountSize * (riskPercent / 100);
  const riskPerShare = entryPrice - stopLossPrice;
  const unitsToBuy = Math.floor(maxRiskAmount / riskPerShare);
  const totalInvestment = unitsToBuy * entryPrice;
  const rewardPerShare = takeProfitPrice - entryPrice;
  const riskRewardRatio = rewardPerShare / riskPerShare;

  return {
    unitsToBuy,
    totalInvestment,
    maxRiskAmount,
    riskRewardRatio,
    isGoodRr: riskRewardRatio >= 2.0
  };
}

/**
 * Calculates drawdown metrics from a time series of values.
 */
export function calculateDrawdown(values: number[]): {
  maxDrawdownPct: number;
  currentDrawdownPct: number;
  peakValue: number;
} {
  if (values.length === 0) return { maxDrawdownPct: 0, currentDrawdownPct: 0, peakValue: 0 };

  let peak = -Infinity;
  let maxDd = 0;

  for (const val of values) {
    if (val > peak) peak = val;
    const dd = ((peak - val) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  const currentVal = values[values.length - 1];
  const currentDd = peak > 0 ? ((peak - currentVal) / peak) * 100 : 0;

  return {
    maxDrawdownPct: maxDd,
    currentDrawdownPct: currentDd,
    peakValue: peak
  };
}
