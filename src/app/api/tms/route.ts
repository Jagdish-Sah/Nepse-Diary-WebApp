import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const tms = await DataService.getTms();
    return NextResponse.json({ success: true, data: tms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, stock, type, medium, amount, charge, remark, status, reference } = body;

    if (!type || !medium || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const newRecord = await DataService.addTms({
      date: date || new Date().toISOString().split('T')[0],
      stock: stock ? stock.toUpperCase().trim() : undefined,
      type,
      medium,
      amount: Number(amount),
      charge: Number(charge || 0),
      remark: remark || '',
      status: status || 'Settled',
      reference: reference || ''
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

    await DataService.deleteTms(Number(id));
    return NextResponse.json({ success: true, message: `TMS Record ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
