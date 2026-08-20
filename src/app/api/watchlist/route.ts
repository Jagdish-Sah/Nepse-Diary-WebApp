import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.watchlist.findMany({
      orderBy: { symbol: 'asc' },
    });

    const data = rows.map((r) => ({
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Watchlist GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { symbol, targetPrice, stopLoss, hardTarget, hardSl, entry1, entryMust, notes } = body;

    const sym = (symbol || '').toUpperCase().trim();
    if (!sym) {
      return NextResponse.json({ success: false, error: 'Stock symbol is required.' }, { status: 400 });
    }

    const item = await prisma.watchlist.upsert({
      where: { symbol: sym },
      update: {
        targetPrice: parseFloat(targetPrice) || 0,
        stopLoss: parseFloat(stopLoss) || 0,
        hardTarget: parseFloat(hardTarget) || 0,
        hardSl: parseFloat(hardSl) || 0,
        entry1: parseFloat(entry1) || 0,
        entryMust: parseFloat(entryMust) || 0,
        notes: notes || null,
      },
      create: {
        symbol: sym,
        targetPrice: parseFloat(targetPrice) || 0,
        stopLoss: parseFloat(stopLoss) || 0,
        hardTarget: parseFloat(hardTarget) || 0,
        hardSl: parseFloat(hardSl) || 0,
        entry1: parseFloat(entry1) || 0,
        entryMust: parseFloat(entryMust) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save watchlist item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0', 10);
    const symbol = url.searchParams.get('symbol')?.toUpperCase().trim();

    if (id) {
      await prisma.watchlist.delete({ where: { id } });
    } else if (symbol) {
      await prisma.watchlist.delete({ where: { symbol } });
    } else {
      return NextResponse.json({ success: false, error: 'ID or symbol required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete watchlist item' }, { status: 500 });
  }
}
