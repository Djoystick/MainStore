import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUserContext } from '@/features/auth';
import { addProductToCartForProfile } from '@/features/user-store/data';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

interface AddToCartBody {
  productId?: string;
  quantity?: number;
}

function getStatusByError(error: string): number {
  if (error === 'unauthorized') {
    return 401;
  }
  if (error === 'not_configured') {
    return 503;
  }
  if (error === 'product_not_found') {
    return 404;
  }
  return 400;
}

export async function POST(request: NextRequest) {
  const { profile } = await getRequestUserContext(request);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  let body: AddToCartBody;
  try {
    body = (await request.json()) as AddToCartBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 },
    );
  }

  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: 'product_id_required' },
      { status: 400 },
    );
  }

  const quantity =
    typeof body.quantity === 'number' && Number.isFinite(body.quantity)
      ? body.quantity
      : 1;

  const result = await addProductToCartForProfile(profile.id, productId, quantity);
  if (!result.ok || !result.data) {
    const error = result.error ?? 'cart_add_failed';
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
