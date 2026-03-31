# LaundryIQ Website — Task List

> **Purpose**: Coding-agent-ready task list for completing the LaundryIQ web platform.
> **Order**: Urgency-first. Tasks at the top are either broken right now or block every task beneath them.
> **Last Updated**: March 31, 2026
>
> **Repo context**: Read `AGENTS.md` at root before touching any file. Read relevant `.cursor/skills/` before editing UI, layouts, fonts, or Convex code.
>
> **Monorepo layout**:
> - `apps/web` — Next.js 15 marketing site (laundryiq.app)
> - `apps/portal` — Vite + React portal (portal.laundryiq.app)
> - `apps/dashboard` — Vite + React dashboard (dashboard.laundryiq.app)
> - `packages/convex` — Shared Convex schema + functions + HTTP actions
> - `packages/ui` — Shared components (`components.tsx`) + design tokens (`tokens.css`)
> - `packages/utils` — Shared pure utilities (state derivation, formatting)

---

## TIER 1 — BREAKING BUGS (Fix before anything else)

These are defects in already-written code that silently produce wrong behavior. Nothing downstream can be tested reliably until these are fixed.

---

### T1-1 · `recordState` never writes `previousState` — "Done/Complete" state is permanently broken

**File**: `packages/convex/convex/deviceApi.ts` → `recordState` internal mutation  
**Symptom**: Machines can never show "Complete / Done" state in the portal or dashboard. `deriveDisplayState` (in `packages/utils`) derives `"complete"` by checking `previousState === "running"` when the new state is `idle`/`off`. Since `previousState` is never written to the DB, it is always `undefined`, so the complete state never fires — even after a full wash cycle finishes.

**Fix**: In the `recordState` handler, add `previousState` to the `ctx.db.patch` call:

```typescript
// Before patching, previousState should capture the old state when state changes
await ctx.db.patch(machine._id, {
  previousState: machine.state !== args.state ? machine.state : machine.previousState,
  state: args.state,
  lastHeartbeatAt: args.now,
  lastStateChangeAt: machine.state === args.state ? machine.lastStateChangeAt : args.now,
  updatedAt: args.now,
});
```

Also update `cycleStartedAt` when transitioning into `running`:
```typescript
cycleStartedAt: args.state === "running" && machine.state !== "running" ? args.now : machine.cycleStartedAt,
```

**Verification**: After fix, deploy Convex dev. POST `state: "running"` then `state: "idle"` for a test device. Portal machine modal should show "Done" with a blue badge within 5 minutes.

---

### T1-2 · Heartbeat response body doesn't match the firmware API contract

**File**: `packages/convex/convex/http.ts` → `/api/v1/device/heartbeat` handler  
**Symptom**: Returns `{ status: "ok" }`. The canonical contract in `api/requests.http` and `docs/software/api-endpoints.md` specifies `{ success: true }`. Firmware checking for exact field names will get `undefined` instead of `true`.

**Fix**: Change the heartbeat response:
```typescript
return json(200, { success: true });
```

---

### T1-3 · New machines show as "Offline" immediately after creation

**File**: `packages/convex/convex/machines.ts` → `create` mutation  
**Symptom**: When a machine is created (before a device is ever linked), `lastHeartbeatAt` is initialized to `Date.now()`. Within 10 minutes, `deriveDisplayState` marks it offline because no heartbeat has come in. The machine should show "Off" (no device), not "Offline" (device lost connection).

**Fix**: The `listForPlace` and `getById` queries should skip offline detection when no device is linked (`machine.deviceId` is null/undefined). Pass a flag or check `deviceId` before applying the 10-minute threshold in the query response. Simplest approach: when there is no `deviceId`, always return `state: "off"` directly rather than running `deriveDisplayState`. Update the queries in `machines.ts` to return a `hasDevice: boolean` field so the frontend can conditionally run `deriveDisplayState`.

---

## TIER 2 — INFRASTRUCTURE (Needed before real devices can connect)

---

### T2-1 · Configure `api.laundryiq.app` CNAME (DNS + Convex custom domain)

**Blocker for**: All firmware development with a real domain  
**What's needed**:
1. In Convex Dashboard → Settings → Custom Domains: add `api.laundryiq.app`
2. In your DNS provider: add a CNAME record pointing `api.laundryiq.app` → the Convex deployment URL (`reminiscent-lark-716.convex.cloud`)
3. Wait for propagation (~5 min on Cloudflare, up to 48h elsewhere)

**Dev workaround**: Firmware can use `https://reminiscent-lark-716.convex.cloud` directly for testing. Document this in `api/requests.http`.

---

### T2-2 · Deploy Convex schema to production deployment

**File**: `packages/convex/`  
**What's needed**: Run `npx convex deploy` from `packages/convex/` to push the full schema and all functions to the production Convex deployment. Currently only the dev deployment has been configured. Vercel production builds need the production Convex URL.

Ensure all apps' production environment variables in Vercel point to the production Convex deployment URL (not the dev one).

---

### T2-3 · Add Convex cron jobs for data cleanup

**File**: Create `packages/convex/convex/crons.ts`  
**What's needed**: Three cleanup jobs. Read the Convex SKILL before implementing.

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 3am UTC: delete expired pending invites (> 7 days old)
crons.daily("cleanup expired invites", { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.expiredInvites
);

// Daily at 3am UTC: delete expired pending device claims (> 30 days old)
crons.daily("cleanup expired claims", { hourUTC: 3, minuteUTC: 5 },
  internal.cleanup.expiredClaims
);

export default crons;
```

Create `packages/convex/convex/cleanup.ts` with corresponding `internalMutation` handlers that delete records where `expiresAt < Date.now()`.

---

## TIER 3 — PORTAL CORE GAPS

The portal is the PRIMARY user-facing app. These gaps directly affect the experience for every end user.

---

### T3-1 · Add `/p/:placeId/m/:machineId` route to Portal (QR code deep links are broken)

**File**: `apps/portal/src/App.tsx`  
**Symptom**: QR codes printed on individual machines link to `portal.laundryiq.app/p/{placeId}/m/{machineId}`. This URL currently returns a 404 because no route exists for it in the portal router. The machine detail is only accessible as a modal opened from the grid.

**Fix**: Add a route that renders `PlaceDetailPage` with `selectedMachine` pre-set to `machineId` from the URL param. Best approach: add the route and auto-open the modal. When the machine modal is closed, navigate back to `/p/:placeId`.

```tsx
<Route
  element={<RequireAuth><PlaceDetailPage /></RequireAuth>}
  path="/p/:placeId/m/:machineId"
/>
```

In `PlaceDetailPage`, read `useParams` for `machineId` and initialize `selectedMachine` to that value if present.

---

### T3-2 · Portal invite OAuth redirect loses token after Google sign-in

**File**: `apps/portal/src/App.tsx` → `InvitePage` and `SignInPage`  
**Symptom**: When an unauthenticated user hits `/invite/:token`, the app redirects them to `/signin?redirect=/invite/TOKEN`. But the Clerk OAuth redirect flow ignores the `redirect` query param and always lands on `/p` (hard-coded in `authenticateWithRedirect` as `redirectUrlComplete: "/p"`).

**Fix**: Read the `redirect` query param in `SignInPage` and pass it as `redirectUrlComplete`:
```typescript
const searchParams = new URLSearchParams(window.location.search);
const redirectTo = searchParams.get("redirect") ?? "/p";

await signIn.authenticateWithRedirect({
  strategy: "oauth_google",
  redirectUrl: `${window.location.origin}/sso-callback`,
  redirectUrlComplete: redirectTo,
});
```

---

### T3-3 · Allow unauthenticated (public) viewing of machine status in Portal

**File**: `apps/portal/src/App.tsx` and `packages/convex/convex/machines.ts`  
**Spec**: `docs/architecture/site-structure.md` — "View machine status: ✓ (with link)" for users with no account. Students scanning a QR code should see machine statuses without being forced to create an account.

**What to change**:

1. **Portal router**: Remove `RequireAuth` wrapper from `PlaceDetailPage`:
   ```tsx
   <Route element={<PlaceDetailPage />} path="/p/:placeId" />
   <Route element={<PlaceDetailPage />} path="/p/:placeId/m/:machineId" />
   ```
   Keep `RequireAuth` only on `/p` (places list) and `/settings`.

2. **Convex `machines.listForPlace` query**: When `ctx.auth.getUserIdentity()` returns null (unauthenticated), still return machines IF the place exists. Remove the early return for unauthenticated users in `listForPlace`. The place detail page should be public read-only.

3. **Portal `PlaceDetailPage` header**: When user is not signed in, show a "Sign In" link in the header instead of the `UserButton`. The machine modal should show "Sign in to enable notifications" instead of a notification toggle.

4. **Security**: The `getById` place query should still return a place when unauthenticated (to render the header correctly). Membership check can remain for write operations only.

---

### T3-4 · Add push notification toggle to machine modal in Portal

**File**: `apps/portal/src/App.tsx` → `MachineModal` component  
**What's needed**: The UI mockup (`03-portal/machine-modal/README.md`) shows a "🔔 Notify me when done [Toggle: ON/OFF]" control in the machine modal. It is completely absent from the current implementation.

**Implementation plan**:

1. **Convex mutation** `api.pushSubscriptions.subscribe`: Takes `machineId` + Web Push subscription object, inserts into `pushSubscriptions` table.

2. **Convex mutation** `api.pushSubscriptions.unsubscribe`: Removes subscription by `userId + machineId + endpoint`.

3. **Convex query** `api.pushSubscriptions.isSubscribed`: Returns bool for current user + machineId.

4. **Portal UI in MachineModal**: Add a section below the status display (only when `isSignedIn`):
   ```
   ┌──────────────────────────────┐
   │ 🔔 Notify me when done       │
   │ Get an alert when this       │
   │ machine finishes.      [▶]   │
   └──────────────────────────────┘
   ```
   Use the `Toggle` component already in `packages/ui/src/components.tsx`.

5. **Notification delivery** (Convex HTTP action or mutation triggered on state change to `complete`): Send Web Push to all subscribed users for that machine. Requires VAPID keys set as Convex environment variables.

6. **When user not signed in**: Show "Sign in to get notified" link instead of the toggle.

**Note**: Read the `convex-rules` SKILL before implementing Convex side. VAPID key generation: `npx web-push generate-vapid-keys`.

---

## TIER 4 — DASHBOARD CORE GAPS

The dashboard is used by operators to set up and manage devices. These gaps affect device setup workflows.

---

### T4-1 · Add Device wizard step 3 uses a fake 5-second timeout — replace with real-time Convex subscription

**File**: `apps/dashboard/src/App.tsx` → `AddDevicePage` → `handleStep3` function  
**Symptom**: After creating the pending claim, the wizard uses `setTimeout(() => setStep("success"), 5000)`. This always shows success after 5 seconds regardless of whether the device actually connected. If the device takes longer (or never connects), the admin gets a false "Device connected!" message.

**Fix**: Replace the `setTimeout` with a `useQuery` that watches the pending claim:

```typescript
// After claim is created, poll for the claim being consumed (device connected)
const pendingClaim = useQuery(
  api.devices.getPendingClaimByDeviceId,
  step === 3 ? { deviceId: cleanDeviceId } : "skip"
);

// When pendingClaim becomes null, the device has claimed and the claim was deleted
useEffect(() => {
  if (step === 3 && pendingClaim === null) {
    setStep("success");
  }
}, [step, pendingClaim]);
```

Add a timeout after 5 minutes of waiting to transition to `"timeout"` state. Add the `getPendingClaimByDeviceId` public query to `packages/convex/convex/devices.ts` (membership-gated).

---

### T4-2 · Machine detail history graph and cycle list (Dashboard)

**File**: `apps/dashboard/src/App.tsx` → `MachineDetailPage`  
**Symptom**: The dashboard machine detail page shows "—" for cycles and has no history graph. The mockup specifies `[1h] [6h] [24h] [7d]` time range buttons + a usage graph + a recent cycles list.

**Implementation plan**:

1. **Add `cycles` table to Convex schema** (`packages/convex/convex/schema.ts`):
   ```typescript
   cycles: defineTable({
     machineId: v.id("machines"),
     placeId: v.id("places"),
     startedAt: v.number(),
     endedAt: v.number(),
     durationMs: v.number(),
   })
     .index("by_machine", ["machineId"])
     .index("by_place_and_started", ["placeId", "startedAt"]),
   ```

2. **Record cycles in `recordState`** (`packages/convex/convex/deviceApi.ts`): When state transitions from `running` → `idle`/`off`, insert a cycle record with `startedAt: machine.cycleStartedAt`, `endedAt: now`, `durationMs: now - machine.cycleStartedAt`.

3. **Add Convex query** `api.cycles.listForMachine`: Returns last N cycles for a machine, gated by membership.

4. **Dashboard UI**: In `MachineDetailPage`, add:
   - Cycles today counter (count where `startedAt > startOfToday`)
   - Time range selector tabs (`[1h] [6h] [24h] [7d]`)
   - Simple bar/line chart showing running periods over the selected range (use plain SVG or a lightweight chart lib — read the `frontend-design` SKILL first)
   - Recent cycles list: "Today 2:30 PM · 45 min"

5. **Overview page**: Update "Cycles Today" stat from "—" to a real Convex query result.

---

### T4-3 · Machine edit form: add group assignment and machine removal

**File**: `apps/dashboard/src/App.tsx` → `MachineDetailPage`  
**Symptom**: The machine settings form in the detail page only lets you edit the name. You cannot assign a group or remove the machine.

**Fix**:
1. Add a `GroupId` select dropdown to the machine edit form that lists all groups in the place. Wire to `api.machines.update` (already accepts `groupId` and `clearGroup`).
2. Add a "Remove Machine" button in the danger zone section. Wire to `api.machines.remove` (already implemented in Convex). Only show for admins/owners. Add confirmation prompt (type machine name to confirm).

---

### T4-4 · Machines page: add table view toggle and status/group filters

**File**: `apps/dashboard/src/App.tsx` → `MachinesPage`  
**Spec**: UI mockup `04-dashboard/README.md` — "Toggle: Grid view / Table view · Filters: Group, Status, Type"

**Fix**:
1. Add a view toggle button (grid icon / list icon) that switches between the current card grid and a table layout.
2. Table columns: Name | Type | Group | Status | Device | Actions ("View Details" link).
3. Add filter row: Group dropdown (from `api.groups.listForPlace`), Status dropdown (All / Available / Running / Done / Offline), Type dropdown (All / Washer / Dryer).
4. Filters apply client-side — no Convex changes needed.

---

### T4-5 · Devices page: fix "Latest Firmware" showing "0.0.0" when no devices have reported

**File**: `apps/dashboard/src/App.tsx` → `DevicesPage`  
**Symptom**: `latestVersion` is computed with `.reduce((v, d) => ...)` starting at `"0.0.0"`. When no devices have reported a firmware version yet, the stat card shows "Latest Firmware: 0.0.0".

**Fix**: Change the default to `"—"` and only compute the max version when devices array is non-empty and at least one device has a non-null `firmwareVersion`.

---

### T4-6 · Add Account Settings link to Dashboard header

**File**: `apps/dashboard/src/App.tsx` → `DashHeader` component  
**Symptom**: There is no way to navigate to `/settings` from within the dashboard UI. The `UserButton` from Clerk shows a dropdown but doesn't link to the in-app account settings page.

**Fix**: Add a settings gear icon link to `/settings` in the `DashHeader`, displayed between the title and the `UserButton`.

---

## TIER 5 — MARKETING SITE GAPS

The competition judges and any prospective users will land on `laundryiq.app` first. These gaps leave the site incomplete.

---

### T5-1 · Hero "Get Started" CTA links to shop — must link to portal

**File**: `apps/web/app/page.tsx` — hero section  
**Spec**: `AGENTS.md` — "All marketing site CTAs (nav Sign In, hero Get Started, etc.) link to **portal**."  
**Symptom**: Both hero CTA buttons link to `SHOP_URL` (external Shopify). The primary hero CTA "Get Started" and the final section CTA "Get Your LaundryIQ" should link to `${PORTAL_URL}/signin` (or just `PORTAL_URL` if the portal shows a landing before auth).

**Fix**: In `apps/web/app/page.tsx`:
- Change hero primary CTA `href={SHOP_URL}` → `href={`${PORTAL_URL}/signin`}`
- Change final section CTA `href={SHOP_URL}` → `href={`${PORTAL_URL}/signin`}`
- Keep the Shop link in the nav as-is (that is correct)

Import `PORTAL_URL` from `../lib/urls`.

---

### T5-2 · Do not add `/pricing` — pricing now lives in `/products`

**Status note**: This task supersedes the older pricing-page plan. The newer marketing spec moved pricing into the Products flow, so there should be **no standalone `/pricing` route**.

**What to verify / keep aligned**:
- `apps/web/components/MarketingNav.tsx` keeps `Features`, `Products`, `About`, `Shop` (no `Pricing` link)
- `apps/web/app/products/page.tsx` includes price visibility and bulk/B2B messaging
- `apps/web/app/products/smart-plug/page.tsx` carries the current Smart Plug pricing and Shopify buy CTA
- Footer internal links stay on existing routes only (`/features`, `/products`, `/about`, `/privacy`, `/terms`)

If pricing content needs expansion, add it to the Products listing or Smart Plug detail page rather than creating a new top-level route.

---

### T5-3 · Add custom web fonts to replace system-ui fallbacks

**Files**: `packages/ui/src/tokens.css` and `apps/web/app/globals.css`  
**Symptom**: `--font-heading` and `--font-body` are both set to `system-ui, -apple-system, 'Segoe UI', sans-serif`. The design calls for a distinctive heading font.

**Action**: Read the `web-font-loading` SKILL at `.cursor/skills/web-font-loading/SKILL.md` **before touching any font code**. The skill contains exact implementation patterns for loading Google Fonts correctly (no FOUT, no layout shift).

**Recommendation**: Use a font pair such as:
- Heading: `Plus Jakarta Sans` or `DM Sans` (modern, clean, startup feel)
- Body: Can stay as system-ui (performance) or use the same as heading

Load via `<link rel="preconnect">` + `<link rel="stylesheet">` in:
- `apps/web/app/layout.tsx` (Next.js — use `next/font/google` for zero-config optimization)
- `apps/portal/index.html` and `apps/dashboard/index.html` (Vite apps — use `<link>` tags with `font-display: swap`)

Update `--font-heading` in both `packages/ui/src/tokens.css` and `apps/web/app/globals.css` to use the chosen font name.

---

## TIER 6 — CONVEX COMPLETENESS

These tasks make the backend production-ready, not just development-functional.

---

### T6-1 · Add OTA firmware seed tooling (so OTA check can actually find updates)

**File**: `packages/convex/convex/` — add an internal mutation and a one-time script  
**Symptom**: The `firmware` table is empty. `getLatestFirmwareForHardware` always returns `null`, so OTA check always returns `updateAvailable: false`. Firmware releases on GitHub will never trigger device updates.

**Fix**:
1. Add an `internal.firmware.upsertRelease` mutation:
   ```typescript
   export const upsertRelease = internalMutation({
     args: {
       version: v.string(),
       hardwareVersion: v.string(),
       downloadUrl: v.string(),
       releaseNotes: v.optional(v.string()),
     },
     handler: async (ctx, args) => {
       // Mark all existing records for this hardware as not latest
       // Insert new record with isLatest: true
     },
   });
   ```
2. Document in `api/requests.http` how to seed a firmware version using the Convex dashboard or a one-off script.
3. When GitHub releases are set up for firmware, the CI pipeline will call this mutation. For now, it can be seeded manually via the Convex dashboard's "Run Function" feature.

---

### T6-2 · `machines.listForPlace` must support unauthenticated reads (needed for T3-3)

**File**: `packages/convex/convex/machines.ts`  
**What's needed**: Currently `listForPlace` returns `[]` when `user` is null (unauthenticated). After implementing T3-3 (public portal viewing), this query must return machines for a place even when not signed in — but only if the place exists.

**Fix**: When `user` is null, skip the membership check and return all machines for the place (read-only, no sensitive data exposed). The machine data (name, type, state, timestamps) is intentionally public information — that's the whole product.

```typescript
if (!user) {
  // Public read: return machines without membership check
  const machines = await ctx.db.query("machines")
    .withIndex("by_place", q => q.eq("placeId", args.placeId))
    .collect();
  // ... join group names, return public fields only
}
```

Similarly update `places.getById` to return place name and slug when unauthenticated (needed to render the portal header).

---

### T6-3 · Add `getPendingClaimByDeviceId` query for Add Device wizard polling (needed for T4-1)

**File**: `packages/convex/convex/devices.ts`  
**What's needed**: A membership-gated query that returns the pending claim for a given `deviceId` within a place. Returns `null` when consumed (device connected). Used in T4-1.

```typescript
export const getPendingClaimByDeviceId = query({
  args: { placeId: v.id("places"), deviceId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;
    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return null;
    return await ctx.db
      .query("pendingClaims")
      .withIndex("by_device_id", q => q.eq("deviceId", args.deviceId))
      .filter(q => q.eq(q.field("placeId"), args.placeId))
      .first();
  },
});
```

---

### T6-4 · Add push subscription Convex functions (needed for T3-4)

**File**: `packages/convex/convex/` — create `pushSubscriptions.ts`  
**What's needed**: Read the `convex-rules` SKILL first.

```typescript
// subscribe: upsert a Web Push subscription for a machine
export const subscribe = mutation({ ... });

// unsubscribe: delete by userId + machineId + endpoint
export const unsubscribe = mutation({ ... });

// isSubscribed: query returning bool for current user + machineId
export const isSubscribed = query({ ... });

// Internal: send push notification to all subscribers of a machine
export const notifySubscribers = internalAction({ ... });
```

`notifySubscribers` is called from `deviceApi.recordState` when state changes to indicate a cycle just completed. Requires VAPID keys stored as Convex environment variables (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).

---

### T6-5 · Rate limiting on device HTTP endpoints

**File**: `packages/convex/convex/http.ts`  
**Spec**: `docs/software/api-endpoints.md` — "Rate limited: 5 requests/min per device, 10 claim attempts/min per IP"  
**What's needed**: Install `@convex-dev/rate-limiter`:
```bash
cd packages/convex && npx convex component add @convex-dev/rate-limiter
```

Apply rate limiting to:
- `/device/claim` — 10 attempts/min per IP (use `request.headers.get("CF-Connecting-IP")` or `x-forwarded-for`)
- `/device/heartbeat` — 5/min per `X-Device-ID`
- `/device/state` — 5/min per `X-Device-ID`

Read the Convex SKILL and the rate-limiter component docs before implementing.

---

## TIER 7 — CAPTIVE PORTAL

The hardware setup flow depends on this page. Required before any user can actually provision a device.

---

### T7-1 · Build the captive portal WiFi setup page (192.168.4.1)

**Spec**: `LaundryIQ-UI-Mockup/05-captive-portal/wifi-setup/README.md`  
**What it is**: A single self-contained HTML page that the ESP32 SoftAP serves at `192.168.4.1`. When a user connects to the device's WiFi (`LaundryIQ-A1B2C3D4E5F6`), their phone opens this page automatically (captive portal detection).

**This is NOT a Next.js or Vite page** — it must be a standalone `index.html` file embedded in firmware. Create it at `apps/captive-portal/index.html` (or as an embedded C++ string in the firmware repo — coordinate with firmware dev).

**Content**:
- LaundryIQ logo + "Setup" heading
- "Connect to your WiFi" section
- WiFi network dropdown (populated by the ESP32 scanning nearby networks via AJAX)
- Password input (hidden, with show/hide toggle)
- Connect button → POST to `http://192.168.4.1/connect`
- Status: "Connecting…" → "Connected! You can close this page."
- Error state: "Wrong password" / "Network not found"

**Design**: Must match LaundryIQ brand (dark background `#0b1120`, primary blue `#0DA6E7`). Must be a single HTML file with all CSS inline (no external dependencies — device has no internet access during setup). Minimum touch target 44px. Mobile-first.

Read the `frontend-design` and `responsive-design` SKILLs. Design this as if it's the user's first impression of LaundryIQ hardware.

---

## TIER 8 — POLISH & COMPLETENESS

Lower urgency but required before a full production launch or competition demo.

---

### T8-1 · Portal machine modal: "running" state should show elapsed time dynamically

**File**: `apps/portal/src/App.tsx` → `MachineModal`  
**Symptom**: The `statusText` string is computed once on render (e.g. "Running, 12m"). It doesn't update as time passes. A user who leaves the modal open will see a stale elapsed time.

**Fix**: Add a 1-minute `setInterval` that forces a re-render of the modal. Use a `useReducer` or `useState` counter that ticks every 60 seconds. The `machineStatusCopy` call will then produce a fresh string on each tick.

---

### T8-2 · Portal place cards: dynamic emoji icon based on place name or type

**File**: `apps/portal/src/App.tsx` → `PlaceCard` component  
**Symptom**: All place cards show 🏠 regardless of whether it's a university, laundromat, or home. A simple heuristic: if the place name contains "university", "college", "hall", "dorm" → 🏫; if it contains "laundromat" → 🏪; default → 🏠.

---

### T8-3 · Dashboard overview: link "Manage Users →" button correctly

**File**: `apps/dashboard/src/App.tsx` → `PlaceOverviewPage`  
**Symptom**: The "Manage Users →" quick action links to `/p/${placeId}/users` which is correct. No bug — just verify it renders correctly after tab navigation is in place.

---

### T8-4 · Dashboard: add machine count + running count to Place List cards

**File**: `apps/dashboard/src/App.tsx` → `PlaceListPage`  
**Spec**: Dashboard mockup shows: "24 machines • 3 running • 45 cycles today"  
**Symptom**: Currently only shows `machineCount`. Missing running count and cycles today.

**Fix**: Update `api.places.listForCurrentUser` in `packages/convex/convex/places.ts` to also return `runningCount` (count of machines in `running` state) by doing a secondary query per place.

---

### T8-5 · Marketing footer: verify all links are correct

**File**: `apps/web/components/MarketingFooter.tsx`  
**Check**:
- Admin link → `${DASHBOARD_URL}/signin` (should be the footer's only dashboard reference per AGENTS.md)
- Portal link → `${PORTAL_URL}/signin`
- All internal page links (`/features`, `/products`, `/about`, `/privacy`, `/terms`) are correct
- Shop link → `SHOP_URL` (external)
- No hardcoded production domains in code — all via env vars

---

### T8-6 · Portal Settings page: add "Notification preferences" section

**File**: `apps/portal/src/App.tsx` → `SettingsPage`  
**What's needed**: After push notifications are implemented (T3-4), add a "Notification Preferences" section to the portal settings page showing all active machine subscriptions and allowing bulk unsubscribe.

---

### T8-7 · Dashboard: "Cycles Today" stat on Place Overview

**File**: `apps/dashboard/src/App.tsx` → `PlaceOverviewPage`  
**Depends on**: T4-2 (cycles table implementation)  
**Fix**: After the `cycles` table is added, update the overview stats to query `api.cycles.countTodayForPlace` and render the real number instead of "—".

---

## REFERENCE: File Map

| Task | Files to Edit |
|---|---|
| T1-1 | `packages/convex/convex/deviceApi.ts` |
| T1-2 | `packages/convex/convex/http.ts` |
| T1-3 | `packages/convex/convex/machines.ts` |
| T2-1 | Convex Dashboard + DNS provider (external) |
| T2-2 | Convex Dashboard (external) |
| T2-3 | `packages/convex/convex/crons.ts` (new), `packages/convex/convex/cleanup.ts` (new) |
| T3-1 | `apps/portal/src/App.tsx` |
| T3-2 | `apps/portal/src/App.tsx` |
| T3-3 | `apps/portal/src/App.tsx`, `packages/convex/convex/machines.ts`, `packages/convex/convex/places.ts` |
| T3-4 | `apps/portal/src/App.tsx`, `packages/convex/convex/pushSubscriptions.ts` (new) |
| T4-1 | `apps/dashboard/src/App.tsx`, `packages/convex/convex/devices.ts` |
| T4-2 | `apps/dashboard/src/App.tsx`, `packages/convex/convex/schema.ts`, `packages/convex/convex/deviceApi.ts`, `packages/convex/convex/cycles.ts` (new) |
| T4-3 | `apps/dashboard/src/App.tsx` |
| T4-4 | `apps/dashboard/src/App.tsx` |
| T4-5 | `apps/dashboard/src/App.tsx` |
| T4-6 | `apps/dashboard/src/App.tsx` |
| T5-1 | `apps/web/app/page.tsx` |
| T5-2 | `apps/web/app/products/page.tsx`, `apps/web/app/products/smart-plug/page.tsx`, `apps/web/components/MarketingNav.tsx` |
| T5-3 | `packages/ui/src/tokens.css`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/portal/index.html`, `apps/dashboard/index.html` |
| T6-1 | `packages/convex/convex/firmware.ts` (new) |
| T6-2 | `packages/convex/convex/machines.ts`, `packages/convex/convex/places.ts` |
| T6-3 | `packages/convex/convex/devices.ts` |
| T6-4 | `packages/convex/convex/pushSubscriptions.ts` (new) |
| T6-5 | `packages/convex/convex/http.ts` |
| T7-1 | `apps/captive-portal/index.html` (new) |
| T8-1 through T8-7 | See individual task descriptions above |

---

## REFERENCE: Mandatory Skill Reads

Before editing these areas, read the corresponding skill from `.cursor/skills/`:

| Area | Skill File |
|---|---|
| Any web UI page or component | `.cursor/skills/frontend-design/SKILL.md` |
| Any layout, grid, responsive behavior | `.cursor/skills/responsive-design/SKILL.md` |
| Any Convex schema, query, mutation, action, cron | `.cursor/skills/convex-rules/SKILL.md` |
| Any font loading or typography changes | `.cursor/skills/web-font-loading/SKILL.md` |

---

## REFERENCE: Design Tokens

All apps share these CSS variable names. Source of truth is `packages/ui/src/tokens.css`.

| Variable | Value |
|---|---|
| `--bg-page` | `#0b1120` |
| `--bg-surface-1` | `#131c2e` |
| `--bg-surface-2` | `#1a2540` |
| `--border-subtle` | `#1e2d47` |
| `--border-default` | `#2a3d5c` |
| `--primary-400` | `#0DA6E7` |
| `--primary-gradient` | `linear-gradient(135deg, #0DA6E7, #06CBD5)` |
| `--success` | `#34d399` |
| `--warning` | `#fbbf24` |
| `--error` | `#f87171` |
| `--info` | `#0DA6E7` |
| All `-soft` and `-border` variants | Defined in `tokens.css` |

Portal and Dashboard both import `@laundryiq/ui/src/tokens.css` via `main.tsx`.  
Marketing site (`apps/web`) uses its own `app/globals.css` (same variables, same values).

---

## REFERENCE: Cross-App URL Convention

Never hardcode domain names. Use env vars:

| App | Env Var | Fallback |
|---|---|---|
| `apps/web` | `NEXT_PUBLIC_PORTAL_URL` | `https://portal.laundryiq.app` |
| `apps/web` | `NEXT_PUBLIC_DASHBOARD_URL` | `https://dashboard.laundryiq.app` |
| `apps/web` | `NEXT_PUBLIC_SHOP_URL` | `https://shop.laundryiq.app` |
| `apps/portal` | `VITE_PORTAL_URL` | `https://portal.laundryiq.app` |
| `apps/portal` | `VITE_DASHBOARD_URL` | `https://dashboard.laundryiq.app` |
| `apps/dashboard` | `VITE_PORTAL_URL` | `https://portal.laundryiq.app` |
| `apps/dashboard` | `VITE_DASHBOARD_URL` | `https://dashboard.laundryiq.app` |

Local `.env.local` sets these to `http://localhost:5173` (portal) and `http://localhost:5174` (dashboard).

---

## REFERENCE: Auth & Routing Rules

- The only auth path in portal and dashboard is `/signin`. No `/login`, `/signup`, `/forgot-password`.
- Google OAuth only. Clerk handles new + returning users.
- OAuth callback path: `/sso-callback` in both apps.
- After sign-in: redirect to `/p`.
- After sign-out: redirect to `/signin`.
- `ClerkProvider` props `signInUrl="/signin"` and `signUpUrl="/signin"` are already set in both `main.tsx` files.
- All marketing site Sign In links → `${PORTAL_URL}/signin`.
- Only the footer admin link → `${DASHBOARD_URL}/signin`.

---

*This file lives at the repo root of `LaundryIQ-Website`. Update task status by checking items off as they are completed.*
