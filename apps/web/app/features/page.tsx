import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../components/MarketingFooter";
import MarketingNav from "../../components/MarketingNav";
import styles from "../../components/marketing.module.css";
import { SHOP_URL } from "../../lib/urls";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Real-time monitoring, push notifications, multi-location support, easy setup, and more. See everything LaundryIQ can do.",
};

const features = [
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Real-Time Monitoring",
    desc: "See live machine status — running, available, or done — from any browser. No refreshing, no calling the laundry room.",
    detail:
      "Your washer or dryer's power draw is continuously measured. The moment a cycle starts or ends, the status updates across all your devices instantly.",
  },
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    title: "Push Notifications",
    desc: "Get notified the moment your cycle is done. Works on any device, no app install required.",
    detail:
      "Web Push notifications work in Chrome, Firefox, Edge, and Safari 16.4+. Enable them with one tap on any machine's detail page.",
  },
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <path d="M5 12.55a11 11 0 0114.08 0" />
        <path d="M1.42 9a16 16 0 0121.16 0" />
        <path d="M8.53 16.11a6 6 0 016.95 0" />
        <line x1="12" x2="12.01" y1="20" y2="20" />
      </svg>
    ),
    title: "Simple WiFi Setup",
    desc: "No BLE, no proprietary app, no complex pairing. The device creates its own WiFi network. Connect, enter your password, done.",
    detail:
      "Works on any phone, tablet, or laptop — just like connecting to a new WiFi network. The whole setup process takes under two minutes.",
  },
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <rect height="16" rx="2" width="16" x="4" y="4" />
        <rect height="6" width="6" x="9" y="9" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </svg>
    ),
    title: "Multi-Location Support",
    desc: "Manage machines across multiple locations from one dashboard. Perfect for laundromats, university housing, and property managers.",
    detail:
      "Group machines by floor or pod, filter the portal by location, and give your team access with role-based invites. No per-seat pricing.",
  },
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <rect height="20" rx="4" width="20" x="2" y="2" />
        <circle cx="12" cy="13" r="5" />
        <circle cx="12" cy="13" r="1.5" />
        <circle cx="7" cy="6" r="1" />
      </svg>
    ),
    title: "Works With Any Machine",
    desc: "No integration needed. If it plugs into a standard outlet and draws power, LaundryIQ can monitor it.",
    detail:
      "LaundryIQ uses current sensing to detect whether a machine is running — no smart outlet, no Bluetooth, no manufacturer API. One device works for any washer or dryer brand.",
  },
  {
    icon: (
      <svg fill="none" height="28" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="28">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Automatic Updates",
    desc: "Firmware updates happen automatically in the background. You never need to manually update a device.",
    detail:
      "Each device checks for a new firmware version every 6 hours. If a cycle is in progress, the update waits until the machine is idle. Updates take under a minute.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          padding: "10rem 0 5rem",
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
          <span className={styles.sectionLabel}>Features</span>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Everything you need to{" "}
            <span
              style={{
                background: "var(--primary-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              know your laundry
            </span>
          </h1>
          <p
            className={styles.sectionDesc}
            style={{ margin: "0 auto", textAlign: "center" }}
          >
            Real-time monitoring, instant notifications, and simple setup — designed for
            both home users and the operators who manage shared laundry facilities.
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.container}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "var(--bg-surface-1)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  padding: "2rem",
                  transition: "all var(--transition-base)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                    background: "var(--info-soft)",
                    border: "1px solid rgba(13,166,231,0.15)",
                  }}
                >
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  {feature.desc}
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {feature.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "5rem 0",
          background: "var(--bg-surface-1)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className={styles.container} style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
            Ready to see it in action?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1.0625rem" }}>
            Get the LaundryIQ smart plug and start monitoring in minutes.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              className={`${styles.btnPrimary} ${styles.btnLg}`}
              href={SHOP_URL}
              rel="noreferrer"
              target="_blank"
            >
              Shop Now
            </a>
            <Link className={`${styles.btnSecondary} ${styles.btnLg}`} href="/products">
              View Products
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
