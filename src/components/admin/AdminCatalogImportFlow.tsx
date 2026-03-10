'use client';

import { useMemo, useState } from 'react';

import { classNames } from '@/css/classnames';
import type {
  ImportColumnMapping,
  ImportFieldKey,
  ImportPreviewPayload,
  ImportReportPayload,
  RowValidationError,
  ValidationResultPayload,
} from '@/features/admin-import/types';
import { importFieldKeys } from '@/features/admin-import/types';
import { requiredImportFields } from '@/features/admin-import/mapping';

import styles from './admin.module.css';

type ApiResponse<T> =
  | { ok: true; payload: T }
  | { ok: false; error: string };

const fieldLabels: Record<ImportFieldKey, string> = {
  slug: 'Slug',
  title: 'Title',
  short_description: 'Short description',
  description: 'Description',
  price: 'Price',
  compare_at_price: 'Compare-at price',
  currency: 'Currency',
  status: 'Status',
  is_featured: 'Featured',
  stock_quantity: 'Stock quantity',
  category: 'Category',
  collection: 'Collection',
  image_url: 'Image URL',
  image_alt: 'Image alt',
  image_sort_order: 'Image sort order',
  image_is_primary: 'Image is primary',
};

const fieldHints: Partial<Record<ImportFieldKey, string>> = {
  status: 'Allowed: draft, active, archived',
  is_featured: 'true/false, yes/no, 1/0',
  image_is_primary: 'true/false, yes/no, 1/0',
  category: 'Uses existing category or creates a new one',
  collection: 'Comma-separated values allowed',
};

async function callImportApi<T>(
  url: string,
  body: FormData,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body,
      credentials: 'include',
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; [key: string]: unknown }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !payload || payload.ok === false) {
      return {
        ok: false,
        error:
          payload && !payload.ok
            ? payload.error || 'Import request failed.'
            : 'Import request failed.',
      };
    }

    const { ok: _ok, ...rest } = payload;
    return { ok: true, payload: rest as T };
  } catch {
    return { ok: false, error: 'Network error while calling import API.' };
  }
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminCatalogImportFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewPayload | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [validation, setValidation] = useState<ValidationResultPayload | null>(null);
  const [report, setReport] = useState<ImportReportPayload | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const currentErrors: RowValidationError[] =
    report?.errors ?? validation?.errors ?? [];

  const hasBlockingMappingErrors = currentErrors.some(
    (error) => error.rowNumber === 0,
  );
  const canValidate = Boolean(file && preview && !isValidating && !isImporting);
  const canImport = Boolean(
    file &&
      preview &&
      validation &&
      validation.summary.validRows > 0 &&
      !hasBlockingMappingErrors &&
      !isImporting,
  );

  const orderedFields = useMemo(
    () =>
      [...requiredImportFields, ...importFieldKeys.filter((key) => !requiredImportFields.includes(key))],
    [],
  );

  const resetFlow = () => {
    setPreview(null);
    setMapping({});
    setValidation(null);
    setReport(null);
    setGlobalError(null);
  };

  const handleLoadPreview = async () => {
    if (!file || isLoadingPreview) {
      return;
    }

    setIsLoadingPreview(true);
    setGlobalError(null);
    setValidation(null);
    setReport(null);

    const formData = new FormData();
    formData.set('file', file);

    const result = await callImportApi<{ preview: ImportPreviewPayload }>(
      '/api/admin/import/preview',
      formData,
    );

    if (!result.ok) {
      setGlobalError(result.error);
      setIsLoadingPreview(false);
      return;
    }

    setPreview(result.payload.preview);
    setMapping(result.payload.preview.suggestedMapping ?? {});
    setIsLoadingPreview(false);
  };

  const handleValidate = async () => {
    if (!file || !preview || !canValidate) {
      return;
    }

    setIsValidating(true);
    setGlobalError(null);
    setValidation(null);
    setReport(null);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('mapping', JSON.stringify(mapping));

    const result = await callImportApi<{
      validation: ValidationResultPayload & { hasBlockingErrors?: boolean };
    }>('/api/admin/import/validate', formData);

    if (!result.ok) {
      setGlobalError(result.error);
      setIsValidating(false);
      return;
    }

    setValidation(result.payload.validation);
    setIsValidating(false);
  };

  const handleImport = async () => {
    if (!file || !preview || !canImport) {
      return;
    }

    setIsImporting(true);
    setGlobalError(null);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('mapping', JSON.stringify(mapping));

    const result = await callImportApi<{ report: ImportReportPayload }>(
      '/api/admin/import/execute',
      formData,
    );

    if (!result.ok) {
      setGlobalError(result.error);
      setIsImporting(false);
      return;
    }

    setReport(result.payload.report);
    setIsImporting(false);
  };

  const handleMappingChange = (field: ImportFieldKey, value: string) => {
    setMapping((previous) => {
      const next = { ...previous };
      if (!value) {
        delete next[field];
      } else {
        next[field] = value;
      }
      return next;
    });
    setValidation(null);
    setReport(null);
  };

  const downloadReport = () => {
    if (!report) {
      return;
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mainstore-import-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.adminCard}>
      <h2 className={styles.adminCardTitle}>Excel catalog import</h2>
      <p className={styles.adminCardSub}>
        Upload, preview, map columns, validate, and import.
      </p>

      <div className={styles.importStageList}>
        <p className={styles.importStageItem}>1. Upload Excel file</p>
        <p className={styles.importStageItem}>2. Preview and map columns</p>
        <p className={styles.importStageItem}>3. Validate rows</p>
        <p className={styles.importStageItem}>4. Import valid rows</p>
      </div>

      <div className={styles.adminForm}>
        <label className={styles.adminField}>
          <span className={styles.adminLabel}>
            Excel file (XLSX, XLS, XLSM, XLTX)
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.xlsm,.xltx"
            className={styles.adminInput}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              resetFlow();
            }}
          />
        </label>

        <div className={styles.adminActions}>
          <a
            href="/api/admin/import/template"
            className={styles.adminActionLink}
            aria-label="Download Excel import template"
          >
            Download template (.xlsx)
          </a>
        </div>

        {file && (
          <p className={styles.adminCardSub}>
            Selected: {file.name} ({formatBytes(file.size)})
          </p>
        )}

        <button
          type="button"
          className={styles.adminPrimaryButton}
          onClick={handleLoadPreview}
          disabled={!file || isLoadingPreview || isValidating || isImporting}
          aria-label="Load import preview"
        >
          {isLoadingPreview ? 'Loading preview...' : 'Load preview'}
        </button>
      </div>

      {globalError && <p className={styles.adminError}>{globalError}</p>}

      {preview && (
        <section className={styles.importSection}>
          <h3 className={styles.adminCardTitle}>Preview</h3>
          <p className={styles.adminCardSub}>
            Sheet: {preview.sheetName} | Rows detected: {preview.totalRows}
            {preview.truncatedRowsCount > 0
              ? ` (limited, ${preview.truncatedRowsCount} rows were ignored)`
              : ''}
          </p>

          <div className={styles.importPreviewTableWrap}>
            <table className={styles.importPreviewTable}>
              <thead>
                <tr>
                  <th>Row</th>
                  {preview.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    {preview.columns.map((column) => (
                      <td key={`${row.rowNumber}-${column}`}>
                        {row.values[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {preview && (
        <section className={styles.importSection}>
          <h3 className={styles.adminCardTitle}>Column mapping</h3>
          <div className={styles.importMappingGrid}>
            {orderedFields.map((field) => {
              const isRequired = requiredImportFields.includes(field);
              return (
                <label key={field} className={styles.adminField}>
                  <span className={styles.adminLabel}>
                    {fieldLabels[field]}
                    {isRequired ? ' *' : ''}
                  </span>
                  <select
                    className={styles.adminSelect}
                    value={mapping[field] ?? ''}
                    disabled={isValidating || isImporting}
                    onChange={(event) => handleMappingChange(field, event.target.value)}
                    aria-label={`Map column for ${fieldLabels[field]}`}
                  >
                    <option value="">Not mapped</option>
                    {preview.columns.map((column) => (
                      <option key={`${field}-${column}`} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                  {fieldHints[field] && (
                    <span className={styles.importFieldHint}>{fieldHints[field]}</span>
                  )}
                </label>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.adminPrimaryButton}
            onClick={handleValidate}
            disabled={!canValidate || isLoadingPreview}
            aria-label="Validate import rows"
          >
            {isValidating ? 'Validating...' : 'Validate rows'}
          </button>
        </section>
      )}

      {validation && !report && (
        <section className={styles.importSection}>
          <h3 className={styles.adminCardTitle}>Validation summary</h3>
          <div className={styles.importSummaryGrid}>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Total rows</p>
              <p className={styles.importSummaryValue}>{validation.summary.totalRows}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Valid rows</p>
              <p className={styles.importSummaryValue}>{validation.summary.validRows}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Rows with errors</p>
              <p className={styles.importSummaryValue}>{validation.summary.rowsWithErrors}</p>
            </article>
          </div>

          {currentErrors.length > 0 && (
            <div className={styles.importErrorList}>
              {currentErrors.map((error, index) => (
                <p key={`${error.rowNumber}-${error.field}-${index}`} className={styles.adminError}>
                  {error.rowNumber === 0
                    ? `Mapping: ${error.message}`
                    : `Row ${error.rowNumber} (${error.field}): ${error.message}`}
                </p>
              ))}
            </div>
          )}

          <button
            type="button"
            className={styles.adminPrimaryButton}
            onClick={handleImport}
            disabled={!canImport || isValidating}
            aria-label="Import valid rows"
          >
            {isImporting ? 'Importing...' : 'Import valid rows'}
          </button>
        </section>
      )}

      {report && (
        <section className={styles.importSection}>
          <h3 className={styles.adminCardTitle}>Import result</h3>
          <div className={styles.importSummaryGrid}>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Created products</p>
              <p className={styles.importSummaryValue}>{report.summary.createdProducts}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Updated products</p>
              <p className={styles.importSummaryValue}>{report.summary.updatedProducts}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Skipped rows</p>
              <p className={styles.importSummaryValue}>{report.summary.skippedRows}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Import errors</p>
              <p className={styles.importSummaryValue}>{report.summary.importErrors}</p>
            </article>
          </div>

          <div className={styles.importSummaryGrid}>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Created categories</p>
              <p className={styles.importSummaryValue}>{report.summary.createdCategories}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Created collections</p>
              <p className={styles.importSummaryValue}>{report.summary.createdCollections}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Created images</p>
              <p className={styles.importSummaryValue}>{report.summary.createdImages}</p>
            </article>
            <article className={styles.importSummaryItem}>
              <p className={styles.importSummaryLabel}>Updated images</p>
              <p className={styles.importSummaryValue}>{report.summary.updatedImages}</p>
            </article>
          </div>

          {report.errors.length > 0 && (
            <div className={styles.importErrorList}>
              {report.errors.map((error, index) => (
                <p key={`${error.rowNumber}-${error.field}-${index}`} className={styles.adminError}>
                  {error.rowNumber === 0
                    ? `Mapping: ${error.message}`
                    : `Row ${error.rowNumber} (${error.field}): ${error.message}`}
                </p>
              ))}
            </div>
          )}

          <div className={styles.adminActions}>
            <button
              type="button"
              className={styles.adminActionButton}
              onClick={downloadReport}
              aria-label="Download import report"
            >
              Download report (JSON)
            </button>
            <button
              type="button"
              className={classNames(styles.adminActionButton, styles.importSecondaryAction)}
              onClick={() => {
                setValidation(null);
                setReport(null);
                setGlobalError(null);
              }}
              aria-label="Run validation again"
            >
              Re-validate
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
