import Link from 'next/link';

import { AdminCategoriesManager } from '@/components/admin/AdminCategoriesManager';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { classNames } from '@/css/classnames';
import { getAdminCategories } from '@/features/admin';
import storeStyles from '@/components/store/store.module.css';

export default async function AdminCategoriesPage() {
  const categoriesResult = await getAdminCategories();

  return (
    <AdminScreen title="Admin Categories" subtitle="Manage category structure for storefront and catalog" back={true}>
      {categoriesResult.message && (
        <section
          className={classNames(
            storeStyles.dataNotice,
            categoriesResult.status === 'error' && storeStyles.dataNoticeError,
          )}
        >
          <p className={storeStyles.dataNoticeTitle}>Categories update</p>
          <p className={storeStyles.dataNoticeText}>{categoriesResult.message}</p>
          {(categoriesResult.status === 'error' || categoriesResult.status === 'not_configured') && (
            <div className={storeStyles.dataNoticeActions}>
              <Link
                href="/admin/categories"
                className={storeStyles.dataNoticeRetry}
                aria-label="Retry loading categories"
              >
                Retry
              </Link>
            </div>
          )}
        </section>
      )}

      {categoriesResult.status === 'ok' ? (
        <AdminCategoriesManager categories={categoriesResult.categories} />
      ) : (
        <StoreEmptyState
          title="Cannot load categories"
          description="Categories are temporarily unavailable. Retry in a moment."
        />
      )}
    </AdminScreen>
  );
}
