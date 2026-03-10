# MainStore Manual Verification Checklist

Run after env setup + migrations/seed.

## 0) Baseline

1. `pnpm run lint`
2. `pnpm run build`
3. `pnpm run infra:check -- --strict`

## 1) Storefront

1. Open `/` (Home) and verify product sections render.
2. Open `/catalog` and verify product list renders.
3. Open `/products/[slug]` and verify product detail renders.

## 2) User Flow

Inside Telegram Mini App:

1. Telegram session bootstrap:
   check that profile session appears (no bootstrap errors).
2. `/profile`:
   user identity and summary visible.
3. Favorites:
   add/remove from product page and confirm `/favorites` updates.
4. Cart:
   add item from product page, update quantity, remove item.
5. Checkout:
   open `/checkout`, submit shipping form, place order.
6. Orders:
   confirm created order appears in `/orders` and `/orders/[orderId]`.

Outside Telegram (browser only):

1. storefront pages still open.
2. session-dependent actions fail gracefully with readable messages.

## 3) Admin Flow

Using account with `profiles.role = 'admin'`:

1. Open `/admin` dashboard.
2. Products:
   - create product
   - edit fields
   - change status (`draft/active/archived`)
   - toggle featured
3. Product images:
   - add image by URL
   - edit alt/sort/primary
   - delete image
4. Categories:
   - create category
   - edit category
5. Orders:
   - open `/admin/orders`
   - open order details
   - update order status
6. Import scaffold:
   open `/admin/import` and verify placeholder section is visible.

Using non-admin account:

1. Open `/admin*` routes and verify access denied state.
2. Trigger any `/api/admin/*` action and verify server returns 401/403.
