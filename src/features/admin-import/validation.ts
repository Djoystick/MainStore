import type { ProductStatus } from '@/types/db';

import type {
  ImportColumnMapping,
  ParsedExcelRow,
  RowValidationError,
  ValidatedImportRow,
  ValidationSummary,
} from './types';
import { requiredImportFields } from './mapping';
import {
  parseBooleanLike,
  parseNumberLike,
  slugify,
  splitMultiValue,
  toTrimmedString,
} from './utils';

const allowedStatuses: ProductStatus[] = ['draft', 'active', 'archived'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function addError(
  errors: RowValidationError[],
  rowNumber: number,
  field: RowValidationError['field'],
  message: string,
) {
  errors.push({ rowNumber, field, message });
}

function readMappedValue(
  row: ParsedExcelRow,
  mapping: ImportColumnMapping,
  field: keyof ImportColumnMapping,
): string {
  const column = mapping[field];
  if (!column) {
    return '';
  }
  return toTrimmedString(row.values[column]);
}

export function validateImportRows(args: {
  rows: ParsedExcelRow[];
  mapping: ImportColumnMapping;
}): {
  summary: ValidationSummary;
  errors: RowValidationError[];
  validRows: ValidatedImportRow[];
} {
  const { rows, mapping } = args;
  const errors: RowValidationError[] = [];
  const validRows: ValidatedImportRow[] = [];

  const missingRequiredFields = requiredImportFields.filter((field) => !mapping[field]);
  if (missingRequiredFields.length > 0) {
    missingRequiredFields.forEach((field) => {
      errors.push({
        rowNumber: 0,
        field,
        message: `Required mapping is missing for "${field}".`,
      });
    });

    return {
      summary: {
        totalRows: rows.length,
        validRows: 0,
        rowsWithErrors: rows.length,
      },
      errors,
      validRows: [],
    };
  }

  const slugRowIndex = new Map<string, number>();
  const rowErrorIndex = new Set<number>();

  rows.forEach((row) => {
    const rowStartErrorCount = errors.length;

    const slugRaw = readMappedValue(row, mapping, 'slug').toLowerCase();
    const titleRaw = readMappedValue(row, mapping, 'title');
    const shortDescriptionRaw = readMappedValue(row, mapping, 'short_description');
    const descriptionRaw = readMappedValue(row, mapping, 'description');
    const priceRaw = readMappedValue(row, mapping, 'price');
    const compareAtRaw = readMappedValue(row, mapping, 'compare_at_price');
    const currencyRaw = readMappedValue(row, mapping, 'currency');
    const statusRaw = readMappedValue(row, mapping, 'status').toLowerCase();
    const isFeaturedRaw = readMappedValue(row, mapping, 'is_featured');
    const stockRaw = readMappedValue(row, mapping, 'stock_quantity');
    const categoryRaw = readMappedValue(row, mapping, 'category');
    const collectionRaw = readMappedValue(row, mapping, 'collection');
    const imageUrlRaw = readMappedValue(row, mapping, 'image_url');
    const imageAltRaw = readMappedValue(row, mapping, 'image_alt');
    const imageSortRaw = readMappedValue(row, mapping, 'image_sort_order');
    const imagePrimaryRaw = readMappedValue(row, mapping, 'image_is_primary');

    const slug = slugify(slugRaw);
    if (!slug) {
      addError(errors, row.rowNumber, 'slug', 'Укажите slug.');
    } else if (!slugPattern.test(slug)) {
      addError(errors, row.rowNumber, 'slug', 'Slug имеет некорректный формат.');
    } else {
      const duplicateRow = slugRowIndex.get(slug);
      if (duplicateRow !== undefined) {
        addError(
          errors,
          row.rowNumber,
          'slug',
          `Такой slug уже есть в файле. Он уже используется в строке ${duplicateRow}.`,
        );
      } else {
        slugRowIndex.set(slug, row.rowNumber);
      }
    }

    if (!titleRaw) {
      addError(errors, row.rowNumber, 'title', 'Укажите название товара.');
    }

    const price = parseNumberLike(priceRaw);
    if (price === null || price < 0) {
      addError(errors, row.rowNumber, 'price', 'Цена должна быть неотрицательным числом.');
    }

    const compareAtPrice =
      compareAtRaw === '' ? null : parseNumberLike(compareAtRaw);
    if (compareAtRaw !== '' && (compareAtPrice === null || compareAtPrice < 0)) {
      addError(
        errors,
        row.rowNumber,
        'compare_at_price',
        'Старая цена должна быть неотрицательным числом.',
      );
    }
    if (price !== null && compareAtPrice !== null && compareAtPrice < price) {
      addError(
        errors,
        row.rowNumber,
        'compare_at_price',
        'Старая цена не может быть меньше текущей.',
      );
    }

    const currency = (currencyRaw || 'USD').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      addError(errors, row.rowNumber, 'currency', 'Валюта должна быть трёхбуквенным кодом.');
    }

    const status = (statusRaw || 'draft') as ProductStatus;
    if (!allowedStatuses.includes(status)) {
      addError(
        errors,
        row.rowNumber,
        'status',
        'Статус должен быть одним из: draft, active, archived.',
      );
    }

    const isFeaturedParsed = parseBooleanLike(isFeaturedRaw);
    if (isFeaturedRaw && isFeaturedParsed === null) {
      addError(
        errors,
        row.rowNumber,
        'is_featured',
        'Для is_featured используйте true/false, yes/no или 1/0.',
      );
    }

    const stockParsed =
      stockRaw === '' ? 0 : parseNumberLike(stockRaw);
    if (
      stockParsed === null ||
      !Number.isInteger(stockParsed) ||
      stockParsed < 0
    ) {
      addError(
        errors,
        row.rowNumber,
        'stock_quantity',
        'Остаток должен быть неотрицательным целым числом.',
      );
    }

    if (imageUrlRaw) {
      try {
        const parsed = new URL(imageUrlRaw);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          addError(errors, row.rowNumber, 'image_url', 'URL изображения должен использовать http или https.');
        }
      } catch {
        addError(errors, row.rowNumber, 'image_url', 'URL изображения некорректен.');
      }
    }

    const imageSortOrder =
      imageSortRaw === '' ? 0 : parseNumberLike(imageSortRaw);
    if (
      imageSortOrder === null ||
      !Number.isInteger(imageSortOrder) ||
      imageSortOrder < 0
    ) {
      addError(
        errors,
        row.rowNumber,
        'image_sort_order',
        'Порядок изображения должен быть неотрицательным целым числом.',
      );
    }

    const imagePrimaryParsed = parseBooleanLike(imagePrimaryRaw);
    if (imagePrimaryRaw && imagePrimaryParsed === null) {
      addError(
        errors,
        row.rowNumber,
        'image_is_primary',
        'Для image_is_primary используйте true/false, yes/no или 1/0.',
      );
    }

    if (errors.length > rowStartErrorCount) {
      rowErrorIndex.add(row.rowNumber);
      return;
    }

    validRows.push({
      rowNumber: row.rowNumber,
      slug,
      title: titleRaw,
      shortDescription: shortDescriptionRaw || null,
      description: descriptionRaw || null,
      price: price ?? 0,
      compareAtPrice,
      currency,
      status,
      isFeatured: isFeaturedParsed ?? false,
      stockQuantity: Math.trunc(stockParsed ?? 0),
      categoryLabel: categoryRaw || null,
      collectionLabels: splitMultiValue(collectionRaw),
      image: imageUrlRaw
        ? {
            url: imageUrlRaw,
            alt: imageAltRaw || null,
            sortOrder: Math.trunc(imageSortOrder ?? 0),
            isPrimary: imagePrimaryParsed ?? true,
          }
        : null,
    });
  });

  return {
    summary: {
      totalRows: rows.length,
      validRows: validRows.length,
      rowsWithErrors: rowErrorIndex.size,
    },
    errors,
    validRows,
  };
}
