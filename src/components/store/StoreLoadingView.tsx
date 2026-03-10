import { StoreScreen } from './StoreScreen';
import styles from './store.module.css';

interface StoreLoadingViewProps {
  title: string;
  subtitle: string;
  back?: boolean;
  showBottomNav?: boolean;
}

export function StoreLoadingView({
  title,
  subtitle,
  back = false,
  showBottomNav = true,
}: StoreLoadingViewProps) {
  return (
    <StoreScreen
      title={title}
      subtitle={subtitle}
      back={back}
      showBottomNav={showBottomNav}
    >
      <div className={`${styles.loadingBlock} ${styles.loadingHero}`} />
      <div className={`${styles.loadingBlock} ${styles.loadingBar}`} />
      <div className={`${styles.loadingBlock} ${styles.loadingSection}`} />
    </StoreScreen>
  );
}
