import Link from "next/link";

import MarketingNav from "../components/MarketingNav";
import styles from "../components/marketing.module.css";
import { PORTAL_URL } from "../lib/urls";

export default function NotFound() {
  return (
    <>
      <MarketingNav />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "8rem 1.5rem 4rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(248,113,113,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* 404 number */}
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(6rem, 15vw, 9rem)",
              fontWeight: 900,
              lineHeight: 1,
              background: "var(--primary-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
              opacity: 0.3,
            }}
          >
            404
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto 2.5rem",
            }}
          >
            This page doesn&apos;t exist or you don&apos;t have access to it. Both look the same to us — it&apos;s a security thing.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              className={`${styles.btnPrimary} ${styles.btnLg}`}
              href="/"
            >
              Go to Home
            </Link>
            <a
              className={`${styles.btnSecondary} ${styles.btnLg}`}
              href={PORTAL_URL}
            >
              Open Portal
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
