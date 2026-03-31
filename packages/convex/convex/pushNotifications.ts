"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

function getEnv(name: string) {
  return globalThis.process?.env?.[name] ?? null;
}

export const notifySubscribers = internalAction({
  args: {
    machineId: v.id("machines"),
    machineName: v.string(),
    placeId: v.id("places"),
  },
  handler: async (ctx, args) => {
    const publicKey = getEnv("VAPID_PUBLIC_KEY");
    const privateKey = getEnv("VAPID_PRIVATE_KEY");
    const subject = getEnv("VAPID_SUBJECT");

    if (!publicKey || !privateKey || !subject) {
      return null;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(
      internal.pushSubscriptions.listForMachineInternal,
      {
        machineId: args.machineId,
        placeId: args.placeId,
      },
    );

    const payload = JSON.stringify({
      title: `${args.machineName} is done`,
      body: "Your laundry cycle just finished.",
      path: `/p/${args.placeId}/m/${args.machineId}`,
      machineId: args.machineId,
      placeId: args.placeId,
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
          );
        } catch (error) {
          const statusCode =
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
              ? error.statusCode
              : null;

          if (statusCode === 404 || statusCode === 410) {
            await ctx.runMutation(internal.pushSubscriptions.removeByEndpoint, {
              endpoint: subscription.endpoint,
            });
          }
        }
      }),
    );

    return null;
  },
});
