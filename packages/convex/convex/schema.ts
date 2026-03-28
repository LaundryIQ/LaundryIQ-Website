import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  places: defineTable({
    name: v.string(),
    slug: v.string(),
    type: v.union(v.literal("dashboard"), v.literal("portal")),
    ownerUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUserId"]),

  groups: defineTable({
    placeId: v.id("places"),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_place", ["placeId"]),

  machines: defineTable({
    placeId: v.id("places"),
    groupId: v.optional(v.id("groups")),
    name: v.string(),
    type: v.union(v.literal("washer"), v.literal("dryer")),
    state: v.union(v.literal("off"), v.literal("idle"), v.literal("running")),
    lastStateChangeAt: v.number(),
    lastHeartbeatAt: v.number(),
    deviceId: v.optional(v.id("devices")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_place", ["placeId"])
    .index("by_group", ["groupId"])
    .index("by_device", ["deviceId"]),

  devices: defineTable({
    deviceId: v.string(),
    type: v.union(v.literal("washer"), v.literal("dryer")),
    hardwareVersion: v.string(),
    firmwareVersion: v.optional(v.string()),
    machineId: v.optional(v.id("machines")),
    placeId: v.optional(v.id("places")),
    claimedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_device_id", ["deviceId"])
    .index("by_machine", ["machineId"])
    .index("by_place", ["placeId"]),

  apiKeys: defineTable({
    deviceId: v.id("devices"),
    keyHash: v.string(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  }).index("by_device", ["deviceId"]),

  pendingClaims: defineTable({
    deviceId: v.string(),
    placeId: v.id("places"),
    machineId: v.id("machines"),
    type: v.union(v.literal("washer"), v.literal("dryer")),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_device_id", ["deviceId"])
    .index("by_expires_at", ["expiresAt"]),

  firmware: defineTable({
    version: v.string(),
    hardwareVersion: v.string(),
    downloadUrl: v.string(),
    releaseNotes: v.optional(v.string()),
    publishedAt: v.number(),
    isLatest: v.boolean(),
  })
    .index("by_hardware", ["hardwareVersion", "isLatest"])
    .index("by_version", ["version"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
