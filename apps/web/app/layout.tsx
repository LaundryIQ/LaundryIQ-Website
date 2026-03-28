import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LaundryIQ",
  description: "Smart laundry monitoring for shared spaces.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#020617",
          color: "#e2e8f0",
        }}
      >
        {children}
      </body>
    </html>
  );
}
