import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess, updateAdminOrderStatus, type OrderStatus } from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

interface StatusPayload {
  status?: OrderStatus;
}

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'confirmed' ||
    value === 'processing' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: 'order_id_required' },
      { status: 400 },
    );
  }

  let payload: StatusPayload;
  try {
    payload = (await request.json()) as StatusPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request_body' },
      { status: 400 },
    );
  }

  if (!isOrderStatus(payload.status)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_order_status' },
      { status: 400 },
    );
  }

  const result = await updateAdminOrderStatus(orderId, payload.status);
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
