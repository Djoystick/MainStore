import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function AdminImportLoading() {
  return (
    <StoreLoadingView
      title="Catalog Import"
      subtitle="Preparing import workspace"
      back={true}
      showBottomNav={false}
      mode="admin"
    />
  );
}
