import { NextResponse, type NextRequest } from 'next/server';

import { createAdminCollection, getAdminRequestAccess, type CollectionUpsertInput } from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

function isCollectionPayload(value: unknown): value is CollectionUpsertInput {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.title === 'string' &&
    typeof record.slug === 'string' &&
    typeof record.isActive === 'boolean' &&
    typeof record.isFeatured === 'boolean' &&
    typeof record.sortOrder === 'number'
  );
}

export async function POST(request: NextRequest) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request_body' },
      { status: 400 },
    );
  }

  if (!isCollectionPayload(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_collection_payload' },
      { status: 400 },
    );
  }

  const result = await createAdminCollection(payload);

  if (!result.ok || !result.data) {
    const status = result.error === 'not_configured' ? 503 : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error: result.error, details },
      { status },
    );
  }

  return NextResponse.json({ ok: true, id: result.data.id });
}
