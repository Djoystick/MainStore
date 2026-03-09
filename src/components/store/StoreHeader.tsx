import styles from './store.module.css';

interface StoreHeaderProps {
  title: string;
  subtitle?: string;
}

export function StoreHeader({ title, subtitle }: StoreHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div>
          <p className={styles.headerTag}>MainStore</p>
          <h1 className={styles.headerTitle}>{title}</h1>
          {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
