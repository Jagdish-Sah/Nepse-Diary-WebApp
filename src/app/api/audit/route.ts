import { NextResponse } from 'next/server';
import { DataService } from '@/lib/storage';

export async function GET() {
  try {
    const audit = await DataService.getAuditLog();
    return NextResponse.json({ success: true, data: audit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
