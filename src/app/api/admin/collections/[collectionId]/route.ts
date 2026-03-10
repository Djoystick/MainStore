import { NextResponse, type NextRequest } from 'next/server';

import {
  deleteAdminCollection,
  getAdminRequestAccess,
  updateAdminCollection,
  type CollectionUpsertInput,
} from '@/features/admin';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { collectionId } = await params;
  if (!collectionId) {
    return NextResponse.json(
      { ok: false, error: 'collection_id_required' },
      { status: 400 },
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

  const result = await updateAdminCollection(collectionId, payload);

  if (!result.ok) {
    const status =
      result.error === 'not_configured'
        ? 503
        : result.error === 'collection_not_found'
          ? 404
          : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error: result.error, details },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { collectionId } = await params;
  if (!collectionId) {
    return NextResponse.json(
      { ok: false, error: 'collection_id_required' },
      { status: 400 },
    );
  }

  const result = await deleteAdminCollection(collectionId);
  if (!result.ok || !result.data) {
    const status =
      result.error === 'not_configured'
        ? 503
        : result.error === 'collection_not_found'
          ? 404
          : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error: result.error, details },
      { status },
    );
  }

  return NextResponse.json({ ok: true, summary: result.data });
}
