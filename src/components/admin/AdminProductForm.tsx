'use client';

import { useRef, useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import type {
  AdminCategoryOption,
  AdminProductDetail,
  ProductStatus,
} from '@/features/admin/types';

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapAdminProductError(error: string | undefined): string {
  if (!error) {
    return 'Could not save product.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'invalid_slug':
      return 'Slug should use lowercase letters, digits, and hyphens only.';
    case 'slug_conflict':
      return 'This slug is already used by another product.';
    case 'title_required':
      return 'Product title is required.';
    case 'invalid_status':
      return 'Selected status is invalid.';
    case 'currency_required':
      return 'Currency is required.';
    case 'invalid_currency':
      return 'Currency should use a 3-letter code like USD.';
    case 'invalid_price':
      return 'Price should be a valid non-negative number.';
    case 'compare_at_price_less_than_price':
      return 'Compare-at price should be greater than or equal to price.';
    case 'invalid_stock_quantity':
      return 'Stock quantity should be a valid non-negative integer.';
    case 'invalid_category':
      return 'Selected category is no longer available.';
    case 'product_not_found':
      return 'This product is no longer available.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not save product. Please retry.';
  }
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
  const isSubmittingRef = useRef(false);

  const heading = mode === 'create' ? 'Create product card' : 'Edit product card';
  const primaryActionLabel =
    mode === 'create'
      ? isPending
        ? 'Creating...'
        : 'Create product'
      : isPending
        ? 'Saving...'
        : 'Save changes';

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const parsedPrice = Number(price);
      const parsedStock = Number(stockQuantity);
      const parsedCompareAtPrice = toNullableNumber(compareAtPrice);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        setErrorMessage('Price should be a valid non-negative number.');
        isSubmittingRef.current = false;
        return;
      }

      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        setErrorMessage('Stock quantity should be a non-negative integer.');
        isSubmittingRef.current = false;
        return;
      }

      if (parsedCompareAtPrice !== null && parsedCompareAtPrice < parsedPrice) {
        setErrorMessage('Compare-at price should be greater than or equal to price.');
        isSubmittingRef.current = false;
        return;
      }

      const payload = {
        slug,
        title,
        shortDescription,
        description,
        price: parsedPrice,
        compareAtPrice: parsedCompareAtPrice,
        currency,
        status,
        isFeatured,
        stockQuantity: parsedStock,
        categoryId: categoryId || null,
      };

      const endpoint =
        mode === 'create' ? '/api/admin/products' : `/api/admin/products/${product?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true; id?: string }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapAdminProductError(errorCode));
          return;
        }

        if (mode === 'create' && data.id) {
          router.push(`/admin/products/${data.id}/edit`);
          return;
        }

        setSuccessMessage('Product card updated.');
        router.refresh();
      } catch {
        setErrorMessage('Network error while saving product.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <section className={styles.adminCard}>
      <div className={styles.adminCardHead}>
        <div>
          <h2 className={styles.adminCardTitle}>{heading}</h2>
          <p className={styles.adminCardSub}>
            Keep pricing, publishing, descriptions, and availability aligned in one form.
          </p>
        </div>
        <span className={styles.adminStatusBadge}>{status}</span>
      </div>

      <form className={styles.adminForm} onSubmit={handleSubmit} aria-busy={isPending}>
        <section className={styles.adminFormSection}>
          <div className={styles.adminFormSectionHead}>
            <h3 className={styles.adminFormSectionTitle}>Core identity</h3>
            <p className={styles.adminFormSectionText}>
              Title and slug define the public product card.
            </p>
          </div>

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
            <div className={styles.adminInlineActionRow}>
              <input
                className={styles.adminInput}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                required
              />
              <button
                type="button"
                className={styles.adminActionButton}
                onClick={() => setSlug(slugify(title))}
                disabled={!title.trim() || isPending}
                aria-label="Generate slug from title"
              >
                Use title
              </button>
            </div>
          </label>
        </section>

        <section className={styles.adminFormSection}>
          <div className={styles.adminFormSectionHead}>
            <h3 className={styles.adminFormSectionTitle}>Pricing and availability</h3>
            <p className={styles.adminFormSectionText}>
              Use these fields to control what is sellable right now.
            </p>
          </div>

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
              <span className={styles.adminLabel}>Compare-at price</span>
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
        </section>

        <section className={styles.adminFormSection}>
          <div className={styles.adminFormSectionHead}>
            <h3 className={styles.adminFormSectionTitle}>Publishing</h3>
            <p className={styles.adminFormSectionText}>
              Control visibility, promotion, and category placement.
            </p>
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

          <label className={styles.adminCheckboxRow}>
            <input
              type="checkbox"
              className={styles.adminCheckbox}
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            <span className={styles.adminLabel}>Feature this product in storefront</span>
          </label>
        </section>

        <section className={styles.adminFormSection}>
          <div className={styles.adminFormSectionHead}>
            <h3 className={styles.adminFormSectionTitle}>Descriptions</h3>
            <p className={styles.adminFormSectionText}>
              Keep short copy tight and long copy useful for the product page.
            </p>
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
        </section>

        <button
          type="submit"
          className={styles.adminPrimaryButton}
          disabled={isPending}
          aria-label={mode === 'create' ? 'Create product' : 'Save product'}
        >
          {primaryActionLabel}
        </button>

        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
        {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
      </form>
    </section>
  );
}
