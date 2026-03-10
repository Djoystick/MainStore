import type { PropsWithChildren } from 'react';

import { AdminNoAccessState } from '@/components/admin/AdminNoAccessState';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { getAdminPageAccess } from '@/features/admin';

export default async function AdminLayout({ children }: PropsWithChildren) {
  const access = await getAdminPageAccess();

  if (!access.ok) {
    return (
      <AdminScreen
        title="Admin"
        subtitle="Restricted workspace"
        back={true}
      >
        <AdminNoAccessState reason={access.reason ?? 'forbidden'} />
      </AdminScreen>
    );
  }

  return children;
}
