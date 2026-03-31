import { internalMutation } from "./_generated/server";

export const expiredInvites = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const invites = ctx.db
      .query("pendingInvites")
      .withIndex("by_expires_at", (q) => q.lte("expiresAt", now));

    for await (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    return null;
  },
});

export const expiredClaims = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const claims = ctx.db
      .query("pendingClaims")
      .withIndex("by_expires_at", (q) => q.lte("expiresAt", now));

    for await (const claim of claims) {
      await ctx.db.delete(claim._id);
    }

    return null;
  },
});
