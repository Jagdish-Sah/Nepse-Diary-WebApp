import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const portfolio = await DataService.getPortfolio();
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, symbol, qty, price, transactionType, remarks } = body;

    if (!symbol || !qty || !price || !transactionType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const newRecord = await DataService.addPortfolioTransaction({
      date: date || new Date().toISOString().split('T')[0],
      symbol: symbol.toUpperCase().trim(),
      qty: Number(qty),
      price: Number(price),
      transactionType,
      remarks: remarks || '',
      netAmount: 0,
      totalInvested: 0,
      totalReceived: 0
    });

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await DataService.deletePortfolioRecord(Number(id));
    return NextResponse.json({ success: true, message: `Record ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
