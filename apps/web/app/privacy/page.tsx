import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../components/MarketingFooter";
import MarketingNav from "../../components/MarketingNav";
import styles from "../../components/marketing.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LaundryIQ Privacy Policy.",
};

const sections = [
  {
    title: "Information we collect",
    body: "When you create an account, we collect your email address and name provided through your sign-in provider (Google). When devices are provisioned, we receive the device's hardware ID and the machine status data it sends (off, idle, running). We do not collect payment information directly — purchases are processed by Shopify.",
  },
  {
    title: "How we use information",
    body: "We use your account information to authenticate you, identify which places and machines you have access to, and send push notifications when you subscribe to a machine. Device telemetry is used to display real-time machine status and cycle history in the portal and dashboard.",
  },
  {
    title: "Data retention",
    body: "Raw device readings are retained for 7 days. Cycle summary records are retained indefinitely. Push notification subscriptions are retained until you remove them. Account data is retained until you delete your account.",
  },
  {
    title: "Information sharing",
    body: "We do not sell or share your personal information with third parties for marketing purposes. Device data is shared only within the place you belong to (with other members of your place). We use Convex for data storage and Clerk for authentication.",
  },
  {
    title: "Your rights",
    body: "You may delete your account at any time from the portal or dashboard account settings page. Deleting your account removes your profile, memberships, and push subscriptions. Device data tied to places you own will also be removed.",
  },
  {
    title: "Contact",
    body: "For privacy-related questions, contact us at contact@laundryiq.app.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />

      <section style={{ padding: "10rem 0 3rem" }}>
        <div className={styles.container}>
          <div style={{ maxWidth: 720 }}>
            <span className={styles.sectionLabel}>Legal</span>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "0.5rem",
              }}
            >
              Privacy Policy
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "3rem" }}>
              Last updated March 28, 2026
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {sections.map((section) => (
                <div
                  key={section.title}
                  style={{
                    background: "var(--bg-surface-1)",
                    border: "2px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xl)",
                    padding: "1.75rem",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {section.title}
                  </h2>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{section.body}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
