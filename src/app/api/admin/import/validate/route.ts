import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess } from '@/features/admin';
import {
  limitErrors,
  mapAdminImportRouteErrorToHttp,
  mapParseErrorToMessage,
  parseExcelFile,
  parseMappingFromFormData,
  readFileFromFormData,
  validateImportRows,
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
    const mapping = parseMappingFromFormData(formData, parsed.columns);
    const validation = validateImportRows({
      rows: parsed.rows,
      mapping,
    });

    const hasBlockingErrors = validation.errors.some((error) => error.rowNumber === 0);

    return NextResponse.json({
      ok: true,
      validation: {
        mapping,
        summary: validation.summary,
        errors: limitErrors(validation.errors),
        hasBlockingErrors,
      },
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
