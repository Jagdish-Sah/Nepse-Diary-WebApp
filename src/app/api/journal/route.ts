import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const journal = await DataService.getJournal();
    return NextResponse.json({ success: true, data: journal });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, topic, feeling, star, tradeThesis, finalRemark } = body;

    if (!topic || !tradeThesis) {
      return NextResponse.json({ success: false, error: 'Topic and Trade Thesis are required' }, { status: 400 });
    }

    const newRecord = await DataService.addJournal({
      symbol: (symbol || 'GENERAL').toUpperCase().trim(),
      topic,
      feeling: feeling || 'Neutral',
      star: Number(star || 5),
      tradeThesis,
      finalRemark: finalRemark || ''
    });

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
