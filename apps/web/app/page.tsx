import Link from "next/link";

const sections = [
  {
    title: "Operator dashboard",
    href: "https://dashboard.laundryiq.app",
    copy: "Claim devices, manage places, monitor fleet state, and prepare the rollout for laundromats, universities, and housing.",
  },
  {
    title: "End-user portal",
    href: "https://portal.laundryiq.app",
    copy: "Give residents and customers a clear view of machine status, cycle progress, and future notification flows.",
  },
  {
    title: "Device API",
    href: "https://api.laundryiq.app",
    copy: "Convex-backed device endpoints for claim, heartbeat, state reporting, and OTA checks.",
  },
];

export default function HomePage() {
  return (
    <main style={{ padding: "64px 24px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1120 }}>
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            border: "1px solid rgba(34,211,238,0.3)",
            background: "rgba(34,211,238,0.08)",
            color: "#a5f3fc",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            padding: "8px 12px",
            textTransform: "uppercase",
          }}
        >
          LaundryIQ Website
        </div>
        <h1
          style={{
            fontSize: "clamp(3rem, 7vw, 6rem)",
            lineHeight: 1,
            marginBottom: 16,
            marginTop: 20,
          }}
        >
          Smart laundry monitoring for shared spaces.
        </h1>
        <p
          style={{
            color: "#94a3b8",
            fontSize: 18,
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          This is the real v2 foundation: marketing, portal, dashboard, device
          API, and firmware are now aligned around a single Convex backend and a
          Clerk-powered auth model.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
          <Link
            href="https://dashboard.laundryiq.app"
            style={{
              borderRadius: 999,
              background: "linear-gradient(135deg, #0ea5e9, #22d3ee)",
              color: "#fff",
              fontWeight: 700,
              padding: "14px 20px",
              textDecoration: "none",
            }}
          >
            Open dashboard
          </Link>
          <Link
            href="https://portal.laundryiq.app"
            style={{
              borderRadius: 999,
              border: "1px solid #334155",
              color: "#e2e8f0",
              fontWeight: 700,
              padding: "14px 20px",
              textDecoration: "none",
            }}
          >
            Open portal
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            marginTop: 40,
          }}
        >
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              style={{
                borderRadius: 28,
                border: "1px solid #1e293b",
                background: "rgba(15, 23, 42, 0.88)",
                color: "#e2e8f0",
                padding: 24,
                textDecoration: "none",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{section.title}</h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>{section.copy}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
