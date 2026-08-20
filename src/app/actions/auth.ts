'use server';

import { createSession, deleteSession, getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export interface AuthState {
  success?: boolean;
  error?: string;
}

export async function loginAction(prevState: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const username = (formData.get('username') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!username || !password) {
    return { error: 'Please enter both username and password.' };
  }

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'password123';
  const viewerUser = process.env.VIEWER_USERNAME || 'viewer';
  const viewerPass = process.env.VIEWER_PASSWORD || 'viewer123';

  let role: 'admin' | 'viewer' | null = null;

  if (username === adminUser && password === adminPass) {
    role = 'admin';
  } else if (username === viewerUser && password === viewerPass) {
    role = 'viewer';
  }

  if (!role) {
    return { error: 'Invalid username or password.' };
  }

  await createSession(username, role);
  redirect('/');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}

export async function getCurrentUser() {
  return getSession();
}
