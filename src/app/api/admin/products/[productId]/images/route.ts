import { NextResponse, type NextRequest } from 'next/server';

import {
  createAdminProductImage,
  getAdminRequestAccess,
  type ProductImageUpsertInput,
} from '@/features/admin';

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

  if (!isImageInput(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_image_payload' },
      { status: 400 },
    );
  }

  const result = await createAdminProductImage(productId, payload);
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === 'not_configured' ? 503 : 400 },
    );
  }

  return NextResponse.json({ ok: true, id: result.data.id });
}
