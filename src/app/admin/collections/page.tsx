import Link from 'next/link';

import { AdminCollectionsManager } from '@/components/admin/AdminCollectionsManager';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { classNames } from '@/css/classnames';
import { getAdminCollections } from '@/features/admin';
import storeStyles from '@/components/store/store.module.css';

export default async function AdminCollectionsPage() {
  const collectionsResult = await getAdminCollections();

  return (
    <AdminScreen title="Admin Collections" subtitle="Manage curated storefront groupings and product links" back={true}>
      {collectionsResult.message && (
        <section
          className={classNames(
            storeStyles.dataNotice,
            collectionsResult.status === 'error' && storeStyles.dataNoticeError,
          )}
        >
          <p className={storeStyles.dataNoticeTitle}>Collections update</p>
          <p className={storeStyles.dataNoticeText}>{collectionsResult.message}</p>
          {(collectionsResult.status === 'error' || collectionsResult.status === 'not_configured') && (
            <div className={storeStyles.dataNoticeActions}>
              <Link
                href="/admin/collections"
                className={storeStyles.dataNoticeRetry}
                aria-label="Retry loading collections"
              >
                Retry
              </Link>
            </div>
          )}
        </section>
      )}

      {collectionsResult.status === 'ok' ? (
        <AdminCollectionsManager collections={collectionsResult.collections} />
      ) : (
        <StoreEmptyState
          title="Cannot load collections"
          description="Collections are temporarily unavailable. Retry in a moment."
        />
      )}
    </AdminScreen>
  );
}
