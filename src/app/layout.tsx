import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Sora, Instrument_Serif } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "vyay — move together",
  description:
    "A zero-lag social fitness companion. Raise your pet, build routines in the Studio, and move with the feed.",
  applicationName: "vyay",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ede6" },
    { media: "(prefers-color-scheme: dark)", color: "#07070a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${instrument.variable} bg-cloud font-sans text-ink antialiased dark:bg-void dark:text-snow`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
