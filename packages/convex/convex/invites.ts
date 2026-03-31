/**
 * LaundryIQ — Invites
 *
 * Shareable invite links. An admin/owner generates a token-based URL
 * (portal.laundryiq.app/invite/{token}) and shares it manually.
 * No email sending — no Resend/email service required for MVP.
 *
 * Expiry: 7 days. Cleanup runs via a daily Convex cron job.
 */
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60_000;

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

function generateToken(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let token = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  for (const byte of randomValues) {
    token += chars[byte % chars.length];
  }
  return token;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Used by the accept-invite page — no auth required to preview the invite. */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("pendingInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) return null;
    if (invite.usedAt !== undefined) return { status: "used" as const };
    if (Date.now() > invite.expiresAt) return { status: "expired" as const };

    const place = await ctx.db.get(invite.placeId);
    const invitedBy = await ctx.db.get(invite.invitedByUserId);

    return {
      status: "valid" as const,
      token: invite.token,
      placeId: invite.placeId,
      placeName: place?.name ?? null,
      role: invite.role,
      invitedByName: invitedBy?.name ?? null,
      expiresAt: invite.expiresAt,
    };
  },
});

/** List pending (not yet used, not expired) invites for a place. Admin+ only. */
export const listForPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const membership = await getMembership(ctx, user._id, args.placeId);
    if (!membership) return [];
    const roleOrder = { viewer: 0, admin: 1, owner: 2 };
    if (roleOrder[membership.role] < roleOrder["admin"]) return [];

    const now = Date.now();
    const invites = await ctx.db
      .query("pendingInvites")
      .withIndex("by_place", (q) => q.eq("placeId", args.placeId))
      .collect();

    return invites
      .filter((inv) => inv.usedAt === undefined && inv.expiresAt > now)
      .map((inv) => ({
        id: inv._id,
        token: inv.token,
        role: inv.role,
        email: inv.email ?? null,
        expiresAt: inv.expiresAt,
      }));
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    placeId: v.id("places"),
    role: v.union(v.literal("viewer"), v.literal("admin")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    await requireMembership(ctx, user._id, args.placeId, "admin");

    const now = Date.now();
    const token = generateToken();

    await ctx.db.insert("pendingInvites", {
      token,
      placeId: args.placeId,
      role: args.role,
      invitedByUserId: user._id,
      email: args.email,
      createdAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
    });

    return token;
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const invite = await ctx.db
      .query("pendingInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invite) throw new ConvexError("Invite not found.");
    if (invite.usedAt !== undefined) throw new ConvexError("Invite already used.");
    if (Date.now() > invite.expiresAt) throw new ConvexError("Invite expired.");

    // Check if already a member
    const existing = await getMembership(ctx, user._id, invite.placeId);
    if (existing) {
      throw new ConvexError("You are already a member of this place.");
    }

    const now = Date.now();

    await ctx.db.insert("userMemberships", {
      userId: user._id,
      placeId: invite.placeId,
      role: invite.role,
      joinedAt: now,
    });

    await ctx.db.patch(invite._id, {
      usedAt: now,
      usedByUserId: user._id,
    });

    return invite.placeId;
  },
});

export const revoke = mutation({
  args: { inviteId: v.id("pendingInvites") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated.");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new ConvexError("Invite not found.");

    await requireMembership(ctx, user._id, invite.placeId, "admin");

    await ctx.db.delete(args.inviteId);
  },
});
