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
      addError(errors, row.rowNumber, 'slug', 'Slug is required.');
    } else if (!slugPattern.test(slug)) {
      addError(errors, row.rowNumber, 'slug', 'Slug format is invalid.');
    } else {
      const duplicateRow = slugRowIndex.get(slug);
      if (duplicateRow !== undefined) {
        addError(
          errors,
          row.rowNumber,
          'slug',
          `Duplicate slug in file. Already used in row ${duplicateRow}.`,
        );
      } else {
        slugRowIndex.set(slug, row.rowNumber);
      }
    }

    if (!titleRaw) {
      addError(errors, row.rowNumber, 'title', 'Title is required.');
    }

    const price = parseNumberLike(priceRaw);
    if (price === null || price < 0) {
      addError(errors, row.rowNumber, 'price', 'Price must be a non-negative number.');
    }

    const compareAtPrice =
      compareAtRaw === '' ? null : parseNumberLike(compareAtRaw);
    if (compareAtRaw !== '' && (compareAtPrice === null || compareAtPrice < 0)) {
      addError(
        errors,
        row.rowNumber,
        'compare_at_price',
        'Compare-at price must be a non-negative number.',
      );
    }
    if (price !== null && compareAtPrice !== null && compareAtPrice < price) {
      addError(
        errors,
        row.rowNumber,
        'compare_at_price',
        'Compare-at price cannot be less than price.',
      );
    }

    const currency = (currencyRaw || 'USD').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      addError(errors, row.rowNumber, 'currency', 'Currency must be a 3-letter code.');
    }

    const status = (statusRaw || 'draft') as ProductStatus;
    if (!allowedStatuses.includes(status)) {
      addError(
        errors,
        row.rowNumber,
        'status',
        'Status must be one of: draft, active, archived.',
      );
    }

    const isFeaturedParsed = parseBooleanLike(isFeaturedRaw);
    if (isFeaturedRaw && isFeaturedParsed === null) {
      addError(
        errors,
        row.rowNumber,
        'is_featured',
        'is_featured should be true/false, yes/no, or 1/0.',
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
        'Stock quantity must be a non-negative integer.',
      );
    }

    if (imageUrlRaw) {
      try {
        const parsed = new URL(imageUrlRaw);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          addError(errors, row.rowNumber, 'image_url', 'Image URL must use http or https.');
        }
      } catch {
        addError(errors, row.rowNumber, 'image_url', 'Image URL is invalid.');
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
        'Image sort order must be a non-negative integer.',
      );
    }

    const imagePrimaryParsed = parseBooleanLike(imagePrimaryRaw);
    if (imagePrimaryRaw && imagePrimaryParsed === null) {
      addError(
        errors,
        row.rowNumber,
        'image_is_primary',
        'image_is_primary should be true/false, yes/no, or 1/0.',
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

