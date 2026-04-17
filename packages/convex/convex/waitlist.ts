// ════════════════════════════════════════════════════════════════════════════
// ▼▼▼ WAITLIST GATE — TEMPORARY (Spring 2026, pre-launch) ▼▼▼
// This entire file is part of the temporary "coming soon" gate. When the
// product goes live to anyone, delete:
//   - This file
//   - The two waitlist* tables in convex/schema.ts
//   - The <WaitlistGate> wrappers and helpers in apps/portal + apps/dashboard
//   - The <WaitlistPopup> in apps/web (marketing site)
//   - WAITLIST.md at the repo root
// See WAITLIST.md for the full removal checklist.
// ════════════════════════════════════════════════════════════════════════════

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ────────────────────────────────────────────────────────────────────────────
// HARDCODED bypass secret. Lives server-side, never sent to the client.
// Rotate or remove when the gate is taken down.
// ────────────────────────────────────────────────────────────────────────────
const BYPASS_SECRET = "liqliqliq";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function normaliseEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  // Conservative validation: anything@anything.tld (we are not doing real validation here)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  if (trimmed.length > 320) return null;
  return trimmed;
}

function randomToken(): string {
  // 24 chars from a URL-safe alphabet, generated server-side. Convex runtime
  // exposes globalThis.crypto on Node-compatible runtimes.
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  // base64url
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Public mutation: join the waitlist ─────────────────────────────────────
export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    source: v.union(
      v.literal("marketing-popup"),
      v.literal("portal-gate"),
      v.literal("dashboard-gate"),
    ),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    duplicate: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = normaliseEmail(args.email);
    if (!email) {
      return { ok: false, duplicate: false, reason: "invalid_email" as const };
    }

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { ok: true, duplicate: true };
    }

    await ctx.db.insert("waitlist", {
      email,
      source: args.source,
      userAgent: args.userAgent,
      referrer: args.referrer,
      createdAt: Date.now(),
    });

    return { ok: true, duplicate: false };
  },
});

// ─── Public mutation: redeem the bypass secret to get a session token ───────
//
// The frontend calls this with the secret string the user typed. If it matches
// the server-side BYPASS_SECRET, we issue a fresh token, persist it, and
// return it. The client stores the token in localStorage and presents it on
// subsequent loads.
export const redeemBypass = mutation({
  args: { secret: v.string() },
  returns: v.object({
    ok: v.boolean(),
    token: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    if (args.secret !== BYPASS_SECRET) {
      return { ok: false };
    }
    const now = Date.now();
    const token = randomToken();
    await ctx.db.insert("waitlistBypassTokens", {
      token,
      issuedAt: now,
      expiresAt: now + TOKEN_TTL_MS,
    });
    return { ok: true, token, expiresAt: now + TOKEN_TTL_MS };
  },
});

// ─── Public query: is this token currently valid? ───────────────────────────
//
// Cheap, indexed lookup. The client uses this on each page load. If invalid
// or expired, the gate is shown.
export const isBypassValid = query({
  args: { token: v.optional(v.string()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.token) return false;
    const row = await ctx.db
      .query("waitlistBypassTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .unique();
    if (!row) return false;
    if (row.expiresAt < Date.now()) return false;
    return true;
  },
});
