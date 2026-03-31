/**
 * LaundryIQ — Groups
 *
 * Groups are optional machine categories within a place (e.g. "Pod A Floor 1").
 * Used by B2B customers to filter the portal machine list.
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

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) return [];

    return await ctx.db
      .query("groups")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    placeId: v.id("places"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");
    await requireMembership(ctx, user._id, args.placeId, "admin");

    return await ctx.db.insert("groups", {
      placeId: args.placeId,
      name: args.name.trim(),
      createdAt: Date.now(),
    });
  },
});

export const rename = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Group not found.");

    await requireMembership(ctx, user._id, group.placeId, "admin");
    await ctx.db.patch(args.groupId, { name: args.name.trim() });
  },
});

export const remove = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Group not found.");

    await requireMembership(ctx, user._id, group.placeId, "admin");

    // Unlink machines from this group (they remain in the place, just ungrouped)
    const machines = await ctx.db
      .query("machines")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const now = Date.now();
    for (const machine of machines) {
      await ctx.db.patch(machine._id, { groupId: undefined, updatedAt: now });
    }

    await ctx.db.delete(args.groupId);
  },
});
