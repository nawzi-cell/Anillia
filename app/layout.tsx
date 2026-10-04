import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ANILLIÉA — Premium Modest Fashion & Everyday Essentials",
    template: "%s | ANILLIÉA",
  },
  description:
    "Thoughtfully curated modest essentials designed for everyday elegance. Hijabs, underscarves, accessories and curated bundles — delivered across Pakistan.",
  keywords: [
    "modest fashion",
    "hijab",
    "Pakistan",
    "modest essentials",
    "ANILLIÉA",
  ],
  openGraph: {
    type: "website",
    siteName: "ANILLIÉA",
    title: "ANILLIÉA — Premium Modest Fashion & Everyday Essentials",
    description:
      "Thoughtfully curated modest essentials designed for everyday elegance.",
    url: siteUrl,
    images: [{ url: "/images/og-cover.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ANILLIÉA — Premium Modest Fashion & Everyday Essentials",
    description:
      "Thoughtfully curated modest essentials designed for everyday elegance.",
    images: ["/images/og-cover.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "64x64", type: "image/png" },
      { url: "/logo/anilliea-logo.png", sizes: "740x637", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-ivory font-sans text-espresso antialiased">
        {children}
      </body>
    </html>
  );
}
