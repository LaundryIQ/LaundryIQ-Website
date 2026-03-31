import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../components/MarketingFooter";
import MarketingNav from "../../components/MarketingNav";
import styles from "../../components/marketing.module.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LaundryIQ Terms of Service.",
};

const sections = [
  {
    title: "Acceptance of terms",
    body: "By creating an account or using LaundryIQ, you agree to these terms. If you don't agree, don't use the service.",
  },
  {
    title: "Service description",
    body: "LaundryIQ provides hardware devices, firmware, and web applications for monitoring laundry machine state in homes, laundromats, and shared facilities. The hardware is sold separately; the associated web services are provided alongside the hardware.",
  },
  {
    title: "Acceptable use",
    body: "You agree not to misuse the service, interfere with device communications, attempt unauthorized access to places, machines, or accounts that don't belong to you, or reverse engineer the firmware or API.",
  },
  {
    title: "Data and privacy",
    body: "Your use of the service is also governed by our Privacy Policy, which is incorporated into these terms by reference.",
  },
  {
    title: "Availability",
    body: "LaundryIQ is an evolving product. We may update, change, or discontinue features at any time. We aim to communicate significant changes in advance but cannot guarantee uninterrupted service.",
  },
  {
    title: "Limitation of liability",
    body: "LaundryIQ is provided as-is. We are not liable for missed laundry notifications, laundry left in machines, or other incidental issues arising from device connectivity problems or service interruptions.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact us at contact@laundryiq.app.",
  },
];

export default function TermsPage() {
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
              Terms of Service
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
