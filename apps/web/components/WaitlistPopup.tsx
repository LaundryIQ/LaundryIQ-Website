// ════════════════════════════════════════════════════════════════════════════
// ▼▼▼ WAITLIST POPUP — TEMPORARY (Spring 2026, pre-launch) ▼▼▼
// Tiny bottom-right popup that slides in on the marketing-site home page,
// asks for an email, and POSTs it to the Convex HTTP action at
// `${NEXT_PUBLIC_CONVEX_API_URL}/api/v1/waitlist/join` (defaults to
// https://api.laundryiq.app). The marketing site does NOT wrap with
// ConvexProvider, so this uses plain fetch.
//
// Removal plan (when we go live):
//   1. Delete this file
//   2. Remove the <WaitlistPopup /> import + render in apps/web/app/page.tsx
//   3. Run `pnpm typecheck`
// See WAITLIST.md at the repo root for the full removal checklist.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_DISMISSED = "liq.waitlist.popupDismissed";
const STORAGE_KEY_JOINED = "liq.waitlist.popupJoined";
const SHOW_AFTER_MS = 4500;

const API_BASE =
  process.env.NEXT_PUBLIC_CONVEX_API_URL ?? "https://api.laundryiq.app";

type JoinResult = { ok: boolean; duplicate: boolean; reason?: string };

export default function WaitlistPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let dismissed = "0";
    let joined = "0";
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY_DISMISSED) ?? "0";
      joined = window.localStorage.getItem(STORAGE_KEY_JOINED) ?? "0";
    } catch {
      // ignore
    }
    if (dismissed === "1" || joined === "1") return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY_DISMISSED, "1");
    } catch {
      // ignore
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const response = await fetch(`${API_BASE}/api/v1/waitlist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "marketing-popup",
          userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
          referrer: typeof document === "undefined" ? undefined : (document.referrer || undefined),
        }),
      });
      const result = (await response.json()) as JoinResult;
      if (!result.ok) {
        setErr(result.reason === "invalid_email" ? "That email doesn't look right." : "Could not save right now.");
      } else {
        setDone({ duplicate: result.duplicate });
        setEmail("");
        try {
          window.localStorage.setItem(STORAGE_KEY_JOINED, "1");
        } catch {
          // ignore
        }
      }
    } catch {
      setErr("Network hiccup. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        aria-label="Join the LaundryIQ waitlist"
        role="dialog"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9999,
          width: "min(360px, calc(100vw - 32px))",
          background: "var(--bg-surface-1)",
          border: "1px solid var(--border-default)",
          borderRadius: 14,
          padding: "1rem 1.1rem 1.15rem",
          boxShadow: "0 18px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(13,166,231,0.12)",
          color: "var(--text-primary)",
          animation: "liq-popup-in 320ms cubic-bezier(.2,.7,.3,1.2) both",
        }}
      >
        <button
          aria-label="Dismiss"
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            lineHeight: 1,
          }}
          type="button"
        >
          &times;
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--primary-400)",
              boxShadow: "0 0 8px rgba(13,166,231,0.6)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--primary-300)" }}>
            Coming soon
          </span>
        </div>

        <div style={{ fontSize: "1.0625rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>
          Be the first to use LaundryIQ.
        </div>
        <div style={{ fontSize: ".875rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
          We&apos;ll email you the moment the portal opens to everyone.
        </div>

        {done ? (
          <div
            style={{
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.35)",
              color: "var(--success)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: ".875rem",
              lineHeight: 1.45,
            }}
          >
            {done.duplicate ? "You're already on the list. We'll be in touch." : "You're in. Watch your inbox."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 12px",
                minHeight: 40,
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border-default)",
                borderRadius: 999,
                color: "var(--text-primary)",
                fontSize: ".9375rem",
                outline: "none",
              }}
              type="email"
              value={email}
            />
            <button
              disabled={busy}
              style={{
                padding: "10px 16px",
                minHeight: 40,
                borderRadius: 999,
                background: "var(--primary-gradient)",
                color: "#fff",
                border: "none",
                fontSize: ".9375rem",
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.7 : 1,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 12px rgba(13,166,231,0.3)",
              }}
              type="submit"
            >
              {busy ? "..." : "Join"}
            </button>
          </form>
        )}
        {err ? (
          <div style={{ color: "var(--error)", fontSize: ".75rem", marginTop: 8 }}>{err}</div>
        ) : null}
      </div>
      <style>{`
        @keyframes liq-popup-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
