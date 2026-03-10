import { NextResponse, type NextRequest } from 'next/server';

import { duplicateAdminProduct, getAdminRequestAccess } from '@/features/admin';
import { getSupabaseAdminMissingEnvMessage } from '@/lib/supabase';

function getAccessStatusCode(reason: string): number {
  return reason === 'no_session' ? 401 : 403;
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

  const result = await duplicateAdminProduct(productId);
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

  return NextResponse.json({ ok: true, id: result.data.id });
}
