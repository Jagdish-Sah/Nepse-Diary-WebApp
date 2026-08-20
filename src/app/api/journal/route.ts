import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.tradingJournal.findMany({
      orderBy: { dateTimeStamp: 'desc' },
    });

    const data = rows.map((r) => ({
      id: r.id,
      dateTimeStamp: r.dateTimeStamp ? r.dateTimeStamp.toISOString() : undefined,
      symbol: r.symbol,
      topic: r.topic,
      feeling: r.feeling,
      star: r.star,
      tradeThesis: r.tradeThesis,
      finalRemark: r.finalRemark || undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Journal GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch journal' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { symbol, topic, feeling, star, tradeThesis, finalRemark } = body;

    if (!topic || !tradeThesis) {
      return NextResponse.json({ success: false, error: 'Topic and trade thesis are required.' }, { status: 400 });
    }

    const entry = await prisma.tradingJournal.create({
      data: {
        symbol: symbol ? symbol.toUpperCase().trim() : 'GENERAL',
        topic,
        feeling: feeling || 'Disciplined',
        star: parseInt(star, 10) || 5,
        tradeThesis,
        finalRemark: finalRemark || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Journal POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create journal entry' }, { status: 500 });
  }
}
