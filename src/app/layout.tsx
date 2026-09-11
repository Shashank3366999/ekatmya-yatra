import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Tiro_Devanagari_Hindi } from "next/font/google";

import { AppProviders } from "@/components/app-providers";

import "./globals.css";

/** Body text. Variable, so weights 200-800 are available from one file. */
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Headings. Variable too, which matters here: the previous display serif was a
 * single 400 weight, so a heading could never be set heavier than its body text.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Devanagari, for the Mahavakyas and any Sanskrit on the page.
 *
 * This has to be loaded explicitly: Cormorant Garamond and Manrope carry no Devanagari
 * glyphs, so the browser was silently substituting whatever the device
 * happened to have — verified as "Noto Serif Devanagari" on this machine, and
 * anyone's guess on a phone. Tiro Devanagari Hindi is designed for Sanskrit
 * and Hindi reading, and is what the Ekatma Dham sister site uses.
 */
const devanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ekatma Yatra: One Journey, One Consciousness",
    template: "%s · Ekatma Yatra",
  },
  description:
    "A Bharat Yatra for oneness, in the footsteps of Adi Shankaracharya, from Kalady to Kedarnath.",
  applicationName: "Ekatma Yatra",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Installed to a phone's home screen, it should open like an app.
  appleWebApp: {
    capable: true,
    title: "Ekatma Yatra",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#14523c",
  width: "device-width",
  initialScale: 1,
  // The app is used one-handed in the field; allow zoom for accessibility.
  maximumScale: 5,
  // Draw into the notch/home-bar area; the shells add safe-area padding.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${manrope.variable} ${cormorant.variable} ${devanagari.variable}`}>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
