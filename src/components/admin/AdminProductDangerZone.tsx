'use client';

import { useRef, useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import type { AdminProductDetail } from '@/features/admin/types';

import styles from './admin.module.css';

interface DeleteSummary {
  detachedOrderItemsCount: number;
  removedImagesCount: number;
  removedCollectionLinksCount: number;
  removedFavoritesCount: number;
  removedCartItemsCount: number;
}

function mapDeleteError(error: string | undefined): string {
  if (!error) {
    return 'Could not delete product.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'product_not_found':
      return 'This product is no longer available.';
    case 'delete_precheck_failed':
      return 'Could not prepare a safe deletion summary. Retry in a moment.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not delete product. Please retry.';
  }
}

interface AdminProductDangerZoneProps {
  product: AdminProductDetail;
}

export function AdminProductDangerZone({ product }: AdminProductDangerZoneProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteSummary, setDeleteSummary] = useState<DeleteSummary | null>(null);
  const isSubmittingRef = useRef(false);

  const canDelete = confirmation.trim() === product.slug;

  const handleDelete: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!canDelete || isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setDeleteSummary(null);

      try {
        const response = await fetch(`/api/admin/products/${product.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true; summary?: DeleteSummary }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok || !data.summary) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapDeleteError(errorCode));
          return;
        }

        setDeleteSummary(data.summary);
        router.push('/admin/products');
        router.refresh();
      } catch {
        setErrorMessage('Network error while deleting product.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <section className={styles.adminDangerCard}>
      <h2 className={styles.adminCardTitle}>Delete product</h2>
      <p className={styles.adminCardSub}>
        This uses a controlled hard delete. Images, favorites, cart rows, and collection links are
        removed. Order history is preserved by detaching historical `order_items` links.
      </p>

      <div className={styles.adminMetaGrid}>
        <div className={styles.adminMetaCell}>
          <p className={styles.adminMetaLabel}>Images</p>
          <p className={styles.adminMetaValue}>{product.imagesCount}</p>
        </div>
        <div className={styles.adminMetaCell}>
          <p className={styles.adminMetaLabel}>Favorites</p>
          <p className={styles.adminMetaValue}>{product.favoritesCount}</p>
        </div>
        <div className={styles.adminMetaCell}>
          <p className={styles.adminMetaLabel}>In carts</p>
          <p className={styles.adminMetaValue}>{product.cartItemsCount}</p>
        </div>
        <div className={styles.adminMetaCell}>
          <p className={styles.adminMetaLabel}>Order history links</p>
          <p className={styles.adminMetaValue}>{product.orderItemsCount}</p>
        </div>
      </div>

      <form className={styles.adminForm} onSubmit={handleDelete}>
        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Type the product slug to confirm</span>
          <input
            className={styles.adminInput}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={product.slug}
            aria-label="Confirm product deletion"
          />
        </label>

        <button
          type="submit"
          className={styles.adminDangerButton}
          disabled={!canDelete || isPending}
          aria-label="Delete product permanently"
        >
          {isPending ? 'Deleting...' : 'Delete product'}
        </button>

        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
        {deleteSummary && (
          <p className={styles.adminSuccess}>
            Product deleted. Preserved order history links: {deleteSummary.detachedOrderItemsCount}.
          </p>
        )}
      </form>
    </section>
  );
}
