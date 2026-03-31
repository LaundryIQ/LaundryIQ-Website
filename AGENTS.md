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

## Repo Skills

Always inspect `.cursor/skills/` before starting substantial work in this repo and read every relevant `SKILL.md` before editing files.

Current repo-local skills:
- `.cursor/skills/frontend-design/SKILL.md` — use for any web UI or page implementation
- `.cursor/skills/responsive-design/SKILL.md` — use for all layout and component work
- `.cursor/skills/convex-rules/SKILL.md` — use for any Convex schema, function, or HTTP action work
- `.cursor/skills/web-font-loading/SKILL.md` — use before changing typography or introducing custom fonts

If a task touches one of these areas, reading the relevant skill is required, not optional.

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

## Branch Policy

- Default Git branch is `dev` for day-to-day work and commits.
- Production deployments must use `main`.
- Vercel projects for this repo are Git-connected to `LaundryIQ/LaundryIQ-Website` and should treat `main` as the production branch.
- Keep `main` fast-forwardable from `dev`; do not let production-only hotfixes drift without syncing back.

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

## Environment

Each app keeps a committed `.env.example` next to its real env (copy to `.env.local` for web/Vite/Convex; `api/` uses `.env`). Never commit `.env.local` or `api/.env`.

| Location | Copy to |
|---|---|
| `apps/web/.env.example` | `apps/web/.env.local` |
| `apps/portal/.env.example` | `apps/portal/.env.local` |
| `apps/dashboard/.env.example` | `apps/dashboard/.env.local` |
| `packages/convex/.env.example` | `packages/convex/.env.local` |
| `api/.env.example` | `api/.env` |

### Env File Parity

- Keep each `.env.example` in the same variable order and grouping as the corresponding real local env file.
- Show the expected value shape in `.env.example` so someone copying it can tell which kind of key or URL belongs in each slot.
- Never hardcode backend URLs, publishable keys, secret keys, or deployment-specific config in application bootstrap code as a fallback. If config is required, read it from env and fail clearly.
- If env requirements change, update both the real local env file format and the example file format together.

## TypeScript Standards

- **Never use `any`.** It silently disables type checking.
- Use `unknown` for values whose shape is genuinely unknown. Narrow before use.
- Use Convex's exported context types (`QueryCtx`, `MutationCtx`, `ActionCtx` from `./_generated/server`) for handler helpers.
- Auto-generated files under `convex/_generated/` are exempt (codegen overwrites them).

## Compatibility

**No backward compatibility. Ever.** Break things cleanly rather than adding shims, redirects, or legacy paths. This project has no external users. When changing routes, schemas, databases, APIs, or any interface: convert fully, delete the old code, and do not leave redirect stubs or deprecated aliases. Clean code over soft migrations, every time.

## Auth Route Convention

The one and only auth path is `/signin` across all apps (portal, dashboard). There is no `/login`, `/signup`, `/forgot-password`, or `/reset-password`. Google OAuth via Clerk handles both new and returning users. The callback route is `/sso-callback`. Do not add alternative auth routes.

## Models

Do not use legacy AI models like GPT-4o. Use current models from major labs.

## Verification

For comprehensive edits, always finish with a numbered manual test checklist covering changed behaviors end-to-end.

## Ask Questions

- Use the question tool early when a decision, credential, hosted setting, or external action is needed.
- Prefer asking a precise unblock question over guessing or implementing a speculative workaround.
- If there are multiple valid approaches with meaningful tradeoffs, ask before locking one in.

## Unblocks

- Do not stop a task halfway without first trying to unblock it through the available tools and, when needed, asking the user a precise question.
- If a task is truly blocked by an external UI, missing access, DNS propagation, or another non-code dependency, explain exactly what is already done, what remains, and the smallest next action needed from the user.
- Never leave behind bodged code to hide a real configuration or hosting problem.

## App Roles

**Portal** (`portal.laundryiq.app`) is the PRIMARY user-facing app. 99% of users are residents checking machine status. It is mobile-first, consumer-friendly, and has ZERO admin controls. Users join places via invite link only — they cannot create places.

**Dashboard** (`dashboard.laundryiq.app`) is the SECONDARY admin app. Operators/building managers use it to manage machines, devices, users, and place settings. It is data-dense and professional.

All marketing site CTAs (nav Sign In, hero Get Started, etc.) link to **portal**. Only the small admin link in the footer links to **dashboard**.

## Subdomains

| URL | App | Purpose |
|---|---|---|
| `laundryiq.app` | `apps/web` | Marketing, SEO |
| `portal.laundryiq.app` | `apps/portal` | **PRIMARY** — resident machine status checker |
| `dashboard.laundryiq.app` | `apps/dashboard` | **SECONDARY** — operator admin panel |
| `api.laundryiq.app` | `packages/convex` | Device REST API |
| `shop.laundryiq.app` | `apps/shop` | E-commerce |

## Cross-App URLs

All apps use env vars for cross-app URLs — never hardcode production domains in code:
- `apps/web`: `NEXT_PUBLIC_PORTAL_URL`, `NEXT_PUBLIC_DASHBOARD_URL`
- `apps/portal`: `VITE_PORTAL_URL`, `VITE_DASHBOARD_URL`
- `apps/dashboard`: `VITE_PORTAL_URL`, `VITE_DASHBOARD_URL`

Defaults fall back to production domains. Local dev `.env.local` sets `localhost:5173` (portal) and `localhost:5174` (dashboard).

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
| Portal | portal.laundryiq.app | Auth (/signin — Google only), Places list, Place detail, Machine modal, Invite, Settings, 404 |
| Dashboard | dashboard.laundryiq.app | Auth (/signin — Google only), Places, Place overview, Machine grid/detail, Devices, Add device wizard, Users, Place settings, Account settings, 404 |
| Captive portal | 192.168.4.1 | WiFi setup (single page, embedded HTML) |

### API Reference

Device REST API endpoints are documented in `api/requests.http`. Use VS Code REST Client extension (no account required) to send requests.
