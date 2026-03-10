'use client';

import { useRef, useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import type {
  AdminCollectionOption,
  AdminProductCollectionAssignment,
} from '@/features/admin/types';

import styles from './admin.module.css';

interface AdminProductCollectionsManagerProps {
  productId: string;
  collections: AdminCollectionOption[];
  assignments: AdminProductCollectionAssignment[];
}

interface AssignmentRowProps {
  productId: string;
  assignment: AdminProductCollectionAssignment;
  isDisabled: boolean;
  onBusyChange: (next: boolean) => void;
  onFeedback: (kind: 'error' | 'success', message: string) => void;
}

function mapCollectionBindingError(error: string | undefined): string {
  if (!error) {
    return 'Could not update collection link.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'collection_not_found':
    case 'product_not_found':
      return 'Requested product or collection is no longer available.';
    case 'invalid_collection_sort_order':
      return 'Collection sort order should be a non-negative integer.';
    case 'invalid_product_collection_payload':
      return 'Collection assignment payload is invalid.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not update collection link. Please retry.';
  }
}

function AssignmentRow({
  productId,
  assignment,
  isDisabled,
  onBusyChange,
  onFeedback,
}: AssignmentRowProps) {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState(String(assignment.sortOrder));

  const onSave = async () => {
    const parsedSortOrder = Number(sortOrder);
    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      onFeedback('error', 'Collection sort order should be a non-negative integer.');
      return;
    }

    onBusyChange(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          collectionId: assignment.collectionId,
          sortOrder: parsedSortOrder,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !data || !data.ok) {
        const errorCode = data && !data.ok ? data.error : undefined;
        onFeedback('error', mapCollectionBindingError(errorCode));
        return;
      }

      onFeedback('success', 'Collection link saved.');
      router.refresh();
    } catch {
      onFeedback('error', 'Network error while saving collection link.');
    } finally {
      onBusyChange(false);
    }
  };

  const onRemove = async () => {
    onBusyChange(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/collections`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ collectionId: assignment.collectionId }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !data || !data.ok) {
        const errorCode = data && !data.ok ? data.error : undefined;
        onFeedback('error', mapCollectionBindingError(errorCode));
        return;
      }

      onFeedback('success', 'Collection link removed.');
      router.refresh();
    } catch {
      onFeedback('error', 'Network error while removing collection link.');
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <article className={styles.adminMetaCell}>
      <div className={styles.adminCardHead}>
        <div>
          <p className={styles.adminMetaValue}>{assignment.title}</p>
          <p className={styles.adminCardSub}>{assignment.slug}</p>
        </div>
      </div>
      <div className={styles.adminInlineActionRow}>
        <input
          type="number"
          min="0"
          step="1"
          className={styles.adminInput}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          aria-label={`Sort order for ${assignment.title}`}
        />
        <button
          type="button"
          className={styles.adminActionButton}
          onClick={onSave}
          disabled={isDisabled}
          aria-label={`Save ${assignment.title} collection link`}
        >
          Save
        </button>
      </div>
      <div className={styles.adminActions}>
        <button
          type="button"
          className={styles.adminDangerButton}
          onClick={onRemove}
          disabled={isDisabled}
          aria-label={`Remove from ${assignment.title}`}
        >
          Remove
        </button>
      </div>
    </article>
  );
}

export function AdminProductCollectionsManager({
  productId,
  collections,
  assignments,
}: AdminProductCollectionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? '');
  const [sortOrder, setSortOrder] = useState(String(assignments.length));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const linkedCollectionIds = new Set(assignments.map((assignment) => assignment.collectionId));
  const availableCollections = collections.filter((collection) => !linkedCollectionIds.has(collection.id));

  const onAssign: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const parsedSortOrder = Number(sortOrder);
      if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
        setErrorMessage('Collection sort order should be a non-negative integer.');
        isSubmittingRef.current = false;
        return;
      }

      try {
        const response = await fetch(`/api/admin/products/${productId}/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            collectionId,
            sortOrder: parsedSortOrder,
          }),
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapCollectionBindingError(errorCode));
          return;
        }

        setSuccessMessage('Collection link saved.');
        router.refresh();
      } catch {
        setErrorMessage('Network error while linking collection.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <section className={styles.adminCard}>
      <div className={styles.adminCardHead}>
        <div>
          <h2 className={styles.adminCardTitle}>Product collections</h2>
          <p className={styles.adminCardSub}>
            Add the product to curated collections and control its order inside each one.
          </p>
        </div>
        <span className={styles.adminStatusBadge}>{assignments.length} links</span>
      </div>

      {availableCollections.length > 0 && (
        <form className={styles.adminForm} onSubmit={onAssign} aria-busy={isPending}>
          <div className={styles.adminInlineRow}>
            <label className={styles.adminField}>
              <span className={styles.adminLabel}>Collection</span>
              <select
                className={styles.adminSelect}
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
              >
                {availableCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.adminField}>
              <span className={styles.adminLabel}>Sort order</span>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.adminInput}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </label>
          </div>

          <button
            type="submit"
            className={styles.adminPrimaryButton}
            disabled={isPending}
            aria-label="Assign product to collection"
          >
            {isPending ? 'Saving...' : 'Add to collection'}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <StoreEmptyState
          title="No collection links yet"
          description="Use collections to surface this product in curated storefront sections."
        />
      ) : (
        <div className={styles.adminCardList}>
          {assignments.map((assignment) => (
            <AssignmentRow
              key={assignment.collectionId}
              productId={productId}
              assignment={assignment}
              isDisabled={isPending}
              onBusyChange={(next) => {
                isSubmittingRef.current = next;
              }}
              onFeedback={(kind, message) => {
                if (kind === 'error') {
                  setErrorMessage(message);
                  setSuccessMessage(null);
                  return;
                }

                setSuccessMessage(message);
                setErrorMessage(null);
              }}
            />
          ))}
        </div>
      )}

      {availableCollections.length === 0 && collections.length > 0 && (
        <p className={styles.adminCardSub}>This product is already linked to every available collection.</p>
      )}

      {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
      {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
    </section>
  );
}
