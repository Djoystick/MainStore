import Link from 'next/link';

import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import { getCurrentUserContext } from '@/features/auth';
import { getUserStoreSummaryForProfile } from '@/features/user-store/data';
import styles from '@/components/store/store.module.css';

export default async function ProfilePage() {
  const { profile } = await getCurrentUserContext();
  const summary = await getUserStoreSummaryForProfile(profile?.id ?? null);
  const displayName = profile?.displayName || profile?.username || 'Telegram user';
  const username = profile?.username ? `@${profile.username}` : 'No username';

  return (
    <StoreScreen title="Profile" subtitle="Your account and purchase flow">
      {profile ? (
        <>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{displayName}</h2>
            <p className={styles.panelText}>
              {username}
              <br />
              Role: {profile.role}
            </p>
          </section>

          <StoreSection title="Activity">
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <p className={styles.infoLabel}>Favorites</p>
                <p className={styles.infoValue}>{summary.favoritesCount}</p>
              </div>
              <div className={styles.infoItem}>
                <p className={styles.infoLabel}>Cart qty</p>
                <p className={styles.infoValue}>{summary.cartQuantityTotal}</p>
              </div>
            </div>
          </StoreSection>
        </>
      ) : (
        <StoreEmptyState
          title="No active session"
          description="Open MainStore in Telegram to load your profile, favorites, and cart."
          actionLabel="Browse catalog"
          actionHref="/catalog"
        />
      )}

      <StoreSection title="Your shortcuts">
        <div className={styles.actionList}>
          <Link href="/orders" className={styles.actionItem} aria-label="Open my orders">
            <div>
              <p className={styles.actionItemTitle}>My orders</p>
              <p className={styles.actionItemSub}>Track status and history</p>
            </div>
            <span className={styles.actionItemIcon}>GO</span>
          </Link>

          <Link href="/favorites" className={styles.actionItem} aria-label="Open favorites">
            <div>
              <p className={styles.actionItemTitle}>Favorites</p>
              <p className={styles.actionItemSub}>Saved products in one place</p>
            </div>
            <span className={styles.actionItemIcon}>GO</span>
          </Link>

          <Link href="/cart" className={styles.actionItem} aria-label="Open cart">
            <div>
              <p className={styles.actionItemTitle}>Cart</p>
              <p className={styles.actionItemSub}>Review products before checkout</p>
            </div>
            <span className={styles.actionItemIcon}>GO</span>
          </Link>
        </div>
      </StoreSection>
    </StoreScreen>
  );
}
