import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleAuthError } from '@/lib/auth';
import { calculateNepseFees } from '@/lib/nepse-math';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.portfolio.findMany({
      orderBy: { date: 'desc' },
    });

    const data = rows.map((r) => ({
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Portfolio GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { date, symbol, qty, price, transactionType, remarks } = body;

    const numQty = parseFloat(qty);
    const numPrice = parseFloat(price);
    const sym = (symbol || '').toUpperCase().trim();
    const type = (transactionType || 'BUY').toUpperCase() as 'BUY' | 'SELL';

    if (!sym || isNaN(numQty) || numQty <= 0 || isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid trade input parameters.' }, { status: 400 });
    }

    const feeResult = calculateNepseFees({
      qty: numQty,
      price: numPrice,
      trxType: type,
    });

    const netAmount = feeResult.totalPayableOrReceivable;
    const totalInvested = type === 'BUY' ? netAmount : 0;
    const totalReceived = type === 'SELL' ? netAmount : 0;
    const tmsCommission = feeResult.brokerCommission + feeResult.sebonFee;
    const cgt = type === 'SELL' ? (feeResult.cgt || 0) : null;

    const tradeDate = date ? new Date(date) : new Date();

    // Use transaction for atomic consistency
    const [trade] = await prisma.$transaction([
      prisma.portfolio.create({
        data: {
          date: tradeDate,
          symbol: sym,
          qty: numQty,
          price: numPrice,
          transactionType: type,
          remarks: remarks || '',
          netAmount,
          totalInvested,
          totalReceived,
          tmsCommission,
          cgt,
        },
      }),
      prisma.tmsTransaction.create({
        data: {
          date: tradeDate,
          stock: sym,
          type: type === 'BUY' ? 'Buy' : 'Sell',
          medium: 'Collateral',
          amount: type === 'BUY' ? -netAmount : netAmount,
          charge: 0,
          remark: `Auto-Logged: ${remarks || type}`,
          status: 'Settled',
          reference: `TRD-${Date.now().toString().slice(-6)}`,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: `TRADE_${type}`,
          symbol: sym,
          details: `${numQty} units @ Rs ${numPrice} | Net: Rs ${netAmount.toFixed(2)}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: trade }, { status: 201 });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Portfolio POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create trade record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0', 10);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });
    }

    await prisma.portfolio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Portfolio DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete trade record' }, { status: 500 });
  }
}
