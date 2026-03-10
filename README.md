# MainStore (Telegram Mini App)

MainStore is a Telegram Mini App storefront built on Next.js App Router with:

- Supabase-backed catalog and orders
- Telegram session bootstrap (server-side verified)
- User flows: favorites, cart, checkout (without payment), orders
- Admin flows: products CRUD, product images, categories, orders management

## Quick Start (Local)

1. Install dependencies:

```bash
pnpm install
```

2. Create local env file:

```powershell
Copy-Item .env.example .env.local
```

3. Fill `.env.local` values.

4. Run infrastructure env diagnostics:

```bash
pnpm run infra:check -- --strict
```

5. Apply Supabase migrations and seed (see [supabase/README.md](./supabase/README.md)).

6. Run app:

```bash
pnpm run dev
```

7. Validate build/lint:

```bash
pnpm run lint
pnpm run build
```

## Environment Model

See [.env.example](./.env.example) for canonical list.

- Public (browser-visible):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TELEGRAM_BOT_TOKEN`
  - `APP_SESSION_SECRET`
- Dev-only app env:
  - none (Next.js manages `NODE_ENV`)

## Deployment (Vercel)

- No additional `vercel.json` is required for current setup.
- Configure all env vars from `.env.example` in Vercel Project Settings.
- Deploy with standard Next.js build (`pnpm run build`).

## Infrastructure Runbook

Detailed setup and runtime sequence:

- [docs/INFRA_SETUP_RUNBOOK.md](./docs/INFRA_SETUP_RUNBOOK.md)

Manual end-to-end checks:

- [docs/MANUAL_VERIFICATION_CHECKLIST.md](./docs/MANUAL_VERIFICATION_CHECKLIST.md)
