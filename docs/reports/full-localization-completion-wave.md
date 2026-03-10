# Full Localization Completion Wave

## What was changed
- Завершён practical-pass по оставшемуся code-owned English UI в storefront, customer area, admin, import flow, Telegram bootstrap/fallback states и payment sandbox surfaces.
- Переведены оставшиеся mixed-language тексты в checkout/cart/admin copy и import validation/errors.
- Локализованы fallback и server-returned user-facing сообщения для Telegram bootstrap и Excel import parsing.
- Обновлены скидочные badge labels в pricing layer, чтобы storefront не показывал English вроде `% off` и `Unknown target`.

## Files changed
- `src/app/admin/collections/page.tsx`
- `src/app/admin/import/page.tsx`
- `src/app/admin/orders/[orderId]/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/products/page.tsx`
- `src/app/api/admin/import/execute/route.ts`
- `src/app/api/admin/import/preview/route.ts`
- `src/app/api/admin/import/validate/route.ts`
- `src/app/api/auth/telegram/bootstrap/route.ts`
- `src/app/cart/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/pay/sandbox/[attemptId]/page.tsx`
- `src/app/profile/page.tsx`
- `src/components/admin/AdminCatalogImportFlow.tsx`
- `src/components/admin/AdminCollectionsManager.tsx`
- `src/components/admin/AdminProductsCatalogManager.tsx`
- `src/components/store/SandboxPaymentActions.tsx`
- `src/features/admin-import/excel.ts`
- `src/features/admin-import/importer.ts`
- `src/features/admin-import/server.ts`
- `src/features/admin-import/validation.ts`
- `src/features/pricing/index.ts`

## Checks run
- `pnpm run lint` ✅
- `pnpm run build` ✅

## Remaining risks / leftovers
- Реальные названия, описания и маркетинговый контент из Supabase не переводились автоматически, если они являются DB/content-owned данными.
- Термины вроде `slug`, `URL`, `Alt` частично сохранены там, где они выступают как технические admin labels, а не публичный product copy.
- В `lint/build` остаётся неблокирующее предупреждение `baseline-browser-mapping`.

## Exact commands required from the user
- Дополнительных обязательных команд нет.
- Для ручной проверки стоит открыть ключевые экраны в Telegram Mini App и убедиться, что DB-managed контент, если он всё ещё на английском, переведён уже через admin/content management.
