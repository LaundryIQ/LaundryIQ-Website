/**
 * LaundryIQ UI Components
 *
 * Typed React component library faithfully implementing the design from
 * LaundryIQ-UI-Mockup/00-foundations/foundations.html.
 *
 * All styling is done via inline CSS that maps directly to the CSS variables
 * in tokens.css. This allows these components to work across Vite and Next.js
 * apps without requiring a shared PostCSS/Tailwind pipeline.
 *
 * Design constraints:
 * - 2px borders on all container elements (cards, inputs, modals, nav)
 * - 1px for internal dividers only (table rows, section separators within a card)
 * - overflow-x: hidden must be on BOTH html AND body
 * - Minimum 44px touch targets for all interactive elements
 * - Status always communicated with icon + color + text (colorblind accessible)
 */

import type {
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

export type DisplayState = "running" | "idle" | "complete" | "offline" | "off";

function mergeStyle(base: CSSProperties, extra?: CSSProperties): CSSProperties {
  return extra ? { ...base, ...extra } : base;
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export function PageShell({
  children,
  style,
}: PropsWithChildren<{ style?: CSSProperties }>) {
  return (
    <div
      style={mergeStyle(
        {
          background: "var(--bg-page)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          minHeight: "100vh",
          overflowX: "hidden",
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  onClick,
  className,
}: PropsWithChildren<
  Pick<HTMLAttributes<HTMLDivElement>, "style" | "onClick" | "className">
>) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={mergeStyle(
        {
          background: "var(--bg-surface-1)",
          border: "2px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-xl)",
          transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  borderRadius: "var(--radius-full)",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  textDecoration: "none",
  lineHeight: 1,
  minHeight: "44px",
};

const btnVariants: Record<BtnVariant, CSSProperties> = {
  primary: {
    background: "var(--primary-gradient)",
    color: "var(--text-on-primary)",
    boxShadow: "0 2px 12px rgba(13,166,231,0.3)",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "2px solid var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
  },
  danger: {
    background: "var(--error)",
    color: "#fff",
    border: "none",
  },
};

const btnSizes: Record<BtnSize, CSSProperties> = {
  sm: { padding: "0.3125rem 0.75rem", fontSize: "0.8125rem", minHeight: "32px" },
  md: { padding: "0.5rem 1rem", fontSize: "0.875rem" },
  lg: { padding: "0.625rem 1.375rem", fontSize: "1rem", minHeight: "52px" },
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  style,
  disabled,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          ...btnBase,
          ...btnVariants[variant],
          ...btnSizes[size],
          ...(disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}),
        },
        style,
      )}
      type={type}
    >
      {children}
    </button>
  );
}

// ─── Form elements ────────────────────────────────────────────────────────────

const inputBase: CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "var(--bg-surface-2)",
  border: "2px solid var(--border-default)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  minHeight: "44px",
  outline: "none",
  transition: "all var(--transition-fast)",
  boxSizing: "border-box",
};

export function FormInput({
  hasError,
  style,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      {...rest}
      style={mergeStyle(
        {
          ...inputBase,
          ...(hasError
            ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(248,113,113,0.15)" }
            : {}),
        },
        style,
      )}
    />
  );
}

export function FormSelect({
  style,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      style={mergeStyle(
        {
          ...inputBase,
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 1rem center",
          paddingRight: "2.5rem",
          cursor: "pointer",
        },
        style,
      )}
    />
  );
}

export function FormLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: "var(--text-secondary)",
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </label>
  );
}

export function FormGroup({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) {
  return <div style={mergeStyle({ marginBottom: "1.25rem" }, style)}>{children}</div>;
}

export function FormHint({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
      {children}
    </p>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.375rem" }}>
      {children}
    </p>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeTone = "success" | "warning" | "error" | "info" | "neutral";

const badgeTones: Record<BadgeTone, CSSProperties> = {
  success: {
    background: "var(--success-soft)",
    color: "var(--success)",
    border: "1px solid var(--success-border)",
  },
  warning: {
    background: "var(--warning-soft)",
    color: "var(--warning)",
    border: "1px solid var(--warning-border)",
  },
  error: {
    background: "var(--error-soft)",
    color: "var(--error)",
    border: "1px solid var(--error-border)",
  },
  info: {
    background: "var(--info-soft)",
    color: "var(--info)",
    border: "1px solid var(--info-border)",
  },
  neutral: {
    background: "var(--bg-surface-2)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-subtle)",
  },
};

export function StatusBadge({
  children,
  tone,
  style,
}: {
  children: ReactNode;
  tone: BadgeTone;
  style?: CSSProperties;
}) {
  return (
    <span
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 0.875rem",
          borderRadius: "var(--radius-full)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          lineHeight: 1,
          ...badgeTones[tone],
        },
        style,
      )}
    >
      {children}
    </span>
  );
}

/** Derive the correct badge tone from a display state. */
export function toneFromDisplayState(state: DisplayState): BadgeTone {
  switch (state) {
    case "idle":
      return "success";
    case "running":
      return "warning";
    case "complete":
      return "info";
    case "offline":
      return "error";
    case "off":
      return "neutral";
  }
}

// ─── Status dot ───────────────────────────────────────────────────────────────

export function StatusDot({
  tone,
  pulse = false,
}: {
  tone: BadgeTone;
  pulse?: boolean;
}) {
  const colorMap: Record<BadgeTone, string> = {
    success: "var(--success)",
    warning: "var(--warning)",
    error: "var(--error)",
    info: "var(--info)",
    neutral: "var(--text-muted)",
  };

  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: colorMap[tone],
        boxShadow: `0 0 6px ${colorMap[tone]}`,
        flexShrink: 0,
        animation: pulse ? "pulse-glow 2s ease-in-out infinite" : "none",
      }}
    />
  );
}

// ─── Machine status icons (SVG inline) ───────────────────────────────────────

export function WasherIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      fill="none"
      height="26"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="26"
    >
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="1.5" />
      <circle cx="7" cy="6" r="1" />
    </svg>
  );
}

export function DryerIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      fill="none"
      height="26"
      stroke={color}
      strokeLinecap="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="26"
    >
      <rect height="20" rx="4" width="20" x="2" y="2" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 6h8" />
    </svg>
  );
}

// ─── Toggle (switch) ──────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      role="switch"
      style={{
        width: "44px",
        height: "24px",
        background: checked ? "var(--primary-400)" : "var(--bg-surface-3)",
        borderRadius: "var(--radius-full)",
        position: "relative",
        cursor: "pointer",
        transition: "background var(--transition-fast)",
        border: checked ? "2px solid var(--primary-400)" : "2px solid var(--border-default)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: "18px",
          height: "18px",
          background: "#fff",
          borderRadius: "50%",
          position: "absolute",
          top: "2px",
          left: "2px",
          transition: "transform var(--transition-fast)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          boxShadow: "var(--shadow-sm)",
        }}
      />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const fontSizes = { sm: "0.6875rem", md: "0.8125rem", lg: "1rem" };
  const dim = sizes[size];
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (imageUrl) {
    return (
      <img
        alt={name}
        src={imageUrl}
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        background: "var(--primary-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSizes[size],
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "2px solid var(--border-default)",
        borderTopColor: "var(--primary-400)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ModalOverlay({
  children,
  onClose,
}: PropsWithChildren<{ onClose: () => void }>) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,9,18,0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}

export function ModalBox({
  children,
  maxWidth = 400,
  style,
}: PropsWithChildren<{ maxWidth?: number; style?: CSSProperties }>) {
  return (
    <div
      style={mergeStyle(
        {
          background: "var(--bg-surface-1)",
          border: "2px solid var(--border-default)",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 1.5rem",
        borderBottom: "2px solid var(--border-subtle)",
      }}
    >
      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1.125rem" }}>
        {title}
      </h3>
      <button
        onClick={onClose}
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-surface-2)",
          border: "none",
          borderRadius: "var(--radius-full)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "1.125rem",
        }}
        type="button"
      >
        &times;
      </button>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) {
    return (
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border-subtle)",
          margin: "var(--space-xl) 0",
        }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        margin: "1.5rem 0",
      }}
    >
      <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    </div>
  );
}

// ─── Social login button ──────────────────────────────────────────────────────

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        width: "100%",
        padding: "0.75rem 1.25rem",
        background: "var(--bg-surface-2)",
        border: "2px solid var(--border-default)",
        borderRadius: "var(--radius-full)",
        fontFamily: "var(--font-body)",
        fontSize: "0.9375rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        cursor: "pointer",
        minHeight: "48px",
        transition: "all var(--transition-fast)",
      }}
      type="button"
    >
      <svg height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <div
        style={{
          width: 80,
          height: 80,
          margin: "0 auto 1.5rem",
          borderRadius: "50%",
          background: "var(--bg-surface-1)",
          border: "2px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <h2 style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "0.625rem" }}>
        {title}
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          maxWidth: 320,
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      {action ? <div style={{ marginTop: "1.5rem" }}>{action}</div> : null}
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

export function TabBar({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.25rem",
        padding: "0.25rem",
        background: "var(--bg-surface-2)",
        borderRadius: "var(--radius-full)",
        border: "2px solid var(--border-subtle)",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch" as CSSProperties["WebkitOverflowScrolling"],
      }}
    >
      {children}
    </div>
  );
}

export function Tab({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "0.5rem 1rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        cursor: "pointer",
        border: active ? "1px solid var(--border-default)" : "none",
        background: active ? "var(--bg-surface-1)" : "transparent",
        fontFamily: "var(--font-body)",
        minHeight: "44px",
        transition: "all var(--transition-fast)",
        whiteSpace: "nowrap",
      }}
      type="button"
    >
      {children}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SkeletonText({ width = "80%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 7, marginBottom: "0.5rem" }}
    />
  );
}

export function SkeletonCard({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={mergeStyle(
        {
          background: "var(--bg-surface-1)",
          border: "2px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-xl)",
        },
        style,
      )}
    >
      <SkeletonText width="50%" height={20} />
      <SkeletonText width="80%" />
      <SkeletonText width="60%" />
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: "var(--error-soft)",
        border: "2px solid var(--error-border)",
        borderRadius: "var(--radius-lg)",
        fontSize: "0.875rem",
        color: "var(--error)",
        marginBottom: "1.25rem",
      }}
    >
      <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
        <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 10.5h.007" stroke="#f87171" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      {children}
    </div>
  );
}

// ─── Success state card ───────────────────────────────────────────────────────

export function SuccessState({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
      <div
        style={{
          width: 56,
          height: 56,
          margin: "0 auto 1.25rem",
          borderRadius: "50%",
          background: "rgba(52,211,153,0.12)",
          border: "2px solid rgba(52,211,153,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
          <path d="M20 6L9 17l-5-5" stroke="#34d399" strokeLinecap="round" strokeWidth="2.5" />
        </svg>
      </div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h2>
      {children}
    </div>
  );
}
