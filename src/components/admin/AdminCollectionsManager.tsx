'use client';

import { useRef, useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import type { AdminCollectionOption, CollectionUpsertInput } from '@/features/admin/types';

import styles from './admin.module.css';

interface AdminCollectionsManagerProps {
  collections: AdminCollectionOption[];
}

interface CollectionRowProps {
  collection: AdminCollectionOption;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapAdminCollectionError(error: string | undefined): string {
  if (!error) {
    return 'Could not update collection.';
  }

  switch (error) {
    case 'not_configured':
      return 'Admin backend is temporarily unavailable.';
    case 'collection_title_required':
      return 'Collection title is required.';
    case 'invalid_collection_slug':
      return 'Collection slug should contain lowercase letters, digits, and hyphens.';
    case 'invalid_collection_sort_order':
      return 'Display order should be a non-negative integer.';
    case 'slug_conflict':
      return 'This slug is already used by another collection.';
    case 'collection_not_found':
      return 'This collection is no longer available.';
    case 'invalid_collection_payload':
      return 'Fill in all required collection fields.';
    case 'admin_access_denied':
      return 'You do not have access to this admin action.';
    default:
      return 'Could not save collection. Please retry.';
  }
}

function CollectionRow({ collection }: CollectionRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(collection.title);
  const [slug, setSlug] = useState(collection.slug);
  const [description, setDescription] = useState(collection.description ?? '');
  const [shortText, setShortText] = useState(collection.shortText ?? '');
  const [sortOrder, setSortOrder] = useState(String(collection.sortOrder));
  const [isActive, setIsActive] = useState(collection.isActive);
  const [isFeatured, setIsFeatured] = useState(collection.isFeatured);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const onSave = () => {
    if (isPending || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      const parsedSortOrder = Number(sortOrder);
      if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
        setErrorMessage('Display order should be a non-negative integer.');
        isSubmittingRef.current = false;
        return;
      }

      const payload: CollectionUpsertInput = {
        title,
        slug,
        description,
        shortText,
        isActive,
        isFeatured,
        sortOrder: parsedSortOrder,
      };

      try {
        const response = await fetch(`/api/admin/collections/${collection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapAdminCollectionError(errorCode));
          return;
        }

        setSuccessMessage('Collection saved.');
        router.refresh();
      } catch {
        setErrorMessage('Network error while saving collection.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  const onDelete = () => {
    if (isPending || isSubmittingRef.current) {
      return;
    }

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    isSubmittingRef.current = true;

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch(`/api/admin/collections/${collection.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = (await response.json().catch(() => null)) as
          | { ok: true }
          | { ok: false; error?: string }
          | null;

        if (!response.ok || !data || !data.ok) {
          const errorCode = data && !data.ok ? data.error : undefined;
          setErrorMessage(mapAdminCollectionError(errorCode));
          return;
        }

        router.refresh();
      } catch {
        setErrorMessage('Network error while deleting collection.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <article className={styles.adminCard}>
      <div className={styles.adminCardHead}>
        <div>
          <h3 className={styles.adminCardTitle}>{collection.title}</h3>
          <p className={styles.adminCardSub}>{collection.productsCount} linked products</p>
        </div>
        <div className={styles.adminBadgeRow}>
          {isFeatured && <span className={styles.adminFeatureBadge}>Featured</span>}
          <span className={styles.adminStatusBadge}>{isActive ? 'Visible' : 'Hidden'}</span>
        </div>
      </div>

      <div className={styles.adminForm}>
        <div className={styles.adminInlineRow}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Title</span>
            <input
              className={styles.adminInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Slug</span>
            <div className={styles.adminInlineActionRow}>
              <input
                className={styles.adminInput}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
              <button
                type="button"
                className={styles.adminActionButton}
                onClick={() => setSlug(slugify(title))}
                disabled={!title.trim() || isPending}
                aria-label="Generate collection slug"
              >
                Use title
              </button>
            </div>
          </label>
        </div>

        <div className={styles.adminInlineRow}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Short text</span>
            <input
              className={styles.adminInput}
              value={shortText}
              onChange={(event) => setShortText(event.target.value)}
            />
          </label>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Display order</span>
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

        <label className={styles.adminField}>
          <span className={styles.adminLabel}>Description</span>
          <textarea
            className={styles.adminTextarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>

        <div className={styles.adminInlineRow}>
          <label className={styles.adminCheckboxRow}>
            <input
              type="checkbox"
              className={styles.adminCheckbox}
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span className={styles.adminLabel}>Visible in storefront</span>
          </label>

          <label className={styles.adminCheckboxRow}>
            <input
              type="checkbox"
              className={styles.adminCheckbox}
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            <span className={styles.adminLabel}>Feature on storefront</span>
          </label>
        </div>

        <div className={styles.adminActions}>
          <button
            type="button"
            className={styles.adminActionButton}
            onClick={onSave}
            disabled={isPending}
            aria-label={`Save collection ${collection.title}`}
          >
            {isPending ? 'Saving...' : 'Save collection'}
          </button>
          <button
            type="button"
            className={styles.adminDangerButton}
            onClick={onDelete}
            disabled={isPending}
            aria-label={`Delete collection ${collection.title}`}
          >
            {isConfirmingDelete ? 'Confirm delete' : 'Delete'}
          </button>
        </div>

        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
        {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
      </div>
    </article>
  );
}

export function AdminCollectionsManager({ collections }: AdminCollectionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortText, setShortText] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const filteredCollections = collections.filter((collection) => {
    if (visibilityFilter === 'visible' && !collection.isActive) {
      return false;
    }
    if (visibilityFilter === 'hidden' && collection.isActive) {
      return false;
    }
    if (featuredFilter === 'featured' && !collection.isFeatured) {
      return false;
    }
    if (featuredFilter === 'standard' && collection.isFeatured) {
      return false;
    }
    if (!search.trim()) {
      return true;
    }

    const haystack = `${collection.title} ${collection.slug} ${collection.shortText ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const onCreate: FormEventHandler<HTMLFormElement> = (event) => {
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
        setErrorMessage('Display order should be a non-negative integer.');
        isSubmittingRef.current = false;
        return;
      }

      const payload: CollectionUpsertInput = {
        title,
        slug,
        description,
        shortText,
        isActive,
        isFeatured,
        sortOrder: parsedSortOrder,
      };

      try {
        const response = await fetch('/api/admin/collections', {
          method: 'POST',
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
          setErrorMessage(mapAdminCollectionError(errorCode));
          return;
        }

        setTitle('');
        setSlug('');
        setDescription('');
        setShortText('');
        setSortOrder('0');
        setIsActive(true);
        setIsFeatured(false);
        setSuccessMessage('Collection created.');
        router.refresh();
      } catch {
        setErrorMessage('Network error while creating collection.');
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return (
    <section className={styles.adminSectionStack}>
      <section className={styles.adminCard}>
        <div className={styles.adminCardHead}>
          <div>
            <h2 className={styles.adminCardTitle}>Collections</h2>
            <p className={styles.adminCardSub}>
              Manage curated storefront sections, visibility, promotion, and order.
            </p>
          </div>
          <div className={styles.adminBadgeRow}>
            <span className={styles.adminStatusBadge}>{collections.length} total</span>
          </div>
        </div>

        <div className={styles.adminFiltersGrid}>
          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Search</span>
            <input
              className={styles.adminInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, slug, short text"
            />
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Visibility</span>
            <select
              className={styles.adminSelect}
              value={visibilityFilter}
              onChange={(event) =>
                setVisibilityFilter(event.target.value as 'all' | 'visible' | 'hidden')
              }
            >
              <option value="all">All collections</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </label>

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Featured</span>
            <select
              className={styles.adminSelect}
              value={featuredFilter}
              onChange={(event) =>
                setFeaturedFilter(event.target.value as 'all' | 'featured' | 'standard')
              }
            >
              <option value="all">All collections</option>
              <option value="featured">Featured only</option>
              <option value="standard">Standard only</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.adminCard}>
        <h2 className={styles.adminCardTitle}>Create collection</h2>

        <form className={styles.adminForm} onSubmit={onCreate} aria-busy={isPending}>
          <div className={styles.adminInlineRow}>
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
                  aria-label="Generate collection slug"
                >
                  Use title
                </button>
              </div>
            </label>
          </div>

          <div className={styles.adminInlineRow}>
            <label className={styles.adminField}>
              <span className={styles.adminLabel}>Short text</span>
              <input
                className={styles.adminInput}
                value={shortText}
                onChange={(event) => setShortText(event.target.value)}
              />
            </label>
            <label className={styles.adminField}>
              <span className={styles.adminLabel}>Display order</span>
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

          <label className={styles.adminField}>
            <span className={styles.adminLabel}>Description</span>
            <textarea
              className={styles.adminTextarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>

          <div className={styles.adminInlineRow}>
            <label className={styles.adminCheckboxRow}>
              <input
                type="checkbox"
                className={styles.adminCheckbox}
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <span className={styles.adminLabel}>Visible in storefront</span>
            </label>

            <label className={styles.adminCheckboxRow}>
              <input
                type="checkbox"
                className={styles.adminCheckbox}
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              <span className={styles.adminLabel}>Feature on storefront</span>
            </label>
          </div>

          <button
            type="submit"
            className={styles.adminPrimaryButton}
            disabled={isPending}
            aria-label="Create collection"
          >
            {isPending ? 'Creating...' : 'Create collection'}
          </button>

          {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
          {successMessage && <p className={styles.adminSuccess}>{successMessage}</p>}
        </form>
      </section>

      {filteredCollections.length === 0 ? (
        <StoreEmptyState
          title={collections.length === 0 ? 'No collections yet' : 'No matching collections'}
          description={
            collections.length === 0
              ? 'Create the first collection to power curated storefront sections.'
              : 'Adjust filters or search query to see matching collections.'
          }
        />
      ) : (
        <div className={styles.adminCardList}>
          {filteredCollections.map((collection) => (
            <CollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
