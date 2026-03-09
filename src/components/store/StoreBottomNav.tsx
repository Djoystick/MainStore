'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { classNames } from '@/css/classnames';

import styles from './store.module.css';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: 'HM',
    label: 'Home',
    isActive: (pathname) => pathname === '/',
  },
  {
    href: '/catalog',
    icon: 'CT',
    label: 'Catalog',
    isActive: (pathname) =>
      pathname === '/catalog' || pathname.startsWith('/products/'),
  },
  {
    href: '/cart',
    icon: 'CR',
    label: 'Cart',
    isActive: (pathname) => pathname === '/cart',
  },
  {
    href: '/orders',
    icon: 'OR',
    label: 'Orders',
    isActive: (pathname) => pathname === '/orders',
  },
  {
    href: '/profile',
    icon: 'PF',
    label: 'Profile',
    isActive: (pathname) => pathname === '/profile' || pathname === '/admin',
  },
];

export function StoreBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNavShell} aria-label="Store navigation">
      <div className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                styles.bottomNavLink,
                isActive && styles.bottomNavLinkActive,
              )}
            >
              <span className={styles.bottomNavIcon}>{item.icon}</span>
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
