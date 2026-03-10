'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import styles from './admin.module.css';

function mapFeaturedToggleError(error: string | undefined): string {
  if (!error) {
    return 'Could not update featured state.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'product_not_found':
      return 'This product is no longer available.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not update featured state. Please retry.';
  }
}

interface AdminProductFeatureToggleProps {
  productId: string;
  initialIsFeatured: boolean;
}

export function AdminProductFeatureToggle({
  productId,
  initialIsFeatured,
}: AdminProductFeatureToggleProps) {
  const router = useRouter();
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured);
  const [savedIsFeatured, setSavedIsFeatured] = useState(initialIsFeatured);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSave = () => {
    if (isPending || isSubmittingRef.current || isFeatured === savedIsFeatured) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isFeatured }),
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapFeaturedToggleError(errorCode));
          return;
        }

        setSavedIsFeatured(isFeatured);
        setSuccessMessage(isFeatured ? 'Product promoted.' : 'Featured state cleared.');
        router.refresh();
      } catch {
        setErrorMessage('Network error while updating featured state.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <div className={styles.adminActions}>
      <label className={styles.adminCheckboxRow}>
        <input
          type="checkbox"
          className={styles.adminCheckbox}
          checked={isFeatured}
          onChange={(event) => setIsFeatured(event.target.checked)}
        />
        <span className={styles.adminLabel}>Featured</span>
      </label>
      <button
        type="button"
        className={styles.adminActionButton}
        onClick={handleSave}
        disabled={isPending || isFeatured === savedIsFeatured}
        aria-label="Save featured state"
      >
        {isPending ? 'Saving...' : 'Save featured'}
      </button>
      {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
      {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
    </div>
  );
}
