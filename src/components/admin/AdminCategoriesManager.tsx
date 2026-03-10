'use client';

import { useState, useTransition, type FormEventHandler } from 'react';
import { useRouter } from 'next/navigation';

import type { AdminCategoryOption } from '@/features/admin';

import styles from './admin.module.css';

interface AdminCategoriesManagerProps {
  categories: AdminCategoryOption[];
}

interface CategoryRowProps {
  category: AdminCategoryOption;
}

function CategoryRow({ category }: CategoryRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(category.title);
  const [slug, setSlug] = useState(category.slug);
  const [isActive, setIsActive] = useState(category.isActive);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSave = () => {
    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug, isActive }),
      });

      if (!response.ok) {
        setErrorMessage('Failed to update category.');
        return;
      }

      router.refresh();
    });
  };

  return (
    <article className={styles.adminImageCard}>
      <div className={styles.adminForm}>
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
          <input
            className={styles.adminInput}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>

        <label className={styles.adminCheckboxRow}>
          <input
            type="checkbox"
            className={styles.adminCheckbox}
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span className={styles.adminLabel}>Active category</span>
        </label>

        <button
          type="button"
          className={styles.adminActionButton}
          onClick={onSave}
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save category'}
        </button>

        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
      </div>
    </article>
  );
}

export function AdminCategoriesManager({ categories }: AdminCategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onCreate: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    startTransition(async () => {
      setErrorMessage(null);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug, isActive }),
      });

      if (!response.ok) {
        setErrorMessage('Failed to create category.');
        return;
      }

      setTitle('');
      setSlug('');
      setIsActive(true);
      router.refresh();
    });
  };

  return (
    <section className={styles.adminCard}>
      <h2 className={styles.adminCardTitle}>Categories</h2>

      <form className={styles.adminForm} onSubmit={onCreate}>
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
            <input
              className={styles.adminInput}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.adminCheckboxRow}>
          <input
            type="checkbox"
            className={styles.adminCheckbox}
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span className={styles.adminLabel}>Active</span>
        </label>

        <button type="submit" className={styles.adminPrimaryButton} disabled={isPending}>
          {isPending ? 'Creating...' : 'Create category'}
        </button>
        {errorMessage && <p className={styles.adminError}>{errorMessage}</p>}
      </form>

      <div className={styles.adminImageList}>
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
