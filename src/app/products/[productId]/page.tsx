import { StoreStubScreen } from '@/components/store/StoreStubScreen';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return (
    <StoreStubScreen
      title="Product Page"
      description={`Product route "${productId}" is a placeholder. Product content and business logic will be added in the next stage.`}
    />
  );
}
