import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function ProfileLoading() {
  return (
    <StoreLoadingView
      title="Профиль"
      subtitle="Готовим личное пространство"
      back={false}
      showBottomNav={true}
      mode="orders"
    />
  );
}
