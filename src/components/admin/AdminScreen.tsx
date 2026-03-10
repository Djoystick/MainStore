import type { PropsWithChildren } from 'react';

import { StoreScreen } from '@/components/store/StoreScreen';

import { AdminTabsNav } from './AdminTabsNav';

interface AdminScreenProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  back?: boolean;
}

export function AdminScreen({
  title,
  subtitle,
  back = false,
  children,
}: AdminScreenProps) {
  return (
    <StoreScreen title={title} subtitle={subtitle} back={back} showBottomNav={false}>
      <AdminTabsNav />
      {children}
    </StoreScreen>
  );
}
