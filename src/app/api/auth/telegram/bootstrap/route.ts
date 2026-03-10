import { NextResponse } from 'next/server';

import {
  getSessionFeatureMissingEnvMessage,
  getTelegramVerificationMissingEnvMessage,
  isSessionFeatureConfigured,
  isTelegramVerificationConfigured,
  setSessionCookie,
  upsertProfileFromTelegramIdentity,
  verifyTelegramInitData,
} from '@/features/auth';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

interface BootstrapBody {
  initDataRaw?: string;
}

export async function POST(request: Request) {
  if (!isTelegramVerificationConfigured() || !isSessionFeatureConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'bootstrap_not_configured',
        error: 'Серверная сессия Telegram не настроена.',
        details: [
          getTelegramVerificationMissingEnvMessage(),
          getSessionFeatureMissingEnvMessage(),
        ],
      },
      { status: 503 },
    );
  }

  let body: BootstrapBody;
  try {
    body = (await request.json()) as BootstrapBody;
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'invalid_request_body', error: 'Некорректное тело запроса.' },
      { status: 400 },
    );
  }

  const initDataRaw = body.initDataRaw;
  if (!initDataRaw) {
    return NextResponse.json(
      { ok: false, reason: 'init_data_missing', error: 'Нужно передать initDataRaw.' },
      { status: 400 },
    );
  }

  const verification = verifyTelegramInitData(initDataRaw);
  if (!verification.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: verification.reason,
        error: `Не удалось проверить Telegram init data: ${verification.reason}`,
      },
      { status: 401 },
    );
  }

  const upsertResult = await upsertProfileFromTelegramIdentity(verification.user);
  if (!upsertResult.ok) {
    const statusCode =
      upsertResult.reason === 'supabase_admin_unavailable' ? 503 : 500;
    const details =
      upsertResult.reason === 'supabase_admin_unavailable'
        ? [getSupabaseAdminMissingEnvMessage()]
        : upsertResult.details;

    console.error('[MainStore] Telegram bootstrap profile upsert failed', {
      reason: upsertResult.reason,
      details: upsertResult.details ?? [],
    });

    return NextResponse.json(
      {
        ok: false,
        reason: upsertResult.reason,
        error: `Не удалось сохранить профиль: ${upsertResult.reason}`,
        details,
      },
      { status: statusCode },
    );
  }

  const profile = upsertResult.profile;
  const response = NextResponse.json({
    ok: true,
    profile: {
      id: profile.id,
      role: profile.role,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
    },
  });

  setSessionCookie(response, {
    profileId: profile.id,
    telegramUserId: profile.telegramUserId ?? verification.user.id,
    role: profile.role,
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  });

  return response;
}
