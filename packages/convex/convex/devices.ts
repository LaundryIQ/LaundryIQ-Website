/**
 * LaundryIQ — Devices (app-facing queries)
 *
 * Device management from the dashboard. Writing (linking, unlinking, API key
 * management) happens through pending claims and the device HTTP API in http.ts.
 */
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

async function getMembership(ctx: QueryCtx | MutationCtx, userId: Id<"users">, placeId: Id<"places">) {
  return await ctx.db
    .query("userMemberships")
    .withIndex("by_user_and_place", (q) => q.eq("userId", userId).eq("placeId", placeId))
    .unique();
}

async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  placeId: Id<"places">,
  minimumRole: "viewer" | "admin" | "owner",
) {
  const membership = await getMembership(ctx, userId, placeId);
  if (!membership) throw new ConvexError("Not found.");
  const roleOrder = { viewer: 0, admin: 1, owner: 2 };
  if (roleOrder[membership.role] < roleOrder[minimumRole]) throw new ConvexError("Not found.");
  return membership;
}

const OFFLINE_THRESHOLD_MS = 10 * 60_000;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return [];

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    const pendingClaims = await ctx.db
      .query("pendingClaims")
      .collect();
    const placeClaimDeviceIds = new Set(
      pendingClaims.filter((c) => c.placeId === args.placeId).map((c) => c.deviceId),
    );

    const now = Date.now();

    return await Promise.all(
      devices.map(async (device) => {
        const machine = device.machineId ? await ctx.db.get(device.machineId) : null;
        const online =
          device.lastSeenAt !== undefined &&
          now - device.lastSeenAt < OFFLINE_THRESHOLD_MS;

        return {
          id: device._id,
          deviceId: device.deviceId,
          machineId: device.machineId ?? null,
          machineName: machine?.name ?? null,
          firmwareVersion: device.firmwareVersion ?? null,
          hardwareVersion: device.hardwareVersion,
          lastSeenAt: device.lastSeenAt ?? null,
          online,
          claimStatus: online ? "claimed" : "offline",
        };
      }),
    );
  },
});

/** List pending claims (device IDs entered by admin but device not yet connected). */
export const listPendingClaimsForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return [];

    const now = Date.now();
    const claims = await ctx.db
      .query("pendingClaims")
      .collect();

    return await Promise.all(
      claims
        .filter((c) => c.placeId === args.placeId && c.expiresAt > now)
        .map(async (c) => {
          const machine = await ctx.db.get(c.machineId);
          return {
            id: c._id,
            deviceId: c.deviceId,
            machineId: c.machineId,
            machineName: machine?.name ?? null,
            type: c.type,
            expiresAt: c.expiresAt,
          };
        }),
    );
  },
});

export const getPendingClaimByDeviceId = query({
  args: {
    placeId: v.id("places"),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return null;

    const claims = await ctx.db
      .query("pendingClaims")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    const now = Date.now();
    return claims.find((claim) => claim.placeId === args.placeId && claim.expiresAt > now) ?? null;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60_000;

/** Create a pending claim (Step 1 + 2 of the Add Device wizard). */
export const createPendingClaim = mutation({
  args: {
    placeId: v.id("places"),
    machineId: v.id("machines"),
    deviceId: v.string(),   // 12 uppercase hex chars
    type: v.union(v.literal("washer"), v.literal("dryer")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    await requireMembership(ctx, user._id, args.placeId, "admin");

    // Validate device ID format: 12 uppercase hex characters
    if (!/^[0-9A-F]{12}$/.test(args.deviceId)) {
      throw new ConvexError("Invalid device ID format. Must be 12 uppercase hex characters.");
    }

    // Check if device is already claimed by anyone
    const existingDevice = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .unique();

    if (existingDevice?.placeId) {
      throw new ConvexError("device_already_claimed");
    }

    const now = Date.now();

    // Remove any previous pending claim for this device
    const oldClaims = await ctx.db
      .query("pendingClaims")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .collect();
    for (const old of oldClaims) {
      await ctx.db.delete(old._id);
    }

    await ctx.db.insert("pendingClaims", {
      deviceId: args.deviceId,
      placeId: args.placeId,
      machineId: args.machineId,
      type: args.type,
      createdAt: now,
      expiresAt: now + THIRTY_DAYS_MS,
    });
  },
});

/** Revoke a pending claim (cancel before device connects). */
export const cancelPendingClaim = mutation({
  args: { claimId: v.id("pendingClaims") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new ConvexError("Claim not found.");

    await requireMembership(ctx, user._id, claim.placeId, "admin");

    await ctx.db.delete(args.claimId);
  },
});
