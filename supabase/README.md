# MainStore Supabase Setup

This folder contains database migrations and seed data for MainStore.

## Required Env Context

The app expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `TELEGRAM_BOT_TOKEN` (server-only)
- `APP_SESSION_SECRET` (server-only)

See root `.env.example` for details.

## Migrations

Migration files:

1. `migrations/20260309190000_store_backend_foundation.sql`
2. `migrations/20260310123000_checkout_order_flow.sql`

## Local DB

Apply migrations + seed in one step:

```bash
supabase db reset
```

## Remote DB

1. Link project:

```bash
supabase link --project-ref <your-project-ref>
```

2. Push migrations:

```bash
supabase db push
```

3. If test catalog data is needed, run `seed.sql` manually in Supabase SQL Editor.

## Seed Data

`seed.sql` inserts:

- categories
- products
- product_images
- collections
- collection_items

Use seed only for development/testing data bootstrap.
