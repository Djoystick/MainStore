# Storefront UX/UI Wave

## Что изменено

- Упрощена визуальная иерархия главной страницы: более спокойный hero, быстрые входы в каталог и мягкие promo-поверхности.
- Добавлены отдельные горизонтальные mini-shelves для promo/product сценариев, готовые к будущей привязке акционных и скидочных товаров.
- Упрощён визуальный вид `ProductCard`: меньше шумного текста, легче считываются название, цена и скидка.
- Добавлен более чистый lead-блок в каталоге и смягчён визуальный ритм секций и карточек по storefront.
- Сохранена mobile-first подача и читаемость русского текста в Telegram Mini App.

## Files Changed

- `src/app/page.tsx`
- `src/app/catalog/page.tsx`
- `src/app/products/[productId]/page.tsx`
- `src/components/store/ProductCard.tsx`
- `src/components/store/StoreMiniShelfSection.tsx`
- `src/components/store/store.module.css`
- `src/features/storefront/data.ts`
- `src/features/storefront/marketing.ts`

## Checks Run

- `pnpm run lint` OK
- `pnpm run build` OK

## Remaining Risks / Leftovers

- Горизонтальные mini-shelves уже готовы по структуре под future promo/discount binding, но пока используют текущие storefront data и placeholder fallback logic, если реальных promo-товаров нет.
- В этом проходе намеренно не перерабатывались `cart`, `favorites`, `orders`, `profile`, `admin` и `payment foundation`, кроме общей визуальной консистентности storefront cards.
- В `lint` и `build` остаётся существующее неблокирующее предупреждение `baseline-browser-mapping`.

## Exact Commands Required From The User

- Обязательных команд после этого прохода нет.
- Опционально для ручной проверки:
  - `pnpm run dev`
  - проверить `/`, `/catalog` и `/products/[productId]` в Telegram Mini App viewport
