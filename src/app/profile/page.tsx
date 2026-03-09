import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import styles from '@/components/store/store.module.css';

export default function ProfilePage() {
  return (
    <StoreScreen title="Profile" subtitle="Customer account placeholder">
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Main profile card</h2>
        <p className={styles.panelText}>
          Guest customer mode. Profile data, addresses, and authentication will
          be added in the next stage.
        </p>
      </section>

      <StoreSection title="Quick actions">
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Saved addresses</p>
            <p className={styles.infoValue}>0</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Payment methods</p>
            <p className={styles.infoValue}>0</p>
          </div>
        </div>
      </StoreSection>

      <StoreEmptyState
        title="Admin panel is prepared"
        description="Administrative tools have a dedicated route with UI placeholders."
        actionLabel="Open admin"
        actionHref="/admin"
      />
    </StoreScreen>
  );
}
