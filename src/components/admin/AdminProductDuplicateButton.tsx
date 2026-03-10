'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import styles from './admin.module.css';

function mapDuplicateError(error: string | undefined): string {
  if (!error) {
    return 'Could not duplicate product.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'product_not_found':
      return 'This product is no longer available.';
    case 'duplicate_slug_generation_failed':
      return 'Could not prepare a unique slug for the duplicate.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not duplicate product. Please retry.';
  }
}

interface AdminProductDuplicateButtonProps {
  productId: string;
  label?: string;
}

export function AdminProductDuplicateButton({
  productId,
  label = 'Duplicate',
}: AdminProductDuplicateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleDuplicate = () => {
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/admin/products/${productId}/duplicate`, {
          method: 'POST',
          credentials: 'include',
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true; id?: string }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok || !data.id) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapDuplicateError(errorCode));
          return;
        }

        router.push(`/admin/products/${data.id}/edit`);
      } catch {
        setErrorMessage('Network error while duplicating product.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={styles.adminActionButton}
        onClick={handleDuplicate}
        disabled={isPending}
        aria-label="Duplicate product"
      >
        {isPending ? 'Duplicating...' : label}
      </button>
      {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
    </>
  );
}
