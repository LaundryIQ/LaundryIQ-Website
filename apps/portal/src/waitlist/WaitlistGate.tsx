// ════════════════════════════════════════════════════════════════════════════
// ▼▼▼ WAITLIST GATE — TEMPORARY (Spring 2026, pre-launch) ▼▼▼
// Wraps the entire portal app. Anonymous + signed-in visitors who haven't
// redeemed the bypass token see a "coming soon, join the waitlist" page.
// Bypass: there is a tiny invisible button in the bottom-left corner of the
// gate page that opens a prompt for the secret string. Server validates.
//
// Removal plan (when we go live):
//   1. Delete this folder (apps/portal/src/waitlist/)
//   2. Delete the <WaitlistGate> wrapper in apps/portal/src/App.tsx
//   3. Run `pnpm typecheck` and `pnpm build`
// See WAITLIST.md at the repo root for the full removal checklist.
// ════════════════════════════════════════════════════════════════════════════

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@laundryiq/convex/convex/_generated/api";

const STORAGE_KEY = "liq.waitlist.bypassToken";

function loadStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveStoredToken(token: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore quota / privacy errors
  }
}

function clearStoredToken() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function WaitlistGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadStoredToken());
  const isValid = useQuery(api.waitlist.isBypassValid, { token: token ?? undefined });

  // If the server says the stored token is invalid (revoked / expired), drop it.
  useEffect(() => {
    if (token && isValid === false) {
      clearStoredToken();
      setToken(null);
    }
  }, [token, isValid]);

  // While the validation query is in flight, keep showing whatever the previous
  // state was, but render nothing if no token at all (so the gate doesn't flash).
  if (token && isValid === undefined) {
    return null;
  }

  if (token && isValid === true) {
    return <>{children}</>;
  }

  return <Gate onBypass={(t) => { saveStoredToken(t); setToken(t); }} app="portal" />;
}

// ─── The gate page ─────────────────────────────────────────────────────────

const C = {
  page: "#0b1120",
  s1: "#131c2e",
  s2: "#1a2540",
  border: "#2a3d5c",
  borderSubtle: "#1e2d47",
  primary: "#0DA6E7",
  grad: "linear-gradient(135deg, #0DA6E7 0%, #06CBD5 100%)",
  txt: "#f0f4f8",
  txt2: "#94a3b8",
  txt3: "#5f7089",
  ok: "#34d399",
  err: "#f87171",
};

function Gate({ onBypass, app }: { onBypass: (token: string) => void; app: "portal" | "dashboard" }) {
  const join = useMutation(api.waitlist.joinWaitlist);
  const redeem = useMutation(api.waitlist.redeemBypass);

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);
  const [err, setErr] = useState("");

  const source = useMemo(() => (app === "portal" ? "portal-gate" as const : "dashboard-gate" as const), [app]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const result = await join({
        email,
        source,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
      });
      if (!result.ok) {
        setErr(result.reason === "invalid_email" ? "That email doesn't look right." : "Could not save right now.");
      } else {
        setDone({ duplicate: result.duplicate });
        setEmail("");
      }
    } catch {
      setErr("Network hiccup. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleBypass() {
    const secret = window.prompt("Enter access string:");
    if (!secret) return;
    const result = await redeem({ secret });
    if (result.ok && result.token) {
      onBypass(result.token);
    } else {
      window.alert("That string didn't match.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.page, color: C.txt, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      {/* Atmosphere */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(13,166,231,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(6,203,213,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, margin: "0 auto 1.25rem", overflow: "hidden", boxShadow: "0 0 28px rgba(13,166,231,0.35)" }}>
          <img alt="LaundryIQ" src="/logo.svg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <h1 style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.03em", marginBottom: ".5rem", lineHeight: 1.1 }}>
          LaundryIQ is almost ready.
        </h1>
        <p style={{ color: C.txt2, fontSize: "1rem", lineHeight: 1.55, marginBottom: "2rem" }}>
          The {app === "portal" ? "resident portal" : "operator dashboard"} opens to everyone soon. Drop your email and we'll let you know the moment it's live.
        </p>

        {done ? (
          <div style={{ background: "rgba(52,211,153,0.10)", border: `1px solid rgba(52,211,153,0.35)`, color: C.ok, borderRadius: 14, padding: "1.25rem 1.5rem", fontSize: "0.95rem", lineHeight: 1.55 }}>
            {done.duplicate ? "You're already on the list. We'll be in touch." : "You're in. Watch your inbox."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.25rem 1.25rem 1.5rem", boxShadow: "0 12px 40px rgba(0,0,0,0.42)" }}>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.txt2, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem", textAlign: "left" }} htmlFor="liq-waitlist-email">
              Email address
            </label>
            <input
              autoComplete="email"
              id="liq-waitlist-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: "100%", padding: "0.875rem 1rem", minHeight: 48, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 9999, color: C.txt, fontSize: "1rem", outline: "none", marginBottom: "0.75rem" }}
              type="email"
              value={email}
            />
            {err ? (
              <div style={{ color: C.err, fontSize: "0.8125rem", marginBottom: "0.75rem", textAlign: "left" }}>{err}</div>
            ) : null}
            <button
              disabled={busy}
              style={{ width: "100%", padding: "0.875rem 1.25rem", minHeight: 48, borderRadius: 9999, background: C.grad, color: "#fff", border: "none", fontSize: "1rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 2px 12px rgba(13,166,231,0.35)" }}
              type="submit"
            >
              {busy ? "Saving..." : "Join the waitlist"}
            </button>
          </form>
        )}

        <p style={{ color: C.txt3, fontSize: "0.8125rem", marginTop: "1.5rem" }}>
          Already a tester?{" "}
          <a href="https://laundryiq.app" style={{ color: C.txt2, textDecoration: "underline" }}>Back to laundryiq.app</a>
        </p>
      </div>

      {/* Tiny invisible bypass button in bottom-left. Hold tab/click to find it. */}
      <button
        aria-label="Access"
        onClick={() => void handleBypass()}
        style={{
          position: "fixed",
          left: 6, bottom: 6,
          width: 14, height: 14,
          background: "transparent",
          border: "none",
          cursor: "default",
          opacity: 0,
          padding: 0,
          zIndex: 9999,
        }}
        title=""
        type="button"
      />
    </div>
  );
}
