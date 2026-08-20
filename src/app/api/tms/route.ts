import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleAuthError } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const rows = await prisma.tmsTransaction.findMany({
      orderBy: { date: 'desc' },
    });

    const data = rows.map((r) => ({
      id: r.id,
      date: r.date ? r.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      stock: r.stock || undefined,
      type: r.type,
      medium: r.medium,
      amount: r.amount,
      charge: r.charge,
      remark: r.remark || undefined,
      status: r.status,
      reference: r.reference || undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('TMS GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch TMS records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { date, stock, type, medium, amount, charge, remark, status, reference } = body;

    const numAmount = parseFloat(amount);
    const numCharge = parseFloat(charge) || 0;

    if (isNaN(numAmount) || !type || !medium) {
      return NextResponse.json({ success: false, error: 'Invalid TMS transaction parameters.' }, { status: 400 });
    }

    const tDate = date ? new Date(date) : new Date();

    const [transaction] = await prisma.$transaction([
      prisma.tmsTransaction.create({
        data: {
          date: tDate,
          stock: stock ? stock.toUpperCase().trim() : null,
          type,
          medium,
          amount: numAmount,
          charge: numCharge,
          remark: remark || null,
          status: status || 'Settled',
          reference: reference || `MAN-${Date.now().toString().slice(-6)}`,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'TMS_ENTRY',
          symbol: stock ? stock.toUpperCase().trim() : null,
          details: `${type} via ${medium}: Rs ${numAmount}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('TMS POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create TMS record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0', 10);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });
    }

    await prisma.tmsTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('TMS DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete TMS record' }, { status: 500 });
  }
}
