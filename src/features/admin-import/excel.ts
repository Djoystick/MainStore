import * as XLSX from 'xlsx';

import {
  excelImportAcceptedExtensions,
  maxImportFileSizeBytes,
  maxImportRows,
} from './constants';
import type { ParsedExcelData } from './types';
import { toTrimmedString } from './utils';

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function ensureUniqueColumns(columns: string[]): string[] {
  const used = new Map<string, number>();

  return columns.map((column, index) => {
    const base = column || `column_${index + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}_${seen + 1}`;
  });
}

function findHeaderRow(rows: unknown[][]): { index: number; values: string[] } | null {
  for (let index = 0; index < rows.length; index += 1) {
    const values = rows[index].map((cell) => toTrimmedString(cell));
    const nonEmptyCount = values.filter(Boolean).length;
    if (nonEmptyCount >= 2) {
      return { index, values };
    }
  }
  return null;
}

export function parseExcelFile(args: {
  fileName: string;
  fileSizeBytes: number;
  buffer: Buffer;
}): ParsedExcelData {
  const extension = getFileExtension(args.fileName);
  if (!excelImportAcceptedExtensions.includes(extension as (typeof excelImportAcceptedExtensions)[number])) {
    throw new Error('unsupported_file_type');
  }

  if (args.fileSizeBytes <= 0 || args.fileSizeBytes > maxImportFileSizeBytes) {
    throw new Error('file_too_large');
  }

  const workbook = XLSX.read(args.buffer, {
    type: 'buffer',
    dense: true,
    raw: false,
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('sheet_not_found');
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('sheet_not_found');
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  }) as unknown[][];

  if (matrix.length === 0) {
    throw new Error('sheet_empty');
  }

  const headerRow = findHeaderRow(matrix);
  if (!headerRow) {
    throw new Error('header_not_found');
  }

  const columns = ensureUniqueColumns(
    headerRow.values.map((value, index) => value || `column_${index + 1}`),
  );

  const rows: ParsedExcelData['rows'] = [];
  const sourceRows = matrix.slice(headerRow.index + 1);
  for (let index = 0; index < sourceRows.length; index += 1) {
    const rowCells = sourceRows[index];
    const values: Record<string, string> = {};
    let hasAnyValue = false;

    columns.forEach((column, columnIndex) => {
      const cellValue = toTrimmedString(rowCells[columnIndex] ?? '');
      values[column] = cellValue;
      if (cellValue) {
        hasAnyValue = true;
      }
    });

    if (!hasAnyValue) {
      continue;
    }

    rows.push({
      rowNumber: headerRow.index + index + 2,
      values,
    });
  }

  const truncatedRowsCount = rows.length > maxImportRows ? rows.length - maxImportRows : 0;

  return {
    fileName: args.fileName,
    fileSizeBytes: args.fileSizeBytes,
    sheetName: firstSheetName,
    columns,
    rows: rows.slice(0, maxImportRows),
    truncatedRowsCount,
  };
}

export function mapParseErrorToMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Не удалось прочитать этот Excel-файл.';
  }

  switch (error.message) {
    case 'unsupported_file_type':
      return 'Неподдерживаемый тип файла. Используйте XLSX, XLS, XLSM или XLTX.';
    case 'file_too_large':
      return `Файл слишком большой. Максимальный размер: ${Math.floor(maxImportFileSizeBytes / (1024 * 1024))} MB.`;
    case 'sheet_not_found':
      return 'В файле не найден читаемый лист.';
    case 'sheet_empty':
      return 'Лист пустой.';
    case 'header_not_found':
      return 'Не удалось определить корректную строку заголовков.';
    default:
      return 'Не удалось прочитать этот Excel-файл.';
  }
}
