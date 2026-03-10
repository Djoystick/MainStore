import { NextResponse, type NextRequest } from 'next/server';

import {
  deleteAdminProductImage,
  getAdminRequestAccess,
  updateAdminProductImage,
  type ProductImageUpsertInput,
} from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

function isImageInput(value: unknown): value is ProductImageUpsertInput {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.url === 'string' &&
    typeof record.sortOrder === 'number' &&
    typeof record.isPrimary === 'boolean'
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { imageId } = await params;
  if (!imageId) {
    return NextResponse.json(
      { ok: false, error: 'image_id_required' },
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

  if (!isImageInput(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_image_payload' },
      { status: 400 },
    );
  }

  const result = await updateAdminProductImage(imageId, payload);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { imageId } = await params;
  if (!imageId) {
    return NextResponse.json(
      { ok: false, error: 'image_id_required' },
      { status: 400 },
    );
  }

  const result = await deleteAdminProductImage(imageId);
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
