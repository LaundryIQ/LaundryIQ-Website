/**
 * LaundryIQ — Places
 *
 * A "place" is the top-level entity (home, laundromat, university building).
 * Access control: users must have a userMembership record for a place to
 * see or manage it. Creating a place automatically adds the creator as owner.
 */
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated.");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new ConvexError("User record not found. Call getOrCreateCurrentUser first.");
  }
  return user;
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
  if (!membership) {
    throw new ConvexError("Not found.");
  }
  const roleOrder = { viewer: 0, admin: 1, owner: 2 };
  if (roleOrder[membership.role] < roleOrder[minimumRole]) {
    throw new ConvexError("Not found.");
  }
  return membership;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** List all places the authenticated user is a member of. */
export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("userMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const places = await Promise.all(
      memberships.map(async (membership) => {
        const place = await ctx.db.get(membership.placeId);
        if (!place) {
          return null;
        }
        const machines = await ctx.db
          .query("machines")
          .withIndex("by_place", (q) => q.eq("placeId", place._id))
          .collect();
        const machineCount = machines.length;
        const runningCount = machines.filter((machine) => machine.state === "running").length;
        const todayStart = startOfToday();
        const cyclesToday = (
          await ctx.db
            .query("cycles")
            .withIndex("by_place_and_started", (q) =>
              q.eq("placeId", place._id).gte("startedAt", todayStart),
            )
            .collect()
        ).length;
        return {
          ...place,
          role: membership.role,
          machineCount,
          runningCount,
          cyclesToday,
        };
      }),
    );

    return places.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});

/** Get a single place by ID, checking membership. Returns null if not found or no access. */
export const getById = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        _id: place._id,
        name: place.name,
        slug: place.slug,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      return {
        _id: place._id,
        name: place.name,
        slug: place.slug,
      };
    }

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) {
      return null;
    }

    return { ...place, role: membership.role };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const placeId = await ctx.db.insert("places", {
      name: args.name.trim(),
      slug,
      ownerUserId: user._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("userMemberships", {
      userId: user._id,
      placeId,
      role: "owner",
      joinedAt: now,
    });

    return placeId;
  },
});

export const updateName = mutation({
  args: {
    placeId: v.id("places"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireMembership(ctx, user._id, args.placeId, "admin");

    await ctx.db.patch(args.placeId, {
      name: args.name.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    placeId: v.id("places"),
    confirmName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const membership = await requireMembership(ctx, user._id, args.placeId, "owner");
    const place = await ctx.db.get(args.placeId);
    if (!place) {
      throw new ConvexError("Place not found.");
    }
    if (args.confirmName !== place.name) {
      throw new ConvexError("Confirmation name does not match.");
    }

    // Remove all memberships
    const memberships = await ctx.db
      .query("userMemberships")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    // Remove all invites
    const invites = await ctx.db
      .query("pendingInvites")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Remove all machines and their devices
    const machines = await ctx.db
      .query("machines")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const machine of machines) {
      await ctx.db.delete(machine._id);
    }

    // Remove all devices (unlink from place)
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const device of devices) {
      await ctx.db.patch(device._id, {
        placeId: undefined,
        machineId: undefined,
        claimedAt: undefined,
        updatedAt: Date.now(),
      });
    }

    // Remove all pending claims
    const claims = await ctx.db
      .query("pendingClaims")
      .collect();
    for (const claim of claims) {
      if (claim.placeId === args.placeId) {
        await ctx.db.delete(claim._id);
      }
    }

    // Remove groups
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();
    for (const group of groups) {
      await ctx.db.delete(group._id);
    }

    await ctx.db.delete(args.placeId);

    // Suppress unused variable warning
    void membership;
  },
});
