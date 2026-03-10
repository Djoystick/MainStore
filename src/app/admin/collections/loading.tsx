import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function AdminCollectionsLoading() {
  return (
    <StoreLoadingView
      title="Admin Collections"
      subtitle="Loading collection workspace"
      back={true}
      showBottomNav={false}
      mode="admin"
    />
  );
}
