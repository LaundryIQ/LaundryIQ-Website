import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  deviceClaim: {
    kind: "fixed window",
    rate: 10,
    period: MINUTE,
  },
  deviceHeartbeat: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },
  deviceState: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },
});
