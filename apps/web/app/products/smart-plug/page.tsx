import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../../components/MarketingFooter";
import MarketingNav from "../../../components/MarketingNav";
import styles from "../../../components/marketing.module.css";
import { SHOP_URL } from "../../../lib/urls";

export const metadata: Metadata = {
  title: "LaundryIQ Smart Plug",
  description:
    "A plug-in current sensor that makes any washer or dryer smart. Real-time monitoring and push notifications with simple WiFi setup.",
};

const specs = [
  { label: "Connectivity", value: "WiFi (2.4 GHz)" },
  { label: "Setup", value: "SoftAP + Captive Portal" },
  { label: "Outlet", value: "NEMA 5-15 (120V standard)" },
  { label: "Sensing", value: "Hall effect current sensing" },
  { label: "Range", value: "Up to 50A (covers standard washers and dryers)" },
  { label: "Processor", value: "ESP32-S3" },
  { label: "Updates", value: "Automatic OTA" },
];

const inBox = [
  "LaundryIQ Smart Plug",
  "Quick Start Guide",
];

export default function SmartPlugPage() {
  return (
    <>
      <MarketingNav />

      {/* Breadcrumb */}
      <div style={{ paddingTop: "6rem", paddingBottom: "1rem" }}>
        <div className={styles.container}>
          <nav style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link href="/" style={{ color: "var(--text-muted)" }}>Home</Link>
            <span>/</span>
            <Link href="/products" style={{ color: "var(--text-muted)" }}>Products</Link>
            <span>/</span>
            <span style={{ color: "var(--text-secondary)" }}>Smart Plug</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section style={{ paddingBottom: "5rem" }}>
        <div className={styles.container}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "start",
            }}
          >
            {/* Image area */}
            <div>
              <div
                style={{
                  background: "var(--bg-surface-1)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3rem",
                }}
              >
                <div
                  style={{
                    width: "60%",
                    aspectRatio: "1",
                    borderRadius: "var(--radius-xl)",
                    background: "var(--bg-surface-2)",
                    border: "2px solid var(--border-default)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1.25rem",
                  }}
                >
                  <svg fill="none" height="72" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="72">
                    <rect height="20" rx="4" width="20" x="2" y="2" />
                    <circle cx="12" cy="13" r="5" />
                    <circle cx="12" cy="13" r="1.5" />
                    <circle cx="7" cy="6" r="1" />
                  </svg>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
                    LaundryIQ Smart Plug
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <span className={styles.sectionLabel} style={{ display: "block" }}>Smart Plug</span>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  marginBottom: "1rem",
                }}
              >
                LaundryIQ Smart Plug
              </h1>
              <p style={{ fontSize: "1.625rem", fontWeight: 800, marginBottom: "0.875rem" }}>
                $49.99
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                Plug it between the wall outlet and your washer or dryer. Connect to WiFi in under 2 minutes.
                Real-time machine status and push notifications start working immediately.
              </p>

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2.5rem" }}>
                {["No subscription required", "Works with any washer or dryer brand", "Setup in under 2 minutes", "Automatic firmware updates"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9375rem" }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--success-soft)",
                        border: "1px solid var(--success-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg fill="none" height="12" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                className={`${styles.btnPrimary} ${styles.btnLg}`}
                href={`${SHOP_URL}/products/laundryiq-smart-plug`}
                rel="noreferrer"
                style={{ display: "inline-flex", width: "100%", justifyContent: "center" }}
                target="_blank"
              >
                Buy Now at Shop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Specs + In Box */}
      <section
        className={styles.section}
        style={{
          background: "var(--bg-surface-1)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className={styles.container}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "3rem",
              maxWidth: 900,
            }}
          >
            {/* Specs */}
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                Specifications
              </h2>
              <div
                style={{
                  background: "var(--bg-surface-2)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                }}
              >
                {specs.map((spec, i) => (
                  <div
                    key={spec.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.875rem 1.25rem",
                      borderBottom: i < specs.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{spec.label}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* In the box */}
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                What&apos;s in the box
              </h2>
              <div
                style={{
                  background: "var(--bg-surface-2)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  padding: "1.25rem",
                }}
              >
                {inBox.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.625rem 0",
                      fontSize: "0.9375rem",
                    }}
                  >
                    <svg fill="none" height="16" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Setup preview */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className={styles.sectionLabel}>Setup</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>Up and running in 3 steps</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {[
              {
                step: "1",
                title: "Plug In",
                desc: "Plug the LaundryIQ device between the outlet and your washer or dryer.",
              },
              {
                step: "2",
                title: "Connect to WiFi",
                desc: "Join the device's temporary WiFi network and enter your building's WiFi password.",
              },
              {
                step: "3",
                title: "Monitor",
                desc: "Open the portal or dashboard. Your machine status is live.",
              },
            ].map((step) => (
              <div key={step.step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "var(--info-soft)",
                    border: "2px solid rgba(13,166,231,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      background: "var(--primary-gradient)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {step.step}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
