"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PORTAL_URL, SHOP_URL } from "../lib/urls";
import styles from "./marketing.module.css";

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <Link className={styles.navLogo} href="/">
            <Image
              alt="LaundryIQ"
              className={styles.navLogoImg}
              height={36}
              src="/logo.svg"
              unoptimized
              width={36}
            />
            <span className={styles.navBrand}>LaundryIQ</span>
          </Link>
          <ul className={styles.navLinks}>
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><a href={SHOP_URL} rel="noreferrer" target="_blank">Shop</a></li>
          </ul>
          <div className={styles.navCta}>
            <a className={styles.btnSignIn} href={`${PORTAL_URL}/signin`}>Sign In</a>
            <button
              aria-label="Open menu"
              className={styles.hamburger}
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen ? (
        <div className={styles.mobileMenu}>
          <button
            aria-label="Close menu"
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            &times;
          </button>
          <Link href="/features" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link href="/products" onClick={() => setMobileOpen(false)}>Products</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)}>About</Link>
          <a href={SHOP_URL} onClick={() => setMobileOpen(false)} rel="noreferrer" target="_blank">Shop</a>
          <a className={`${styles.btnPrimary} ${styles.btnLg}`} href={`${PORTAL_URL}/signin`}>Sign In</a>
        </div>
      ) : null}
    </>
  );
}
