import { NextResponse, type NextRequest } from 'next/server';

import { createAdminProduct, getAdminRequestAccess, type ProductUpsertInput } from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
}

export async function POST(request: NextRequest) {
  const access = await getAdminRequestAccess(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: 'admin_access_denied' },
      { status: getAccessStatusCode(access.reason ?? 'forbidden') },
    );
  }

  let payload: ProductUpsertInput;
  try {
    payload = (await request.json()) as ProductUpsertInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request_body' },
      { status: 400 },
    );
  }

  const result = await createAdminProduct(payload);
  if (!result.ok || !result.data) {
    const status = result.error === 'not_configured' ? 503 : 400;
    const details = status === 503 ? [getSupabaseAdminMissingEnvMessage()] : undefined;
    return NextResponse.json({ ok: false, error: result.error, details }, { status });
  }

  return NextResponse.json({ ok: true, id: result.data.id });
}
