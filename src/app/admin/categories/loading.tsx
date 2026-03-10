import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function AdminCategoriesLoading() {
  return (
    <StoreLoadingView
      title="Admin Categories"
      subtitle="Loading category workspace"
      back={true}
      showBottomNav={false}
      mode="admin"
    />
  );
}
