/**
 * LaundryIQ — Members
 *
 * Handles membership listing, role updates, and removal within a place.
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
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const selfMembership = await getMembership(ctx, user._id, args.placeId);
    if (!selfMembership) return [];

    const memberships = await ctx.db
      .query("userMemberships")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    return await Promise.all(
      memberships.map(async (m) => {
        const member = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          name: member?.name ?? null,
          email: member?.email ?? null,
          imageUrl: member?.imageUrl ?? null,
          isCurrentUser: m.userId === user._id,
        };
      }),
    );
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const updateRole = mutation({
  args: {
    membershipId: v.id("userMemberships"),
    role: v.union(v.literal("viewer"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const targetMembership = await ctx.db.get(args.membershipId);
    if (!targetMembership) throw new ConvexError("Membership not found.");

    await requireMembership(ctx, user._id, targetMembership.placeId, "owner");

    if (targetMembership.role === "owner") {
      throw new ConvexError("Cannot change owner role.");
    }

    await ctx.db.patch(args.membershipId, { role: args.role });
  },
});

export const remove = mutation({
  args: { membershipId: v.id("userMemberships") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const targetMembership = await ctx.db.get(args.membershipId);
    if (!targetMembership) throw new ConvexError("Membership not found.");

    // Owners can remove others; members can remove themselves
    const selfMembership = await getMembership(ctx, user._id, targetMembership.placeId);
    if (!selfMembership) throw new ConvexError("Not found.");

    const isRemovingSelf = targetMembership.userId === user._id;
    const isOwner = selfMembership.role === "owner";

    if (!isRemovingSelf && !isOwner) {
      throw new ConvexError("Not authorized.");
    }

    if (targetMembership.role === "owner") {
      throw new ConvexError("Cannot remove the owner.");
    }

    await ctx.db.delete(args.membershipId);
  },
});
