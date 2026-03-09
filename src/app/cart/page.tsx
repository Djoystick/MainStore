import { StoreEmptyState } from '@/components/store/StoreEmptyState';
import { StoreScreen } from '@/components/store/StoreScreen';
import { StoreSection } from '@/components/store/StoreSection';
import styles from '@/components/store/store.module.css';

export default function CartPage() {
  return (
    <StoreScreen title="Cart" subtitle="Your selected products will appear here">
      <StoreSection title="Summary">
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Items</p>
            <p className={styles.infoValue}>0</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Subtotal</p>
            <p className={styles.infoValue}>$0</p>
          </div>
        </div>
      </StoreSection>

      <StoreEmptyState
        title="Your cart is empty"
        description="Add products from catalog. Quantity, options, and checkout actions will be wired in the next stage."
        actionLabel="Go to catalog"
        actionHref="/catalog"
      />
    </StoreScreen>
  );
}
