import { NextResponse, type NextRequest } from 'next/server';

import { getAdminRequestAccess } from '@/features/admin';
import {
  executeValidatedImport,
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

    const blockingMappingErrors = validation.errors.filter((error) => error.rowNumber === 0);
    if (blockingMappingErrors.length > 0) {
      return NextResponse.json(
        {
          ok: true,
          report: {
            mapping,
            summary: {
              totalRows: validation.summary.totalRows,
              validRows: 0,
              rowsWithErrors: validation.summary.totalRows,
              createdProducts: 0,
              updatedProducts: 0,
              skippedRows: validation.summary.totalRows,
              importErrors: 0,
              createdCategories: 0,
              createdCollections: 0,
              createdImages: 0,
              updatedImages: 0,
            },
            errors: limitErrors(validation.errors),
            importedRows: [],
          },
        },
        { status: 200 },
      );
    }

    const execution =
      validation.validRows.length > 0
        ? await executeValidatedImport(validation.validRows)
        : {
            importedRows: [],
            errors: [],
            createdProducts: 0,
            updatedProducts: 0,
            createdCategories: 0,
            createdCollections: 0,
            createdImages: 0,
            updatedImages: 0,
          };

    const allErrors = [...validation.errors, ...execution.errors];
    const errorRowSet = new Set(allErrors.filter((error) => error.rowNumber > 0).map((error) => error.rowNumber));
    const importErrorRowSet = new Set(execution.errors.map((error) => error.rowNumber));

    return NextResponse.json({
      ok: true,
      report: {
        mapping,
        summary: {
          totalRows: validation.summary.totalRows,
          validRows: execution.importedRows.length,
          rowsWithErrors: errorRowSet.size,
          createdProducts: execution.createdProducts,
          updatedProducts: execution.updatedProducts,
          skippedRows: validation.summary.totalRows - execution.importedRows.length,
          importErrors: importErrorRowSet.size,
          createdCategories: execution.createdCategories,
          createdCollections: execution.createdCollections,
          createdImages: execution.createdImages,
          updatedImages: execution.updatedImages,
        },
        errors: limitErrors(allErrors),
        importedRows: execution.importedRows.slice(0, 300),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const parseMessage = mapParseErrorToMessage(error);
      if (parseMessage !== 'Could not parse this Excel file.') {
        const status = error.message === 'file_too_large' ? 413 : 400;
        return NextResponse.json({ ok: false, error: parseMessage }, { status });
      }
    }

    const mapped = mapAdminImportRouteErrorToHttp(error);
    return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
  }
}

