import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess } from '@/features/admin';
import {
  buildPreviewPayload,
  mapAdminImportRouteErrorToHttp,
  mapParseErrorToMessage,
  parseExcelFile,
  readFileFromFormData,
} from '@/features/admin-import';

export const runtime = 'nodejs';

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

  try {
    const formData = await request.formData();
    const file = await readFileFromFormData(formData);
    const parsed = parseExcelFile(file);

    return NextResponse.json({
      ok: true,
      preview: buildPreviewPayload(parsed),
    });
  } catch (error) {
    if (error instanceof Error) {
      const parseMessage = mapParseErrorToMessage(error);
      if (parseMessage !== 'Не удалось прочитать этот Excel-файл.') {
        const status = error.message === 'file_too_large' ? 413 : 400;
        return NextResponse.json({ ok: false, error: parseMessage }, { status });
      }
    }

    const mapped = mapAdminImportRouteErrorToHttp(error);
    return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
  }
}
