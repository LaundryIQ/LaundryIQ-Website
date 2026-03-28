/**
 * Shared LaundryIQ utilities.
 * Used by portal, dashboard, and mobile apps.
 */

const OFFLINE_THRESHOLD_MS = 600_000; // 10 minutes

export type MachineState = "off" | "idle" | "running";
export type DisplayState = MachineState | "complete" | "offline";

/**
 * Derive the user-visible state from raw machine data.
 * "complete" = was running, now idle/off, within 5 min.
 * "offline"  = no heartbeat for 10+ minutes.
 */
export function deriveDisplayState(
  state: MachineState,
  lastStateChange: number,
  lastHeartbeat: number
): DisplayState {
  const now = Date.now();

  if (now - lastHeartbeat > OFFLINE_THRESHOLD_MS) return "offline";

  const fiveMin = 5 * 60 * 1000;
  if (state !== "running" && now - lastStateChange < fiveMin) return "complete";

  return state;
}

/** Format a duration in milliseconds to a human-readable string. */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/** Generate a device-ID-style string from a MAC address. 12 uppercase hex chars. */
export function deviceIdFromMac(mac: string): string {
  return mac.replace(/:/g, "").toUpperCase().substring(0, 12);
}
