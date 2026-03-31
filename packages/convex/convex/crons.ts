import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("cleanup expired invites", "0 3 * * *", internal.cleanup.expiredInvites, {});
crons.cron("cleanup expired claims", "5 3 * * *", internal.cleanup.expiredClaims, {});

export default crons;
