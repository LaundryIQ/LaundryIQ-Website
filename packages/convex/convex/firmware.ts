import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

export const upsertRelease = internalMutation({
  args: {
    version: v.string(),
    hardwareVersion: v.string(),
    downloadUrl: v.string(),
    releaseNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingFirmware = await ctx.db.query("firmware").collect();
    const publishedAt = Date.now();

    let existingReleaseId: Id<"firmware"> | null = null;

    for (const release of existingFirmware) {
      if (release.hardwareVersion === args.hardwareVersion && release.isLatest) {
        await ctx.db.patch(release._id, { isLatest: false });
      }

      if (
        release.hardwareVersion === args.hardwareVersion &&
        release.version === args.version
      ) {
        existingReleaseId = release._id;
      }
    }

    if (existingReleaseId) {
      await ctx.db.patch(existingReleaseId, {
        downloadUrl: args.downloadUrl,
        releaseNotes: args.releaseNotes,
        publishedAt,
        isLatest: true,
      });

      return existingReleaseId;
    }

    return await ctx.db.insert("firmware", {
      version: args.version,
      hardwareVersion: args.hardwareVersion,
      downloadUrl: args.downloadUrl,
      releaseNotes: args.releaseNotes,
      publishedAt,
      isLatest: true,
    });
  },
});
