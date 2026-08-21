import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.wealthSnapshot.findMany({
      orderBy: { snapshotDate: 'asc' },
    });

    const data = rows.map((r) => ({
      snapshotDate: r.snapshotDate ? r.snapshotDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalInvestment: r.totalInvestment,
      currentValue: r.currentValue,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Wealth GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wealth trajectory' }, { status: 500 });
  }
}
