import type { ImportColumnMapping, ParsedExcelData, RowValidationError } from './types';
import { previewRowsLimit, validationErrorsLimit } from './constants';
import { buildSuggestedMapping, sanitizeMapping } from './mapping';

export async function readFileFromFormData(formData: FormData): Promise<{
  fileName: string;
  fileSizeBytes: number;
  buffer: Buffer;
}> {
  const fileValue = formData.get('file');
  if (!(fileValue instanceof File)) {
    throw new Error('file_required');
  }

  const fileName = fileValue.name?.trim() || 'import.xlsx';
  const fileSizeBytes = fileValue.size;
  const buffer = Buffer.from(await fileValue.arrayBuffer());

  return { fileName, fileSizeBytes, buffer };
}

export function parseMappingFromFormData(
  formData: FormData,
  columns: string[],
): ImportColumnMapping {
  const rawMapping = formData.get('mapping');
  if (typeof rawMapping !== 'string' || !rawMapping.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawMapping) as unknown;
    return sanitizeMapping(parsed, columns);
  } catch {
    return {};
  }
}

export function buildPreviewPayload(parsed: ParsedExcelData) {
  return {
    fileName: parsed.fileName,
    fileSizeBytes: parsed.fileSizeBytes,
    sheetName: parsed.sheetName,
    columns: parsed.columns,
    totalRows: parsed.rows.length,
    truncatedRowsCount: parsed.truncatedRowsCount,
    previewRows: parsed.rows.slice(0, previewRowsLimit),
    suggestedMapping: buildSuggestedMapping(parsed.columns),
  };
}

export function limitErrors(errors: RowValidationError[]): RowValidationError[] {
  return errors.slice(0, validationErrorsLimit);
}

export function mapAdminImportRouteErrorToHttp(error: unknown): {
  status: number;
  message: string;
} {
  if (!(error instanceof Error)) {
    return { status: 500, message: 'Не удалось выполнить запрос импорта.' };
  }

  switch (error.message) {
    case 'file_required':
      return { status: 400, message: 'Нужно выбрать Excel-файл.' };
    default:
      return { status: 500, message: 'Не удалось выполнить запрос импорта.' };
  }
}
