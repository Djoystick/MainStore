import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import styles from '@/components/store/store.module.css';

export default function AdminPage() {
  return (
    <StoreScreen title="Admin" subtitle="Store management UI placeholders">
      <StoreSection title="Dashboard">
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Products</p>
            <p className={styles.infoValue}>0</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Pending orders</p>
            <p className={styles.infoValue}>0</p>
          </div>
        </div>
      </StoreSection>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Admin workspace</h2>
        <p className={styles.panelText}>
          Product editing, order processing, and role checks are intentionally
          not connected in this stage.
        </p>
      </section>

      <StoreEmptyState
        title="Backend hooks are not connected"
        description="This screen is intentionally visual-only and ready for the next implementation stage."
      />
    </StoreScreen>
  );
}
