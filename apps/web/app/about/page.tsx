import type { Metadata } from "next";
import Link from "next/link";

import MarketingFooter from "../../components/MarketingFooter";
import MarketingNav from "../../components/MarketingNav";
import styles from "../../components/marketing.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "LaundryIQ is built by a small team that believes laundry rooms should be smarter.",
};

export default function AboutPage() {
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
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(13,166,231,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className={styles.container} style={{ position: "relative", zIndex: 1 }}>
          <span className={styles.sectionLabel}>About</span>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "1.25rem",
            }}
          >
            Laundry rooms should be{" "}
            <span
              style={{
                background: "var(--primary-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              smarter
            </span>
          </h1>
          <p className={styles.sectionDesc} style={{ margin: "0 auto", textAlign: "center" }}>
            We built LaundryIQ because we were tired of wasted trips to the laundry room. We thought there had to be a better way.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.container}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "var(--bg-surface-1)",
                border: "2px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                padding: "2.5rem",
              }}
            >
              <span className={styles.sectionLabel} style={{ display: "block" }}>Our Mission</span>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>
                Real-time visibility for shared laundry
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
                Whether you live in a house, a dorm, or manage a laundromat, the problem is the same: you don&apos;t know if a machine
                is running without physically checking. That&apos;s a solved problem.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                LaundryIQ gives real-time visibility to everyone who needs it — users get notifications when their clothes are done,
                operators get a clear view of every machine in their facility.
              </p>
            </div>

            <div
              style={{
                background: "var(--bg-surface-1)",
                border: "2px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                padding: "2.5rem",
              }}
            >
              <span className={styles.sectionLabel} style={{ display: "block" }}>Our Story</span>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>
                Started at an engineering clinic
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
                LaundryIQ grew out of an electrical and computer engineering project — a mix of hardware design, firmware, and full-stack
                web development coming together around a simple, relatable problem.
              </p>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                We set out to prove that a small team could build a real product from scratch: custom PCB, ESP32 firmware, Convex backend,
                and web portal. LaundryIQ is the result.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div
            style={{
              background: "var(--bg-surface-1)",
              border: "2px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)",
              padding: "2.5rem",
              marginTop: "1.5rem",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Get in touch
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", maxWidth: 480, margin: "0 auto 1.5rem" }}>
              Have a question, a bulk pricing inquiry, or want to see LaundryIQ in your building? We&apos;d love to hear from you.
            </p>
            <a
              className={`${styles.btnPrimary} ${styles.btnLg}`}
              href="mailto:contact@laundryiq.app"
            >
              contact@laundryiq.app
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
