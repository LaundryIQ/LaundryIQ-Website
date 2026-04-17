/**
 * LaundryIQ Dashboard — dashboard.laundryiq.app
 *
 * 1:1 implementation of the HTML mockups in:
 *   LaundryIQ-UI-Mockup/04-dashboard/
 *
 * Design decisions from LeeorNahum.md:
 * - Dashboard = SaaS admin panel, data-dense, professional
 * - Split layout auth on desktop (left feature panel + right form)
 * - Place tabs: Overview | Machines | Devices | Users | Settings
 * - Pill-style tabs in recessed track, horizontal scroll on mobile
 * - Device IDs always in ui-monospace font (font-mono)
 * - OTA is invisible — no "update" button, just informational
 * - 2px borders on all containers
 * - Status text: commas not middle dots ("Running, 23m")
 *
 * Auth: Clerk (Google-only sign-in)
 * Data: Convex useQuery / useMutation
 */

import { useEffect, useState } from "react";
import {
  AuthenticateWithRedirectCallback,
  UserButton,
  useAuth,
  useSignIn,
  useUser,
} from "@clerk/clerk-react";
import { PORTAL_URL, DASHBOARD_URL } from "./lib/urls";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@laundryiq/convex/convex/_generated/api";
import type { Id } from "@laundryiq/convex/convex/_generated/dataModel";
import {
  Spinner,
  toneFromDisplayState,
} from "@laundryiq/ui";
import {
  deriveDisplayState,
  displayStateLabel,
  formatDuration,
  formatRelativeTime,
  formatTimestamp,
  machineStatusCopy,
  type DisplayState,
} from "@laundryiq/utils";
// >>> WAITLIST GATE — TEMPORARY (Spring 2026, pre-launch). Remove this import + the wrapper below when going live. See WAITLIST.md.
import { WaitlistGate } from "./waitlist/WaitlistGate";
// <<< END WAITLIST GATE IMPORT

// ─── Shared styles ────────────────────────────────────────────────────────────

const css = {
  page: {
    background: "var(--bg-page)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    minHeight: "100vh",
    overflowX: "hidden" as const,
  } as React.CSSProperties,

  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    background: "rgba(11,17,32,0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "2px solid var(--border-subtle)",
    padding: "0.875rem 1.5rem",
  } as React.CSSProperties,

  headerInner: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  } as React.CSSProperties,

  content: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "1.5rem",
  } as React.CSSProperties,

  card: {
    background: "var(--bg-surface-1)",
    border: "2px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
    transition: "border-color var(--transition-fast)",
  } as React.CSSProperties,

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    minHeight: 44,
    borderRadius: "var(--radius-full)",
    fontSize: "0.9375rem",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    background: "var(--primary-gradient)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    textDecoration: "none",
    lineHeight: 1,
    boxShadow: "0 2px 8px rgba(13,166,231,0.25)",
  } as React.CSSProperties,

  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    minHeight: 44,
    borderRadius: "var(--radius-full)",
    fontSize: "0.9375rem",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    background: "transparent",
    color: "var(--text-primary)",
    border: "2px solid var(--border-default)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    textDecoration: "none",
    lineHeight: 1,
  } as React.CSSProperties,

  formInput: {
    width: "100%",
    padding: "0.75rem 1rem",
    minHeight: 44,
    borderRadius: "var(--radius-full)",
    border: "2px solid var(--border-default)",
    background: "var(--bg-surface-2)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    outline: "none",
    transition: "all var(--transition-fast)",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  formSelect: {
    width: "100%",
    padding: "0.75rem 1rem",
    minHeight: 44,
    borderRadius: "var(--radius-full)",
    border: "2px solid var(--border-default)",
    background: "var(--bg-surface-2)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    cursor: "pointer",
    appearance: "none" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  formLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
  } as React.CSSProperties,

  mono: {
    fontFamily: "var(--font-mono)",
    color: "var(--primary-400)",
    fontWeight: 600,
  } as React.CSSProperties,
} as const;

// ─── User sync ────────────────────────────────────────────────────────────────

function useUserSync() {
  const { isSignedIn } = useAuth();
  const getOrCreate = useMutation(api.users.getOrCreateCurrentUser);
  useEffect(() => {
    if (isSignedIn) void getOrCreate();
  }, [isSignedIn, getOrCreate]);
}

// ─── Machine type icons ───────────────────────────────────────────────────────

function WasherIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg fill="none" height={size} stroke={color} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width={size}>
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="1.5" />
      <circle cx="7" cy="6" r="1" />
    </svg>
  );
}

function DryerIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg fill="none" height={size} stroke={color} strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width={size}>
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 6h8" />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ displayState }: { displayState: DisplayState }) {
  const bgMap: Record<DisplayState, string> = {
    idle: "var(--success-soft)", running: "var(--warning-soft)",
    complete: "var(--info-soft)", offline: "var(--error-soft)", off: "var(--bg-surface-3)",
  };
  const borderMap: Record<DisplayState, string> = {
    idle: "var(--success-border)", running: "var(--warning-border)",
    complete: "var(--info-border)", offline: "var(--error-border)", off: "var(--border-subtle)",
  };
  const colorMap: Record<DisplayState, string> = {
    idle: "var(--success)", running: "var(--warning)",
    complete: "var(--info)", offline: "var(--error)", off: "var(--text-muted)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.375rem 0.875rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        lineHeight: 1,
        background: bgMap[displayState],
        border: `1px solid ${borderMap[displayState]}`,
        color: colorMap[displayState],
        flexShrink: 0,
      }}
    >
      {displayState === "running" ? (
        <span
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--warning)", boxShadow: "0 0 6px var(--warning)",
            animation: "pulse-glow 2s ease-in-out infinite", flexShrink: 0,
          }}
        />
      ) : displayState === "idle" || displayState === "complete" ? (
        <svg fill="none" height="12" stroke={colorMap[displayState]} strokeLinecap="round" strokeWidth="2" viewBox="0 0 14 14" width="12">
          <path d="M11.5 3.5L5.5 10L2.5 7" />
        </svg>
      ) : displayState === "offline" ? (
        <svg fill="none" height="12" stroke={colorMap[displayState]} strokeLinecap="round" strokeWidth="2" viewBox="0 0 14 14" width="12">
          <path d="M7 2.5v5M7 10.5h.01" />
        </svg>
      ) : null}
      {displayStateLabel(displayState)}
    </span>
  );
}

// ─── Dashboard header ─────────────────────────────────────────────────────────

function DashHeader({ backTo, title }: { backTo?: string; title?: string }) {
  return (
    <header style={css.header}>
      <div style={css.headerInner}>
        {backTo ? (
          <Link
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, minWidth: 44, borderRadius: "var(--radius-full)",
              border: "2px solid var(--border-default)", background: "var(--bg-surface-2)",
              color: "var(--text-secondary)", textDecoration: "none", flexShrink: 0,
            }}
            to={backTo}
          >
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <Link style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", flexShrink: 0 }} to="/p">
            <img alt="LaundryIQ" src="/logo.svg" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.0625rem", background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LaundryIQ</span>
          </Link>
        )}
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title ?? (backTo ? "" : "Dashboard")}
        </span>
        <Link
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            minWidth: 44,
            borderRadius: "var(--radius-full)",
            border: "2px solid var(--border-default)",
            background: "var(--bg-surface-2)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            flexShrink: 0,
          }}
          to="/settings"
        >
          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 005 15.4a1.65 1.65 0 00-1.51-1H3.4a2 2 0 010-4h.09A1.65 1.65 0 005 8.89a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009.11 5c.64-.27 1-.9 1-1.59V3.4a2 2 0 014 0v.09c0 .69.36 1.32 1 1.59a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019 8.89c.27.64.9 1 1.59 1h.09a2 2 0 010 4h-.09c-.69 0-1.32.36-1.59 1z" />
          </svg>
        </Link>
        <UserButton afterSignOutUrl="/signin" />
      </div>
    </header>
  );
}

// ─── Place tab nav ────────────────────────────────────────────────────────────

function PlaceTabs({ placeId }: { placeId: string }) {
  const location = useLocation();
  const base = `/p/${placeId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/machines`, label: "Machines" },
    { href: `${base}/devices`, label: "Devices" },
    { href: `${base}/users`, label: "Users" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem 0", marginTop: "0.5rem", paddingBottom: "0" }}>
      <div
        style={{
          display: "flex", gap: "0.25rem", padding: "0.25rem",
          background: "var(--bg-surface-2)", borderRadius: "var(--radius-full)",
          border: "2px solid var(--border-subtle)", overflowX: "auto",
          scrollbarWidth: "none" as const,
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href;
          return (
            <Link
              key={tab.href}
              style={{
                flexShrink: 0,
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                background: isActive ? "var(--bg-surface-1)" : "transparent",
                border: isActive ? "1px solid var(--border-default)" : "none",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)",
              }}
              to={tab.href}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function DashAuthPage() {
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
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: "/p",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setLoading(false);
    }
  }

  const leftFeatures = [
    { icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>, label: "Real-time device monitoring" },
    { icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>, label: "Usage analytics and history" },
    { icon: <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>, label: "Team and access management" },
  ];

  return (
    <div style={{ ...css.page, display: "flex", minHeight: "100vh" }}>
      {/* Left panel (desktop only) */}
      <aside
        className="dash-auth-left"
        style={{
          flex: 1,
          maxWidth: "48%",
          background: "var(--bg-surface-1)",
          backgroundImage: "linear-gradient(180deg, rgba(13,166,231,0.04) 0%, transparent 50%)",
          borderRight: "2px solid var(--border-subtle)",
          padding: "3rem 2.5rem",
          flexDirection: "column",
          justifyContent: "center",
          display: "none",
        }}
      >
        <style>{`@media(min-width:768px){.dash-auth-left{display:flex!important}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <img alt="LaundryIQ" src="/logo.svg" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LaundryIQ</h1>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>Dashboard</span>
          </div>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "2.5rem", maxWidth: 320 }}>
          Manage your devices, monitor your machines.
        </p>
        <ul style={{ listStyle: "none" }}>
          {leftFeatures.map((f) => (
            <li key={f.label} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0", color: "var(--text-secondary)", fontSize: "0.9375rem", minHeight: 44 }}>
              <span style={{ color: "var(--primary-400)", flexShrink: 0 }}>{f.icon}</span>
              {f.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Right: form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(13,166,231,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(6,203,213,0.03) 0%, transparent 50%)" }} />
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

          {/* Mobile-only logo */}
          <div className="dash-auth-mobile-logo" style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <style>{`@media(min-width:768px){.dash-auth-mobile-logo{display:none!important}}`}</style>
            <img alt="LaundryIQ" src="/logo.svg" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: "0.5rem" }} />
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LaundryIQ</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Sign in to manage your fleet</p>
          </div>

          <div style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "2rem", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>
              Sign in to Dashboard
            </h2>

            {error ? (
              <div style={{ padding: "0.75rem 1rem", background: "var(--error-soft)", border: "1px solid var(--error-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--error)", marginBottom: "1.25rem" }}>
                {error}
              </div>
            ) : null}

            {/* Google OAuth button */}
            <button
              disabled={loading || !isLoaded}
              onClick={() => void handleGoogle()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.875rem 1.25rem",
                minHeight: 52,
                background: "var(--bg-surface-2)",
                border: "2px solid var(--border-default)",
                borderRadius: "var(--radius-full)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: loading || !isLoaded ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all var(--transition-fast)",
              }}
              type="button"
            >
              {loading ? (
                <span style={{ width: 20, height: 20, border: "2px solid var(--border-strong)", borderTopColor: "var(--primary-400)", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <svg fill="none" height="20" viewBox="0 0 18 18" width="20">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
              )}
              {loading ? "Connecting..." : "Continue with Google"}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Place list ───────────────────────────────────────────────────────────────

function PlaceListPage() {
  const navigate = useNavigate();
  const places = useQuery(api.places.listForCurrentUser);
  const createPlace = useMutation(api.places.create);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const placeId = await createPlace({ name: newName.trim() });
      setShowModal(false);
      setNewName("");
      navigate(`/p/${placeId}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={css.page}>
      <DashHeader />
      <div style={css.content}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>Your Places</h1>
          <button
            onClick={() => setShowModal(true)}
            style={css.btnPrimary}
            type="button"
          >
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M12 5v14M5 12h14" /></svg>
            Create Place
          </button>
        </div>

        {places === undefined ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ ...css.card }}>
                <div className="skeleton" style={{ height: 20, width: "50%", borderRadius: 10, marginBottom: "0.75rem" }} />
                <div className="skeleton" style={{ height: 14, width: "80%", borderRadius: 7 }} />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1.5rem" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg fill="none" height="36" stroke="var(--text-muted)" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="36"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.625rem" }}>No places yet</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: 300, margin: "0 auto 2rem" }}>
              Create your first place to start adding devices and monitoring machines.
            </p>
            <button onClick={() => setShowModal(true)} style={css.btnPrimary} type="button">
              Create Your First Place
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {places.map((place) => (
              <Link
                key={place._id}
                style={{ ...css.card, textDecoration: "none", color: "inherit", display: "block", cursor: "pointer" }}
                to={`/p/${place._id}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1.0625rem" }}>{place.name}</h3>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: "var(--success-soft)", border: "1px solid var(--success-border)", color: "var(--success)" }}>
                    {"role" in place ? place.role : "viewer"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{place.machineCount}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Machines</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{place.runningCount ?? 0}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Running</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{place.cyclesToday ?? 0}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Cycles Today</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create place modal */}
      {showModal ? (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, background: "rgba(5,9,18,0.8)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-default)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 420, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "2px solid var(--border-subtle)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1.125rem" }}>Create Place</h3>
              <button onClick={() => setShowModal(false)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface-2)", border: "none", borderRadius: "var(--radius-full)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.125rem" }} type="button">&times;</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ ...css.formLabel, fontSize: "0.8125rem", color: "var(--text-secondary)" }} htmlFor="new-place-name">Place name</label>
                <input autoFocus id="new-place-name" onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }} placeholder="e.g. Holly Pointe, My Home" style={css.formInput} value={newName} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>You can change this later.</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem 1.5rem", borderTop: "2px solid var(--border-subtle)" }}>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", color: "var(--text-secondary)", border: "none", cursor: "pointer", padding: "0.625rem 1.25rem", borderRadius: "var(--radius-full)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", minHeight: 44 }} type="button">Cancel</button>
              <button disabled={!newName.trim() || creating} onClick={() => void handleCreate()} style={{ ...css.btnPrimary, opacity: !newName.trim() || creating ? 0.6 : 1 }} type="button">{creating ? "Creating..." : "Create Place"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Place overview ───────────────────────────────────────────────────────────

function PlaceOverviewPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const machines = useQuery(api.machines.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const cyclesToday = useQuery(
    api.cycles.countTodayForPlace,
    placeId ? { placeId: placeId as Id<"places"> } : "skip",
  );

  if (place === null) return <DashNotFoundPage />;

  const running = machines?.filter((m) => deriveDisplayState(m.state, m.lastStateChangeAt, m.lastHeartbeatAt, m.previousState) === "running").length ?? 0;
  const offlineMachines = machines?.filter((m) => deriveDisplayState(m.state, m.lastStateChangeAt, m.lastHeartbeatAt, m.previousState) === "offline").length ?? 0;

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo="/p" title={place?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Machines", value: machines?.length ?? "—", icon: null },
            { label: "Running", value: running, highlight: running > 0 ? "warning" : null },
            { label: "Cycles Today", value: cyclesToday ?? "—", icon: null },
            { label: "Offline", value: offlineMachines, highlight: offlineMachines > 0 ? "error" : null },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                ...css.card,
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                ...(stat.highlight === "error" && offlineMachines > 0 ? { background: "var(--error-soft)", borderColor: "var(--error-border)" } : {}),
              }}
            >
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2 }}>{stat.value}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Machine status mini-grid (compact pills) */}
        {machines && machines.length > 0 ? (
          <>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Machine Status</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: "0.5rem", marginBottom: "2rem" }}>
              {machines.map((machine, idx) => {
                const displayState = deriveDisplayState(machine.state, machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState);
                const bgMap: Record<DisplayState, string> = {
                  idle: "var(--success)", running: "var(--warning)",
                  complete: "var(--info)", offline: "var(--error)", off: "var(--bg-surface-3)",
                };
                return (
                  <Link
                    key={machine._id}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: bgMap[displayState],
                      color: displayState === "running" ? "#1a1a1a" : "#fff",
                      textDecoration: "none",
                      border: "2px solid transparent",
                      transition: "all var(--transition-fast)",
                      minWidth: 36,
                      minHeight: 36,
                      maxWidth: 44,
                      maxHeight: 44,
                      position: "relative",
                    }}
                    title={machine.name}
                    to={`/p/${placeId}/m/${machine._id}`}
                  >
                    {idx + 1}
                  </Link>
                );
              })}
            </div>
          </>
        ) : null}

        {/* Quick actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <Link style={css.btnPrimary} to={`/p/${placeId}/devices/add`}>
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M12 5v14M5 12h14" /></svg>
            Add Device
          </Link>
          <Link style={css.btnSecondary} to={`/p/${placeId}/users`}>
            Manage Users
          </Link>
        </div>

        {/* Empty state */}
        {machines?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.625rem" }}>No machines yet</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: 300, margin: "0 auto 1.5rem" }}>Add your first device to start monitoring this place.</p>
            <Link style={css.btnPrimary} to={`/p/${placeId}/devices/add`}>Add Device</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Machine list ─────────────────────────────────────────────────────────────

function MachinesPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const machines = useQuery(api.machines.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const groups = useQuery(api.groups.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const createMachine = useMutation(api.machines.create);

  const [showCreate, setShowCreate] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineType, setNewMachineType] = useState<"washer" | "dryer">("washer");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "idle" | "running" | "complete" | "offline">("all");
  const [filterType, setFilterType] = useState<"all" | "washer" | "dryer">("all");
  const [creating, setCreating] = useState(false);

  if (place === null) return <DashNotFoundPage />;

  async function handleCreateMachine() {
    if (!placeId || !newMachineName.trim()) return;
    setCreating(true);
    try {
      await createMachine({ placeId: placeId as Id<"places">, name: newMachineName.trim(), type: newMachineType });
      setShowCreate(false);
      setNewMachineName("");
    } finally {
      setCreating(false);
    }
  }

  const filteredMachines = machines?.filter((machine) => {
    const displayState = deriveDisplayState(
      machine.state,
      machine.lastStateChangeAt,
      machine.lastHeartbeatAt,
      machine.previousState,
    );

    if (filterGroup !== "all" && machine.groupName !== filterGroup) {
      return false;
    }
    if (filterStatus !== "all" && displayState !== filterStatus) {
      return false;
    }
    if (filterType !== "all" && machine.type !== filterType) {
      return false;
    }

    return true;
  });

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo="/p" title={place?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>Machines</h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-full)", padding: "0.25rem", gap: "0.25rem" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{ ...css.btnSecondary, minHeight: 36, padding: "0.5rem 0.875rem", background: viewMode === "grid" ? "var(--bg-surface-1)" : "transparent", border: viewMode === "grid" ? "2px solid var(--border-default)" : "2px solid transparent" }}
                type="button"
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                style={{ ...css.btnSecondary, minHeight: 36, padding: "0.5rem 0.875rem", background: viewMode === "table" ? "var(--bg-surface-1)" : "transparent", border: viewMode === "table" ? "2px solid var(--border-default)" : "2px solid transparent" }}
                type="button"
              >
                Table
              </button>
            </div>
            <button onClick={() => setShowCreate(true)} style={css.btnPrimary} type="button">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M12 5v14M5 12h14" /></svg>
              Add Machine
            </button>
          </div>
        </div>

        <div style={{ ...css.card, marginBottom: "1.25rem", padding: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <div>
              <label style={css.formLabel} htmlFor="machine-filter-group">Group</label>
              <select
                id="machine-filter-group"
                onChange={(e) => setFilterGroup(e.target.value)}
                style={css.formSelect}
                value={filterGroup}
              >
                <option value="all">All Groups</option>
                {groups?.map((group) => (
                  <option key={group._id} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={css.formLabel} htmlFor="machine-filter-status">Status</label>
              <select
                id="machine-filter-status"
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                style={css.formSelect}
                value={filterStatus}
              >
                <option value="all">All Statuses</option>
                <option value="idle">Available</option>
                <option value="running">Running</option>
                <option value="complete">Done</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label style={css.formLabel} htmlFor="machine-filter-type">Type</label>
              <select
                id="machine-filter-type"
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                style={css.formSelect}
                value={filterType}
              >
                <option value="all">All Types</option>
                <option value="washer">Washer</option>
                <option value="dryer">Dryer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Machine grid */}
        {machines === undefined ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={css.card}>
                <div className="skeleton" style={{ height: 20, width: "60%", borderRadius: 10, marginBottom: "1rem" }} />
                <div className="skeleton" style={{ height: 14, width: "80%", borderRadius: 7 }} />
              </div>
            ))}
          </div>
        ) : machines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.625rem" }}>No machines yet</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1.5rem" }}>Add a machine entry, then claim a device for it.</p>
            <button onClick={() => setShowCreate(true)} style={css.btnPrimary} type="button">Add Machine</button>
          </div>
        ) : filteredMachines && filteredMachines.length === 0 ? (
          <div style={{ ...css.card, textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No matching machines
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Adjust the filters to see more machines.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {filteredMachines?.map((machine) => {
              const displayState = deriveDisplayState(machine.state, machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState);
              return (
                <div key={machine._id} style={css.card}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: "0.25rem" }}>{machine.name}</h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {machine.type}{machine.groupName ? ` • ${machine.groupName}` : ""}
                      </p>
                    </div>
                    <StatusBadge displayState={displayState} />
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    {machineStatusCopy(machine.state, machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState, machine.cycleStartedAt ?? undefined)}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <Link style={{ ...css.btnSecondary, fontSize: "0.875rem", padding: "0.5rem 1rem", minHeight: 36 }} to={`/p/${placeId}/m/${machine._id}`}>
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ ...css.card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  {["Name", "Type", "Group", "Status", "Device", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMachines?.map((machine) => {
                  const displayState = deriveDisplayState(
                    machine.state,
                    machine.lastStateChangeAt,
                    machine.lastHeartbeatAt,
                    machine.previousState,
                  );
                  return (
                    <tr key={machine._id}>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)", fontWeight: 600 }}>{machine.name}</td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)", textTransform: "capitalize", color: "var(--text-secondary)" }}>{machine.type}</td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>{machine.groupName ?? "—"}</td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <StatusBadge displayState={displayState} />
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                        {machine.deviceIdHex ? <code style={css.mono}>{machine.deviceIdHex}</code> : "Unlinked"}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <Link style={{ ...css.btnSecondary, fontSize: "0.875rem", padding: "0.5rem 1rem", minHeight: 36 }} to={`/p/${placeId}/m/${machine._id}`}>
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add machine modal */}
      {showCreate ? (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }} style={{ position: "fixed", inset: 0, background: "rgba(5,9,18,0.8)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-default)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 420, boxShadow: "0 12px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "2px solid var(--border-subtle)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1.125rem" }}>Add Machine</h3>
              <button onClick={() => setShowCreate(false)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-surface-2)", border: "none", borderRadius: "var(--radius-full)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.125rem" }} type="button">&times;</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={css.formLabel} htmlFor="machine-name">Name</label>
                <input autoFocus id="machine-name" onChange={(e) => setNewMachineName(e.target.value)} placeholder="e.g. Washer 3" style={css.formInput} value={newMachineName} />
              </div>
              <div>
                <label style={css.formLabel} htmlFor="machine-type">Type</label>
                <select id="machine-type" onChange={(e) => setNewMachineType(e.target.value as "washer" | "dryer")} style={css.formSelect} value={newMachineType}>
                  <option value="washer">Washer</option>
                  <option value="dryer">Dryer</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1rem 1.5rem", borderTop: "2px solid var(--border-subtle)" }}>
              <button onClick={() => setShowCreate(false)} style={{ background: "transparent", color: "var(--text-secondary)", border: "none", cursor: "pointer", padding: "0.625rem 1.25rem", borderRadius: "var(--radius-full)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", minHeight: 44 }} type="button">Cancel</button>
              <button disabled={!newMachineName.trim() || creating} onClick={() => void handleCreateMachine()} style={{ ...css.btnPrimary, opacity: !newMachineName.trim() || creating ? 0.6 : 1 }} type="button">{creating ? "Adding..." : "Add Machine"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function startOfTodayTimestamp() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function CycleHistoryChart({
  cycles,
  windowMs,
}: {
  cycles: Array<{ _id: string; startedAt: number; endedAt: number; durationMs: number }>;
  windowMs: number;
}) {
  if (cycles.length === 0) {
    return (
      <div style={{ ...css.card, background: "var(--bg-surface-2)", textAlign: "center", color: "var(--text-muted)" }}>
        No cycles recorded in this range yet.
      </div>
    );
  }

  const rangeStart = Date.now() - windowMs;

  return (
    <div style={{ ...css.card, background: "var(--bg-surface-2)", padding: "1rem" }}>
      <svg height="180" style={{ width: "100%", display: "block" }} viewBox="0 0 100 180" preserveAspectRatio="none">
        <line x1="0" x2="100" y1="170" y2="170" stroke="var(--border-default)" strokeWidth="1" />
        {cycles
          .slice()
          .sort((left, right) => left.startedAt - right.startedAt)
          .map((cycle) => {
            const startRatio = Math.max(0, (cycle.startedAt - rangeStart) / windowMs);
            const widthRatio = Math.max(0.04, cycle.durationMs / windowMs);
            const x = startRatio * 100;
            const width = Math.min(100 - x, widthRatio * 100);

            return (
              <rect
                key={cycle._id}
                x={x}
                y={36}
                width={width}
                height={118}
                rx={3}
                fill="url(#cycleGradient)"
                opacity="0.95"
              />
            );
          })}
        <defs>
          <linearGradient id="cycleGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0DA6E7" />
            <stop offset="100%" stopColor="#06CBD5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Machine detail ───────────────────────────────────────────────────────────

function MachineDetailPage() {
  const { placeId, machineId } = useParams<{ placeId: string; machineId: string }>();
  const navigate = useNavigate();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const machine = useQuery(
    api.machines.getById,
    placeId && machineId
      ? { placeId: placeId as Id<"places">, machineId: machineId as Id<"machines"> }
      : "skip",
  );
  const groups = useQuery(api.groups.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const [selectedRangeMs, setSelectedRangeMs] = useState(24 * 60 * 60_000);
  const cycles = useQuery(
    api.cycles.listForMachine,
    placeId && machineId
      ? {
          placeId: placeId as Id<"places">,
          machineId: machineId as Id<"machines">,
          windowMs: selectedRangeMs,
        }
      : "skip",
  );
  const todayCycles = useQuery(
    api.cycles.listForMachine,
    placeId && machineId
      ? {
          placeId: placeId as Id<"places">,
          machineId: machineId as Id<"machines">,
          windowMs: Math.max(60_000, Date.now() - startOfTodayTimestamp()),
        }
      : "skip",
  );

  const updateMachine = useMutation(api.machines.update);
  const unlinkDevice = useMutation(api.machines.unlinkDevice);
  const removeMachine = useMutation(api.machines.remove);
  const [editName, setEditName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [removeConfirmName, setRemoveConfirmName] = useState("");
  const [removingMachine, setRemovingMachine] = useState(false);

  useEffect(() => {
    if (machine) {
      setEditName(machine.name);
      setSelectedGroupId(machine.groupId ?? "");
    }
  }, [machine]);

  if (machine === null) return <DashNotFoundPage />;

  const displayState = machine
    ? deriveDisplayState(machine.state, machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState)
    : "off";
  const placeRole = place && "role" in place ? place.role : null;
  const canManageMachine = placeRole === "admin" || placeRole === "owner";
  const rangeOptions: Array<{ label: string; value: number }> = [
    { label: "1h", value: 60 * 60_000 },
    { label: "6h", value: 6 * 60 * 60_000 },
    { label: "24h", value: 24 * 60 * 60_000 },
    { label: "7d", value: 7 * 24 * 60 * 60_000 },
  ];

  async function handleSave() {
    if (!machineId || !editName.trim()) return;
    setSaving(true);
    try {
      await updateMachine({
        machineId: machineId as Id<"machines">,
        name: editName.trim(),
        ...(selectedGroupId
          ? { groupId: selectedGroupId as Id<"groups"> }
          : { clearGroup: true }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink() {
    if (!machineId) return;
    await unlinkDevice({ machineId: machineId as Id<"machines"> });
    setConfirmUnlink(false);
  }

  async function handleRemoveMachine() {
    if (!machineId || removeConfirmName !== machine?.name) return;
    setRemovingMachine(true);
    try {
      await removeMachine({ machineId: machineId as Id<"machines"> });
      navigate(`/p/${placeId}/machines`);
    } finally {
      setRemovingMachine(false);
    }
  }

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo={`/p/${placeId}/machines`} title={machine?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {/* Status card */}
          <div style={css.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, marginBottom: "0.25rem" }}>{machine?.name ?? "..."}</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{machine?.type}</p>
              </div>
              <StatusBadge displayState={displayState} />
            </div>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
              {machine ? machineStatusCopy(machine.state, machine.lastStateChangeAt, machine.lastHeartbeatAt, machine.previousState, machine.cycleStartedAt ?? undefined) : ""}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              Cycles today: {todayCycles?.length ?? "—"}
            </p>
          </div>

          {/* Device info */}
          <div style={css.card}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Linked Device</h2>
            {machine?.deviceIdHex ? (
              <>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Device ID: <span style={css.mono}>{machine.deviceIdHex}</span>
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Firmware: {machine.firmwareVersion ?? "Unknown"}
                </p>
                {machine.lastSeenAt ? (
                  <p style={{ fontSize: "0.875rem", color: machine.deviceOnline ? "var(--success)" : "var(--error)" }}>
                    {machine.deviceOnline ? `Online, last seen ${formatRelativeTime(machine.lastSeenAt)}` : `Offline since ${formatRelativeTime(machine.lastSeenAt)}`}
                  </p>
                ) : null}
              </>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No device linked yet.</p>
            )}
          </div>
        </div>

        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                History
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Usage history for this machine.
              </p>
            </div>
            <div style={{ display: "inline-flex", gap: "0.25rem", padding: "0.25rem", background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-full)" }}>
              {rangeOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedRangeMs(option.value)}
                  style={{ ...css.btnSecondary, minHeight: 36, padding: "0.5rem 0.875rem", background: selectedRangeMs === option.value ? "var(--bg-surface-1)" : "transparent", border: selectedRangeMs === option.value ? "2px solid var(--border-default)" : "2px solid transparent" }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <CycleHistoryChart cycles={cycles ?? []} windowMs={selectedRangeMs} />

          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Recent Cycles</h3>
            {cycles === undefined ? (
              <div className="skeleton" style={{ height: 56, borderRadius: 12 }} />
            ) : cycles.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No completed cycles in the selected time range.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {cycles.slice(0, 8).map((cycle) => (
                  <div key={cycle._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.875rem 1rem", background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{formatTimestamp(cycle.startedAt)}</p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        Finished {formatRelativeTime(cycle.endedAt)}
                      </p>
                    </div>
                    <span style={{ color: "var(--primary-400)", fontWeight: 700 }}>
                      {formatDuration(cycle.durationMs)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Machine settings */}
        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem" }}>Machine Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={css.formLabel} htmlFor="edit-machine-name">Machine name</label>
              <input id="edit-machine-name" onChange={(e) => setEditName(e.target.value)} style={css.formInput} value={editName} />
            </div>
            <div>
              <label style={{ ...css.formLabel }}>Type</label>
              <div style={{ ...css.formInput, display: "flex", alignItems: "center", textTransform: "capitalize" }}>
                {machine?.type ?? "—"}
              </div>
            </div>
            <div>
              <label style={css.formLabel} htmlFor="edit-machine-group">Group</label>
              <select
                id="edit-machine-group"
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={css.formSelect}
                value={selectedGroupId}
              >
                <option value="">No group</option>
                {groups?.map((group) => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button disabled={!editName.trim() || saving || (editName === machine?.name && selectedGroupId === (machine?.groupId ?? ""))} onClick={() => void handleSave()} style={{ ...css.btnPrimary, opacity: !editName.trim() || saving || (editName === machine?.name && selectedGroupId === (machine?.groupId ?? "")) ? 0.6 : 1 }} type="button">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Danger zone */}
        {(machine?.deviceIdHex || canManageMachine) ? (
          <div style={{ ...css.card, borderColor: "var(--error-border)", background: "var(--error-soft)" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--error)" }}>
              Danger Zone
            </h2>
            {machine?.deviceIdHex ? (
              <div style={{ marginBottom: canManageMachine ? "1.25rem" : 0 }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1rem" }}>
                  Remove the linked device from this machine. The device will lose its API key and re-enter provisioning mode.
                </p>
                {confirmUnlink ? (
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button onClick={() => void handleUnlink()} style={{ ...css.btnPrimary, background: "var(--error)" }} type="button">Yes, Remove Device</button>
                    <button onClick={() => setConfirmUnlink(false)} style={css.btnSecondary} type="button">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmUnlink(true)} style={{ ...css.btnSecondary, borderColor: "var(--error)", color: "var(--error)" }} type="button">Remove Device</button>
                )}
              </div>
            ) : null}

            {canManageMachine ? (
              <div style={{ borderTop: machine?.deviceIdHex ? "1px solid var(--error-border)" : "none", paddingTop: machine?.deviceIdHex ? "1.25rem" : 0 }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
                  Permanently remove this machine from the place.
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ ...css.formLabel, color: "var(--text-secondary)" }}>
                    Type <strong>{machine?.name}</strong> to confirm
                  </label>
                  <input
                    onChange={(e) => setRemoveConfirmName(e.target.value)}
                    placeholder={machine?.name}
                    style={css.formInput}
                    value={removeConfirmName}
                  />
                </div>
                <button
                  disabled={removeConfirmName !== machine?.name || removingMachine}
                  onClick={() => void handleRemoveMachine()}
                  style={{ ...css.btnPrimary, background: "var(--error)", opacity: removeConfirmName !== machine?.name || removingMachine ? 0.6 : 1 }}
                  type="button"
                >
                  {removingMachine ? "Removing..." : "Remove Machine"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Devices ──────────────────────────────────────────────────────────────────

function DevicesPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const devices = useQuery(api.devices.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const pendingClaims = useQuery(api.devices.listPendingClaimsForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");

  if (place === null) return <DashNotFoundPage />;

  const offlineCount = devices?.filter((d) => !d.online).length ?? 0;
  const firmwareVersions = devices?.flatMap((device) => device.firmwareVersion ? [device.firmwareVersion] : []) ?? [];
  const latestVersion = firmwareVersions.length > 0
    ? firmwareVersions.reduce((latest, version) => version > latest ? version : latest)
    : "—";

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo="/p" title={place?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Devices", value: devices?.length ?? "—" },
            { label: "Offline", value: offlineCount, error: offlineCount > 0 },
            { label: "Pending Claims", value: pendingClaims?.length ?? "—" },
            { label: "Latest Firmware", value: latestVersion },
          ].map((stat) => (
            <div key={stat.label} style={{ ...css.card, ...(stat.error ? { background: "var(--error-soft)", borderColor: "var(--error-border)" } : {}) }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
          <Link style={css.btnPrimary} to={`/p/${placeId}/devices/add`}>
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M12 5v14M5 12h14" /></svg>
            Add Device
          </Link>
        </div>

        {/* Device list */}
        {devices === undefined ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {[1, 2].map((i) => <div key={i} style={css.card}><div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 7 }} /></div>)}
          </div>
        ) : devices.length === 0 && (!pendingClaims || pendingClaims.length === 0) ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.625rem" }}>No devices yet</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Add your first device to start claiming it.</p>
            <Link style={css.btnPrimary} to={`/p/${placeId}/devices/add`}>Add Device</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {devices.map((device) => (
              <div key={device.id} style={css.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <code style={css.mono}>{device.deviceId}</code>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: device.online ? "var(--success-soft)" : "var(--error-soft)", border: `1px solid ${device.online ? "var(--success-border)" : "var(--error-border)"}`, color: device.online ? "var(--success)" : "var(--error)" }}>
                    {device.online ? "Online" : "Offline"}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Machine: {device.machineName ?? "Unassigned"}
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Firmware: {device.firmwareVersion ?? "Unknown"}
                </p>
                {device.lastSeenAt ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {device.online ? "Seen " : "Offline since "}{formatRelativeTime(device.lastSeenAt)}
                  </p>
                ) : null}
              </div>
            ))}

            {/* Pending claims */}
            {pendingClaims?.map((claim) => (
              <div key={claim.id} style={{ ...css.card, borderColor: "var(--warning-border)", background: "var(--warning-soft)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <code style={{ ...css.mono, color: "var(--warning)" }}>{claim.deviceId}</code>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: "var(--warning-soft)", border: "1px solid var(--warning-border)", color: "var(--warning)" }}>
                    Pending
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                  Assigned to: {claim.machineName ?? "Unknown machine"}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Expires {formatTimestamp(claim.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add device wizard ────────────────────────────────────────────────────────

function AddDevicePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const machines = useQuery(api.machines.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const createPendingClaim = useMutation(api.devices.createPendingClaim);

  const [step, setStep] = useState<1 | 2 | 3 | "success" | "timeout" | "error">(1);
  const [deviceId, setDeviceId] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [deviceType, setDeviceType] = useState<"washer" | "dryer">("washer");
  const [newMachineName, setNewMachineName] = useState("");
  const [createNew, setCreateNew] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [watchingClaim, setWatchingClaim] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const createMachine = useMutation(api.machines.create);
  const navigate = useNavigate();

  if (place === null) return <DashNotFoundPage />;

  const cleanDeviceId = deviceId.trim().toUpperCase();
  const validDeviceId = /^[0-9A-F]{12}$/.test(cleanDeviceId);
  const pendingClaim = useQuery(
    api.devices.getPendingClaimByDeviceId,
    watchingClaim && placeId && validDeviceId
      ? { placeId: placeId as Id<"places">, deviceId: cleanDeviceId }
      : "skip",
  );

  useEffect(() => {
    if (watchingClaim && pendingClaim === null) {
      setWatchingClaim(false);
      setStep("success");
    }
  }, [watchingClaim, pendingClaim]);

  useEffect(() => {
    if (!watchingClaim) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setWatchingClaim(false);
      setStep("timeout");
    }, 5 * 60_000);

    return () => window.clearTimeout(timeout);
  }, [watchingClaim]);

  async function handleStep2() {
    if (!validDeviceId) {
      setErrorMsg("Enter a valid 12-character device ID (uppercase hex only).");
      return;
    }
    setErrorMsg("");
    setStep(2);
  }

  async function handleStep3() {
    setClaiming(true);
    setErrorMsg("");

    try {
      let machineId = selectedMachineId as Id<"machines"> | undefined;

      if (createNew && placeId) {
        const newId = await createMachine({
          placeId: placeId as Id<"places">,
          name: newMachineName.trim() || "New Machine",
          type: deviceType,
        });
        machineId = newId;
      }

      if (!machineId || !placeId) throw new Error("Missing machine");

      await createPendingClaim({
        placeId: placeId as Id<"places">,
        machineId,
        deviceId: cleanDeviceId,
        type: deviceType,
      });
      setWatchingClaim(true);
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("already_claimed") || msg.includes("device_already_claimed")) {
        setWatchingClaim(false);
        setStep("error");
      } else {
        setErrorMsg(msg);
        setWatchingClaim(false);
        setStep(2);
      }
    } finally {
      setClaiming(false);
    }
  }

  const stepIndicatorColors = {
    done: "var(--success)",
    current: "var(--primary-400)",
    future: "var(--border-default)",
  };

  function dotStyle(dotStep: 1 | 2 | 3) {
    const current = typeof step === "number" ? step : 4;
    const state = dotStep < current ? "done" : dotStep === current ? "current" : "future";
    return {
      width: state === "current" ? 14 : 10,
      height: state === "current" ? 14 : 10,
      borderRadius: "50%",
      background: stepIndicatorColors[state],
      boxShadow: state === "current" ? "0 0 12px rgba(13,166,231,0.5)" : "none",
      transition: "all var(--transition-fast)",
    };
  }

  return (
    <div style={{ ...css.page, paddingBottom: 80 }}>
      {/* Header */}
      <header style={css.header}>
        <div style={{ ...css.headerInner, maxWidth: 520 }}>
          <Link style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, minWidth: 44, borderRadius: "var(--radius-full)", border: "2px solid var(--border-default)", background: "var(--bg-surface-2)", color: "var(--text-secondary)", textDecoration: "none", flexShrink: 0 }} to={`/p/${placeId}/devices`}>
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem", fontWeight: 600, flex: 1 }}>Add Device</h1>
        </div>
      </header>

      {/* Step indicator (shown for steps 1-3) */}
      {typeof step === "number" && step <= 3 ? (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {[1, 2, 3].map((s, idx) => (
              <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: idx < 2 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={dotStyle(s as 1 | 2 | 3)} />
                  <span style={{ fontSize: "0.6875rem", color: s === (typeof step === "number" ? step : 4) ? "var(--primary-400)" : s < (typeof step === "number" ? step : 4) ? "var(--success)" : "var(--text-muted)", fontWeight: s === (typeof step === "number" ? step : 4) ? 700 : 400, marginTop: "0.5rem", textAlign: "center", maxWidth: 70 }}>
                    {["Enter ID", "Assign", "Connect"][idx]}
                  </span>
                </div>
                {idx < 2 ? (
                  <div style={{ flex: 1, height: 2, background: typeof step === "number" && step > s ? "var(--success)" : "var(--border-subtle)", margin: "4px 4px 0" }} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>

          {/* Step 1 */}
          {step === 1 ? (
            <>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Enter Device ID</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Find the device ID on the label on the device</p>

              {/* ASCII label illustration */}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem", whiteSpace: "pre", lineHeight: 1.5 }}>
                {`┌─────────────────────────────┐\n│  LaundryIQ Smart Plug       │\n│                             │\n│  Device ID: A1B2C3D4E5F6    │\n│  ─────────────────────────  │\n│  Serial: 2024-001234        │\n└─────────────────────────────┘`}
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={css.formLabel} htmlFor="device-id-field">Device ID</label>
                <input
                  autoFocus
                  id="device-id-field"
                  maxLength={12}
                  onChange={(e) => { setDeviceId(e.target.value.toUpperCase()); setErrorMsg(""); }}
                  placeholder="XXXXXXXXXXXX"
                  style={{ ...css.formInput, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
                  value={deviceId}
                />
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>12 uppercase hex characters (0-9, A-F)</p>
                {errorMsg ? <p style={{ fontSize: "0.875rem", color: "var(--error)", marginTop: "0.5rem" }}>{errorMsg}</p> : null}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9375rem", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }} to={`/p/${placeId}/devices`}>
                  Cancel
                </Link>
                <button onClick={() => void handleStep2()} style={css.btnPrimary} type="button">Next</button>
              </div>
            </>
          ) : null}

          {/* Step 2 */}
          {step === 2 ? (
            <>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Assign to Machine</h2>
              <div style={{ marginBottom: "1.5rem" }}>
                <code style={{ ...css.mono, fontSize: "0.875rem", display: "inline-block", padding: "0.375rem 0.75rem", background: "var(--info-soft)", border: "1px solid var(--info-border)", borderRadius: "var(--radius-full)" }}>{cleanDeviceId}</code>
              </div>

              {/* Create new vs existing */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div onClick={() => setCreateNew(true)} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", border: `2px solid ${createNew ? "var(--primary-400)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-lg)", cursor: "pointer", background: createNew ? "var(--info-soft)" : "transparent", marginBottom: "0.75rem" }}>
                  <input checked={createNew} onChange={() => setCreateNew(true)} style={{ marginTop: "0.25rem", accentColor: "var(--primary-400)" }} type="radio" />
                  <div style={{ flex: 1 }}>
                    <strong>Create new machine</strong>
                    {createNew ? (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", display: "grid", gap: "0.75rem" }}>
                        <div>
                          <label style={css.formLabel} htmlFor="new-machine-name">Name</label>
                          <input id="new-machine-name" onChange={(e) => setNewMachineName(e.target.value)} placeholder="e.g. Washer 3" style={css.formInput} value={newMachineName} />
                        </div>
                        <div>
                          <label style={css.formLabel} htmlFor="new-machine-type">Type</label>
                          <select id="new-machine-type" onChange={(e) => setDeviceType(e.target.value as "washer" | "dryer")} style={css.formSelect} value={deviceType}>
                            <option value="washer">Washer</option>
                            <option value="dryer">Dryer</option>
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {(machines && machines.length > 0) ? (
                  <div onClick={() => setCreateNew(false)} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", border: `2px solid ${!createNew ? "var(--primary-400)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-lg)", cursor: "pointer", background: !createNew ? "var(--info-soft)" : "transparent" }}>
                    <input checked={!createNew} onChange={() => setCreateNew(false)} style={{ marginTop: "0.25rem", accentColor: "var(--primary-400)" }} type="radio" />
                    <div style={{ flex: 1 }}>
                      <strong>Assign to existing machine</strong>
                      {!createNew ? (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                          <select onChange={(e) => setSelectedMachineId(e.target.value)} style={css.formSelect} value={selectedMachineId}>
                            <option value="">Select machine...</option>
                            {machines.filter((m) => !m.deviceId).map((m) => (
                              <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(1)} style={css.btnSecondary} type="button">Back</button>
                <button onClick={() => void handleStep3()} style={css.btnPrimary} type="button">Next</button>
              </div>
            </>
          ) : null}

          {/* Step 3 */}
          {step === 3 ? (
            <>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Connect Device</h2>
              <div style={{ background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1.5rem" }}>
                Device <code style={css.mono}>{cleanDeviceId}</code>
              </div>

              <ol style={{ listStyle: "none", margin: "0 0 1.5rem", padding: 0 }}>
                {[
                  { icon: <svg fill="none" height="20" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>, text: "Power on the device" },
                  { icon: <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface-2)", border: "2px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>2</span>, text: <span>On your phone, connect to WiFi: <strong style={css.mono}>{`LaundryIQ-${cleanDeviceId}`}</strong></span> },
                  { icon: <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface-2)", border: "2px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>3</span>, text: "A setup page will open. Enter your building's WiFi credentials." },
                  { icon: <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface-2)", border: "2px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0 }}>4</span>, text: "The device will connect and appear here automatically." },
                ].map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.75rem 0", borderBottom: idx < 3 ? "1px solid var(--border-subtle)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ fontSize: "0.9375rem" }}>{item.text}</div>
                  </li>
                ))}
              </ol>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.25rem", background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }}>
                <Spinner size={24} />
                <span>{claiming ? "Creating claim..." : "Waiting for device to connect..."}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(2)} style={css.btnSecondary} type="button">Back</button>
                <button onClick={() => { setWatchingClaim(false); setStep("timeout"); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9375rem", minHeight: 44 }} type="button">Cancel</button>
              </div>
            </>
          ) : null}

          {/* Success */}
          {step === "success" ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: "var(--success-soft)", border: "2px solid var(--success-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg fill="none" height="40" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="40"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Device connected!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>The machine is now online and monitoring.</p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setStep(1); setDeviceId(""); setNewMachineName(""); }} style={css.btnSecondary} type="button">Add Another Device</button>
                <Link style={css.btnPrimary} to={`/p/${placeId}/devices`}>Done</Link>
              </div>
            </div>
          ) : null}

          {/* Timeout */}
          {step === "timeout" ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 1rem", borderRadius: "50%", background: "var(--warning-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg fill="none" height="32" stroke="var(--warning)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="32"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Device not connecting?</h2>
              <ul style={{ listStyle: "none", maxWidth: 320, margin: "0 auto 1.5rem", textAlign: "left" }}>
                {["Make sure the device is powered on", "Check you connected to the right WiFi network", "Try entering WiFi credentials again"].map((tip) => (
                  <li key={tip} style={{ padding: "0.5rem 0 0.5rem 1.5rem", position: "relative", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                    <span style={{ position: "absolute", left: 0, color: "var(--warning)" }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setWatchingClaim(true); setStep(3); }} style={css.btnPrimary} type="button">Try Again</button>
                <button onClick={() => setStep(1)} style={css.btnSecondary} type="button">Cancel</button>
              </div>
            </div>
          ) : null}

          {/* Error: already claimed */}
          {step === "error" ? (
            <>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Device already claimed</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>This device ID is already claimed by another place.</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setStep(1)} style={css.btnSecondary} type="button">Cancel</button>
                <button onClick={() => { setStep(1); setDeviceId(""); }} style={css.btnPrimary} type="button">Enter Different ID</button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const members = useQuery(api.members.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const invites = useQuery(api.invites.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const createInvite = useMutation(api.invites.create);
  const [inviteRole, setInviteRole] = useState<"viewer" | "admin">("viewer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  if (place === null) return <DashNotFoundPage />;

  const roleColors: Record<string, { bg: string; border: string; color: string }> = {
    owner: { bg: "var(--info-soft)", border: "var(--info-border)", color: "var(--info)" },
    admin: { bg: "var(--warning-soft)", border: "var(--warning-border)", color: "var(--warning)" },
    viewer: { bg: "var(--bg-surface-2)", border: "var(--border-subtle)", color: "var(--text-secondary)" },
  };

  async function handleCreateInvite() {
    if (!placeId) return;
    setGenerating(true);
    try {
      const token = await createInvite({ placeId: placeId as Id<"places">, role: inviteRole, email: inviteEmail.trim() || undefined });
      setGeneratedToken(token);
      setInviteEmail("");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo="/p" title={place?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>

        {/* Member list */}
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Members</h2>
        {members === undefined ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[1, 2].map((i) => <div key={i} style={css.card}><div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 7 }} /></div>)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {members.map((member) => {
              const colors = roleColors[member.role] ?? roleColors.viewer;
              return (
                <div key={member.membershipId} style={css.card}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {(member.name ?? member.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: "0.125rem" }}>{member.name ?? "Unknown"}</p>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{member.email ?? "—"}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                      {member.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invite section */}
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Invite Access</h2>
        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={{ ...css.formLabel, fontSize: "0.8125rem", color: "var(--text-secondary)" }} htmlFor="invite-role">Role</label>
              <select id="invite-role" onChange={(e) => setInviteRole(e.target.value as "viewer" | "admin")} style={css.formSelect} value={inviteRole}>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ ...css.formLabel, fontSize: "0.8125rem", color: "var(--text-secondary)" }} htmlFor="invite-email">Track by email (optional)</label>
              <input id="invite-email" onChange={(e) => setInviteEmail(e.target.value)} placeholder="student@example.com" style={css.formInput} value={inviteEmail} />
            </div>
          </div>
          <button disabled={generating} onClick={() => void handleCreateInvite()} style={{ ...css.btnPrimary, opacity: generating ? 0.6 : 1 }} type="button">
            {generating ? "Generating..." : "Create Invite Link"}
          </button>

          {generatedToken ? (
            <div style={{ marginTop: "1.25rem", padding: "1rem", background: "var(--bg-surface-2)", borderRadius: "var(--radius-lg)", border: "2px solid var(--success-border)" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--success)", fontWeight: 700, marginBottom: "0.5rem" }}>Invite link generated!</p>
              <code style={{ ...css.mono, wordBreak: "break-all", fontSize: "0.875rem" }}>
                {`${PORTAL_URL}/invite/${generatedToken}`}
              </code>
              <button
                onClick={() => void navigator.clipboard.writeText(`${PORTAL_URL}/invite/${generatedToken}`)}
                style={{ ...css.btnSecondary, marginTop: "0.75rem", fontSize: "0.875rem", padding: "0.5rem 1rem", minHeight: 36 }}
                type="button"
              >
                Copy
              </button>
            </div>
          ) : null}
        </div>

        {/* Pending invites */}
        {invites && invites.length > 0 ? (
          <>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Pending Invites</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {invites.map((invite) => (
                <div key={invite.id} style={css.card}>
                  <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{invite.email ?? "Shareable invite link"}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}>Role: {invite.role}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Expires {formatTimestamp(invite.expiresAt)}</p>
                  <code style={{ ...css.mono, fontSize: "0.75rem", display: "block", wordBreak: "break-all" }}>{invite.token}</code>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Place settings ───────────────────────────────────────────────────────────

function PlaceSettingsPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const place = useQuery(api.places.getById, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const groups = useQuery(api.groups.listForPlace, placeId ? { placeId: placeId as Id<"places"> } : "skip");
  const updateName = useMutation(api.places.updateName);
  const removePlace = useMutation(api.places.remove);
  const createGroup = useMutation(api.groups.create);
  const deleteGroup = useMutation(api.groups.remove);

  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);

  useEffect(() => {
    if (place) setEditName(place.name);
  }, [place?.name]);

  if (place === null) return <DashNotFoundPage />;

  async function handleSaveName() {
    if (!placeId || !editName.trim()) return;
    setSaving(true);
    try { await updateName({ placeId: placeId as Id<"places">, name: editName.trim() }); }
    finally { setSaving(false); }
  }

  async function handleDeletePlace() {
    if (!placeId || confirmDelete !== place?.name) return;
    setDeleting(true);
    try {
      await removePlace({ placeId: placeId as Id<"places">, confirmName: confirmDelete });
      navigate("/p");
    } finally { setDeleting(false); }
  }

  async function handleAddGroup() {
    if (!placeId || !newGroupName.trim()) return;
    setAddingGroup(true);
    try { await createGroup({ placeId: placeId as Id<"places">, name: newGroupName.trim() }); setNewGroupName(""); }
    finally { setAddingGroup(false); }
  }

  return (
    <div style={{ ...css.page, paddingBottom: 60 }}>
      <DashHeader backTo="/p" title={place?.name ?? "..."} />
      <PlaceTabs placeId={placeId!} />
      <div style={css.content}>

        {/* General */}
        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem" }}>General</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={css.formLabel} htmlFor="place-name-edit">Place name</label>
              <input id="place-name-edit" onChange={(e) => setEditName(e.target.value)} style={css.formInput} value={editName} />
            </div>
            <div>
              <label style={{ ...css.formLabel, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Place ID</label>
              <div style={{ ...css.formInput, display: "flex", alignItems: "center" }}>
                <code style={css.mono}>{placeId}</code>
              </div>
            </div>
          </div>
          <button disabled={!editName.trim() || saving || editName === place?.name} onClick={() => void handleSaveName()} style={{ ...css.btnPrimary, opacity: !editName.trim() || saving || editName === place?.name ? 0.6 : 1 }} type="button">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Groups */}
        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Groups</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
            Groups let residents filter machines by floor, pod, or area in the portal.
          </p>

          {groups && groups.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {groups.map((group) => (
                <div key={group._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "var(--bg-surface-2)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontWeight: 600 }}>{group.name}</span>
                  <button onClick={() => void deleteGroup({ groupId: group._id })} style={{ background: "transparent", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.875rem", fontFamily: "var(--font-body)", fontWeight: 600, minHeight: 36 }} type="button">Delete</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>No groups yet. Home setups usually don't need groups.</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input onChange={(e) => setNewGroupName(e.target.value)} placeholder="New group name" style={{ ...css.formInput, flex: 1 }} value={newGroupName} />
            <button disabled={!newGroupName.trim() || addingGroup} onClick={() => void handleAddGroup()} style={{ ...css.btnPrimary, flexShrink: 0, opacity: !newGroupName.trim() || addingGroup ? 0.6 : 1 }} type="button">Add</button>
          </div>
        </div>

        {/* Danger zone */}
        {place && "role" in place && place.role === "owner" ? (
          <div style={{ ...css.card, borderColor: "var(--error-border)", background: "var(--error-soft)" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--error)" }}>
              Danger Zone
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1rem" }}>
              Deleting this place removes all machines, devices, and member access.
              This action cannot be undone.
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ ...css.formLabel, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Type <strong>{place.name}</strong> to confirm
              </label>
              <input
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={place.name}
                style={css.formInput}
                value={confirmDelete}
              />
            </div>
            <button
              disabled={confirmDelete !== place.name || deleting}
              onClick={() => void handleDeletePlace()}
              style={{ ...css.btnPrimary, background: "var(--error)", opacity: confirmDelete !== place.name || deleting ? 0.6 : 1 }}
              type="button"
            >
              {deleting ? "Deleting..." : "Delete Place"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Account settings ─────────────────────────────────────────────────────────

function AccountSettingsPage() {
  const { user } = useUser();

  return (
    <div style={css.page}>
      <DashHeader />
      <div style={css.content}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Account Settings</h1>

        <div style={{ ...css.card, marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem" }}>Profile</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            {user?.imageUrl ? (
              <img alt={user.fullName ?? ""} src={user.imageUrl} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-subtle)" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
                {user?.fullName?.charAt(0) ?? "?"}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{user?.fullName ?? "—"}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Account details are managed through Google. To update your name or photo, update your Google profile.
          </p>
        </div>

        <div style={css.card}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>Sign Out</h2>
          <UserButton afterSignOutUrl="/signin" />
        </div>
      </div>
    </div>
  );
}

// ─── 404 ─────────────────────────────────────────────────────────────────────

function DashNotFoundPage() {
  return (
    <div style={{ ...css.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, margin: "0 auto 1.5rem", borderRadius: "50%", background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg fill="none" height="36" stroke="var(--text-muted)" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="36"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
      </div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>Page not found</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: 400, lineHeight: 1.6, marginBottom: "2rem" }}>
        This page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link style={css.btnPrimary} to="/p">Go to Places</Link>
    </div>
  );
}

// ─── Require auth ─────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate replace to="/signin" />;
  return <>{children}</>;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  useUserSync();

  return (
    // >>> WAITLIST GATE — TEMPORARY. Remove the wrapper (keep its children) when going live. See WAITLIST.md.
    <WaitlistGate>
      <BrowserRouter>
        <Routes>
          <Route element={<Navigate replace to="/p" />} path="/" />
          <Route element={<DashAuthPage />} path="/signin" />
          <Route element={<AuthenticateWithRedirectCallback afterSignInUrl="/p" afterSignUpUrl="/p" />} path="/sso-callback" />

          <Route element={<RequireAuth><PlaceListPage /></RequireAuth>} path="/p" />
          <Route element={<RequireAuth><PlaceOverviewPage /></RequireAuth>} path="/p/:placeId" />
          <Route element={<RequireAuth><MachinesPage /></RequireAuth>} path="/p/:placeId/machines" />
          <Route element={<RequireAuth><MachineDetailPage /></RequireAuth>} path="/p/:placeId/m/:machineId" />
          <Route element={<RequireAuth><DevicesPage /></RequireAuth>} path="/p/:placeId/devices" />
          <Route element={<RequireAuth><AddDevicePage /></RequireAuth>} path="/p/:placeId/devices/add" />
          <Route element={<RequireAuth><UsersPage /></RequireAuth>} path="/p/:placeId/users" />
          <Route element={<RequireAuth><PlaceSettingsPage /></RequireAuth>} path="/p/:placeId/settings" />
          <Route element={<RequireAuth><AccountSettingsPage /></RequireAuth>} path="/settings" />
          <Route element={<DashNotFoundPage />} path="*" />
        </Routes>
      </BrowserRouter>
    </WaitlistGate>
    // <<< END WAITLIST GATE WRAPPER
  );
}
