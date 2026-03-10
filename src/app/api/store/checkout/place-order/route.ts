import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUserContext } from '@/features/auth';
import { placeOrderFromCartForProfile, type CheckoutPayload } from '@/features/orders/data';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getStatusCode(status: string): number {
  if (status === 'unauthorized') {
    return 401;
  }
  if (status === 'not_configured') {
    return 503;
  }
  if (status === 'invalid_input') {
    return 400;
  }
  if (status === 'empty_cart' || status === 'unavailable_items' || status === 'mixed_currency') {
    return 409;
  }
  return 500;
}

export async function POST(request: NextRequest) {
  const { profile } = await getRequestUserContext(request);
  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 },
    );
  }

  let payload: CheckoutPayload;
  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 },
    );
  }

  const result = await placeOrderFromCartForProfile(profile.id, payload);

  if (result.status !== 'ok') {
    const details =
      result.status === 'not_configured'
        ? [getSupabaseAdminMissingEnvMessage()]
        : undefined;

    return NextResponse.json(
      { ok: false, error: result.status, message: result.message, details },
      { status: getStatusCode(result.status) },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: result.orderId,
    totalCents: result.totalCents,
    currency: result.currency,
    itemsCount: result.itemsCount,
  });
}
