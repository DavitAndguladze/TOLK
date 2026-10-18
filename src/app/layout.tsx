import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "TOLK",
  description: "Read aloud, one Level closer to the original.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
