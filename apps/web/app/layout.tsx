import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "LaundryIQ — Know When Your Laundry's Done",
    template: "%s | LaundryIQ",
  },
  description:
    "Smart monitoring for washers and dryers. Get notified when your laundry is done. Works for homes, laundromats, and universities.",
  openGraph: {
    siteName: "LaundryIQ",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakartaSans.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
