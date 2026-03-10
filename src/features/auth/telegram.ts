import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { formatMissingEnvMessage, readEnvOptional } from '@/lib/env/model';

import type { TelegramIdentity } from './types';

const MAX_INIT_DATA_AGE_SECONDS = 60 * 60 * 24;

function getTelegramBotTokenOptional(): string | null {
  return readEnvOptional('TELEGRAM_BOT_TOKEN');
}

function hashTelegramData(dataCheckString: string, botToken: string): string {
  const secret = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  return createHmac('sha256', secret).update(dataCheckString).digest('hex');
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];

  params.forEach((value, key) => {
    if (key === 'hash') {
      return;
    }
    pairs.push(`${key}=${value}`);
  });

  return pairs.sort((left, right) => left.localeCompare(right)).join('\n');
}

function parseTelegramUser(params: URLSearchParams): TelegramIdentity | null {
  const userRaw = params.get('user');
  if (!userRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(userRaw) as TelegramIdentity;
    if (!parsed || typeof parsed.id !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isAuthDateFresh(params: URLSearchParams): boolean {
  const authDateRaw = params.get('auth_date');
  if (!authDateRaw) {
    return false;
  }

  const authDateSeconds = Number(authDateRaw);
  if (!Number.isFinite(authDateSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (authDateSeconds > nowSeconds + 300) {
    return false;
  }

  return nowSeconds - authDateSeconds <= MAX_INIT_DATA_AGE_SECONDS;
}

export type VerifyTelegramInitDataResult =
  | { ok: true; user: TelegramIdentity }
  | { ok: false; reason: string };

export function verifyTelegramInitData(
  rawInitData: string,
): VerifyTelegramInitDataResult {
  const botToken = getTelegramBotTokenOptional();
  if (!botToken) {
    return { ok: false, reason: 'telegram_bot_token_missing' };
  }

  if (!rawInitData) {
    return { ok: false, reason: 'raw_init_data_missing' };
  }

  const params = new URLSearchParams(rawInitData);
  const hash = params.get('hash');

  if (!hash) {
    return { ok: false, reason: 'hash_missing' };
  }

  if (!isAuthDateFresh(params)) {
    return { ok: false, reason: 'auth_date_invalid_or_expired' };
  }

  const dataCheckString = buildDataCheckString(params);
  const expectedHash = hashTelegramData(dataCheckString, botToken);

  if (!safeEqualHex(expectedHash, hash)) {
    return { ok: false, reason: 'hash_verification_failed' };
  }

  const user = parseTelegramUser(params);
  if (!user) {
    return { ok: false, reason: 'user_payload_missing_or_invalid' };
  }

  return { ok: true, user };
}

export function isTelegramVerificationConfigured(): boolean {
  return Boolean(getTelegramBotTokenOptional());
}

export function getTelegramVerificationMissingEnvMessage(): string {
  return formatMissingEnvMessage('Telegram init data verification', ['TELEGRAM_BOT_TOKEN']);
}
