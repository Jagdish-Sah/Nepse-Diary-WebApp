import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const wealth = await DataService.getWealth();
    return NextResponse.json({ success: true, data: wealth });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
