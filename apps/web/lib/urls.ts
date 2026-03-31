/**
 * Cross-app URL config.
 *
 * In development (.env.local):
 *   NEXT_PUBLIC_PORTAL_URL=http://localhost:5173
 *   NEXT_PUBLIC_DASHBOARD_URL=http://localhost:5174
 *   NEXT_PUBLIC_SHOP_URL=https://shop.laundryiq.app
 *
 * In production (Vercel env vars):
 *   NEXT_PUBLIC_PORTAL_URL=https://portal.laundryiq.app
 *   NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.laundryiq.app
 *   NEXT_PUBLIC_SHOP_URL=https://shop.laundryiq.app
 */

export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.laundryiq.app";

export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://dashboard.laundryiq.app";

export const SHOP_URL =
  process.env.NEXT_PUBLIC_SHOP_URL ?? "https://shop.laundryiq.app";
