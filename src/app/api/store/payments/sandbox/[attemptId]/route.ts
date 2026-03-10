import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUserContext } from '@/features/auth';
import { applySandboxActionForProfile } from '@/features/payments';

function getStatusCode(error: string): number {
  if (error === 'unauthorized') {
    return 401;
  }
  if (error === 'not_configured') {
    return 503;
  }
  if (['payment_attempt_not_found', 'order_not_found'].includes(error)) {
    return 404;
  }

  return 409;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { profile } = await getRequestUserContext(request);
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { attemptId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { action?: 'paid' | 'failed' | 'cancelled' }
    | null;

  if (!payload?.action) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const result = await applySandboxActionForProfile(profile.id, attemptId, payload.action);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'unknown_payment_update_error' },
      { status: getStatusCode(result.error ?? 'unknown_payment_update_error') },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: result.orderId,
    paymentAttemptId: result.paymentAttemptId,
    paymentStatus: result.paymentStatus,
    orderStatus: result.orderStatus,
  });
}
