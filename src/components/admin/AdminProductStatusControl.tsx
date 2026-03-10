'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type { ProductStatus } from '@/features/admin';

import styles from './admin.module.css';

const statusOptions: ProductStatus[] = ['draft', 'active', 'archived'];

interface AdminProductStatusControlProps {
  productId: string;
  initialStatus: ProductStatus;
}

export function AdminProductStatusControl({
  productId,
  initialStatus,
}: AdminProductStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ProductStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setErrorMessage('Failed to update status.');
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className={styles.adminActions}>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as ProductStatus)}
        className={styles.adminSelect}
        aria-label="Product status"
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.adminActionButton}
        onClick={handleSave}
        disabled={isPending}
        aria-label="Save product status"
      >
        {isPending ? 'Saving...' : 'Save status'}
      </button>
      {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
    </div>
  );
}
