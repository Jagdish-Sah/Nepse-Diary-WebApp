import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    const data = rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp ? r.timestamp.toISOString() : undefined,
      action: r.action,
      symbol: r.symbol || undefined,
      details: r.details,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('Audit GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
