import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

import { formatMissingEnvMessage, readEnvOptional } from '@/lib/env/model';

import type { AppSession } from './types';

const SESSION_COOKIE_NAME = 'ms_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  v: 1;
  profileId: string;
  telegramUserId: number;
  role: AppSession['role'];
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  expiresAt: number;
};

function getSessionSecretOptional(): string | null {
  return readEnvOptional('APP_SESSION_SECRET');
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}

function decodePayload(encodedPayload: string): SessionPayload | null {
  try {
    const decoded = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (parsed.v !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('hex');
}

function verifySignature(
  encodedPayload: string,
  providedSignature: string,
  secret: string,
): boolean {
  try {
    const expectedSignature = signPayload(encodedPayload, secret);
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

function payloadToSession(payload: SessionPayload): AppSession | null {
  if (
    !payload.profileId ||
    !Number.isFinite(payload.telegramUserId) ||
    !Number.isFinite(payload.expiresAt)
  ) {
    return null;
  }

  if (Date.now() >= payload.expiresAt) {
    return null;
  }

  return {
    profileId: payload.profileId,
    telegramUserId: payload.telegramUserId,
    role: payload.role,
    displayName: payload.displayName,
    username: payload.username,
    avatarUrl: payload.avatarUrl,
    expiresAt: payload.expiresAt,
  };
}

function parseSessionCookieValue(cookieValue: string): AppSession | null {
  const secret = getSessionSecretOptional();
  if (!secret) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!verifySignature(encodedPayload, signature, secret)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  return payloadToSession(payload);
}

export function createSessionToken(session: Omit<AppSession, 'expiresAt'>): string | null {
  const secret = getSessionSecretOptional();
  if (!secret) {
    return null;
  }

  const payload: SessionPayload = {
    v: 1,
    profileId: session.profileId,
    telegramUserId: session.telegramUserId,
    role: session.role,
    displayName: session.displayName,
    username: session.username,
    avatarUrl: session.avatarUrl,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function getCurrentSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return parseSessionCookieValue(token);
}

export function getCurrentSessionFromRequest(request: NextRequest): AppSession | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return parseSessionCookieValue(token);
}

export function setSessionCookie(
  response: NextResponse,
  session: Omit<AppSession, 'expiresAt'>,
) {
  const token = createSessionToken(session);
  if (!token) {
    return;
  }

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function isSessionFeatureConfigured(): boolean {
  return Boolean(getSessionSecretOptional());
}

export function getSessionFeatureMissingEnvMessage(): string {
  return formatMissingEnvMessage('Signed app session configuration', ['APP_SESSION_SECRET']);
}
