import 'server-only';
import { getSession, UserSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireAdmin(): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'Authentication required. Please login.' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'Admin privileges required for this action.' }, { status: 403 });
    }
  }
  return null;
}
