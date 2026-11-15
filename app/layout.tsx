import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Suspense } from "react";
import { DemoModeSwitch } from "@/components/DemoModeSwitch";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// UI text.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Headings. The optical-size axis lets large headings use the finer display cut.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Prephrase — AI trainer for LSAT Logical Reasoning",
    template: "%s · Prephrase",
  },
  description:
    "Prephrase hides the answer choices, makes you explain the argument in your own words, and an AI coach grades your reasoning in seconds.",
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {/* Reads ?demo=1 from the address, which only exists in the browser. */}
        <Suspense fallback={null}>
          <DemoModeSwitch />
        </Suspense>
      </body>
    </html>
  );
}
