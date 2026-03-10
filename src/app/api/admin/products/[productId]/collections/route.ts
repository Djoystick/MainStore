import { NextResponse, type NextRequest } from 'next/server';

import {
  deleteAdminProductCollection,
  getAdminRequestAccess,
  upsertAdminProductCollection,
} from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

function isProductCollectionPayload(
  value: unknown,
): value is { collectionId: string; sortOrder: number } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.collectionId === 'string' && typeof record.sortOrder === 'number';
}

function isProductCollectionDeletePayload(
  value: unknown,
): value is { collectionId: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.collectionId === 'string';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { productId } = await params;
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: 'product_id_required' },
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

  if (!isProductCollectionPayload(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_product_collection_payload' },
      { status: 400 },
    );
  }

  const result = await upsertAdminProductCollection(
    productId,
    payload.collectionId,
    payload.sortOrder,
  );

  if (!result.ok) {
    const status =
      result.error === 'not_configured'
        ? 503
        : result.error === 'product_not_found' || result.error === 'collection_not_found'
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
  { params }: { params: Promise<{ productId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { productId } = await params;
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: 'product_id_required' },
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

  if (!isProductCollectionDeletePayload(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_product_collection_payload' },
      { status: 400 },
    );
  }

  const result = await deleteAdminProductCollection(productId, payload.collectionId);
  if (!result.ok) {
    const status = result.error === 'not_configured' ? 503 : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error: result.error, details },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}
