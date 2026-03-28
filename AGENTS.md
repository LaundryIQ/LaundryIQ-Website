# LaundryIQ Website Monorepo — Agent Context

> Read `../../Planning/LaundryIQ-Plan/PROJECT.md` for full project context before working here.

---

## What This Is

Turborepo monorepo for all LaundryIQ web applications and shared packages.

```
apps/
  web/        ← Next.js 15 — laundryiq.app (marketing / landing)
  portal/     ← Vite + React — portal.laundryiq.app (end-user status view)
  dashboard/  ← Vite + React — dashboard.laundryiq.app (operator admin)
  mobile/     ← Expo — iOS/Android (post-April 2026 placeholder)
  shop/       ← Git submodule → laundryiq-shop (Shopify Liquid theme)

packages/
  convex/     ← Shared Convex schema, functions, and HTTP actions
  ui/         ← Shared shadcn/ui components
  utils/      ← Shared utilities (state derivation, timestamps, IDs)
  types/      ← Shared TypeScript types
  config/     ← Shared ESLint, TypeScript, Tailwind configs

api/
  requests.http ← Device API REST Client examples (canonical contract)
```

## Tech Stack

| Concern | Tool |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Vite + React + TypeScript + shadcn/ui |
| Marketing | Next.js 15 |
| Backend | Convex (DB, realtime, HTTP actions) |
| Auth | Clerk (Google-only OAuth, JWT template "convex" for Convex integration) |
| Hosting | Vercel (all web apps) |
| E-commerce | Shopify (submodule) |
| Styling | Tailwind CSS v3 |

## Key Architecture Decisions

- All web apps share a single Convex deployment (`packages/convex/`)
- Web/mobile apps use Convex `useQuery`/`useMutation` directly (not REST)
- Only devices (ESP32) use the REST API in `api/requests.http`
- `api.laundryiq.app` — Convex custom domain (HTTP Actions)
- Auth is **Clerk** — `ConvexProviderWithClerk` wraps all Vite apps; `@clerk/nextjs` wraps `apps/web`
- Clerk JWT template "convex" (issuer `https://grown-thrush-53.clerk.accounts.dev`) validates sessions in Convex
- Google-only sign-in for MVP (Clerk shared credentials, no email+password)

## Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all apps in dev mode
pnpm dev --filter web     # Run just the marketing site
pnpm dev --filter portal  # Run just the portal
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm typecheck        # Type-check all packages

# Convex
cd packages/convex && npx convex dev   # Start Convex dev
cd packages/convex && npx convex deploy # Deploy Convex to prod
```

## TypeScript Standards

- **Never use `any`.** It silently disables type checking.
- Use `unknown` for values whose shape is genuinely unknown. Narrow before use.
- Use Convex's exported context types (`QueryCtx`, `MutationCtx`, `ActionCtx` from `./_generated/server`) for handler helpers.
- Auto-generated files under `convex/_generated/` are exempt (codegen overwrites them).

## Compatibility

**No backward compatibility.** This project has no external users yet. When changing data formats, schemas, or serialization, convert fully to the new approach. Remove obsolete fields and dead code immediately.

## Models

Do not use legacy AI models like GPT-4o. Use current models from major labs.

## Verification

For comprehensive edits, always finish with a numbered manual test checklist covering changed behaviors end-to-end.

## Subdomains

| URL | App | Purpose |
|---|---|---|
| `laundryiq.app` | `apps/web` | Marketing, SEO |
| `portal.laundryiq.app` | `apps/portal` | End-user machine status |
| `dashboard.laundryiq.app` | `apps/dashboard` | Operator admin |
| `api.laundryiq.app` | `packages/convex` | Device REST API |
| `shop.laundryiq.app` | `apps/shop` | E-commerce |

## Design Reference

### UI Pages Summary

All web surfaces follow these design constraints:
- Dark mode only (MVP). Background `#0b1120`, surface `#131c2e`, primary `#0DA6E7 → #06CBD5` gradient
- Status indicators always use icon + color + text (colorblind accessible)
- Machine display states: `off` / `idle` / `running` (firmware) + `complete` / `offline` (UI-derived)

| Surface | URL | Pages |
|---|---|---|
| Marketing | laundryiq.app | Home, Features, Products, Product detail, About, Privacy, Terms, 404 |
| Shop | shop.laundryiq.app | Product listing, Product detail, Cart |
| Portal | portal.laundryiq.app | Auth (login/signup/forgot/reset), Places list, Place detail, Machine modal, Invite, Settings, 404 |
| Dashboard | dashboard.laundryiq.app | Auth, Places, Place overview, Machine grid/detail, Devices, Add device wizard, Users, Place settings, Account settings, 404 |
| Captive portal | 192.168.4.1 | WiFi setup (single page, embedded HTML) |

### API Reference

Device REST API endpoints are documented in `api/requests.http`. Use VS Code REST Client extension (no account required) to send requests.
