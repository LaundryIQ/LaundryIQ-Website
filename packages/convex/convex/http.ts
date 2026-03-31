/**
 * LaundryIQ Device REST API — Convex HTTP Actions
 *
 * All device endpoints follow the contract documented in:
 * ../../api/requests.http
 *
 * Routes:
 *   POST /api/v1/device/claim
 *   POST /api/v1/device/heartbeat
 *   POST /api/v1/device/state
 *   GET  /api/v1/device/ota/check
 */
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const DEVICE_ID_REGEX = /^[0-9A-F]{12}$/;
const API_KEY_REGEX = /^liq_[A-Za-z0-9]{32}$/;
const VERSION_PART_REGEX = /^\d+$/;
type HttpActionCtx = Parameters<Parameters<typeof httpAction>[0]>[0];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function error(status: number, message: string) {
  return json(status, { error: message });
}

function getDeviceId(request: Request) {
  const deviceId = request.headers.get("X-Device-ID");
  if (!deviceId || !DEVICE_ID_REGEX.test(deviceId)) {
    return null;
  }

  return deviceId;
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authorization.slice("Bearer ".length);
  if (!API_KEY_REGEX.test(apiKey)) {
    return null;
  }

  return apiKey;
}

async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function hashApiKey(apiKey: string) {
  const encoded = new TextEncoder().encode(apiKey);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".");
  const rightParts = right.split(".");
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const leftPart = leftParts[index] ?? "0";
    const rightPart = rightParts[index] ?? "0";

    if (!VERSION_PART_REGEX.test(leftPart) || !VERSION_PART_REGEX.test(rightPart)) {
      return left.localeCompare(right);
    }

    const leftValue = Number.parseInt(leftPart, 10);
    const rightValue = Number.parseInt(rightPart, 10);
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

async function authenticateRequest(
  ctx: HttpActionCtx,
  request: Request,
) {
  const deviceId = getDeviceId(request);
  if (!deviceId) {
    return {
      ok: false as const,
      response: error(400, "Invalid X-Device-ID header."),
    };
  }

  const apiKey = getBearerToken(request);
  if (!apiKey) {
    return {
      ok: false as const,
      response: error(401, "Missing or invalid Authorization header."),
    };
  }

  const keyHash = await hashApiKey(apiKey);
  const auth = await ctx.runQuery(internal.deviceApi.authenticateDevice, {
    deviceId,
    keyHash,
  });

  if (!auth) {
    return {
      ok: false as const,
      response: error(401, "Unauthorized."),
    };
  }

  return {
    ok: true as const,
    deviceId,
  };
}

http.route({
  path: "/api/v1/device/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const deviceId = getDeviceId(request);
    if (!deviceId) {
      return error(400, "Invalid X-Device-ID header.");
    }

    const body = await parseJsonBody<{ type?: string }>(request);
    if (!body || (body.type !== "washer" && body.type !== "dryer")) {
      return error(400, 'Body must include type: "washer" | "dryer".');
    }

    const apiKey = `liq_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
    const keyHash = await hashApiKey(apiKey);
    const result = await ctx.runMutation(internal.deviceApi.claimDevice, {
      deviceId,
      type: body.type,
      keyHash,
      now: Date.now(),
    });

    if (result.status === "unclaimed") {
      return json(404, { status: "unclaimed" });
    }

    if (result.status === "type_mismatch") {
      return json(409, {
        error: `Pending claim expects type "${result.expectedType}".`,
      });
    }

    return json(200, { apiKey });
  }),
});

http.route({
  path: "/api/v1/device/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticateRequest(ctx, request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await parseJsonBody<Record<string, never>>(request);
    if (body === null) {
      return error(400, "Heartbeat body must be valid JSON.");
    }

    await ctx.runMutation(internal.deviceApi.recordHeartbeat, {
      deviceId: auth.deviceId,
      now: Date.now(),
    });

    return json(200, { status: "ok" });
  }),
});

http.route({
  path: "/api/v1/device/state",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticateRequest(ctx, request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await parseJsonBody<{ state?: string }>(request);
    if (!body || (body.state !== "off" && body.state !== "idle" && body.state !== "running")) {
      return error(400, 'Body must include state: "off" | "idle" | "running".');
    }

    await ctx.runMutation(internal.deviceApi.recordState, {
      deviceId: auth.deviceId,
      state: body.state,
      now: Date.now(),
    });

    return json(200, { status: "ok" });
  }),
});

http.route({
  path: "/api/v1/device/ota/check",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await authenticateRequest(ctx, request);
    if (!auth.ok) {
      return auth.response;
    }

    const currentVersion = request.headers.get("X-Current-Version");
    const hardwareVersion = request.headers.get("X-Hardware-Version");
    if (!currentVersion || !hardwareVersion) {
      return error(400, "Missing OTA version headers.");
    }

    const now = Date.now();
    await ctx.runMutation(internal.deviceApi.recordOtaCheck, {
      deviceId: auth.deviceId,
      firmwareVersion: currentVersion,
      hardwareVersion,
      now,
    });

    const latest = await ctx.runQuery(internal.deviceApi.getLatestFirmwareForHardware, {
      hardwareVersion,
    });

    if (!latest || compareVersions(latest.version, currentVersion) <= 0) {
      return json(200, {
        updateAvailable: false,
        version: currentVersion,
        downloadUrl: null,
      });
    }

    return json(200, {
      updateAvailable: true,
      version: latest.version,
      downloadUrl: latest.downloadUrl,
    });
  }),
});

export default http;
