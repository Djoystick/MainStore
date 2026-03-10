import { NextResponse, type NextRequest } from 'next/server';

import {
  deleteAdminProduct,
  getAdminRequestAccess,
  updateAdminProduct,
  updateAdminProductFeatured,
  updateAdminProductStatus,
  type ProductStatus,
  type ProductUpsertInput,
} from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

function isProductStatus(value: unknown): value is ProductStatus {
  return value === 'draft' || value === 'active' || value === 'archived';
}

function isFeaturedPayload(value: unknown): value is { isFeatured: boolean } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && typeof record.isFeatured === 'boolean';
}

function isProductUpsertInput(value: unknown): value is ProductUpsertInput {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.slug === 'string' &&
    typeof record.title === 'string' &&
    typeof record.price === 'number' &&
    typeof record.currency === 'string' &&
    typeof record.status === 'string' &&
    typeof record.isFeatured === 'boolean' &&
    typeof record.stockQuantity === 'number'
  );
}

export async function PATCH(
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

  if (
    payload &&
    typeof payload === 'object' &&
    Object.keys(payload as Record<string, unknown>).length === 1 &&
    isProductStatus((payload as { status?: unknown }).status)
  ) {
    const result = await updateAdminProductStatus(
      productId,
      (payload as { status: ProductStatus }).status,
    );

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

  if (isFeaturedPayload(payload)) {
    const result = await updateAdminProductFeatured(productId, payload.isFeatured);

    if (!result.ok) {
      const status =
        result.error === 'not_configured'
          ? 503
          : result.error === 'product_not_found'
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

  if (!isProductUpsertInput(payload)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_product_payload' },
      { status: 400 },
    );
  }

  const result = await updateAdminProduct(productId, payload);
  if (!result.ok) {
    const status =
      result.error === 'not_configured'
        ? 503
        : result.error === 'product_not_found'
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

  const result = await deleteAdminProduct(productId);
  if (!result.ok || !result.data) {
    const status =
      result.error === 'not_configured'
        ? 503
        : result.error === 'product_not_found'
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
