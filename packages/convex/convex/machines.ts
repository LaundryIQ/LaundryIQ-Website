/**
 * LaundryIQ — Machines
 *
 * Machines are logical entities within a place. They are linked to a physical
 * Device after provisioning. All state (off/idle/running) comes from the device
 * via HTTP actions.
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
  minimumRole: "viewer" | "admin" | "owner" = "viewer",
) {
  const membership = await getMembership(ctx, userId, placeId);
  if (!membership) throw new ConvexError("Not found.");
  const roleOrder = { viewer: 0, admin: 1, owner: 2 };
  if (roleOrder[membership.role] < roleOrder[minimumRole]) throw new ConvexError("Not found.");
  return membership;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return [];

    const machines = await ctx.db
      .query("machines")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    return await Promise.all(
      machines.map(async (machine) => {
        const group = machine.groupId ? await ctx.db.get(machine.groupId) : null;
        const device = machine.deviceId ? await ctx.db.get(machine.deviceId) : null;
        return {
          ...machine,
          groupName: group?.name ?? null,
          deviceIdHex: device?.deviceId ?? null,
          firmwareVersion: device?.firmwareVersion ?? null,
          deviceOnline: device
            ? (device.lastSeenAt !== undefined && Date.now() - device.lastSeenAt < 10 * 60_000)
            : false,
        };
      }),
    );
  },
});

export const getById = query({
  args: { placeId: v.id("places"), machineId: v.id("machines") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return null;

    const machine = await ctx.db.get(args.machineId);
    if (!machine || machine.placeId !== args.placeId) return null;

    const group = machine.groupId ? await ctx.db.get(machine.groupId) : null;
    const device = machine.deviceId ? await ctx.db.get(machine.deviceId) : null;

    return {
      ...machine,
      groupName: group?.name ?? null,
      deviceIdHex: device?.deviceId ?? null,
      firmwareVersion: device?.firmwareVersion ?? null,
      hardwareVersion: device?.hardwareVersion ?? null,
      lastSeenAt: device?.lastSeenAt ?? null,
      deviceOnline: device
        ? (device.lastSeenAt !== undefined && Date.now() - device.lastSeenAt < 10 * 60_000)
        : false,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    placeId: v.id("places"),
    name: v.string(),
    type: v.union(v.literal("washer"), v.literal("dryer")),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");
    await requireMembership(ctx, user._id, args.placeId, "admin");

    const now = Date.now();
    return await ctx.db.insert("machines", {
      placeId: args.placeId,
      groupId: args.groupId,
      name: args.name.trim(),
      type: args.type,
      state: "off",
      lastStateChangeAt: now,
      lastHeartbeatAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    machineId: v.id("machines"),
    name: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    clearGroup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const machine = await ctx.db.get(args.machineId);
    if (!machine) throw new ConvexError("Machine not found.");

    await requireMembership(ctx, user._id, machine.placeId, "admin");

    const patch: Partial<typeof machine> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.clearGroup) patch.groupId = undefined;
    else if (args.groupId !== undefined) patch.groupId = args.groupId;

    await ctx.db.patch(args.machineId, patch);
  },
});

export const unlinkDevice = mutation({
  args: { machineId: v.id("machines") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const machine = await ctx.db.get(args.machineId);
    if (!machine) throw new ConvexError("Machine not found.");

    await requireMembership(ctx, user._id, machine.placeId, "admin");

    if (machine.deviceId) {
      // Revoke all API keys for this device
      const keys = await ctx.db
        .query("apiKeys")
        .withIndex("by_device", (q) => q.eq("deviceId", machine.deviceId!))
        .collect();
      const now = Date.now();
      for (const key of keys) {
        if (key.revokedAt === undefined) {
          await ctx.db.patch(key._id, { revokedAt: now });
        }
      }
      // Unlink device from place/machine
      await ctx.db.patch(machine.deviceId, {
        placeId: undefined,
        machineId: undefined,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.machineId, {
      deviceId: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { machineId: v.id("machines") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const machine = await ctx.db.get(args.machineId);
    if (!machine) throw new ConvexError("Machine not found.");

    await requireMembership(ctx, user._id, machine.placeId, "admin");

    // Unlink device first
    if (machine.deviceId) {
      await ctx.db.patch(machine.deviceId, {
        machineId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.machineId);
  },
});
