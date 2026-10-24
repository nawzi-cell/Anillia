import type { Metadata } from "next";
import "./globals.css";

// Fonts are loaded via <link> in <head> below (instead of next/font/google)
// so the production build never needs to fetch Google Fonts at build time.
// The --font-cormorant / --font-inter CSS variables are defined in globals.css.

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ivory font-sans text-espresso antialiased">
        {children}
      </body>
    </html>
  );
}
