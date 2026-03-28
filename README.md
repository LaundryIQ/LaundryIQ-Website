# LaundryIQ Website Monorepo

Turborepo + pnpm monorepo for all LaundryIQ web apps.

## Apps

| App | URL | Framework |
|---|---|---|
| `web` | laundryiq.app | Next.js 15 |
| `portal` | portal.laundryiq.app | Vite + React |
| `dashboard` | dashboard.laundryiq.app | Vite + React |
| `shop` | shop.laundryiq.app | Shopify (submodule) |
| `mobile` | iOS / Android | Expo (post-April 2026) |

## Setup

```bash
pnpm install
pnpm dev
```

See `AGENTS.md` for full technical context.
