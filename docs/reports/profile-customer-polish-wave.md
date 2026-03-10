# Profile / Customer Polish Wave

## Что изменено

- `profile` превращён в более понятный customer hub:
  - clearer hierarchy
  - next-action guidance
  - richer activity summary
  - better quick navigation
- Усилены `favorites`:
  - summary block
  - clearer next steps
  - better empty state
- Усилена `cart`:
  - clearer summary and actions
  - better empty state recovery
  - better links to related customer surfaces
- Обновлены loading texts для `profile`, `favorites`, `cart`.
- Добавлен небольшой CSS polish для customer hub / helper states.

## Files changed

- `src/app/profile/page.tsx`
- `src/app/profile/loading.tsx`
- `src/app/favorites/page.tsx`
- `src/app/favorites/loading.tsx`
- `src/app/cart/page.tsx`
- `src/app/cart/loading.tsx`
- `src/components/store/store.module.css`

## Checks run

- `pnpm run lint`
- `pnpm run build`

## Remaining risks / leftovers

- Profile area остаётся practical customer space, не full account/settings system.
- Не добавлялись fake account features, editable profile fields, address book или loyalty mechanics.
- Bottom nav / customer navigation сохранены mobile-first и простыми, без отдельного customer layout overhaul.
- `baseline-browser-mapping` warning остаётся неблокирующим.

## Exact commands required from the user

- Обязательных дополнительных команд нет.
- Для ручной проверки:
  - `pnpm run dev`
