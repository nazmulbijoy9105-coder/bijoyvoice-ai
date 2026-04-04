import type { Metadata, Viewport } from "next";
import { Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-serif-bengali",
  preload: true,
});

/** Canonical URL override in Vercel: NEXT_PUBLIC_SITE_URL=https://bijoyvoice-ai.vercel.app */
function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const base = explicit.replace(/\/$/, "");
    return new URL(`${base}/`);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "BijoyVoice AI",
  description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "BijoyVoice AI",
    description: "বাংলা ভার্চুয়াল অ্যাসিস্ট্যান্ট — NB TECH",
    type: "website",
    locale: "bn_BD",
    url: siteUrl,
    siteName: "BijoyVoice AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BijoyVoice AI",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BijoyVoice AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#04091a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={notoSerifBengali.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-bengali antialiased">{children}</body>
    </html>
  );
}
