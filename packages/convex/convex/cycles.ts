import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

async function getAuthUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

async function getMembership(ctx: QueryCtx, userId: Id<"users">, placeId: Id<"places">) {
  return await ctx.db
    .query("userMemberships")
    .withIndex("by_user_and_place", (q) => q.eq("userId", userId).eq("placeId", placeId))
    .unique();
}

async function requireMembership(ctx: QueryCtx, placeId: Id<"places">) {
  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Not authenticated.");

  const membership = await getMembership(ctx, user._id, placeId);
  if (!membership) throw new ConvexError("Not found.");

  return membership;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const listForMachine = query({
  args: {
    placeId: v.id("places"),
    machineId: v.id("machines"),
    windowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.placeId);

    const machine = await ctx.db.get(args.machineId);
    if (!machine || machine.placeId !== args.placeId) {
      return [];
    }

    const cutoff = Date.now() - (args.windowMs ?? 24 * 60 * 60_000);
    const cycles = await ctx.db
      .query("cycles")
      .withIndex("by_machine", (q) => q.eq("machineId", args.machineId))
      .collect();

    return cycles
      .filter((cycle) => cycle.startedAt >= cutoff)
      .sort((left, right) => right.startedAt - left.startedAt);
  },
});

export const countTodayForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.placeId);

    const cycles = await ctx.db
      .query("cycles")
      .withIndex("by_place_and_started", (q) =>
        q.eq("placeId", args.placeId).gte("startedAt", startOfToday()),
      )
      .collect();

    return cycles.length;
  },
});
