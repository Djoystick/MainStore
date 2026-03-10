import { NextResponse } from 'next/server';

import {
  isSessionFeatureConfigured,
  isTelegramVerificationConfigured,
  setSessionCookie,
  upsertProfileFromTelegramIdentity,
  verifyTelegramInitData,
} from '@/features/auth';

interface BootstrapBody {
  initDataRaw?: string;
}

export async function POST(request: Request) {
  if (!isTelegramVerificationConfigured() || !isSessionFeatureConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Server session bootstrap is not configured. Missing TELEGRAM_BOT_TOKEN or APP_SESSION_SECRET.',
      },
      { status: 503 },
    );
  }

  let body: BootstrapBody;
  try {
    body = (await request.json()) as BootstrapBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const initDataRaw = body.initDataRaw;
  if (!initDataRaw) {
    return NextResponse.json(
      { ok: false, error: 'initDataRaw is required.' },
      { status: 400 },
    );
  }

  const verification = verifyTelegramInitData(initDataRaw);
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: `Telegram init data verification failed: ${verification.reason}` },
      { status: 401 },
    );
  }

  const upsertResult = await upsertProfileFromTelegramIdentity(verification.user);
  if (!upsertResult.ok) {
    const statusCode =
      upsertResult.reason === 'supabase_service_role_missing' ? 503 : 500;

    return NextResponse.json(
      { ok: false, error: `Profile upsert failed: ${upsertResult.reason}` },
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
