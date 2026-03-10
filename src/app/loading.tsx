import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function HomeLoading() {
  return (
    <StoreLoadingView
      title="Home"
      subtitle="Loading storefront"
      back={false}
      showBottomNav={true}
    />
  );
}
