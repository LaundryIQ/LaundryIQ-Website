import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../components/MarketingFooter";
import MarketingNav from "../../components/MarketingNav";
import styles from "../../components/marketing.module.css";

export const metadata: Metadata = {
  title: "Products",
  description:
    "LaundryIQ smart monitoring devices. Make any washer or dryer smart with a simple plug-in device.",
};

const faqs = [
  {
    q: "Do I need a subscription?",
    a: "The LaundryIQ device is a one-time hardware purchase. The portal, dashboard, notifications, and automatic firmware updates are included.",
  },
  {
    q: "Does it work with any washer or dryer?",
    a: "Yes. LaundryIQ uses current sensing, so it works with any machine that plugs into a standard outlet. No smart outlet or manufacturer API required.",
  },
  {
    q: "What app do I need?",
    a: "No app download required. The portal and dashboard are responsive web apps that work in any modern browser.",
  },
  {
    q: "Can I use one account for multiple locations?",
    a: "Yes. A single account can manage multiple places. Each place can have its own machines, groups, and user permissions.",
  },
];

export default function ProductsPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          padding: "10rem 0 4rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 700,
            background: "radial-gradient(circle, rgba(13,166,231,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className={styles.container} style={{ position: "relative", zIndex: 1 }}>
          <span className={styles.sectionLabel}>Products</span>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Make any washer or dryer{" "}
            <span
              style={{
                background: "var(--primary-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              smart
            </span>
          </h1>
          <p
            className={styles.sectionDesc}
            style={{ margin: "0 auto", textAlign: "center" }}
          >
            One plug-in device. Real-time monitoring, push notifications, and usage data
            — for your home or an entire facility.
          </p>
        </div>
      </section>

      {/* Product card */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.container}>
          <div
            style={{
              background: "var(--bg-surface-1)",
              border: "2px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              {/* Placeholder image area */}
              <div
                style={{
                  background: "var(--bg-surface-2)",
                  borderRight: "2px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 320,
                  padding: "3rem",
                }}
              >
                <div
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: "var(--radius-xl)",
                    background: "var(--bg-surface-3)",
                    border: "2px solid var(--border-default)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  <svg fill="none" height="56" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="56">
                    <rect height="20" rx="4" width="20" x="2" y="2" />
                    <circle cx="12" cy="13" r="5" />
                    <circle cx="12" cy="13" r="1.5" />
                    <circle cx="7" cy="6" r="1" />
                  </svg>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                    LaundryIQ Smart Plug
                  </span>
                </div>
              </div>

              {/* Product info */}
              <div style={{ padding: "2.5rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    background: "var(--success-soft)",
                    border: "1px solid var(--success-border)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--success)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  Available Now
                </span>

                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  LaundryIQ Smart Plug
                </h2>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                  $49.99
                </p>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  Plug it between the outlet and your washer or dryer. Connect to WiFi. Done.
                  Real-time monitoring and notifications start working immediately.
                </p>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
                  {["Works with any washer or dryer", "Setup takes under 2 minutes", "Notifications on any browser", "Automatic firmware updates"].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
                      <svg fill="none" height="16" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  className={`${styles.btnPrimary} ${styles.btnLg}`}
                  href="/products/smart-plug"
                  style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included (free) */}
      <section
        className={styles.section}
        style={{
          background: "var(--bg-surface-1)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className={styles.container}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className={styles.sectionLabel}>No Subscription</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>
              Hardware purchase includes everything
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {[
              { title: "Portal access", desc: "Share machine status with residents, family, and students." },
              { title: "Dashboard access", desc: "Manage devices, machines, places, and user permissions." },
              { title: "Push notifications", desc: "Get browser notifications when your cycle finishes." },
              { title: "Automatic updates", desc: "New features and improvements delivered automatically." },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "var(--bg-surface-2)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  padding: "1.5rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--success-soft)",
                    border: "1px solid var(--success-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <svg fill="none" height="20" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className={styles.sectionLabel}>Questions</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>
              Common questions
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.25rem",
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            {faqs.map((faq) => (
              <div
                key={faq.q}
                style={{
                  background: "var(--bg-surface-1)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  padding: "1.5rem",
                }}
              >
                <h3 style={{ fontWeight: 700, marginBottom: "0.625rem", fontSize: "1rem" }}>{faq.q}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
