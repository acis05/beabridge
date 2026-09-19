import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const COOKIE = 'beabridge_session';
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('12h').sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE, '', { httpOnly: true, path: '/', expires: new Date(0) });
}

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || typeof payload.userId !== 'string') return null;
    return prisma.user.findUnique({ where: { id: payload.userId }, include: { company: true } });
  } catch { return null; }
}
