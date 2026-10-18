import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Newsreader } from "next/font/google";
import { PhoneFrame } from "@/reading/ui/PhoneFrame";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], variable: "--font-newsreader" });
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-atkinson",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "TOLK",
  description: "Read aloud, one Level closer to the original.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TOLK", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f8ff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${atkinson.variable}`}>
      <body className="bg-mist font-ui text-ink antialiased">
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
