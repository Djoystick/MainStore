import Link from 'next/link';

import styles from './admin.module.css';

interface AdminNoAccessStateProps {
  reason: 'no_session' | 'forbidden';
}

export function AdminNoAccessState({ reason }: AdminNoAccessStateProps) {
  const title =
    reason === 'no_session'
      ? 'Admin access needs Telegram session'
      : 'Admin access denied';
  const description =
    reason === 'no_session'
      ? 'Open MainStore inside Telegram with an admin account.'
      : 'Your account does not have admin role in profiles.role.';

  return (
    <section className={styles.adminNoAccess}>
      <h2 className={styles.adminNoAccessTitle}>{title}</h2>
      <p className={styles.adminNoAccessText}>{description}</p>
      <Link href="/" className={styles.adminNoAccessAction} aria-label="Back to storefront">
        Go to storefront
      </Link>
    </section>
  );
}
