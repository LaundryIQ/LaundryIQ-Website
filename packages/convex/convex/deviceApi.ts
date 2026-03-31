import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

type DbCtx = MutationCtx | QueryCtx;

type ClaimStatus =
  | {
      kind: "claimed";
      device: Doc<"devices">;
    }
  | {
      kind: "pending";
      pendingClaim: Doc<"pendingClaims">;
      existingDevice: Doc<"devices"> | null;
    }
  | {
      kind: "unclaimed";
    };

async function loadDeviceByDeviceId(ctx: DbCtx, deviceId: string) {
  return await ctx.db
    .query("devices")
    .withIndex("by_device_id", (query) => query.eq("deviceId", deviceId))
    .unique();
}

async function loadClaimStatus(
  ctx: MutationCtx,
  deviceId: string,
  now: number,
): Promise<ClaimStatus> {
  const existingDevice = await loadDeviceByDeviceId(ctx, deviceId);
  if (existingDevice?.machineId && existingDevice.placeId) {
    return {
      kind: "claimed",
      device: existingDevice,
    };
  }

  const claims = await ctx.db
    .query("pendingClaims")
    .withIndex("by_device_id", (query) => query.eq("deviceId", deviceId))
    .collect();

  let pendingClaim: Doc<"pendingClaims"> | null = null;
  for (const candidate of claims) {
    if (candidate.expiresAt <= now) {
      continue;
    }

    if (pendingClaim === null || candidate.createdAt > pendingClaim.createdAt) {
      pendingClaim = candidate;
    }
  }

  if (!pendingClaim) {
    return { kind: "unclaimed" };
  }

  return {
    kind: "pending",
    pendingClaim,
    existingDevice,
  };
}

async function revokeActiveApiKeys(
  ctx: MutationCtx,
  deviceRef: Id<"devices">,
  revokedAt: number,
) {
  const apiKeys = await ctx.db
    .query("apiKeys")
    .withIndex("by_device", (query) => query.eq("deviceId", deviceRef))
    .collect();

  for (const apiKey of apiKeys) {
    if (apiKey.revokedAt === undefined) {
      await ctx.db.patch(apiKey._id, { revokedAt });
    }
  }
}

export const authenticateDevice = internalQuery({
  args: {
    deviceId: v.string(),
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const device = await loadDeviceByDeviceId(ctx, args.deviceId);
    if (!device) {
      return null;
    }

    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_device", (query) => query.eq("deviceId", device._id))
      .collect();

    const activeKey = apiKeys.find(
      (apiKey) => apiKey.keyHash === args.keyHash && apiKey.revokedAt === undefined,
    );

    if (!activeKey) {
      return null;
    }

    const machine = device.machineId ? await ctx.db.get(device.machineId) : null;

    return {
      deviceId: device._id,
      machineId: machine?._id ?? null,
      placeId: device.placeId ?? machine?.placeId ?? null,
    };
  },
});

export const claimDevice = internalMutation({
  args: {
    deviceId: v.string(),
    type: v.union(v.literal("washer"), v.literal("dryer")),
    keyHash: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const claimStatus = await loadClaimStatus(ctx, args.deviceId, args.now);

    if (claimStatus.kind === "claimed") {
      if (claimStatus.device.type !== args.type) {
        return {
          status: "type_mismatch" as const,
          expectedType: claimStatus.device.type,
        };
      }

      await revokeActiveApiKeys(ctx, claimStatus.device._id, args.now);
      await ctx.db.insert("apiKeys", {
        deviceId: claimStatus.device._id,
        keyHash: args.keyHash,
        createdAt: args.now,
      });

      await ctx.db.patch(claimStatus.device._id, {
        lastSeenAt: args.now,
        claimedAt: claimStatus.device.claimedAt ?? args.now,
        updatedAt: args.now,
      });

      if (claimStatus.device.machineId) {
        await ctx.db.patch(claimStatus.device.machineId, {
          lastHeartbeatAt: args.now,
          updatedAt: args.now,
        });
      }

      return {
        status: "ok" as const,
      };
    }

    if (claimStatus.kind === "unclaimed") {
      return {
        status: "unclaimed" as const,
      };
    }

    if (claimStatus.pendingClaim.type !== args.type) {
      return {
        status: "type_mismatch" as const,
        expectedType: claimStatus.pendingClaim.type,
      };
    }

    const machine = await ctx.db.get(claimStatus.pendingClaim.machineId);
    if (!machine) {
      throw new Error("Pending claim references a missing machine.");
    }

    let deviceRef = claimStatus.existingDevice?._id ?? null;
    if (deviceRef === null) {
      deviceRef = await ctx.db.insert("devices", {
        deviceId: args.deviceId,
        type: args.type,
        hardwareVersion: "unknown",
        machineId: machine._id,
        placeId: claimStatus.pendingClaim.placeId,
        claimedAt: args.now,
        lastSeenAt: args.now,
        createdAt: args.now,
        updatedAt: args.now,
      });
    } else {
      await ctx.db.patch(deviceRef, {
        type: args.type,
        machineId: machine._id,
        placeId: claimStatus.pendingClaim.placeId,
        claimedAt: args.now,
        lastSeenAt: args.now,
        updatedAt: args.now,
      });
    }

    await revokeActiveApiKeys(ctx, deviceRef, args.now);
    await ctx.db.insert("apiKeys", {
      deviceId: deviceRef,
      keyHash: args.keyHash,
      createdAt: args.now,
    });

    await ctx.db.patch(machine._id, {
      deviceId: deviceRef,
      lastHeartbeatAt: args.now,
      updatedAt: args.now,
    });

    await ctx.db.delete(claimStatus.pendingClaim._id);

    return {
      status: "ok" as const,
    };
  },
});

export const recordHeartbeat = internalMutation({
  args: {
    deviceId: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const device = await loadDeviceByDeviceId(ctx, args.deviceId);
    if (!device) {
      throw new Error("Device not found.");
    }

    await ctx.db.patch(device._id, {
      lastSeenAt: args.now,
      updatedAt: args.now,
    });

    if (device.machineId) {
      await ctx.db.patch(device.machineId, {
        lastHeartbeatAt: args.now,
        updatedAt: args.now,
      });
    }
  },
});

export const recordState = internalMutation({
  args: {
    deviceId: v.string(),
    state: v.union(v.literal("off"), v.literal("idle"), v.literal("running")),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const device = await loadDeviceByDeviceId(ctx, args.deviceId);
    if (!device) {
      throw new Error("Device not found.");
    }

    await ctx.db.patch(device._id, {
      lastSeenAt: args.now,
      updatedAt: args.now,
    });

    if (!device.machineId) {
      return;
    }

    const machine = await ctx.db.get(device.machineId);
    if (!machine) {
      throw new Error("Machine not found.");
    }

    await ctx.db.patch(machine._id, {
      state: args.state,
      lastHeartbeatAt: args.now,
      lastStateChangeAt: machine.state === args.state ? machine.lastStateChangeAt : args.now,
      updatedAt: args.now,
    });
  },
});

export const recordOtaCheck = internalMutation({
  args: {
    deviceId: v.string(),
    hardwareVersion: v.string(),
    firmwareVersion: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const device = await loadDeviceByDeviceId(ctx, args.deviceId);
    if (!device) {
      throw new Error("Device not found.");
    }

    await ctx.db.patch(device._id, {
      firmwareVersion: args.firmwareVersion,
      hardwareVersion: args.hardwareVersion,
      lastSeenAt: args.now,
      updatedAt: args.now,
    });
  },
});

export const getLatestFirmwareForHardware = internalQuery({
  args: {
    hardwareVersion: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("firmware")
      .withIndex("by_hardware", (query) =>
        query.eq("hardwareVersion", args.hardwareVersion).eq("isLatest", true),
      )
      .unique();
  },
});
