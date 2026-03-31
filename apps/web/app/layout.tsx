import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
