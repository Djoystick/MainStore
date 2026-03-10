import { StoreLoadingView } from '@/components/store/StoreLoadingView';

export default function FavoritesLoading() {
  return (
    <StoreLoadingView
      title="Избранное"
      subtitle="Собираем сохранённые товары"
      back={false}
      showBottomNav={true}
      mode="catalog"
    />
  );
}
