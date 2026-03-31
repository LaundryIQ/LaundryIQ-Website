/**
 * LaundryIQ — Users
 * Auth: Clerk via ConvexProviderWithClerk
 *
 * getOrCreateCurrentUser should be called as a mutation from app startup
 * (e.g. a useEffect that fires once after sign-in) to sync the Clerk
 * identity into our users table.
 */
import { mutation, query } from "./_generated/server";

export const getOrCreateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      const now = Date.now();
      const nameChanged = identity.name && identity.name !== existing.name;
      const imageChanged = identity.pictureUrl && identity.pictureUrl !== existing.imageUrl;
      if (nameChanged || imageChanged) {
        await ctx.db.patch(existing._id, {
          name: identity.name ?? existing.name,
          imageUrl: identity.pictureUrl ?? existing.imageUrl,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
