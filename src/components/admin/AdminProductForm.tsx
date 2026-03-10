'use client';

import { useMemo, useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import type {
  AdminCategoryOption,
  AdminProductDetail,
  ProductStatus,
} from '@/features/admin';

import styles from './admin.module.css';

const statusOptions: ProductStatus[] = ['draft', 'active', 'archived'];

interface AdminProductFormProps {
  mode: 'create' | 'edit';
  product?: AdminProductDetail | null;
  categories: AdminCategoryOption[];
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminProductForm({ mode, product, categories }: AdminProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [slug, setSlug] = useState(product?.slug ?? '');
  const [title, setTitle] = useState(product?.title ?? '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(
    product?.price !== undefined ? String(product.price) : '',
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice !== null && product?.compareAtPrice !== undefined
      ? String(product.compareAtPrice)
      : '',
  );
  const [currency, setCurrency] = useState(product?.currency ?? 'USD');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'draft');
  const [stockQuantity, setStockQuantity] = useState(
    product?.stockQuantity !== undefined ? String(product.stockQuantity) : '0',
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);

  const heading = useMemo(
    () => (mode === 'create' ? 'Create product' : 'Edit product'),
    [mode],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const parsedPrice = Number(price);
      const parsedStock = Number(stockQuantity);

      if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) {
        setErrorMessage('Price and stock quantity must be valid numbers.');
        return;
      }

      const payload = {
        slug,
        title,
        shortDescription,
        description,
        price: parsedPrice,
        compareAtPrice: toNullableNumber(compareAtPrice),
        currency,
        status,
        isFeatured,
        stockQuantity: Math.trunc(parsedStock),
        categoryId: categoryId || null,
      };

      const endpoint =
        mode === 'create' ? '/api/admin/products' : `/api/admin/products/${product?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | { ok: true; id?: string }
        | { ok: false; error?: string };

      if (!response.ok || !data.ok) {
        setErrorMessage(data.ok ? 'Admin product mutation failed.' : data.error ?? 'Mutation failed.');
        return;
      }

      if (mode === 'create' && data.id) {
        router.push(`/admin/products/${data.id}/edit`);
        router.refresh();
        return;
      }

      setSuccessMessage('Product updated.');
      router.refresh();
    });
  };

  return (
    <section className={styles.adminCard}>
      <h2 className={styles.adminCardTitle}>{heading}</h2>

      <form className={styles.adminForm} onSubmit={handleSubmit}>
        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Title</span>
          <input
            className={styles.adminInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Slug</span>
          <input
            className={styles.adminInput}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
          />
        </label>

        <div className={styles.adminInlineRow}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.adminInput}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Compare at price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.adminInput}
              value={compareAtPrice}
              onChange={(event) => setCompareAtPrice(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.adminInlineRow}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Currency</span>
            <input
              className={styles.adminInput}
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Stock quantity</span>
            <input
              type="number"
              min="0"
              step="1"
              className={styles.adminInput}
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              required
            />
          </label>
        </div>

        <div className={styles.adminInlineRow}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Status</span>
            <select
              className={styles.adminSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value as ProductStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Category</span>
            <select
              className={styles.adminSelect}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Short description</span>
          <textarea
            className={styles.adminTextarea}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            rows={3}
          />
        </label>

        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Description</span>
          <textarea
            className={styles.adminTextarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
          />
        </label>

        <label className={styles.adminCheckboxRow}>
          <input
            type="checkbox"
            className={styles.adminCheckbox}
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          <span className={styles.adminLabel}>Featured product</span>
        </label>

        <button
          type="submit"
          className={styles.adminPrimaryButton}
          disabled={isPending}
          aria-label={mode === 'create' ? 'Create product' : 'Save product'}
        >
          {isPending
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create product'
              : 'Save product'}
        </button>

        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
        {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
      </form>
    </section>
  );
}
