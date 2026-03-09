import type { PropsWithChildren } from 'react';

import styles from './store.module.css';

export function StoreScreenContainer({ children }: PropsWithChildren) {
  return <div className={styles.container}>{children}</div>;
}
