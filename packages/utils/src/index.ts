/**
 * Shared LaundryIQ utilities.
 * Used by all web surfaces: marketing, portal, dashboard.
 *
 * This file contains ONLY pure types and utility functions.
 * No demo or mock data lives here — data comes from Convex queries.
 */

// ─── Machine state types ──────────────────────────────────────────────────────

export type MachineState = "off" | "idle" | "running";
export type DisplayState = MachineState | "complete" | "offline";
export type MachineType = "washer" | "dryer";
export type UserRole = "viewer" | "admin" | "owner";
export type ClaimStatus = "claimed" | "pending" | "offline";

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFLINE_THRESHOLD_MS = 10 * 60_000;  // 10 minutes
const COMPLETE_THRESHOLD_MS = 5 * 60_000;   // 5 minutes

// ─── State derivation ─────────────────────────────────────────────────────────

/**
 * Derive the user-visible display state from raw device/machine data.
 *
 * Rules:
 * - "offline"  → no heartbeat for 10+ minutes
 * - "complete" → was running, now idle/off, within last 5 minutes
 * - otherwise  → the raw state from firmware (off / idle / running)
 */
export function deriveDisplayState(
  state: MachineState,
  lastStateChangeAt: number,
  lastHeartbeatAt: number,
  previousState?: MachineState,
): DisplayState {
  const now = Date.now();

  if (now - lastHeartbeatAt > OFFLINE_THRESHOLD_MS) {
    return "offline";
  }

  const wasRunning = previousState === "running";
  if (
    wasRunning &&
    state !== "running" &&
    now - lastStateChangeAt < COMPLETE_THRESHOLD_MS
  ) {
    return "complete";
  }

  return state;
}

// ─── Display labels ───────────────────────────────────────────────────────────

export function displayStateLabel(state: DisplayState): string {
  switch (state) {
    case "running":
      return "Running";
    case "idle":
      return "Available";
    case "off":
      return "Off";
    case "complete":
      return "Done";
    case "offline":
      return "Offline";
  }
}

export function machineTypeLabel(type: MachineType): string {
  return type === "washer" ? "Washing Machine" : "Dryer";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "viewer":
      return "Viewer";
    case "admin":
      return "Admin";
    case "owner":
      return "Owner";
  }
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.abs(Date.now() - timestamp);
  if (diff < 60_000) {
    return "just now";
  }
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// ─── Machine status copy ──────────────────────────────────────────────────────

/**
 * Return the short status string used inside machine cards and modals.
 * Matches the mockup format: "Running, 23m" / "Done, 3m ago" / "Available"
 */
export function machineStatusCopy(
  state: MachineState,
  lastStateChangeAt: number,
  lastHeartbeatAt: number,
  previousState?: MachineState,
  cycleStartedAt?: number,
): string {
  const displayState = deriveDisplayState(
    state,
    lastStateChangeAt,
    lastHeartbeatAt,
    previousState,
  );

  switch (displayState) {
    case "running": {
      const elapsed = formatDuration(Date.now() - (cycleStartedAt ?? lastStateChangeAt));
      return `Running, ${elapsed}`;
    }
    case "complete": {
      const elapsed = formatRelativeTime(lastStateChangeAt);
      return `Done, ${elapsed}`;
    }
    case "offline":
      return "Offline";
    case "off":
      return "Off";
    case "idle":
      return "Available";
  }
}

// ─── Device ID utilities ──────────────────────────────────────────────────────

/** Strip colons and uppercase a MAC address to produce a 12-char device ID. */
export function deviceIdFromMac(mac: string): string {
  return mac.replace(/:/g, "").toUpperCase().substring(0, 12);
}

/** Format a raw device ID for display (uppercase, mono). */
export function formatDeviceId(deviceId: string): string {
  return deviceId.toUpperCase();
}

// ─── Place summary helpers ────────────────────────────────────────────────────

export type PlaceSummaryStats = {
  total: number;
  running: number;
  available: number;
  complete: number;
  offline: number;
};

/** Aggregate display-state counts from a list of machines. */
export function computePlaceSummary(
  machines: Array<{
    state: MachineState;
    lastStateChangeAt: number;
    lastHeartbeatAt: number;
    previousState?: MachineState;
  }>,
): PlaceSummaryStats {
  const stats: PlaceSummaryStats = {
    total: machines.length,
    running: 0,
    available: 0,
    complete: 0,
    offline: 0,
  };

  for (const machine of machines) {
    const display = deriveDisplayState(
      machine.state,
      machine.lastStateChangeAt,
      machine.lastHeartbeatAt,
      machine.previousState,
    );
    if (display === "running") stats.running += 1;
    else if (display === "idle") stats.available += 1;
    else if (display === "complete") stats.complete += 1;
    else if (display === "offline") stats.offline += 1;
  }

  return stats;
}

// ─── Invite utilities ─────────────────────────────────────────────────────────

/** Determine whether an invite token is still within its expiry window. */
export function isInviteExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

// ─── CSS class utilities ──────────────────────────────────────────────────────

/** Concatenate class names, filtering out falsy values. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
