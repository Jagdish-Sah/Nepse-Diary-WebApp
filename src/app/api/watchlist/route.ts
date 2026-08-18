import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const watchlist = await DataService.getWatchlist();
    return NextResponse.json({ success: true, data: watchlist });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, targetPrice, stopLoss, hardTarget, hardSl, entry1, entryMust, notes } = body;

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
    }

    const saved = await DataService.saveWatchlist({
      symbol: symbol.toUpperCase().trim(),
      targetPrice: Number(targetPrice || 0),
      stopLoss: Number(stopLoss || 0),
      hardTarget: Number(hardTarget || 0),
      hardSl: Number(hardSl || 0),
      entry1: Number(entry1 || 0),
      entryMust: Number(entryMust || 0),
      notes: notes || ''
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
    }

    await DataService.deleteWatchlist(symbol);
    return NextResponse.json({ success: true, message: `Watchlist symbol ${symbol} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
