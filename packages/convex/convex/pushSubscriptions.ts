import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

async function getMembership(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  placeId: Id<"places">,
) {
  return await ctx.db
    .query("userMemberships")
    .withIndex("by_user_and_place", (q) => q.eq("userId", userId).eq("placeId", placeId))
    .unique();
}

async function requireMachineAccess(
  ctx: QueryCtx | MutationCtx,
  machineId: Id<"machines">,
) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated.");
  }

  const machine = await ctx.db.get(machineId);
  if (!machine) {
    throw new ConvexError("Machine not found.");
  }

  const membership = await getMembership(ctx, user._id, machine.placeId);
  if (!membership) {
    throw new ConvexError("Not found.");
  }

  return { user, machine };
}

function getPublicEnv(name: string) {
  return globalThis.process?.env?.[name] ?? null;
}

export const getVapidPublicKey = query({
  args: {},
  handler: async () => {
    return getPublicEnv("VAPID_PUBLIC_KEY");
  },
});

export const isSubscribed = query({
  args: { machineId: v.id("machines") },
  handler: async (ctx, args) => {
    const { user, machine } = await requireMachineAccess(ctx, args.machineId);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_and_machine", (q) =>
        q.eq("userId", user._id).eq("machineId", machine._id),
      )
      .collect();

    return existing.length > 0;
  },
});

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return await Promise.all(
      subscriptions.map(async (subscription) => {
        const machine = subscription.machineId ? await ctx.db.get(subscription.machineId) : null;
        const place = machine ? await ctx.db.get(machine.placeId) : null;

        return {
          id: subscription._id,
          machineId: subscription.machineId ?? null,
          machineName: machine?.name ?? "Unknown machine",
          placeId: place?._id ?? null,
          placeName: place?.name ?? "Unknown place",
          endpoint: subscription.endpoint,
          createdAt: subscription.createdAt,
        };
      }),
    );
  },
});

export const subscribe = mutation({
  args: {
    machineId: v.id("machines"),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const { user, machine } = await requireMachineAccess(ctx, args.machineId);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_and_machine", (q) =>
        q.eq("userId", user._id).eq("machineId", machine._id),
      )
      .collect();

    const match = existing.find(
      (subscription) => subscription.endpoint === args.subscription.endpoint,
    );
    if (match) {
      await ctx.db.patch(match._id, {
        p256dh: args.subscription.keys.p256dh,
        auth: args.subscription.keys.auth,
      });
      return match._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      machineId: machine._id,
      endpoint: args.subscription.endpoint,
      p256dh: args.subscription.keys.p256dh,
      auth: args.subscription.keys.auth,
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: {
    machineId: v.id("machines"),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, machine } = await requireMachineAccess(ctx, args.machineId);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_and_machine", (q) =>
        q.eq("userId", user._id).eq("machineId", machine._id),
      )
      .collect();

    for (const subscription of existing) {
      if (subscription.endpoint === args.endpoint) {
        await ctx.db.delete(subscription._id);
      }
    }

    return null;
  },
});

export const unsubscribeById = mutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated.");
    }

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription || subscription.userId !== user._id) {
      throw new ConvexError("Not found.");
    }

    await ctx.db.delete(subscription._id);
    return null;
  },
});

export const listForMachineInternal = internalQuery({
  args: {
    machineId: v.id("machines"),
    placeId: v.id("places"),
  },
  handler: async (ctx, args) => {
    const machine = await ctx.db.get(args.machineId);
    if (!machine || machine.placeId !== args.placeId) {
      return [];
    }

    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_machine", (q) => q.eq("machineId", args.machineId))
      .collect();
  },
});

export const removeByEndpoint = internalMutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }

    return null;
  },
});
