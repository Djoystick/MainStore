import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUserContext } from '@/features/auth';
import {
  removeCartItemForProfile,
  updateCartItemQuantityForProfile,
} from '@/features/user-store/data';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

interface UpdateCartItemBody {
  quantity?: number;
}

function getStatusByError(error: string): number {
  if (error === 'unauthorized') {
    return 401;
  }
  if (error === 'not_configured') {
    return 503;
  }
  return 400;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { profile } = await getRequestUserContext(request);
  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json(
      { ok: false, error: 'cart_item_id_required' },
      { status: 400 },
    );
  }

  let body: UpdateCartItemBody;
  try {
    body = (await request.json()) as UpdateCartItemBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 },
    );
  }

  if (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_quantity' },
      { status: 400 },
    );
  }

  const quantity = Math.trunc(body.quantity);
  const result = await updateCartItemQuantityForProfile(profile.id, itemId, quantity);
  if (!result.ok || !result.data) {
    const error = result.error ?? 'cart_item_update_failed';
    const details = error === 'not_configured' ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error, details },
      { status: getStatusByError(error) },
    );
  }

  return NextResponse.json({
    ok: true,
    quantity: result.data.quantity,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { profile } = await getRequestUserContext(request);
  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json(
      { ok: false, error: 'cart_item_id_required' },
      { status: 400 },
    );
  }

  const result = await removeCartItemForProfile(profile.id, itemId);
  if (!result.ok) {
    const error = result.error ?? 'cart_item_remove_failed';
    const details = error === 'not_configured' ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json(
      { ok: false, error, details },
      { status: getStatusByError(error) },
    );
  }

  return NextResponse.json({ ok: true });
}
