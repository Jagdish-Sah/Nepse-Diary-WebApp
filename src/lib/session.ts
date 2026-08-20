import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface UserSession {
  userId: string;
  username: string;
  role: 'admin' | 'viewer';
  expiresAt: number;
}

const secretKey = process.env.SESSION_SECRET || 'nepse_terminal_pro_super_secure_jwt_secret_key_2026_983749817234';
const encodedKey = new TextEncoder().encode(secretKey);

export const SESSION_COOKIE_NAME = 'nepse_session';
const SESSION_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds

export async function signSession(payload: Omit<UserSession, 'expiresAt'>): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_EXPIRATION;
  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION}s`)
    .sign(encodedKey);
}

export async function verifySessionToken(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function createSession(username: string, role: 'admin' | 'viewer') {
  const token = await signSession({
    userId: username,
    username,
    role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRATION,
  });

  return { username, role };
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
