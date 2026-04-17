/**
 * LaundryIQ Portal — portal.laundryiq.app
 *
 * Consumer-facing app. Residents check machine availability and status.
 * No admin controls — management lives in the Dashboard.
 *
 * Routes:
 *   /signin           Google OAuth sign-in
 *   /sso-callback     Clerk OAuth callback
 *   /p                Places list (joined via invite)
 *   /p/:placeId       Machine grid for a place
 *   /invite/:token    Accept an invite link
 *   /settings         Account settings
 *   *                 404
 *
 * Design (from LaundryIQ-UI-Mockup/03-portal):
 *   - Mobile-first. Max content width: 600px (list), 800px (grid).
 *   - Machine grid: 2 cols → 3 cols (≥640px) → 4 cols (≥900px)
 *   - Machine cards: status-coloured top border, ripple on running
 *   - Machine detail: modal overlay, not a separate page
 *   - Touch targets: min 44px
 *   - 2px borders on containers, 1px dividers
 */

import { useEffect, useRef, useState } from "react";
import {
  AuthenticateWithRedirectCallback,
  UserButton,
  useAuth,
  useSignIn,
  useUser,
} from "@clerk/clerk-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@laundryiq/convex/convex/_generated/api";
import type { Id } from "@laundryiq/convex/convex/_generated/dataModel";
import { Toggle } from "@laundryiq/ui";
import {
  deriveDisplayState,
  displayStateLabel,
  formatRelativeTime,
  machineStatusCopy,
  type DisplayState,
} from "@laundryiq/utils";
import { PORTAL_URL } from "./lib/urls";
// >>> WAITLIST GATE — TEMPORARY (Spring 2026, pre-launch). Remove this import + the wrapper below when going live. See WAITLIST.md.
import { WaitlistGate } from "./waitlist/WaitlistGate";
// <<< END WAITLIST GATE IMPORT

// ─── Global CSS injected once ─────────────────────────────────────────────────

const GLOBAL_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
body { font-family: var(--font-body), system-ui, -apple-system, 'Segoe UI', sans-serif; background: #0b1120; color: #f0f4f8; line-height: 1.6; min-height: 100vh; overflow-x: hidden; padding-bottom: 60px; }
a { color: #0DA6E7; text-decoration: none; }
a:hover { color: #3dbfec; }
button { font-family: inherit; }

@keyframes pulse-glow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.3); } }
@keyframes ripple { 0% { opacity: 0.6; transform: scale(0.8); } 100% { opacity: 0; transform: scale(1.2); } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.skeleton {
  background: linear-gradient(90deg, #1a2540 25%, #222f4a 50%, #1a2540 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
}
`;

// ─── Design tokens (shared CSS vars via inline styles) ────────────────────────

const c = {
  page: "#0b1120",
  s1: "#131c2e",
  s2: "#1a2540",
  s3: "#222f4a",
  borderSubtle: "#1e2d47",
  borderDefault: "#2a3d5c",
  primary: "#0DA6E7",
  primaryGrad: "linear-gradient(135deg, #0DA6E7 0%, #06CBD5 100%)",
  textPrimary: "#f0f4f8",
  textSecondary: "#94a3b8",
  textMuted: "#5f7089",
  success: "#34d399",
  successSoft: "rgba(52,211,153,0.12)",
  successBorder: "rgba(52,211,153,0.3)",
  warning: "#fbbf24",
  warningSoft: "rgba(251,191,36,0.12)",
  warningBorder: "rgba(251,191,36,0.3)",
  error: "#f87171",
  errorSoft: "rgba(248,113,113,0.12)",
  errorBorder: "rgba(248,113,113,0.3)",
  info: "#0DA6E7",
  infoSoft: "rgba(13,166,231,0.12)",
  infoBorder: "rgba(13,166,231,0.3)",
} as const;

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    background: "rgba(11,17,32,0.88)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: `2px solid ${c.borderSubtle}`,
    padding: "0.875rem 1.5rem",
  },
  headerInner: (maxW = 600): React.CSSProperties => ({
    maxWidth: maxW,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  }),
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    textDecoration: "none",
    flexShrink: 0,
  } as React.CSSProperties,
  logoText: {
    fontWeight: 700,
    fontSize: "1rem",
    background: c.primaryGrad,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as React.CSSProperties,
  content: (maxW = 600): React.CSSProperties => ({
    maxWidth: maxW,
    margin: "0 auto",
    padding: "1.5rem",
  }),
  card: {
    background: c.s1,
    border: `2px solid ${c.borderSubtle}`,
    borderRadius: 24,
    transition: "border-color 150ms, box-shadow 150ms, transform 150ms",
  } as React.CSSProperties,
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    minHeight: 48,
    borderRadius: 9999,
    background: c.primaryGrad,
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.9375rem",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    lineHeight: 1,
    boxShadow: "0 2px 12px rgba(13,166,231,0.3)",
    transition: "all 150ms",
  } as React.CSSProperties,
  backBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 9999,
    border: "none",
    background: c.s2,
    color: c.textSecondary,
    cursor: "pointer",
    textDecoration: "none",
    flexShrink: 0,
    transition: "all 150ms",
  } as React.CSSProperties,
};

// ─── User sync (creates/retrieves Convex user on sign-in) ─────────────────────

function useUserSync() {
  const { isSignedIn } = useAuth();
  const getOrCreate = useMutation(api.users.getOrCreateCurrentUser);
  useEffect(() => {
    if (isSignedIn) void getOrCreate();
  }, [isSignedIn, getOrCreate]);
}

// ─── Machine status helpers ───────────────────────────────────────────────────

function statusColors(ds: DisplayState) {
  switch (ds) {
    case "idle": return { border: c.success, icon: c.success, badge: { bg: c.successSoft, border: c.successBorder, text: c.success } };
    case "running": return { border: c.warning, icon: c.warning, badge: { bg: c.warningSoft, border: c.warningBorder, text: c.warning } };
    case "complete": return { border: c.info, icon: c.info, badge: { bg: c.infoSoft, border: c.infoBorder, text: c.info } };
    case "offline": return { border: c.error, icon: c.error, badge: { bg: c.errorSoft, border: c.errorBorder, text: c.error } };
    default: return { border: c.borderSubtle, icon: c.textMuted, badge: { bg: c.s3, border: c.borderSubtle, text: c.textMuted } };
  }
}

function placeEmoji(name: string) {
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes("university") ||
    lowerName.includes("college") ||
    lowerName.includes("hall") ||
    lowerName.includes("dorm")
  ) {
    return "🏫";
  }
  if (lowerName.includes("laundromat")) {
    return "🏪";
  }
  return "🏠";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

function WasherIcon({ color }: { color: string }) {
  return (
    <svg fill="none" height="28" stroke={color} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="28">
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="1.5" />
      <circle cx="7" cy="6" r="1" />
    </svg>
  );
}

function DryerIcon({ color }: { color: string }) {
  return (
    <svg fill="none" height="28" stroke={color} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="28">
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 6h8" />
    </svg>
  );
}

// ─── Portal header ────────────────────────────────────────────────────────────

function PortalHeader({
  backTo,
  title,
  maxWidth = 600,
}: {
  backTo?: string;
  title?: string;
  maxWidth?: number;
}) {
  const { isSignedIn } = useAuth();
  return (
    <header style={S.header}>
      <div style={S.headerInner(maxWidth)}>
        {backTo ? (
          <Link style={S.backBtn} to={backTo}>
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link style={S.logo} to="/p">
            <img alt="LaundryIQ" src="/logo.svg" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
            <span style={S.logoText}>LaundryIQ</span>
          </Link>
        )}

        {title ? (
          <span style={{ fontWeight: 600, fontSize: "1.0625rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </span>
        ) : (
          <span style={{ flex: 1 }} />
        )}

        {isSignedIn ? (
          <UserButton afterSignOutUrl="/signin" />
        ) : (
          <a
            href={`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
            style={{
              ...S.btnPrimary,
              minHeight: 40,
              padding: "0.625rem 1rem",
              fontSize: "0.8125rem",
            }}
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}

// ─── Sign-in page ─────────────────────────────────────────────────────────────

function SignInPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Already signed in — redirect immediately
  if (authLoaded && isSignedIn) return <Navigate replace to="/p" />;

  async function handleGoogle() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") ?? "/p";
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: redirectTo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  }

  return (
    <div style={{ background: c.page, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(13,166,231,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,203,213,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 1rem", overflow: "hidden", boxShadow: "0 0 24px rgba(13,166,231,0.3)" }}>
            <img alt="LaundryIQ" src="/logo.svg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.375rem" }}>LaundryIQ</h1>
          <p style={{ color: c.textSecondary, fontSize: "0.9375rem" }}>Check your laundry room machines</p>
        </div>
        <div style={{ ...S.card, padding: "2rem", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
          {error ? (
            <div style={{ padding: "0.75rem 1rem", background: c.errorSoft, border: `1px solid ${c.errorBorder}`, borderRadius: 12, fontSize: "0.875rem", color: c.error, marginBottom: "1.25rem" }}>
              {error}
            </div>
          ) : null}
          <button
            disabled={loading || !isLoaded}
            onClick={() => void handleGoogle()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", width: "100%", padding: "0.875rem 1.25rem", minHeight: 52, background: c.s2, border: `2px solid ${c.borderDefault}`, borderRadius: 9999, color: c.textPrimary, fontSize: "0.9375rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 150ms" }}
            type="button"
          >
            {loading ? (
              <span style={{ width: 20, height: 20, border: `2px solid ${c.borderDefault}`, borderTopColor: c.primary, borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
            ) : (
              <svg fill="none" height="20" viewBox="0 0 18 18" width="20">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
            )}
            {loading ? "Connecting…" : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Places list ──────────────────────────────────────────────────────────────

function PlacesPage() {
  const places = useQuery(api.places.listForCurrentUser);

  return (
    <div style={{ background: c.page, minHeight: "100vh" }}>
      <PortalHeader />
      <div style={S.content(600)}>
        <h1 style={{ fontWeight: 700, fontSize: "1.75rem", marginBottom: "1.5rem" }}>Your Places</h1>

        {places === undefined ? (
          // Loading skeletons
          <div>
            {[1, 2].map((i) => (
              <div key={i} style={{ ...S.card, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                  <div className="skeleton" style={{ height: 18, width: "40%", borderRadius: 9 }} />
                </div>
                <div className="skeleton" style={{ height: 14, width: "65%", borderRadius: 7 }} />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: c.s1, border: `2px solid ${c.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg fill="none" height="36" stroke={c.textMuted} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="36">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "1.375rem", marginBottom: "0.625rem" }}>No places yet</h2>
            <p style={{ color: c.textSecondary, fontSize: "0.9375rem", maxWidth: 280, margin: "0 auto" }}>
              Ask your building manager for an invite link to join your laundry room.
            </p>
          </div>
        ) : (
          <div>
            {places.map((place) => (
              <PlaceCard key={place._id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place }: { place: { _id: Id<"places">; name: string; role: string; machineCount: number } }) {
  const machines = useQuery(api.machines.listForPlace, { placeId: place._id });

  const available = machines?.filter((m) => deriveDisplayState(m.state, m.lastStateChangeAt, m.lastHeartbeatAt, m.previousState) === "idle").length ?? 0;
  const running = machines?.filter((m) => deriveDisplayState(m.state, m.lastStateChangeAt, m.lastHeartbeatAt, m.previousState) === "running").length ?? 0;
  const offline = machines?.filter((m) => deriveDisplayState(m.state, m.lastStateChangeAt, m.lastHeartbeatAt, m.previousState) === "offline").length ?? 0;

  return (
    <Link
      style={{ ...S.card, display: "block", padding: "1.25rem", marginBottom: "1rem", textDecoration: "none", color: "inherit" }}
      to={`/p/${place._id}`}
    >
      <style>{`a[href="/p/${place._id}"]:hover { border-color: ${c.borderDefault} !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: c.s2, border: `2px solid ${c.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
          {placeEmoji(place.name)}
        </div>
        <span style={{ fontWeight: 600, fontSize: "1.0625rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {place.name}
        </span>
        <svg fill="none" height="16" stroke={c.textMuted} strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {machines === undefined ? (
          <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 7 }} />
        ) : (
          <>
            {available > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: c.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.success, boxShadow: `0 0 6px ${c.success}`, flexShrink: 0 }} />
                {available} available
              </span>
            )}
            {running > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: c.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.warning, boxShadow: `0 0 6px ${c.warning}`, animation: "pulse-glow 2s ease-in-out infinite", flexShrink: 0 }} />
                {running} running
              </span>
            )}
            {offline > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: c.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.error, flexShrink: 0 }} />
                {offline} offline
              </span>
            )}
            {machines.length === 0 && (
              <span style={{ fontSize: "0.8125rem", color: c.textMuted }}>No machines yet</span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

// ─── Place detail (machine grid) ──────────────────────────────────────────────

function PlaceDetailPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { placeId, machineId } = useParams<{ placeId: string; machineId?: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const machines = useQuery(api.machines.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const groups = useQuery(api.groups.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");

  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    setSelectedMachine(machineId ?? null);
  }, [machineId]);

  if (place === null) return <NotFoundPage />;

  const filtered = groupFilter === "all"
    ? machines
    : machines?.filter((m) => m.groupName === groupFilter);

  const selectedM = machines?.find((m) => m._id === selectedMachine);

  function handleCloseModal() {
    if (!placeId) {
      setSelectedMachine(null);
      return;
    }

    if (machineId) {
      navigate(`/p/${placeId}`);
      return;
    }

    setSelectedMachine(null);
  }

  return (
    <div style={{ background: c.page, minHeight: "100vh" }}>
      <PortalHeader backTo={isSignedIn ? "/p" : undefined} maxWidth={800} title={place?.name ?? "…"} />
      <div style={S.content(800)}>
        {/* Group filter */}
        {groups && groups.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <select
              onChange={(e) => setGroupFilter(e.target.value)}
              style={{ padding: "0.625rem 2.5rem 0.625rem 1rem", background: c.s1, border: `2px solid ${c.borderDefault}`, borderRadius: 9999, fontSize: "0.875rem", fontWeight: 600, color: c.textPrimary, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", minHeight: 44, outline: "none" }}
              value={groupFilter}
            >
              <option value="all">All areas</option>
              {groups.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* Machine grid */}
        {machines === undefined ? (
          <MachineGridSkeleton />
        ) : filtered && filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: c.s1, border: `2px solid ${c.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg fill="none" height="36" stroke={c.textMuted} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="36">
                <rect height="20" rx="4" width="20" x="2" y="2" />
                <circle cx="12" cy="13" r="5" />
              </svg>
            </div>
            <h2 style={{ fontWeight: 700, fontSize: "1.375rem", marginBottom: "0.625rem" }}>No machines yet</h2>
            <p style={{ color: c.textSecondary, fontSize: "0.9375rem", maxWidth: 280, margin: "0 auto" }}>
              Machines will appear here once the building manager sets them up.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
            <style>{`
              @media (min-width: 640px) { .machine-grid { grid-template-columns: repeat(3, 1fr) !important; } }
              @media (min-width: 900px) { .machine-grid { grid-template-columns: repeat(4, 1fr) !important; } }
              .machine-card-link:hover { transform: translateY(-2px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; border-color: var(--bc) !important; }
              .machine-card-link:active { transform: translateY(0) !important; }
            `}</style>
            <div className="machine-grid" style={{ display: "contents" }}>
              {filtered?.map((machine) => (
                <MachineCard
                  key={machine._id}
                  machine={machine}
                  onClick={() => {
                    setSelectedMachine(machine._id);
                    navigate(`/p/${placeId}/m/${machine._id}`);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Machine detail modal */}
      {selectedM ? (
        <MachineModal machine={selectedM} onClose={handleCloseModal} />
      ) : null}
    </div>
  );
}

function MachineGridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
      <style>{`@media (min-width: 640px) { .sk-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (min-width: 900px) { .sk-grid { grid-template-columns: repeat(4, 1fr) !important; } }`}</style>
      <div className="sk-grid" style={{ display: "contents" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: c.s1, border: `2px solid ${c.borderSubtle}`, borderRadius: 24, padding: "1.25rem 1rem", textAlign: "center" }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 0.75rem" }} />
            <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 7, margin: "0 auto 0.5rem" }} />
            <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 6, margin: "0 auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

type Machine = {
  _id: Id<"machines">;
  name: string;
  type: "washer" | "dryer";
  state: string;
  lastStateChangeAt: number;
  lastHeartbeatAt: number;
  previousState?: string;
  cycleStartedAt?: number | null;
  groupName?: string | null;
  hasDevice?: boolean;
};

function MachineCard({ machine, onClick }: { machine: Machine; onClick: () => void }) {
  const ds = deriveDisplayState(machine.state as "idle" | "running" | "off", machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState as "idle" | "running" | "off" | undefined) as DisplayState;
  const col = statusColors(ds);

  return (
    <button
      onClick={onClick}
      style={{ background: c.s1, border: `2px solid ${c.borderSubtle}`, borderTop: `4px solid ${col.border}`, borderRadius: 24, padding: "1.25rem 1rem", textAlign: "center", cursor: "pointer", transition: "all 150ms", display: "block", width: "100%", color: c.textPrimary }}
      type="button"
    >
      {/* Icon with ripple for running */}
      <div style={{ width: 52, height: 52, margin: "0 auto 0.75rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: col.badge.bg, position: "relative" }}>
        {ds === "running" && (
          <span style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${c.warning}`, opacity: 0, animation: "ripple 2s ease-out infinite" }} />
        )}
        {machine.type === "washer" ? <WasherIcon color={col.icon} /> : <DryerIcon color={col.icon} />}
      </div>

      <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{machine.name}</p>

      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: 9999, background: col.badge.bg, color: col.badge.text }}>
        {ds === "running" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.warning, boxShadow: `0 0 6px ${c.warning}`, animation: "pulse-glow 2s ease-in-out infinite", flexShrink: 0 }} />}
        {ds === "idle" && <svg fill="none" height="10" stroke={col.badge.text} strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 14 14" width="10"><path d="M11.5 3.5L5.5 10L2.5 7" /></svg>}
        {ds === "complete" && <svg fill="none" height="10" stroke={col.badge.text} strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 14 14" width="10"><path d="M11.5 3.5L5.5 10L2.5 7" /></svg>}
        {ds === "offline" && <svg fill="none" height="10" stroke={col.badge.text} strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 14 14" width="10"><path d="M7 2.5v4M7 9.5h.01" /></svg>}
        {displayStateLabel(ds)}
      </span>

      {machine.groupName ? (
        <p style={{ fontSize: "0.6875rem", color: c.textMuted, marginTop: "0.375rem" }}>{machine.groupName}</p>
      ) : null}
    </button>
  );
}

// ─── Machine detail modal ─────────────────────────────────────────────────────

function MachineModal({ machine, onClose }: { machine: Machine; onClose: () => void }) {
  const { isSignedIn } = useAuth();
  const [statusTick, setStatusTick] = useState(0);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const ds = deriveDisplayState(machine.state as "idle" | "running" | "off", machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState as "idle" | "running" | "off" | undefined) as DisplayState;
  const col = statusColors(ds);
  const isSubscribed = useQuery(
    api.pushSubscriptions.isSubscribed,
    isSignedIn ? { machineId: machine._id } : "skip",
  );
  const vapidPublicKey = useQuery(
    api.pushSubscriptions.getVapidPublicKey,
    isSignedIn ? {} : "skip",
  );
  const subscribeToPush = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribeFromPush = useMutation(api.pushSubscriptions.unsubscribe);
  const statusText = machineStatusCopy(machine.state as "idle" | "running" | "off", machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState as "idle" | "running" | "off" | undefined, machine.cycleStartedAt ?? undefined);

  // Close on backdrop click or Escape
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (ds !== "running") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setStatusTick((value) => value + 1);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [ds]);

  useEffect(() => {
    if (isSubscribed !== undefined) {
      setSubscriptionEnabled(isSubscribed);
    }
  }, [isSubscribed]);

  async function getExistingPushSubscription() {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.register("/push-sw.js");
    return await registration.pushManager.getSubscription();
  }

  async function handleNotificationToggle(nextValue: boolean) {
    if (!isSignedIn) {
      return;
    }

    setSubscriptionBusy(true);
    setSubscriptionError("");

    try {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        throw new Error("Push notifications are not supported in this browser.");
      }

      if (!vapidPublicKey) {
        throw new Error("Push notifications are not configured yet.");
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js");

      if (!nextValue) {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await unsubscribeFromPush({
            machineId: machine._id,
            endpoint: existingSubscription.endpoint,
          });
          await existingSubscription.unsubscribe();
        }
        setSubscriptionEnabled(false);
        return;
      }

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was denied.");
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      const browserSubscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const subscriptionJson = browserSubscription.toJSON();

      if (
        !subscriptionJson.endpoint ||
        !subscriptionJson.keys?.p256dh ||
        !subscriptionJson.keys?.auth
      ) {
        throw new Error("Failed to read the browser push subscription.");
      }

      await subscribeToPush({
        machineId: machine._id,
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
          },
        },
      });
      setSubscriptionEnabled(true);
    } catch (error) {
      setSubscriptionError(
        error instanceof Error ? error.message : "Failed to update notifications.",
      );

      const existingSubscription = await getExistingPushSubscription();
      setSubscriptionEnabled(Boolean(existingSubscription) && Boolean(isSubscribed));
    } finally {
      setSubscriptionBusy(false);
    }
  }

  void statusTick;

  return (
    <div
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      ref={ref}
      style={{ position: "fixed", inset: 0, background: "rgba(5,9,18,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0", animation: "fade-in 150ms" }}
    >
      <style>{`@media (min-width: 500px) { .machine-modal-inner { border-radius: 24px !important; margin: 1.5rem !important; max-width: 440px !important; } }`}</style>
      <div
        className="machine-modal-inner"
        style={{ background: c.s1, border: `2px solid ${c.borderDefault}`, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "100%", padding: "1.5rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
      >
        {/* Modal handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: c.borderDefault, margin: "0 auto 1.25rem" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>{machine.name}</h2>
            <p style={{ color: c.textSecondary, fontSize: "0.875rem", textTransform: "capitalize" }}>
              {machine.type}{machine.groupName ? ` · ${machine.groupName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 9999, border: "none", background: c.s2, color: c.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            type="button"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Status display */}
        <div style={{ background: c.s2, border: `2px solid ${col.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: col.badge.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
            {ds === "running" && (
              <span style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${c.warning}`, opacity: 0, animation: "ripple 2s ease-out infinite" }} />
            )}
            {machine.type === "washer" ? <WasherIcon color={col.icon} /> : <DryerIcon color={col.icon} />}
          </div>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 700, padding: "0.375rem 0.875rem", borderRadius: 9999, background: col.badge.bg, border: `1px solid ${col.badge.border}`, color: col.badge.text, marginBottom: "0.375rem" }}>
              {ds === "running" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.warning, boxShadow: `0 0 6px ${c.warning}`, animation: "pulse-glow 2s ease-in-out infinite" }} />}
              {displayStateLabel(ds)}
            </span>
            <p style={{ color: c.textSecondary, fontSize: "0.875rem" }}>{statusText}</p>
          </div>
        </div>

        <div style={{ background: c.s2, border: `2px solid ${c.borderSubtle}`, borderRadius: 16, padding: "1rem 1.125rem", marginBottom: "1.25rem" }}>
          {isSignedIn ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                    Notify me when done
                  </p>
                  <p style={{ color: c.textSecondary, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                    Get an alert when this machine finishes its cycle.
                  </p>
                </div>
                <div style={{ opacity: subscriptionBusy ? 0.7 : 1, pointerEvents: subscriptionBusy ? "none" : "auto" }}>
                  <Toggle
                    checked={subscriptionEnabled}
                    onChange={(checked) => {
                      void handleNotificationToggle(checked);
                    }}
                  />
                </div>
              </div>
              {subscriptionError ? (
                <p style={{ color: c.error, fontSize: "0.75rem", marginTop: "0.75rem" }}>
                  {subscriptionError}
                </p>
              ) : null}
              {!vapidPublicKey ? (
                <p style={{ color: c.textMuted, fontSize: "0.75rem", marginTop: "0.75rem" }}>
                  Notifications are temporarily unavailable.
                </p>
              ) : null}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                  Sign in to get notified
                </p>
                <p style={{ color: c.textSecondary, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                  Save this machine and get a push notification when the cycle finishes.
                </p>
              </div>
              <a
                href={`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                style={{ ...S.btnPrimary, minHeight: 40, padding: "0.625rem 1rem", fontSize: "0.8125rem" }}
              >
                Sign In
              </a>
            </div>
          )}
        </div>

        {/* Tips for running machines */}
        {ds === "running" && (
          <p style={{ fontSize: "0.875rem", color: c.textMuted, textAlign: "center" }}>
            Check back later — you&apos;ll see when it&apos;s done.
          </p>
        )}
        {ds === "idle" && (
          <div style={{ background: c.successSoft, border: `1px solid ${c.successBorder}`, borderRadius: 12, padding: "0.875rem 1rem", fontSize: "0.875rem", color: c.success, textAlign: "center" }}>
            This machine is available! 🎉
          </div>
        )}
        {ds === "complete" && (
          <div style={{ background: c.infoSoft, border: `1px solid ${c.infoBorder}`, borderRadius: 12, padding: "0.875rem 1rem", fontSize: "0.875rem", color: c.info, textAlign: "center" }}>
            Laundry is done — please collect it soon.
          </div>
        )}
        {ds === "offline" && (
          <div style={{ background: c.errorSoft, border: `1px solid ${c.errorBorder}`, borderRadius: 12, padding: "0.875rem 1rem", fontSize: "0.875rem", color: c.error, textAlign: "center" }}>
            Machine is offline. Contact building management if this persists.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Invite acceptance ────────────────────────────────────────────────────────

function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const invite = useQuery(api.invites.getByToken, token ? { token } : "skip");
  const acceptInvite = useMutation(api.invites.accept);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setError("");
    try {
      const placeId = await acceptInvite({ token });
      navigate(`/p/${placeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setAccepting(false);
    }
  }

  if (invite === undefined) {
    return (
      <div style={{ background: c.page, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
      </div>
    );
  }

  if (invite === null || invite.status === "expired" || invite.status === "used") {
    const message = invite === null
      ? "This invite link is invalid or has expired."
      : invite.status === "used"
        ? "This invite link has already been used."
        : "This invite link has expired.";
    return (
      <div style={{ background: c.page, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.75rem" }}>Invite not found</h1>
          <p style={{ color: c.textSecondary, marginBottom: "1.5rem" }}>{message}</p>
          <Link style={S.btnPrimary} to="/p">Go to Places</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: c.page, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(13,166,231,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 1rem", overflow: "hidden", boxShadow: "0 0 20px rgba(13,166,231,0.25)" }}>
            <img alt="LaundryIQ" src="/logo.svg" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.375rem" }}>You&apos;re invited</h1>
          <p style={{ color: c.textSecondary }}>Join a laundry room on LaundryIQ</p>
        </div>

        <div style={{ ...S.card, padding: "2rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: c.infoSoft, border: `2px solid ${c.infoBorder}`, margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
            {invite.status === "valid" && invite.placeName ? placeEmoji(invite.placeName) : "🏠"}
          </div>
          <p style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            Joining as {invite.status === "valid" ? invite.role : "viewer"}
          </p>
          {invite.status === "valid" && invite.placeName ? (
            <h2 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
              {invite.placeName}
            </h2>
          ) : null}

          {error ? (
            <div style={{ padding: "0.75rem 1rem", background: c.errorSoft, border: `1px solid ${c.errorBorder}`, borderRadius: 12, fontSize: "0.875rem", color: c.error, marginBottom: "1.25rem", marginTop: "1rem" }}>
              {error}
            </div>
          ) : null}

          {!isLoaded ? null : !isSignedIn ? (
            <div style={{ marginTop: "1.5rem" }}>
              <p style={{ color: c.textSecondary, fontSize: "0.875rem", marginBottom: "1rem" }}>Sign in to accept this invite</p>
              <Link
                style={S.btnPrimary}
                to={`/signin?redirect=/invite/${token}`}
              >
                Sign in with Google
              </Link>
            </div>
          ) : (
            <button
              disabled={accepting}
              onClick={() => void handleAccept()}
              style={{ ...S.btnPrimary, width: "100%", marginTop: "1.5rem", opacity: accepting ? 0.7 : 1 }}
              type="button"
            >
              {accepting ? "Accepting…" : "Accept Invite"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Account settings ─────────────────────────────────────────────────────────

function SettingsPage() {
  const { user } = useUser();
  const subscriptions = useQuery(api.pushSubscriptions.listForCurrentUser);
  const unsubscribeById = useMutation(api.pushSubscriptions.unsubscribeById);

  return (
    <div style={{ background: c.page, minHeight: "100vh" }}>
      <PortalHeader backTo="/p" title="Settings" />
      <div style={S.content(600)}>
        <div style={{ ...S.card, padding: "1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "1.25rem" }}>Account</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            {user?.imageUrl ? (
              <img alt={user.fullName ?? ""} src={user.imageUrl} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${c.borderSubtle}`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: c.primaryGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {user?.fullName?.charAt(0) ?? "?"}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, marginBottom: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName ?? "—"}</p>
              <p style={{ color: c.textSecondary, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
            </div>
          </div>
          <p style={{ color: c.textMuted, fontSize: "0.8125rem" }}>
            Account details are managed through Google.
          </p>
        </div>

        <div style={{ ...S.card, padding: "1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>
            Notification Preferences
          </h2>
          {subscriptions === undefined ? (
            <div className="skeleton" style={{ height: 56, borderRadius: 16 }} />
          ) : subscriptions.length === 0 ? (
            <p style={{ color: c.textMuted, fontSize: "0.875rem" }}>
              You don&apos;t have any active machine notifications yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  style={{
                    background: c.s2,
                    border: `1px solid ${c.borderSubtle}`,
                    borderRadius: 14,
                    padding: "0.875rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{subscription.machineName}</p>
                    <p style={{ color: c.textSecondary, fontSize: "0.8125rem" }}>
                      {subscription.placeName} · enabled {formatRelativeTime(subscription.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => void unsubscribeById({ subscriptionId: subscription.id })}
                    style={{ background: "transparent", border: "none", color: c.error, cursor: "pointer", fontWeight: 600, minHeight: 44 }}
                    type="button"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...S.card, padding: "1.5rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>Sign out</h2>
          <UserButton afterSignOutUrl="/signin" />
        </div>
      </div>
    </div>
  );
}

// ─── 404 ─────────────────────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <div style={{ background: c.page, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: c.s1, border: `2px solid ${c.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg fill="none" height="36" stroke={c.textMuted} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="36">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h1 style={{ fontWeight: 700, fontSize: "1.75rem", marginBottom: "0.75rem" }}>Page not found</h1>
      <p style={{ color: c.textSecondary, fontSize: "1rem", maxWidth: 320, lineHeight: 1.6, marginBottom: "2rem" }}>
        This page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link style={S.btnPrimary} to="/p">Go to Places</Link>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate replace to="/signin" />;
  return <>{children}</>;
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  useUserSync();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* >>> WAITLIST GATE — TEMPORARY. Remove the wrapper (keep its children) when going live. See WAITLIST.md. */}
      <WaitlistGate>
        <BrowserRouter>
          <Routes>
            <Route element={<Navigate replace to="/p" />} path="/" />
            <Route element={<SignInPage />} path="/signin" />
            <Route element={<AuthenticateWithRedirectCallback afterSignInUrl="/p" afterSignUpUrl="/p" />} path="/sso-callback" />
            <Route element={<InvitePage />} path="/invite/:token" />

            <Route element={<RequireAuth><PlacesPage /></RequireAuth>} path="/p" />
            <Route element={<PlaceDetailPage />} path="/p/:placeId" />
            <Route element={<PlaceDetailPage />} path="/p/:placeId/m/:machineId" />
            <Route element={<RequireAuth><SettingsPage /></RequireAuth>} path="/settings" />

            <Route element={<NotFoundPage />} path="*" />
          </Routes>
        </BrowserRouter>
      </WaitlistGate>
      {/* <<< END WAITLIST GATE WRAPPER */}
    </>
  );
}
