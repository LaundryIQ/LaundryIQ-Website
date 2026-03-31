"use client";

import Link from "next/link";
import { useEffect } from "react";

import MarketingFooter from "../components/MarketingFooter";
import MarketingNav from "../components/MarketingNav";
import styles from "../components/marketing.module.css";
import { SHOP_URL } from "../lib/urls";

export default function HomePage() {
  // Intersection Observer for fade-up animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <MarketingNav />

      {/* ===== HERO ===== */}
      <section
        style={{
          padding: "10rem 0 6rem",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Background glows */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-20%",
            width: 800,
            height: 800,
            background: "radial-gradient(circle, rgba(13,166,231,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(6,203,213,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className={styles.container} style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <div className={styles.heroInner}>
            {/* Left: Copy */}
            <div className={styles.heroContent} style={{ maxWidth: 560 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 1rem",
                  background: "var(--info-soft)",
                  border: "1px solid rgba(13,166,231,0.2)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8125rem",
                  color: "var(--primary-300)",
                  marginBottom: "1.5rem",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--primary-400)",
                    borderRadius: "50%",
                    animation: "pulse-dot 2s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                />
                Smart laundry monitoring
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: "1.25rem",
                }}
              >
                Know When Your
                <br />
                Laundry&apos;s{" "}
                <span
                  style={{
                    background: "var(--primary-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Done
                </span>
              </h1>
              <p
                style={{
                  fontSize: "1.1875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "2rem",
                  maxWidth: 480,
                }}
              >
                Stop wasting trips to the laundry room. LaundryIQ monitors your washer and dryer in
                real-time and notifies you the moment your cycle finishes.
              </p>
              <div className={styles.heroActions} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a
                  className={`${styles.btnPrimary} ${styles.btnLg}`}
                  href={SHOP_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Get Started
                </a>
                <Link
                  className={`${styles.btnSecondary} ${styles.btnLg}`}
                  href="/#how-it-works"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Right: Washing machine drum */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: "clamp(240px, 30vw, 400px)",
                  height: "clamp(240px, 30vw, 400px)",
                }}
              >
                {/* Outer drum shell */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "2px solid var(--border-default)",
                    background: "var(--bg-surface-1)",
                    overflow: "hidden",
                    boxShadow:
                      "0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(13,166,231,0.25), 0 0 60px rgba(6,203,213,0.1), inset 0 0 60px rgba(13,166,231,0.04)",
                  }}
                >
                  {/* Spinning dashed ring */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 14,
                      borderRadius: "50%",
                      animation: "drum-rotate 14s linear infinite",
                    }}
                  >
                    <svg
                      fill="none"
                      style={{ width: "100%", height: "100%", display: "block" }}
                      viewBox="0 0 372 372"
                    >
                      <circle
                        cx="186"
                        cy="186"
                        r="184"
                        stroke="#2a3d5c"
                        strokeDasharray="10 10"
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Water fill */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "35%",
                      overflow: "hidden",
                      borderRadius: "0 0 200px 200px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(13,166,231,0.10) 0%, rgba(6,203,213,0.24) 100%)",
                      }}
                    />
                    {/* Wave 1 */}
                    <div
                      style={{
                        position: "absolute",
                        top: -6,
                        left: "-100%",
                        width: "400%",
                        height: 20,
                        animation: "wave-move 6s cubic-bezier(0.36,0.45,0.63,0.53) infinite",
                      }}
                    >
                      <svg fill="none" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }} viewBox="0 0 2400 20">
                        <path d="M0 10 Q75 4 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10 T1350 10 T1500 10 T1650 10 T1800 10 T1950 10 T2100 10 T2250 10 T2400 10 V20 H0 Z" fill="rgba(13,166,231,0.18)" />
                      </svg>
                    </div>
                    {/* Wave 2 */}
                    <div
                      style={{
                        position: "absolute",
                        top: -3,
                        left: "-100%",
                        width: "400%",
                        height: 20,
                        opacity: 0.5,
                        animation: "wave-move 8s cubic-bezier(0.36,0.45,0.63,0.53) infinite reverse",
                      }}
                    >
                      <svg fill="none" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }} viewBox="0 0 2400 20">
                        <path d="M0 10 Q75 16 150 10 T300 10 T450 10 T600 10 T750 10 T900 10 T1050 10 T1200 10 T1350 10 T1500 10 T1650 10 T1800 10 T1950 10 T2100 10 T2250 10 T2400 10 V20 H0 Z" fill="rgba(6,203,213,0.14)" />
                      </svg>
                    </div>
                    {/* Wave 3 */}
                    <div
                      style={{
                        position: "absolute",
                        top: -1,
                        left: "-100%",
                        width: "400%",
                        height: 20,
                        opacity: 0.3,
                        animation: "wave-move 10s cubic-bezier(0.36,0.45,0.63,0.53) infinite",
                      }}
                    >
                      <svg fill="none" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }} viewBox="0 0 2400 20">
                        <path d="M0 12 Q75 6 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 T1350 12 T1500 12 T1650 12 T1800 12 T1950 12 T2100 12 T2250 12 T2400 12 V20 H0 Z" fill="rgba(13,166,231,0.10)" />
                      </svg>
                    </div>
                  </div>

                  {/* Content overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 2,
                      textAlign: "center",
                    }}
                  >
                    {/* Info (top area) */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingBottom: "20%",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "clamp(0.6875rem, 1.2vw, 0.9375rem)",
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          marginBottom: "0.625rem",
                          letterSpacing: "0.02em",
                        }}
                      >
                        <svg fill="none" height="15" stroke="var(--text-muted)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        Basement
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "clamp(1.125rem, 2.5vw, 2.125rem)",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          lineHeight: 1.2,
                        }}
                      >
                        Home Washer
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(0.6875rem, 1.2vw, 1rem)",
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginTop: "0.625rem",
                        }}
                      >
                        Washing Machine
                      </div>
                    </div>
                  </div>

                  {/* Status badge in water area */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "35%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBottom: "5%",
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.875rem",
                        background: "rgba(251,191,36,0.15)",
                        border: "1px solid rgba(251,191,36,0.3)",
                        borderRadius: "var(--radius-full)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: "var(--warning)",
                          boxShadow: "0 0 10px rgba(251,191,36,0.6)",
                          animation: "pulse-dot 2s ease-in-out infinite",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "clamp(0.625rem, 1.1vw, 0.875rem)",
                          fontWeight: 600,
                          color: "var(--warning)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Running, 12m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM / SOLUTION ===== */}
      <section
        className={styles.section}
        style={{
          background: "var(--bg-surface-1)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <span className={styles.sectionLabel}>The Problem We Solve</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>
              Laundry shouldn&apos;t be a guessing game
            </h2>
          </div>
          <div className="fade-up ps-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "2rem", alignItems: "start", marginTop: "2.5rem", maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
            {/* Problem */}
            <div style={{ background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "1.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--error)" }}>Without LaundryIQ</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  "Walking to the laundry room just to check if it's done",
                  "Forgetting your clothes until they're damp and wrinkled",
                  "Walking over only to find every machine taken",
                  "No way to know when your cycle will finish",
                ].map((text) => (
                  <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                    <svg fill="none" height="20" stroke="var(--error)" strokeLinecap="round" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }} viewBox="0 0 20 20" width="20">
                      <line x1="4" x2="16" y1="4" y2="16" /><line x1="16" x2="4" y1="4" y2="16" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Arrow */}
            <div className="ps-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "2rem" }}>
              <svg fill="none" height="40" stroke="var(--text-muted)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="40">
                <line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            {/* Solution */}
            <div style={{ background: "var(--bg-surface-2)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "1.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--success)" }}>With LaundryIQ</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  "Check machine status from anywhere",
                  "Get notified the moment it's done",
                  "See which machines are available",
                  "Know exactly how much time is left",
                ].map((text) => (
                  <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                    <svg fill="none" height="20" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }} viewBox="0 0 20 20" width="20">
                      <polyline points="4 10 8 14 16 6" />
                    </svg>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.section} id="features">
        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <span className={styles.sectionLabel}>Features</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>Everything you need, nothing you don&apos;t</h2>
            <p className={styles.sectionDesc} style={{ margin: "0 auto" }}>
              Plug in, connect to WiFi, and you&apos;re monitoring in minutes. Simple setup, powerful results.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginTop: "2.5rem" }}>
            {[
              {
                icon: <svg fill="none" height="24" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                title: "Real-Time Status",
                desc: "See if your machine is running, idle, or finished. Live updates so you always know what's happening.",
              },
              {
                icon: <svg fill="none" height="24" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
                title: "Push Notifications",
                desc: "Get a notification on your phone or laptop the moment your cycle finishes. No more forgotten loads.",
              },
              {
                icon: <svg fill="none" height="24" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                title: "Home and Business",
                desc: "Monitor your home machines or hundreds across a university campus. LaundryIQ scales to fit your needs.",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="fade-up feature-card"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "2px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  padding: "1.75rem",
                  transition: "all var(--transition-base)",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", background: "var(--info-soft)", border: "1px solid rgba(13,166,231,0.15)" }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{feature.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        className={styles.section}
        id="how-it-works"
        style={{ background: "var(--bg-surface-1)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <span className={styles.sectionLabel}>How It Works</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>Up and running in minutes</h2>
            <p className={styles.sectionDesc} style={{ margin: "0 auto" }}>
              Setup is simple. No electrician needed, no special tools. Just plug it in and connect.
            </p>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginTop: "2.5rem", position: "relative" }}>
            {/* Connector line between step circles */}
            <div aria-hidden className="steps-connector" style={{ position: "absolute", top: 40, left: "15%", right: "15%", height: 2, background: "var(--border-subtle)", zIndex: 0 }} />
            {[
              {
                num: "1", title: "Plug In",
                desc: "Plug the LaundryIQ device between the wall outlet and your washer or dryer. That's it for hardware.",
                icon: <svg fill="none" height="16" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
              },
              {
                num: "2", title: "Connect to WiFi",
                desc: "Join the device's WiFi network and enter your home WiFi password. The device connects automatically.",
                icon: <svg fill="none" height="16" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" x2="12.01" y1="20" y2="20" /></svg>,
              },
              {
                num: "3", title: "Monitor",
                desc: "Check real-time status from any device. Enable notifications and never miss a cycle again.",
                icon: <svg fill="none" height="16" stroke="var(--primary-400)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
              },
            ].map((step, i) => (
              <div key={step.num} className="fade-up" style={{ textAlign: "center", position: "relative", zIndex: 1, transitionDelay: `${i * 0.1}s` }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-page)", border: "2px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", position: "relative" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {step.num}
                  </span>
                  <span style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, padding: 4, background: "var(--bg-surface-1)", borderRadius: "50%", border: "2px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {step.icon}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.5rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 260, margin: "0 auto" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className={styles.section} id="use-cases">
        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <span className={styles.sectionLabel}>Built For Everyone</span>
            <h2 className={styles.sectionTitle} style={{ margin: "0 auto" }}>
              Whether you have a few machines or a few hundred
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "2.5rem" }}>
            {/* Home */}
            <div className="fade-up usecase-card" style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "2rem", transition: "all var(--transition-base)", position: "relative", overflow: "hidden" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", background: "var(--success-soft)" }}>
                <svg fill="none" height="24" stroke="var(--success)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>For Your Home</h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
                Never walk downstairs to check on your laundry again. Monitor your machines from the couch, the office, or anywhere. Share access with anyone in your household.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {["Real-time status from anywhere", "Share access with family", "Notify others when the laundry's done"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    <svg fill="none" height="16" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="20 6 9 17 4 12" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Business */}
            <div className="fade-up usecase-card" style={{ background: "var(--bg-surface-1)", border: "2px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "2rem", transition: "all var(--transition-base)", position: "relative", overflow: "hidden", transitionDelay: "0.1s" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", background: "var(--info-soft)" }}>
                <svg fill="none" height="24" stroke="var(--primary-400)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><rect height="16" rx="2" width="16" x="4" y="4" /><rect height="6" width="6" x="9" y="9" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>For Laundromats and Universities</h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
                Give residents and students real-time visibility into machine availability. Reduce complaints, improve satisfaction, and manage your fleet from one dashboard.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {["Works with any machine, any brand", "QR codes for each laundry room", "Admin dashboard with usage data", "Bulk pricing available"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    <svg fill="none" height="16" stroke="var(--success)" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="20 6 9 17 4 12" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section style={{ textAlign: "center", padding: "6rem 0", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(13,166,231,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className={styles.container} style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, marginBottom: "1rem" }}>
            Stop guessing.
            <br />
            Start{" "}
            <span style={{ background: "var(--primary-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              knowing.
            </span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
            Join the homes and campuses that never waste another trip to the laundry room.
          </p>
          <a className={`${styles.btnPrimary} ${styles.btnLg}`} href={SHOP_URL} rel="noreferrer" target="_blank">
            Get Your LaundryIQ
          </a>
        </div>
      </section>

      <MarketingFooter />

      {/* Global styles */}
      <style>{`
        /* Fade-up entrance animation */
        .fade-up {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Feature card hover */
        .feature-card:hover {
          border-color: var(--border-default) !important;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Use-case card hover */
        .usecase-card:hover {
          border-color: var(--border-default) !important;
        }

        /* Steps responsive */
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .steps-connector { display: none !important; }
        }

        /* Problem/solution responsive */
        @media (max-width: 768px) {
          .ps-grid { grid-template-columns: 1fr !important; }
          .ps-arrow svg { transform: rotate(90deg); }
        }
      `}</style>
    </>
  );
}
