# Waitlist gate, removal checklist

This file documents the temporary waitlist gate added in **Spring 2026** while the product is finished but not yet ready for general access. **Delete every item below when going live**, then delete this file.

Every piece of code that exists only for the gate is fenced with one of these markers so you can find it with grep:

```
WAITLIST GATE
WAITLIST POPUP
WAITLIST HTTP ENDPOINT
```

`grep -r "WAITLIST" .` will show you every file you need to touch.

## What it does

| Surface | URL | Behaviour |
|---|---|---|
| Marketing site | `laundryiq.app` | Renders normally. A small popup slides in from the bottom-right after about 4 seconds asking for an email. Dismissible, remembered in localStorage. |
| Resident portal | `portal.laundryiq.app` | Whole app is wrapped in `<WaitlistGate>`. Anyone without a server-issued bypass token sees a coming-soon page with an email signup. |
| Operator dashboard | `dashboard.laundryiq.app` | Same as the portal. |
| Shop | `shop.laundryiq.app` | **Not changed by code in this repo.** Shopify theme lives in a submodule. See "Shop" section below. |

## Bypass

There is a tiny invisible button at the bottom-left corner of the gate page (positioned at `left: 6px; bottom: 6px; width: 14px; height: 14px; opacity: 0`). Click that pixel, type the secret string into the prompt, and the server hands back a 30-day token that gets stored in localStorage as `liq.waitlist.bypassToken`. Subsequent loads recognise the token via `api.waitlist.isBypassValid` and skip the gate.

The bypass secret is hard-coded server-side in `packages/convex/convex/waitlist.ts` (constant `BYPASS_SECRET`). Rotate or remove when going live.

## Files to delete (full list)

Backend (Convex):

- `packages/convex/convex/waitlist.ts` — entire file
- `packages/convex/convex/schema.ts` — the `waitlist` and `waitlistBypassTokens` table definitions, plus the surrounding comment block
- `packages/convex/convex/http.ts` — the `WAITLIST HTTP ENDPOINT` block at the bottom of the file (just before `export default http;`). Also revert the `import { api, internal }` line back to `import { internal }` if `api` ends up unused after removal.

Marketing site (Next.js):

- `apps/web/components/WaitlistPopup.tsx` — entire file
- `apps/web/app/page.tsx` — the `WAITLIST POPUP` import line near the top, and the `<WaitlistPopup />` render right above the global `<style>` tag at the bottom

Resident portal (Vite + React):

- `apps/portal/src/waitlist/` — entire folder
- `apps/portal/src/App.tsx` — the `WAITLIST GATE` import line near the top, and the `<WaitlistGate>` wrapper around `<BrowserRouter>` (keep the children, drop the wrapper)

Operator dashboard (Vite + React):

- `apps/dashboard/src/waitlist/` — entire folder
- `apps/dashboard/src/App.tsx` — same two changes as the portal

Repo root:

- `WAITLIST.md` — this file

## Database cleanup

After the schema entries are removed and the next `npx convex dev` push happens, the `waitlist` and `waitlistBypassTokens` tables in your Convex deployment will become orphaned. Either:

1. Export the waitlist table to CSV first if you want to keep the email signups for a real launch announcement.
2. Then delete the orphaned tables from the Convex dashboard.

## Shop

`shop.laundryiq.app` is served by Shopify from the `apps/shop` git submodule (`LaundryIQ/laundryiq-shop`). Code in this repo does not gate that subdomain. To gate the shop temporarily, do one of:

- Set the Shopify storefront to "password protected" from the Shopify admin (Settings, Preferences) and put the same coming-soon copy in there.
- OR change the Vercel/DNS for `shop.laundryiq.app` to redirect to `laundryiq.app` until the shop is ready.

Either change is reversible from outside this repo.
